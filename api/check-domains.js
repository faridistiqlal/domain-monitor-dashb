import dns from "node:dns/promises";

export const config = {
  maxDuration: 60,
};

const HTTP_TIMEOUT_MS = 12000;
const MAX_DOMAINS_PER_REQUEST = 12;
const MANUAL_CHECK_WINDOW_MS = 60_000;
const MANUAL_CHECK_MAX_REQUESTS = 2;
const rateLimitStore = globalThis.__domainMonitorManualRateLimitStore || new Map();

if (!globalThis.__domainMonitorManualRateLimitStore) {
  globalThis.__domainMonitorManualRateLimitStore = rateLimitStore;
}

const json = (response, statusCode, payload) => {
  response.status(statusCode).json(payload);
};

const normalizeDomain = (url) =>
  String(url || "")
    .trim()
    .replace(/^https?:\/\//i, "")
    .split("/")[0]
    .toLowerCase();

const getClientIdentifier = (request) => {
  const forwardedFor = request.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return forwardedFor.split(",")[0].trim();
  }

  if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
    return String(forwardedFor[0] || "").split(",")[0].trim();
  }

  return request.headers["x-real-ip"] || request.socket?.remoteAddress || "unknown";
};

const cleanupRateLimitStore = (now) => {
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now >= entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }
};

const checkRateLimit = (request) => {
  const now = Date.now();
  cleanupRateLimitStore(now);

  const clientIdentifier = getClientIdentifier(request);
  const existingEntry = rateLimitStore.get(clientIdentifier);

  if (!existingEntry || now >= existingEntry.resetAt) {
    const freshEntry = {
      count: 1,
      resetAt: now + MANUAL_CHECK_WINDOW_MS,
    };
    rateLimitStore.set(clientIdentifier, freshEntry);
    return {
      allowed: true,
      remaining: Math.max(0, MANUAL_CHECK_MAX_REQUESTS - freshEntry.count),
      retryAfterSeconds: Math.ceil(MANUAL_CHECK_WINDOW_MS / 1000),
    };
  }

  if (existingEntry.count >= MANUAL_CHECK_MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existingEntry.resetAt - now) / 1000)),
    };
  }

  existingEntry.count += 1;
  rateLimitStore.set(clientIdentifier, existingEntry);
  return {
    allowed: true,
    remaining: Math.max(0, MANUAL_CHECK_MAX_REQUESTS - existingEntry.count),
    retryAfterSeconds: Math.max(1, Math.ceil((existingEntry.resetAt - now) / 1000)),
  };
};

const isAllowedDomain = (domain) =>
  domain === "kendalkab.go.id" || domain.endsWith(".kendalkab.go.id");

const isSslError = (message) => {
  const normalized = String(message || "").toLowerCase();
  return (
    normalized.includes("cert") ||
    normalized.includes("ssl") ||
    normalized.includes("tls") ||
    normalized.includes("self_signed") ||
    normalized.includes("self signed") ||
    normalized.includes("unable_to_verify") ||
    normalized.includes("handshake")
  );
};

const normalizeError = (error) => {
  if (!error) return "Server tidak dapat diakses";
  if (error.name === "AbortError") return "Timeout";
  if (error.code === "ECONNREFUSED") return "Connection Refused";
  if (error.code === "ECONNRESET") return "Connection Reset";
  if (error.code === "ENOTFOUND") return "DNS Tidak Ditemukan";
  if (error.code === "ETIMEDOUT") return "Timeout";
  return error.message || String(error);
};

const lookupIpAddress = async (domain) => {
  try {
    const result = await dns.lookup(domain);
    return result?.address || null;
  } catch {
    return null;
  }
};

const attemptHttp = async (domain, protocol) => {
  const startedAt = Date.now();
  const url = `${protocol}://${domain}`;

  for (const method of ["HEAD", "GET"]) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), HTTP_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method,
        redirect: "follow",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      return {
        accessible: true,
        protocol,
        responseTime: Date.now() - startedAt,
        statusCode: response.status,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      if (method === "HEAD") continue;

      return {
        accessible: false,
        protocol,
        responseTime: Date.now() - startedAt,
        error: normalizeError(error),
        rawError: error?.message || String(error),
      };
    }
  }

  return {
    accessible: false,
    protocol,
    responseTime: Date.now() - startedAt,
    error: "Server tidak dapat diakses",
  };
};

const checkDomain = async ({ id, url }) => {
  const domain = normalizeDomain(url);

  if (!id || !domain || !isAllowedDomain(domain)) {
    return {
      id,
      status: "offline",
      lastChecked: Date.now(),
      error: "Domain tidak valid atau tidak diizinkan",
      httpAccessible: false,
      dnsResolvable: false,
    };
  }

  const ipAddress = await lookupIpAddress(domain);
  const dnsResolvable = !!ipAddress;
  const httpsResult = await attemptHttp(domain, "https");

  if (httpsResult.accessible) {
    return {
      id,
      status: "online",
      responseTime: httpsResult.responseTime,
      lastChecked: Date.now(),
      ipAddress,
      httpAccessible: true,
      dnsResolvable,
      protocol: "https",
    };
  }

  const httpResult = await attemptHttp(domain, "http");

  if (httpResult.accessible) {
    return {
      id,
      status: "online",
      responseTime: httpResult.responseTime,
      lastChecked: Date.now(),
      ipAddress,
      httpAccessible: true,
      dnsResolvable,
      protocol: "http",
    };
  }

  const error =
    httpsResult.error || httpResult.error || "Server tidak dapat diakses";
  const rawError = httpsResult.rawError || httpResult.rawError || error;
  const status = dnsResolvable && isSslError(rawError) ? "dns-only" : "offline";

  return {
    id,
    status,
    responseTime: Math.min(
      httpsResult.responseTime || HTTP_TIMEOUT_MS,
      httpResult.responseTime || HTTP_TIMEOUT_MS,
    ),
    lastChecked: Date.now(),
    error:
      status === "dns-only"
        ? error
        : error === "DNS Tidak Ditemukan"
          ? "DNS tidak dapat di-resolve"
          : error,
    ipAddress,
    httpAccessible: false,
    dnsResolvable,
  };
};

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    json(response, 405, { error: "Method not allowed" });
    return;
  }

  const rateLimit = checkRateLimit(request);
  response.setHeader("X-RateLimit-Limit", String(MANUAL_CHECK_MAX_REQUESTS));
  response.setHeader("X-RateLimit-Remaining", String(rateLimit.remaining));
  response.setHeader("X-RateLimit-Reset", String(rateLimit.retryAfterSeconds));

  if (!rateLimit.allowed) {
    response.setHeader("Retry-After", String(rateLimit.retryAfterSeconds));
    json(response, 429, {
      error: `Terlalu sering menjalankan manual check. Coba lagi dalam ${rateLimit.retryAfterSeconds} detik.`,
    });
    return;
  }

  const domains = Array.isArray(request.body?.domains)
    ? request.body.domains
    : [];

  if (domains.length === 0) {
    json(response, 400, { error: "domains wajib diisi" });
    return;
  }

  if (domains.length > MAX_DOMAINS_PER_REQUEST) {
    json(response, 413, {
      error: `Maksimal ${MAX_DOMAINS_PER_REQUEST} domain per request`,
    });
    return;
  }

  const results = await Promise.all(domains.map(checkDomain));
  json(response, 200, { results });
}
