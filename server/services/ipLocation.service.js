const { isPrivateOrLocalIp, normalizeIpAddress } = require("../utils/requestIp");
const logger = require("../utils/logger");

const cache = new Map();
const CACHE_TTL_MS = Math.max(Number(process.env.IP_LOCATION_CACHE_MINUTES || 360), 1) * 60 * 1000;
const LOOKUP_TIMEOUT_MS = Math.max(Number(process.env.IP_LOCATION_TIMEOUT_MS || 2500), 500);

const emptyLocation = (provider = "") => ({
  country: "",
  region: "",
  city: "",
  timezone: "",
  latitude: null,
  longitude: null,
  isp: "",
  provider,
  approximate: true,
});

const localLocation = () => ({
  country: "Local network",
  region: "Development",
  city: "Localhost",
  timezone: process.env.TZ || "UTC",
  latitude: null,
  longitude: null,
  isp: "Local/private IP",
  provider: "local",
  approximate: true,
});

const toNumberOrNull = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const sanitizeText = (value) => String(value || "").trim();

const fetchJson = async (url) => {
  if (typeof fetch !== "function") {
    throw new Error("Global fetch is not available in this Node runtime");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LOOKUP_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`IP lookup failed with HTTP ${response.status}`);
    }

    return response.json();
  } finally {
    clearTimeout(timeout);
  }
};

const fromIpApi = async (ipAddress) => {
  const data = await fetchJson(`https://ipapi.co/${encodeURIComponent(ipAddress)}/json/`);
  if (data?.error) throw new Error(data.reason || "ipapi.co returned an error");

  return {
    country: sanitizeText(data.country_name || data.country),
    region: sanitizeText(data.region),
    city: sanitizeText(data.city),
    timezone: sanitizeText(data.timezone),
    latitude: toNumberOrNull(data.latitude),
    longitude: toNumberOrNull(data.longitude),
    isp: sanitizeText(data.org || data.asn),
    provider: "ipapi.co",
    approximate: true,
  };
};

const fromIpInfo = async (ipAddress) => {
  const token = process.env.IPINFO_TOKEN;
  const tokenQuery = token ? `?token=${encodeURIComponent(token)}` : "";
  const data = await fetchJson(`https://ipinfo.io/${encodeURIComponent(ipAddress)}/json${tokenQuery}`);
  const [latitude, longitude] = String(data.loc || "").split(",");

  return {
    country: sanitizeText(data.country),
    region: sanitizeText(data.region),
    city: sanitizeText(data.city),
    timezone: sanitizeText(data.timezone),
    latitude: toNumberOrNull(latitude),
    longitude: toNumberOrNull(longitude),
    isp: sanitizeText(data.org),
    provider: "ipinfo.io",
    approximate: true,
  };
};

const fromIpGeolocation = async (ipAddress) => {
  const apiKey = process.env.IPGEOLOCATION_API_KEY;
  if (!apiKey) throw new Error("IPGEOLOCATION_API_KEY is not configured");

  const data = await fetchJson(
    `https://api.ipgeolocation.io/ipgeo?apiKey=${encodeURIComponent(apiKey)}&ip=${encodeURIComponent(ipAddress)}`
  );

  return {
    country: sanitizeText(data.country_name || data.country_name2),
    region: sanitizeText(data.state_prov),
    city: sanitizeText(data.city),
    timezone: sanitizeText(data.time_zone?.name),
    latitude: toNumberOrNull(data.latitude),
    longitude: toNumberOrNull(data.longitude),
    isp: sanitizeText(data.isp || data.organization),
    provider: "ipgeolocation.io",
    approximate: true,
  };
};

const fromGeoIpLite = (ipAddress) => {
  try {
    // Optional local provider. It is used only when the package is installed.
    // eslint-disable-next-line global-require, import/no-extraneous-dependencies
    const geoip = require("geoip-lite");
    const data = geoip.lookup(ipAddress);
    if (!data) return emptyLocation("geoip-lite");

    return {
      country: sanitizeText(data.country),
      region: sanitizeText(data.region),
      city: sanitizeText(data.city),
      timezone: sanitizeText(data.timezone),
      latitude: toNumberOrNull(data.ll?.[0]),
      longitude: toNumberOrNull(data.ll?.[1]),
      isp: "",
      provider: "geoip-lite",
      approximate: true,
    };
  } catch (_error) {
    return emptyLocation("geoip-lite");
  }
};

const getProviderOrder = () => {
  const configured = String(process.env.IP_GEOLOCATION_PROVIDER || "ipapi").toLowerCase();
  const providers = {
    ipapi: fromIpApi,
    ipinfo: fromIpInfo,
    ipgeolocation: fromIpGeolocation,
    "geoip-lite": fromGeoIpLite,
  };

  return [
    configured,
    "ipapi",
    "ipinfo",
    "geoip-lite",
  ].filter((provider, index, list) => providers[provider] && list.indexOf(provider) === index);
};

const getIpLocation = async (rawIpAddress) => {
  const ipAddress = normalizeIpAddress(rawIpAddress);

  if (isPrivateOrLocalIp(ipAddress)) {
    return localLocation();
  }

  const cached = cache.get(ipAddress);
  if (cached && Date.now() - cached.createdAt < CACHE_TTL_MS) {
    return cached.location;
  }

  let location = emptyLocation();
  const providerMap = {
    ipapi: fromIpApi,
    ipinfo: fromIpInfo,
    ipgeolocation: fromIpGeolocation,
    "geoip-lite": fromGeoIpLite,
  };

  for (const provider of getProviderOrder()) {
    try {
      location = await providerMap[provider](ipAddress);
      if (location.city || location.country || location.latitude || location.longitude) break;
    } catch (error) {
      logger.warn(`IP geolocation provider ${provider} failed: ${error.message}`);
    }
  }

  cache.set(ipAddress, { createdAt: Date.now(), location });
  return location;
};

module.exports = {
  getIpLocation,
};
