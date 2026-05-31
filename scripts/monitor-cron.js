#!/usr/bin/env node

/**
 * Standalone Domain Monitoring Script for Render.com Cron Job
 *
 * This script runs independently without React/browser
 * Checks domains, writes to Firebase, sends Slack notifications
 */

import { initializeApp as initializeClientApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import {
  getFirestore as getClientFirestore,
  collection as clientCollection,
  addDoc as clientAddDoc,
  doc as clientDoc,
  getDoc as clientGetDoc,
  setDoc as clientSetDoc,
  serverTimestamp as clientServerTimestamp,
} from "firebase/firestore";
import dns from "dns";
import { promisify } from "util";
import fetch from "node-fetch";

// Promisify DNS lookup
const dnsLookup = promisify(dns.lookup);

function getRequiredEnv(key) {
  const value = process.env[key];
  if (!value || String(value).trim() === "") {
    throw new Error(`[Monitor] Missing required environment variable: ${key}`);
  }
  return String(value).trim();
}

const firebaseConfig = {
  apiKey: getRequiredEnv("FIREBASE_API_KEY"),
  authDomain: getRequiredEnv("FIREBASE_AUTH_DOMAIN"),
  projectId: getRequiredEnv("FIREBASE_PROJECT_ID"),
  storageBucket: getRequiredEnv("FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: getRequiredEnv("FIREBASE_MESSAGING_SENDER_ID"),
  appId: getRequiredEnv("FIREBASE_APP_ID"),
  measurementId: getRequiredEnv("FIREBASE_MEASUREMENT_ID"),
};

let db;
let firestoreMode = "client";
let adminServerTimestampFactory = null;
let clientAuthUid = null;

const STATS_HEARTBEAT_HOURS = Number(process.env.STATS_HEARTBEAT_HOURS || "12");
const STATS_HEARTBEAT_MS = Math.max(1, STATS_HEARTBEAT_HOURS) * 60 * 60 * 1000;

function parseBooleanEnv(value, defaultValue = false) {
  if (value === undefined || value === null || String(value).trim() === "") {
    return defaultValue;
  }

  const normalizedValue = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalizedValue)) return true;
  if (["0", "false", "no", "off"].includes(normalizedValue)) return false;

  return defaultValue;
}

function parsePauseUntilTimestamp(rawValue) {
  if (!rawValue || String(rawValue).trim() === "") {
    return null;
  }

  const parsedMs = Date.parse(String(rawValue).trim());
  if (Number.isNaN(parsedMs)) {
    console.warn(
      "[Monitor] Invalid MONITORING_PAUSE_UNTIL format. Expected ISO date/time, got:",
      rawValue,
    );
    return null;
  }

  return parsedMs;
}

function isQuotaExhaustedError(error) {
  const code = String(error?.code || "").toLowerCase();
  const message = String(error?.message || "").toLowerCase();

  return (
    code.includes("resource-exhausted") ||
    message.includes("resource_exhausted") ||
    message.includes("resource-exhausted") ||
    message.includes("quota")
  );
}

async function getRemoteMonitoringControl() {
  try {
    const controlRef = fsDoc("users", "default-user");
    const controlSnap = await fsGetDoc(controlRef);

    if (!docExists(controlSnap)) {
      return null;
    }

    const data = controlSnap.data()?.monitoringControl;
    if (!data || typeof data.enabled !== "boolean") {
      return null;
    }

    return {
      enabled: data.enabled,
      updatedAt: data.updatedAt,
      updatedBy: data.updatedBy,
    };
  } catch (error) {
    console.warn(
      "[Monitor] Failed to read remote monitoring control, fallback to env value:",
      error?.message || error,
    );
    return null;
  }
}

const MONITORING_ENABLED = parseBooleanEnv(
  process.env.MONITORING_ENABLED,
  true,
);
const MONITORING_PAUSE_UNTIL_TS = parsePauseUntilTimestamp(
  process.env.MONITORING_PAUSE_UNTIL,
);
const MONITORING_QUOTA_GRACEFUL_EXIT = parseBooleanEnv(
  process.env.MONITORING_QUOTA_GRACEFUL_EXIT,
  true,
);

// Slack webhook URL
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

console.log("[Monitor] Starting domain monitoring cron job...");
console.log("[Monitor] Firebase Project:", firebaseConfig.projectId);
console.log("[Monitor] Slack Enabled:", !!SLACK_WEBHOOK_URL);
console.log("[Monitor] Enabled:", MONITORING_ENABLED);
console.log(
  "[Monitor] Pause Until:",
  MONITORING_PAUSE_UNTIL_TS
    ? new Date(MONITORING_PAUSE_UNTIL_TS).toISOString()
    : "none",
);
console.log("[Monitor] Quota Graceful Exit:", MONITORING_QUOTA_GRACEFUL_EXIT);

function parseServiceAccount(rawValue) {
  if (!rawValue) return null;

  try {
    return JSON.parse(rawValue);
  } catch (_) {
    try {
      const decoded = Buffer.from(rawValue, "base64").toString("utf8");
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  }
}

const docExists = (snapshot) => {
  if (typeof snapshot?.exists === "function") {
    return snapshot.exists();
  }
  return !!snapshot?.exists;
};

const fsCollection = (name) => {
  if (firestoreMode === "admin") {
    return db.collection(name);
  }
  return clientCollection(db, name);
};

const fsDoc = (collectionName, docId) => {
  if (firestoreMode === "admin") {
    return db.collection(collectionName).doc(docId);
  }
  return clientDoc(db, collectionName, docId);
};

const fsGetDoc = async (docRef) => {
  if (firestoreMode === "admin") {
    return docRef.get();
  }
  return clientGetDoc(docRef);
};

const fsSetDoc = async (docRef, data, options = undefined) => {
  if (firestoreMode === "admin") {
    if (options?.merge) {
      return docRef.set(data, { merge: true });
    }
    return docRef.set(data);
  }
  return clientSetDoc(docRef, data, options);
};

const fsAddDoc = async (collectionRef, data) => {
  if (firestoreMode === "admin") {
    return collectionRef.add(data);
  }
  return clientAddDoc(collectionRef, data);
};

const fsServerTimestamp = () => {
  if (firestoreMode === "admin" && adminServerTimestampFactory) {
    return adminServerTimestampFactory();
  }
  return clientServerTimestamp();
};

async function initializeFirestoreConnection() {
  const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT;
  const serviceAccount = parseServiceAccount(serviceAccountRaw);

  if (serviceAccount) {
    try {
      const {
        initializeApp: initializeAdminApp,
        cert,
        getApps,
      } = await import("firebase-admin/app");
      const { getFirestore: getAdminFirestore, FieldValue } =
        await import("firebase-admin/firestore");

      const adminApp =
        getApps().length > 0
          ? getApps()[0]
          : initializeAdminApp({
              credential: cert(serviceAccount),
              projectId: serviceAccount.project_id || firebaseConfig.projectId,
            });

      db = getAdminFirestore(adminApp);
      firestoreMode = "admin";
      adminServerTimestampFactory = () => FieldValue.serverTimestamp();
      console.log("[Monitor] Firestore mode: admin-sdk (service account)");
      return;
    } catch (adminInitError) {
      console.error(
        "[Monitor] Failed to initialize admin SDK, falling back to client SDK:",
        adminInitError.message,
      );
    }
  }

  const app = initializeClientApp(firebaseConfig);
  db = getClientFirestore(app);
  firestoreMode = "client";
  console.log("[Monitor] Firestore mode: client-sdk (rules apply)");

  const cronEmail = process.env.FIREBASE_CRON_EMAIL;
  const cronPassword = process.env.FIREBASE_CRON_PASSWORD;

  if (cronEmail && cronPassword) {
    try {
      const auth = getAuth(app);
      const credential = await signInWithEmailAndPassword(
        auth,
        cronEmail,
        cronPassword,
      );
      clientAuthUid = credential.user.uid;
      console.log("[Monitor] Client auth login success:", clientAuthUid);
    } catch (authError) {
      console.error("[Monitor] Client auth login failed:", authError.message);
      throw authError;
    }
  } else {
    console.log(
      "[Monitor] Client auth credentials not provided (FIREBASE_CRON_EMAIL/FIREBASE_CRON_PASSWORD)",
    );
  }
}

/**
 * Perform a single HTTP reachability attempt.
 * Returns { reachable, protocol, responseTime, statusCode, error }
 * Accepts any HTTP response (including 4xx/5xx) as "server alive".
 * Falls back from HEAD → GET if server rejects HEAD.
 */
async function attemptHTTP(baseUrl, protocol, timeoutMs) {
  const url = `${protocol}://${baseUrl}`;
  const startTime = Date.now();

  for (const method of ["HEAD", "GET"]) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(url, {
        method,
        signal: controller.signal,
        redirect: "follow",
      });
      clearTimeout(timeoutId);

      // Any HTTP response means server is alive (even 403/503)
      return {
        reachable: true,
        protocol,
        responseTime: Date.now() - startTime,
        statusCode: response.status,
        error: null,
      };
    } catch (err) {
      if (err.name === "AbortError") {
        return {
          reachable: false,
          protocol,
          responseTime: null,
          statusCode: null,
          error: "Timeout",
        };
      }
      // HEAD rejected (405/ECONNRESET) → retry with GET
      if (method === "HEAD") continue;
      return {
        reachable: false,
        protocol,
        responseTime: null,
        statusCode: null,
        error: err.message,
      };
    }
  }
  return {
    reachable: false,
    protocol,
    responseTime: null,
    statusCode: null,
    error: "Unreachable",
  };
}

/**
 * Check single domain — with retry, longer timeout, HEAD→GET fallback,
 * and accepts any HTTP status (4xx/5xx) as "server alive".
 */
async function checkDomain(domain) {
  const url = domain.url.replace(/^https?:\/\//, "");
  const HTTP_TIMEOUT = 12000; // 12s — generous for slow .go.id servers
  const MAX_RETRIES = 2; // up to 2 attempts before declaring down

  // ── DNS lookup ──────────────────────────────────────────────────────────
  let ipAddress = null;
  try {
    const dnsResult = await Promise.race([
      dnsLookup(url),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("DNS timeout")), 8000),
      ),
    ]);
    ipAddress = dnsResult?.address || null;
  } catch (_) {
    // DNS failed entirely
  }

  const dnsResolved = !!ipAddress;

  // ── HTTP reachability (with retry) ──────────────────────────────────────
  let lastResult = null;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    // Try HTTPS first, then HTTP
    const httpsResult = await attemptHTTP(url, "https", HTTP_TIMEOUT);
    if (httpsResult.reachable) {
      return {
        status: "online",
        ipAddress,
        responseTime: httpsResult.responseTime,
        protocol: "https",
        error: null,
      };
    }

    const httpResult = await attemptHTTP(url, "http", HTTP_TIMEOUT);
    if (httpResult.reachable) {
      return {
        status: "online",
        ipAddress,
        responseTime: httpResult.responseTime,
        protocol: "http",
        error: null,
      };
    }

    lastResult = httpsResult.error === "Timeout" ? httpsResult : httpResult;

    // Wait 2s before retry (except last attempt)
    if (attempt < MAX_RETRIES) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  // ── Classify after retries exhausted ────────────────────────────────────
  if (dnsResolved) {
    // dns-only ONLY when the error is specifically SSL/TLS/cert related.
    // Any other failure (server down, connection refused, timeout, etc.) = offline.
    const errMsg = (lastResult?.error || "").toLowerCase();
    const isSslError =
      errMsg.includes("cert") ||
      errMsg.includes("ssl") ||
      errMsg.includes("tls") ||
      errMsg.includes("self_signed") ||
      errMsg.includes("self signed") ||
      errMsg.includes("unable_to_verify") ||
      errMsg.includes("handshake");

    if (isSslError) {
      return {
        status: "dns-only",
        ipAddress,
        responseTime: null,
        protocol: null,
        error: lastResult?.error || "SSL/TLS certificate error",
      };
    }

    // Server unreachable / connection refused / timeout → offline
    return {
      status: "offline",
      ipAddress,
      responseTime: null,
      protocol: null,
      error: lastResult?.error || "HTTP/HTTPS not accessible",
    };
  }

  return {
    status: "offline",
    ipAddress: null,
    responseTime: null,
    protocol: null,
    error: lastResult?.error || "DNS resolution failed",
  };
}

/**
 * Get current batch number (1-4) based on current time
 * For 1-hour interval schedule - rotates every 4 hours
 */
function getCurrentBatch() {
  const now = new Date();
  const hour = now.getHours();

  // Batch rotation every 4 hours:
  // Batch 1: Hours 0, 4, 8, 12, 16, 20 (hour % 4 === 0)
  // Batch 2: Hours 1, 5, 9, 13, 17, 21 (hour % 4 === 1)
  // Batch 3: Hours 2, 6, 10, 14, 18, 22 (hour % 4 === 2)
  // Batch 4: Hours 3, 7, 11, 15, 19, 23 (hour % 4 === 3)

  return (hour % 4) + 1;
}

/**
 * Get today's date string in YYYY-MM-DD format in Asia/Jakarta timezone
 */
function getTodayString() {
  const now = new Date();
  // Convert to Jakarta time
  const jakartaTime = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }),
  );
  return jakartaTime.toISOString().split("T")[0];
}

/**
 * Get current hour in Asia/Jakarta timezone (0-23)
 */
function getCurrentHour() {
  const now = new Date();
  const jakartaTime = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }),
  );
  return jakartaTime.getHours();
}

/**
 * Get or create daily stats for a domain
 */
async function getOrCreateDailyStats(domainId) {
  const today = getTodayString();
  const statsId = `${domainId}-${today}`;

  try {
    const statsRef = fsDoc("domain-stats-daily", statsId);
    const statsSnap = await fsGetDoc(statsRef);

    if (docExists(statsSnap)) {
      return { id: statsId, ...statsSnap.data() };
    }

    // Create new stats
    const newStats = {
      id: statsId,
      domainId,
      date: today,
      totalChecks: 0,
      successChecks: 0,
      uptimePercent: 0,
      hourly: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        checks: 0,
        successChecks: 0,
        status: "offline",
      })),
      incidentIds: [],
    };

    await fsSetDoc(statsRef, newStats);
    return newStats;
  } catch (error) {
    console.error(
      `[Stats] Error getting/creating stats for ${domainId}:`,
      error.message,
    );
    // Return default if Firebase fails
    return {
      id: statsId,
      domainId,
      date: today,
      totalChecks: 0,
      successChecks: 0,
      uptimePercent: 0,
      hourly: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        checks: 0,
        successChecks: 0,
        status: "offline",
      })),
      incidentIds: [],
    };
  }
}

/**
 * Update daily stats with check result
 */
async function updateDailyStats(domainId, checkResult) {
  try {
    const stats = await getOrCreateDailyStats(domainId);
    const currentHour = getCurrentHour();

    // Update total checks
    stats.totalChecks++;
    if (checkResult.status === "online") {
      stats.successChecks++;
    }

    // Update uptime percentage
    stats.uptimePercent = (stats.successChecks / stats.totalChecks) * 100;

    // Update hourly aggregate
    const hourlyData = stats.hourly[currentHour];
    hourlyData.checks++;
    if (checkResult.status === "online") {
      hourlyData.successChecks++;
    }
    hourlyData.status = checkResult.status;

    // Update response time stats
    if (checkResult.responseTime) {
      // Update hourly avg
      if (!hourlyData.avgResponseTime) {
        hourlyData.avgResponseTime = checkResult.responseTime;
      } else {
        hourlyData.avgResponseTime =
          (hourlyData.avgResponseTime * (hourlyData.checks - 1) +
            checkResult.responseTime) /
          hourlyData.checks;
      }

      // Update daily min/max
      if (
        !stats.minResponseTime ||
        checkResult.responseTime < stats.minResponseTime
      ) {
        stats.minResponseTime = checkResult.responseTime;
      }
      if (
        !stats.maxResponseTime ||
        checkResult.responseTime > stats.maxResponseTime
      ) {
        stats.maxResponseTime = checkResult.responseTime;
      }

      // Update daily average
      if (!stats.avgResponseTime) {
        stats.avgResponseTime = checkResult.responseTime;
      } else {
        stats.avgResponseTime =
          (stats.avgResponseTime * (stats.totalChecks - 1) +
            checkResult.responseTime) /
          stats.totalChecks;
      }
    }

    // Save to Firestore
    const statsRef = fsDoc("domain-stats-daily", stats.id);
    await fsSetDoc(statsRef, stats, { merge: true });

    console.log(
      `[Stats] Updated stats for ${domainId}: ${stats.totalChecks} checks, ${stats.uptimePercent.toFixed(1)}% uptime`,
    );
  } catch (error) {
    console.error(
      `[Stats] Error updating stats for ${domainId}:`,
      error.message,
    );
  }
}

function shouldWriteDomainStats(domain, checkResult) {
  const previousStatus = domain?.lastStatsStatus || domain?.status || null;
  const currentStatus = checkResult?.status || null;
  const statusChanged =
    !!previousStatus && !!currentStatus && previousStatus !== currentStatus;

  const lastStatsWrite = Number(domain?.lastStatsWrite || 0);
  const elapsedMs = Date.now() - lastStatsWrite;
  const heartbeatDue = !lastStatsWrite || elapsedMs >= STATS_HEARTBEAT_MS;

  return {
    shouldWrite: statusChanged || heartbeatDue,
    statusChanged,
    heartbeatDue,
    elapsedMs,
  };
}

function applyCheckResultToDomainInMemory(
  allDomains,
  domainId,
  checkResult,
  options = {},
) {
  const domainIndex = allDomains.findIndex((d) => d.id === domainId);
  if (domainIndex === -1) {
    return null;
  }

  const now = Date.now();
  allDomains[domainIndex] = {
    ...allDomains[domainIndex],
    status: checkResult.status,
    responseTime: checkResult.responseTime,
    ipAddress: checkResult.ipAddress,
    lastChecked: now,
    error: checkResult.error,
    ...(options.markStatsWritten
      ? {
          lastStatsWrite: now,
          lastStatsStatus: checkResult.status,
        }
      : {}),
  };

  return allDomains[domainIndex];
}

/**
 * Send Slack batch summary (Block Kit)
 */
async function sendSlackBatchSummary({
  batchNum,
  online,
  dnsOnly,
  offline,
  total,
  offlineList,
  dnsOnlyList,
}) {
  if (!SLACK_WEBHOOK_URL) return;

  const timeWIB = new Date().toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
  });
  const color = offline > 0 ? "#ff0000" : dnsOnly > 0 ? "#ffaa00" : "#36a64f";

  const blocks = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `🔍 Batch B${batchNum} — Monitor Selesai`,
        emoji: true,
      },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `✅ *Online:*\n${online}` },
        { type: "mrkdwn", text: `❌ *Offline:*\n${offline}` },
        { type: "mrkdwn", text: `⚠️ *SSL Error:*\n${dnsOnly}` },
        { type: "mrkdwn", text: `📊 *Total Dicek:*\n${total}` },
      ],
    },
  ];

  if (offlineList.length > 0) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*❌ Domain Offline (${offlineList.length}):*\n${offlineList.map((u) => `• ${u}`).join("\n")}`,
      },
    });
  }

  if (dnsOnlyList.length > 0) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*⚠️ SSL/TLS Error (${dnsOnlyList.length}):*\n${dnsOnlyList.map((u) => `• ${u}`).join("\n")}`,
      },
    });
  }

  blocks.push({
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: `🕐 ${timeWIB} WIB | <https://domain-watchtower.vercel.app|View Dashboard>`,
      },
    ],
  });

  try {
    await fetch(SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attachments: [{ color, blocks }] }),
    });
    console.log("[Slack] Batch summary sent");
  } catch (error) {
    console.error("[Slack] Batch summary error:", error.message);
  }
}

/**
 * Send per-domain down / recovery alert to Slack (Block Kit, rich format)
 * Called only when a domain's status changes — no extra Firebase reads/writes.
 */
async function sendDomainAlertToSlack(
  domain,
  previousStatus,
  currentStatus,
  checkResult,
) {
  if (!SLACK_WEBHOOK_URL) return;

  const isDown =
    (currentStatus === "offline" || currentStatus === "dns-only") &&
    previousStatus === "online";
  const isRecovery =
    currentStatus === "online" &&
    (previousStatus === "offline" || previousStatus === "dns-only");

  if (!isDown && !isRecovery) return;

  const emoji = isDown ? (currentStatus === "dns-only" ? "⚠️" : "🔴") : "✅";
  const title = isDown
    ? currentStatus === "dns-only"
      ? "SSL/TLS Error — Sertifikat Bermasalah"
      : "Domain Down Alert"
    : "Domain Recovery";
  const color = isDown
    ? currentStatus === "dns-only"
      ? "#ffaa00"
      : "#ff0000"
    : "#36a64f";
  const timeWIB = new Date().toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
  });

  const fields = [
    {
      type: "mrkdwn",
      text: `*Domain:*\n<https://${domain.url}|${domain.url}>`,
    },
    { type: "mrkdwn", text: `*Status:*\n${currentStatus.toUpperCase()}` },
    { type: "mrkdwn", text: `*Sebelumnya:*\n${previousStatus.toUpperCase()}` },
  ];

  if (checkResult.responseTime) {
    fields.push({
      type: "mrkdwn",
      text: `*Response Time:*\n${checkResult.responseTime} ms`,
    });
  }
  if (checkResult.ipAddress) {
    fields.push({
      type: "mrkdwn",
      text: `*IP Address:*\n${checkResult.ipAddress}`,
    });
  }
  if (checkResult.error) {
    fields.push({ type: "mrkdwn", text: `*Error:*\n\`${checkResult.error}\`` });
  }

  const payload = {
    attachments: [
      {
        color,
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: `${emoji} ${title}`,
              emoji: true,
            },
          },
          { type: "section", fields },
          {
            type: "context",
            elements: [
              {
                type: "mrkdwn",
                text: `🕐 ${timeWIB} WIB | <https://domain-watchtower.vercel.app|View Dashboard>`,
              },
            ],
          },
        ],
      },
    ],
  };

  try {
    await fetch(SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    console.log(`[Slack] Domain alert sent: ${domain.url} → ${currentStatus}`);
  } catch (error) {
    console.error(
      `[Slack] Domain alert error for ${domain.url}:`,
      error.message,
    );
  }
}

/**
 * Main monitoring function
 */
async function runMonitoring() {
  try {
    if (!MONITORING_ENABLED) {
      console.log(
        "[Monitor] Monitoring is disabled via MONITORING_ENABLED=false. Exiting gracefully.",
      );
      return;
    }

    if (MONITORING_PAUSE_UNTIL_TS && Date.now() < MONITORING_PAUSE_UNTIL_TS) {
      console.log(
        `[Monitor] Monitoring is paused until ${new Date(MONITORING_PAUSE_UNTIL_TS).toISOString()} via MONITORING_PAUSE_UNTIL. Exiting gracefully.`,
      );
      return;
    }

    const remoteControl = await getRemoteMonitoringControl();
    if (remoteControl) {
      console.log(
        `[Monitor] Remote control loaded: enabled=${remoteControl.enabled} ` +
          `(updatedBy=${remoteControl.updatedBy || "unknown"}, updatedAt=${remoteControl.updatedAt || "unknown"})`,
      );

      if (!remoteControl.enabled) {
        console.log(
          "[Monitor] Monitoring disabled by admin toggle in UI. Exiting gracefully.",
        );
        return;
      }
    }

    if (firestoreMode === "client" && !clientAuthUid) {
      throw new Error(
        "Client mode requires FIREBASE_CRON_EMAIL and FIREBASE_CRON_PASSWORD, or provide FIREBASE_SERVICE_ACCOUNT for admin mode",
      );
    }

    console.log("[Monitor] Fetching domains from Firebase...");

    const domainsDocRef = fsDoc("domains", "default-user");
    const domainsDocSnap = await fsGetDoc(domainsDocRef);

    if (!docExists(domainsDocSnap)) {
      console.log("[Monitor] domains/default-user not found in Firebase");
      return;
    }

    const data = domainsDocSnap.data();
    const allDomains = Array.isArray(data.domains) ? data.domains : [];

    if (allDomains.length === 0) {
      console.log("[Monitor] No domains found in domains/default-user");
      return;
    }

    console.log(`[Monitor] Found ${allDomains.length} total domains`);

    // Get current batch (B1-B4) based on time
    const currentBatch = getCurrentBatch();
    console.log(`[Monitor] Current batch: B${currentBatch}`);

    // Filter domains by batch for manageable runtime (<1 min per batch)
    const domainsToCheck = allDomains.filter(
      (d) => d.checkBatch === currentBatch,
    );
    console.log(
      `[Monitor] Checking ${domainsToCheck.length} domains in batch B${currentBatch}`,
    );

    if (domainsToCheck.length === 0) {
      console.log("[Monitor] No domains in current batch");

      // Write log even if no domains checked
      try {
        const logsRef = fsCollection("github-actions-logs");
        await fsAddDoc(logsRef, {
          timestamp: fsServerTimestamp(),
          batch: currentBatch,
          totalDomains: allDomains.length,
          domainsChecked: 0,
          results: {
            online: 0,
            dnsOnly: 0,
            offline: 0,
          },
          duration: null,
          status: "success",
        });
        console.log("[Monitor] Empty batch log written to Firebase");
      } catch (logError) {
        console.error("[Monitor] Failed to write log:", logError.message);
      }

      return;
    }

    // Check domains with concurrency limit
    const CONCURRENCY_LIMIT = 10;
    const results = [];

    for (let i = 0; i < domainsToCheck.length; i += CONCURRENCY_LIMIT) {
      const batch = domainsToCheck.slice(i, i + CONCURRENCY_LIMIT);
      const batchResults = await Promise.all(
        batch.map(async (domain) => {
          console.log(`[Monitor] Checking: ${domain.url}`);
          const result = await checkDomain(domain);

          const statsDecision = shouldWriteDomainStats(domain, result);
          if (statsDecision.shouldWrite) {
            console.log(
              `[Stats] Write scheduled for ${domain.url} ` +
                `(statusChanged=${statsDecision.statusChanged}, heartbeatDue=${statsDecision.heartbeatDue}, ` +
                `elapsedMin=${Math.round(statsDecision.elapsedMs / 60000)})`,
            );
            await updateDailyStats(domain.id, result);
          } else {
            console.log(
              `[Stats] Skip write for ${domain.url} ` +
                `(status stable & heartbeat not due, elapsedMin=${Math.round(statsDecision.elapsedMs / 60000)})`,
            );
          }

          applyCheckResultToDomainInMemory(allDomains, domain.id, result, {
            markStatsWritten: statsDecision.shouldWrite,
          });

          return {
            domain,
            result,
            statsWritten: statsDecision.shouldWrite,
          };
        }),
      );
      results.push(...batchResults);
    }

    // Write back domain statuses once per run (avoid per-domain write amplification)
    try {
      const domainsRef = fsDoc("domains", "default-user");
      await fsSetDoc(
        domainsRef,
        {
          domains: allDomains,
          updatedAt: Date.now(),
        },
        { merge: true },
      );
      console.log(
        `[Domain] Persisted ${results.length} domain status updates in single write`,
      );
    } catch (domainWriteError) {
      console.error(
        "[Domain] Failed to persist consolidated domain updates:",
        domainWriteError.message,
      );
    }

    // Count results
    const online = results.filter((r) => r.result.status === "online").length;
    const dnsOnly = results.filter(
      (r) => r.result.status === "dns-only",
    ).length;
    const offline = results.filter((r) => r.result.status === "offline").length;
    const statsWrites = results.filter((r) => r.statsWritten).length;

    console.log(
      `[Monitor] Results: ${online} online, ${dnsOnly} DNS-only, ${offline} offline`,
    );
    console.log(
      `[Monitor] Stats writes this run: ${statsWrites}/${results.length} (heartbeat=${STATS_HEARTBEAT_HOURS}h)`,
    );

    // Send per-domain down/recovery alerts (only domains with notificationsEnabled: true)
    for (const { domain, result } of results) {
      if (domain.notificationsEnabled !== true) continue;
      const previousStatus = domain.status || null;
      const currentStatus = result.status;
      if (previousStatus && previousStatus !== currentStatus) {
        await sendDomainAlertToSlack(
          domain,
          previousStatus,
          currentStatus,
          result,
        );
      }
    }

    // Send summary to Slack only if there are offline or dns-only domains
    const offlineList = results
      .filter((r) => r.result.status === "offline")
      .map((r) => r.domain.url);
    const dnsOnlyList = results
      .filter((r) => r.result.status === "dns-only")
      .map((r) => r.domain.url);

    if (offlineList.length > 0 || dnsOnlyList.length > 0) {
      await sendSlackBatchSummary({
        batchNum: currentBatch,
        online,
        dnsOnly,
        offline,
        total: domainsToCheck.length,
        offlineList,
        dnsOnlyList,
      });
    } else {
      console.log("[Slack] All domains online — skipping batch summary");
    }

    // Write log to Firebase for web app monitoring
    try {
      const logsRef = fsCollection("github-actions-logs");
      await fsAddDoc(logsRef, {
        timestamp: fsServerTimestamp(),
        batch: currentBatch,
        totalDomains: allDomains.length,
        domainsChecked: domainsToCheck.length,
        results: {
          online,
          dnsOnly,
          offline,
        },
        duration: null, // GitHub Actions will track this
        status: "success",
      });
      console.log("[Monitor] Log written to Firebase");
    } catch (logError) {
      console.error("[Monitor] Failed to write log:", logError.message);
    }

    console.log("[Monitor] Monitoring cycle complete");
  } catch (error) {
    if (MONITORING_QUOTA_GRACEFUL_EXIT && isQuotaExhaustedError(error)) {
      console.warn(
        "[Monitor] Firestore quota exhausted. Exiting gracefully (MONITORING_QUOTA_GRACEFUL_EXIT=true).",
      );
      console.warn("[Monitor] Details:", error?.message || error);
      return;
    }

    console.error("[Monitor] Error:", error);

    // Write error log to Firebase
    try {
      const logsRef = fsCollection("github-actions-logs");
      await fsAddDoc(logsRef, {
        timestamp: fsServerTimestamp(),
        status: "error",
        error: error.message,
        stack: error.stack,
      });
    } catch (logError) {
      console.error("[Monitor] Failed to write error log:", logError.message);
    }

    if (SLACK_WEBHOOK_URL) {
      try {
        await fetch(SLACK_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: `❌ Monitoring Error: ${error.message}`,
          }),
        });
      } catch (_) {}
    }
    process.exit(1);
  }
}

// Initialize and run monitoring
initializeFirestoreConnection()
  .then(() => runMonitoring())
  .then(() => {
    console.log("[Monitor] Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("[Monitor] Fatal error:", error);
    process.exit(1);
  });
