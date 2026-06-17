import dns from "node:dns/promises";

export const config = {
  maxDuration: 60,
};

const HTTP_TIMEOUT_MS = 12000;
const MAX_DOMAINS_PER_REQUEST = 12;
const MANUAL_CHECK_WINDOW_MS = 60_000;
const MANUAL_CHECK_MAX_REQUESTS = 2;
const AUTH_VERIFY_TIMEOUT_MS = 8000;
const FIREBASE_WEB_API_KEY =
  process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY || "";
const rateLimitStore =
  globalThis.__domainMonitorManualRateLimitStore || new Map();

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

const getBearerToken = (request) => {
  const authorization = request.headers.authorization;
  if (!authorization || typeof authorization !== "string") return null;

  const [scheme, token] = authorization.trim().split(/\s+/);
  if (!scheme || scheme.toLowerCase() !== "bearer" || !token) return null;

  return token;
};

const verifyFirebaseIdToken = async (idToken) => {
  if (!FIREBASE_WEB_API_KEY) {
    throw new Error("Manual check auth is not configured");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    AUTH_VERIFY_TIMEOUT_MS,
  );

  try {
    const verifyResponse = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(FIREBASE_WEB_API_KEY)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken }),
        signal: controller.signal,
      },
    );

    if (!verifyResponse.ok) {
      return null;
    }

    const payload = await verifyResponse.json();
    const user = Array.isArray(payload?.users) ? payload.users[0] : null;
    const uid = user?.localId;

    if (!uid || typeof uid !== "string") {
      return null;
    }

    return { uid };
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
};

const getClientIdentifier = (request) => {
  const forwardedFor = request.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return forwardedFor.split(",")[0].trim();
  }

  if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
    return String(forwardedFor[0] || "")
      .split(",")[0]
      .trim();
  }

  return (
    request.headers["x-real-ip"] || request.socket?.remoteAddress || "unknown"
  );
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
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((existingEntry.resetAt - now) / 1000),
      ),
    };
  }

  existingEntry.count += 1;
  rateLimitStore.set(clientIdentifier, existingEntry);
  return {
    allowed: true,
    remaining: Math.max(0, MANUAL_CHECK_MAX_REQUESTS - existingEntry.count),
    retryAfterSeconds: Math.max(
      1,
      Math.ceil((existingEntry.resetAt - now) / 1000),
    ),
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
    normalized.includes("unable to verify") ||
    normalized.includes("leaf_signature") ||
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

// Fallback untuk domain dengan incomplete cert chain (misal: UNABLE_TO_VERIFY_LEAF_SIGNATURE).
// Menggunakan https.request langsung dengan rejectUnauthorized:false karena
// native fetch() tidak mendukung opsi agent untuk bypass SSL verification.
const attemptHttpsNoVerify = (domain) =>
  new Promise((resolve) => {
    const startedAt = Date.now();
    import("node:https").then(({ request }) => {
      const timer = setTimeout(
        () => resolve({ accessible: false, error: "Timeout" }),
        HTTP_TIMEOUT_MS,
      );
      const req = request(
        {
          hostname: domain,
          path: "/",
          method: "HEAD",
          rejectUnauthorized: false,
        },
        (res) => {
          clearTimeout(timer);
          resolve({
            accessible: true,
            responseTime: Date.now() - startedAt,
            statusCode: res.statusCode,
          });
        },
      );
      req.on("error", () => {
        clearTimeout(timer);
        resolve({ accessible: false });
      });
      req.end();
    });
  });

const attemptHttpWithAgent = attemptHttp; // alias kept for internal checkDomain use

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

  // Fallback: jika SSL gagal karena incomplete cert chain (bukan self-signed),
  // server mungkin tetap aktif — coba tanpa verifikasi cert untuk konfirmasi.
  if (dnsResolvable && isSslError(rawError)) {
    const fallbackResult = await attemptHttpsNoVerify(domain);
    if (fallbackResult.accessible) {
      return {
        id,
        status: "online",
        responseTime: fallbackResult.responseTime,
        lastChecked: Date.now(),
        ipAddress,
        httpAccessible: true,
        dnsResolvable,
        protocol: "https",
        sslWarning: true,
      };
    }
  }

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

  const idToken = getBearerToken(request);
  if (!idToken) {
    json(response, 401, {
      error: "Unauthorized: login diperlukan untuk manual check",
    });
    return;
  }

  const authUser = await verifyFirebaseIdToken(idToken);
  if (!authUser) {
    json(response, 401, {
      error: "Unauthorized: token tidak valid atau sudah expired",
    });
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
