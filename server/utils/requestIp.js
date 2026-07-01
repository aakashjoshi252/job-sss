const net = require("net");

const firstHeaderValue = (value) => {
  if (Array.isArray(value)) return value[0];
  return value;
};

const normalizeIpAddress = (value = "") => {
  let ip = String(value || "").trim();

  if (!ip) return "0.0.0.0";

  ip = ip.split(",")[0].trim();
  ip = ip.replace(/^::ffff:/i, "");
  ip = ip.replace(/^::1$/, "127.0.0.1");
  ip = ip.replace(/^0:0:0:0:0:0:0:1$/, "127.0.0.1");

  if (ip.startsWith("[") && ip.includes("]")) {
    ip = ip.slice(1, ip.indexOf("]"));
  } else if (/^\d{1,3}(?:\.\d{1,3}){3}:\d+$/.test(ip)) {
    ip = ip.slice(0, ip.lastIndexOf(":"));
  }

  return ip || "0.0.0.0";
};

const getClientIp = (req) =>
  normalizeIpAddress(
    firstHeaderValue(req.headers["x-forwarded-for"])
      || firstHeaderValue(req.headers["cf-connecting-ip"])
      || firstHeaderValue(req.headers["true-client-ip"])
      || firstHeaderValue(req.headers["x-real-ip"])
      || req.ip
      || req.socket?.remoteAddress
      || req.connection?.remoteAddress
  );

const isPrivateOrLocalIp = (ipAddress = "") => {
  const ip = normalizeIpAddress(ipAddress);
  if (ip === "127.0.0.1" || ip === "0.0.0.0" || ip === "localhost") return true;
  if (ip === "::1") return true;

  if (net.isIP(ip) === 4) {
    const [a, b] = ip.split(".").map((part) => Number.parseInt(part, 10));
    return (
      a === 10
      || a === 127
      || (a === 172 && b >= 16 && b <= 31)
      || (a === 192 && b === 168)
      || (a === 169 && b === 254)
    );
  }

  if (net.isIP(ip) === 6) {
    const lower = ip.toLowerCase();
    return lower === "::1" || lower.startsWith("fc") || lower.startsWith("fd") || lower.startsWith("fe80");
  }

  return true;
};

const maskIpAddress = (ipAddress = "") => {
  const ip = normalizeIpAddress(ipAddress);

  if (net.isIP(ip) === 4) {
    const parts = ip.split(".");
    return `${parts[0]}.${parts[1]}.xxx.xxx`;
  }

  if (net.isIP(ip) === 6) {
    const groups = ip.split(":").filter(Boolean);
    return `${groups.slice(0, 2).join(":") || "xxxx"}:xxxx:xxxx`;
  }

  return "Hidden";
};

module.exports = {
  getClientIp,
  isPrivateOrLocalIp,
  maskIpAddress,
  normalizeIpAddress,
};
