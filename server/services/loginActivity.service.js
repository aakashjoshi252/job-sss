const LoginActivity = require("../models/loginActivity.model");
const { getClientIp } = require("../utils/requestIp");
const { getIpLocation } = require("./ipLocation.service");
const { notifySystem } = require("../utils/notificationHelper");
const logger = require("../utils/logger");

const FAILED_WINDOW_MINUTES = Math.max(Number(process.env.LOGIN_FAILED_WINDOW_MINUTES || 15), 1);
const FAILED_THRESHOLD = Math.max(Number(process.env.LOGIN_FAILED_THRESHOLD || 5), 2);
const MAX_TRAVEL_SPEED_KMH = Math.max(Number(process.env.LOGIN_IMPOSSIBLE_TRAVEL_KMH || 900), 300);

const sanitize = (value, maxLength = 500) =>
  String(value || "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);

const detectBrowser = (userAgent) => {
  const ua = userAgent || "";
  if (/Edg\//i.test(ua)) return "Microsoft Edge";
  if (/OPR\//i.test(ua) || /Opera/i.test(ua)) return "Opera";
  if (/SamsungBrowser/i.test(ua)) return "Samsung Internet";
  if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) return "Chrome";
  if (/Firefox\//i.test(ua)) return "Firefox";
  if (/Safari\//i.test(ua) && /Version\//i.test(ua)) return "Safari";
  if (/MSIE|Trident/i.test(ua)) return "Internet Explorer";
  if (/bot|crawler|spider|crawling/i.test(ua)) return "Automated client";
  return "Unknown browser";
};

const detectOs = (userAgent) => {
  const ua = userAgent || "";
  if (/Windows NT/i.test(ua)) return "Windows";
  if (/Android/i.test(ua)) return "Android";
  if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
  if (/Mac OS X|Macintosh/i.test(ua)) return "macOS";
  if (/Linux/i.test(ua)) return "Linux";
  return "Unknown OS";
};

const detectDeviceType = (userAgent) => {
  const ua = userAgent || "";
  if (/bot|crawler|spider|crawling/i.test(ua)) return "bot";
  if (/iPad|Tablet|PlayBook|Silk/i.test(ua)) return "tablet";
  if (/Mobi|Android|iPhone|iPod|IEMobile|BlackBerry/i.test(ua)) return "mobile";
  if (!ua) return "unknown";
  return "desktop";
};

const parseUserAgent = (userAgent = "") => {
  const browser = detectBrowser(userAgent);
  const os = detectOs(userAgent);
  const deviceType = detectDeviceType(userAgent);
  const label = deviceType === "unknown" ? "Unknown device" : `${deviceType} ${os}`.trim();

  return {
    userAgent: sanitize(userAgent, 1000),
    browser,
    os,
    deviceType,
    device: label.charAt(0).toUpperCase() + label.slice(1),
  };
};

const toRadians = (degrees) => (degrees * Math.PI) / 180;

const getDistanceKm = (a, b) => {
  if (![a.latitude, a.longitude, b.latitude, b.longitude].every(Number.isFinite)) return null;

  const radiusKm = 6371;
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * radiusKm * Math.asin(Math.sqrt(h));
};

const getBlacklistedIps = () =>
  String(process.env.LOGIN_IP_BLACKLIST || "")
    .split(",")
    .map((ip) => ip.trim())
    .filter(Boolean);

const buildSuspicion = async ({ user, ipAddress, deviceInfo, location, status }) => {
  const reasons = [];
  const failedSince = new Date(Date.now() - FAILED_WINDOW_MINUTES * 60 * 1000);
  const failedFromIp = await LoginActivity.countDocuments({
    ipAddress,
    status: "failed",
    createdAt: { $gte: failedSince },
  });

  if (getBlacklistedIps().includes(ipAddress)) {
    reasons.push("IP address is on the configured login blacklist");
  }

  if (failedFromIp + (status === "failed" ? 1 : 0) >= FAILED_THRESHOLD) {
    reasons.push(`Multiple failed attempts from this IP in ${FAILED_WINDOW_MINUTES} minutes`);
  }

  if (status !== "success" || !user?._id) {
    return { suspicious: reasons.length > 0, reasons };
  }

  const userId = user._id;
  const historicalQueries = [
    LoginActivity.findOne({ userId, status: "success" }).sort({ loginTime: -1 }).lean(),
  ];

  if (location.country) {
    historicalQueries.push(LoginActivity.countDocuments({ userId, status: "success", country: location.country }));
  } else {
    historicalQueries.push(Promise.resolve(1));
  }

  if (location.city) {
    historicalQueries.push(LoginActivity.countDocuments({ userId, status: "success", city: location.city }));
  } else {
    historicalQueries.push(Promise.resolve(1));
  }

  historicalQueries.push(
    LoginActivity.countDocuments({
      userId,
      status: "success",
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      deviceType: deviceInfo.deviceType,
    })
  );

  const [previousLogin, sameCountryCount, sameCityCount, sameDeviceCount] = await Promise.all(historicalQueries);

  if (previousLogin) {
    if (location.country && sameCountryCount === 0) {
      reasons.push(`New login country detected: ${location.country}`);
    }

    if (location.city && sameCityCount === 0) {
      reasons.push(`New login city detected: ${location.city}`);
    }

    if (sameDeviceCount === 0) {
      reasons.push(`New device or browser detected: ${deviceInfo.browser} on ${deviceInfo.os}`);
    }

    const distanceKm = getDistanceKm(previousLogin, location);
    const previousTime = previousLogin.loginTime ? new Date(previousLogin.loginTime).getTime() : 0;
    const hours = previousTime ? (Date.now() - previousTime) / (60 * 60 * 1000) : null;

    if (distanceKm && hours && hours > 0 && distanceKm / hours > MAX_TRAVEL_SPEED_KMH) {
      reasons.push("Impossible travel detected from the previous login location");
    }
  }

  return { suspicious: reasons.length > 0, reasons };
};

const recordLoginActivity = async ({ req, user = null, email = "", status = "success", reason = "" }) => {
  try {
    const ipAddress = getClientIp(req);
    const deviceInfo = parseUserAgent(req.headers["user-agent"]);
    const location = await getIpLocation(ipAddress);
    const loginTime = new Date();
    const suspiciousResult = await buildSuspicion({
      user,
      ipAddress,
      deviceInfo,
      location,
      status,
    });
    const reasonParts = [sanitize(reason), ...suspiciousResult.reasons.map((item) => sanitize(item))].filter(Boolean);

    const activity = await LoginActivity.create({
      userId: user?._id || null,
      email: sanitize(email || user?.email, 320).toLowerCase(),
      role: user?.role || "unknown",
      ipAddress,
      ...deviceInfo,
      country: location.country,
      region: location.region,
      city: location.city,
      timezone: location.timezone,
      latitude: location.latitude,
      longitude: location.longitude,
      isp: location.isp,
      status,
      suspicious: suspiciousResult.suspicious,
      reason: reasonParts.join("; "),
      loginTime,
      provider: location.provider,
      approximate: location.approximate !== false,
    });

    if (status === "success" && suspiciousResult.suspicious && user?._id) {
      notifySystem(
        user._id,
        "Suspicious login detected",
        "We noticed a new or unusual login. Review your account security page if this was not you.",
        `/${user.role}/security`
      ).catch((error) => logger.warn(`Suspicious login notification failed: ${error.message}`));
    }

    return activity;
  } catch (error) {
    logger.error(`Login activity tracking failed: ${error.message}`, { stack: error.stack });
    return null;
  }
};

const markLatestLogoutActivity = async (userId) => {
  if (!userId) return null;

  try {
    return LoginActivity.findOneAndUpdate(
      {
        userId,
        status: "success",
        logoutTime: null,
      },
      { $set: { logoutTime: new Date() } },
      { new: true, sort: { loginTime: -1 } }
    );
  } catch (error) {
    logger.warn(`Logout activity update failed: ${error.message}`);
    return null;
  }
};

module.exports = {
  markLatestLogoutActivity,
  parseUserAgent,
  recordLoginActivity,
};
