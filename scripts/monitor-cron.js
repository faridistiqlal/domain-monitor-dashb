#!/usr/bin/env node

/**
 * Standalone Domain Monitoring Script for Render.com Cron Job
 * 
 * This script runs independently without React/browser
 * Checks domains, writes to Firebase, sends Slack notifications
 */

import { initializeApp as initializeClientApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import {
  getFirestore as getClientFirestore,
  collection as clientCollection,
  addDoc as clientAddDoc,
  doc as clientDoc,
  getDoc as clientGetDoc,
  setDoc as clientSetDoc,
  serverTimestamp as clientServerTimestamp,
} from 'firebase/firestore'
import dns from 'dns'
import { promisify } from 'util'
import fetch from 'node-fetch'

// Promisify DNS lookup
const dnsLookup = promisify(dns.lookup)

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyDsONdN5q1vz5Gp6Irk0K7T4-GexuJ6Meo",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "kendal-monitor.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "kendal-monitor",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "kendal-monitor.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "769565947746",
  appId: process.env.FIREBASE_APP_ID || "1:769565947746:web:90ae2c85d894b0da44de3b",
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-C3RLK090HK"
}

let db
let firestoreMode = 'client'
let adminServerTimestampFactory = null
let clientAuthUid = null

// Slack webhook URL
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL

console.log('[Monitor] Starting domain monitoring cron job...')
console.log('[Monitor] Firebase Project:', firebaseConfig.projectId)
console.log('[Monitor] Slack Enabled:', !!SLACK_WEBHOOK_URL)

function parseServiceAccount(rawValue) {
  if (!rawValue) return null

  try {
    return JSON.parse(rawValue)
  } catch (_) {
    try {
      const decoded = Buffer.from(rawValue, 'base64').toString('utf8')
      return JSON.parse(decoded)
    } catch {
      return null
    }
  }
}

const docExists = (snapshot) => {
  if (typeof snapshot?.exists === 'function') {
    return snapshot.exists()
  }
  return !!snapshot?.exists
}

const fsCollection = (name) => {
  if (firestoreMode === 'admin') {
    return db.collection(name)
  }
  return clientCollection(db, name)
}

const fsDoc = (collectionName, docId) => {
  if (firestoreMode === 'admin') {
    return db.collection(collectionName).doc(docId)
  }
  return clientDoc(db, collectionName, docId)
}

const fsGetDoc = async (docRef) => {
  if (firestoreMode === 'admin') {
    return docRef.get()
  }
  return clientGetDoc(docRef)
}

const fsSetDoc = async (docRef, data, options = undefined) => {
  if (firestoreMode === 'admin') {
    if (options?.merge) {
      return docRef.set(data, { merge: true })
    }
    return docRef.set(data)
  }
  return clientSetDoc(docRef, data, options)
}

const fsAddDoc = async (collectionRef, data) => {
  if (firestoreMode === 'admin') {
    return collectionRef.add(data)
  }
  return clientAddDoc(collectionRef, data)
}

const fsServerTimestamp = () => {
  if (firestoreMode === 'admin' && adminServerTimestampFactory) {
    return adminServerTimestampFactory()
  }
  return clientServerTimestamp()
}

async function initializeFirestoreConnection() {
  const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT
  const serviceAccount = parseServiceAccount(serviceAccountRaw)

  if (serviceAccount) {
    try {
      const { initializeApp: initializeAdminApp, cert, getApps } = await import('firebase-admin/app')
      const { getFirestore: getAdminFirestore, FieldValue } = await import('firebase-admin/firestore')

      const adminApp = getApps().length > 0
        ? getApps()[0]
        : initializeAdminApp({
            credential: cert(serviceAccount),
            projectId: serviceAccount.project_id || firebaseConfig.projectId,
          })

      db = getAdminFirestore(adminApp)
      firestoreMode = 'admin'
      adminServerTimestampFactory = () => FieldValue.serverTimestamp()
      console.log('[Monitor] Firestore mode: admin-sdk (service account)')
      return
    } catch (adminInitError) {
      console.error('[Monitor] Failed to initialize admin SDK, falling back to client SDK:', adminInitError.message)
    }
  }

  const app = initializeClientApp(firebaseConfig)
  db = getClientFirestore(app)
  firestoreMode = 'client'
  console.log('[Monitor] Firestore mode: client-sdk (rules apply)')

  const cronEmail = process.env.FIREBASE_CRON_EMAIL
  const cronPassword = process.env.FIREBASE_CRON_PASSWORD

  if (cronEmail && cronPassword) {
    try {
      const auth = getAuth(app)
      const credential = await signInWithEmailAndPassword(auth, cronEmail, cronPassword)
      clientAuthUid = credential.user.uid
      console.log('[Monitor] Client auth login success:', clientAuthUid)
    } catch (authError) {
      console.error('[Monitor] Client auth login failed:', authError.message)
      throw authError
    }
  } else {
    console.log('[Monitor] Client auth credentials not provided (FIREBASE_CRON_EMAIL/FIREBASE_CRON_PASSWORD)')
  }
}

/**
 * Check single domain with timeout
 */
async function checkDomain(domain) {
  const url = domain.url.replace(/^https?:\/\//, '')
  const startTime = Date.now()
  
  try {
    // DNS lookup with timeout
    const dnsPromise = dnsLookup(url)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('DNS timeout')), 5000)
    )
    
    const ipAddress = await Promise.race([dnsPromise, timeoutPromise])
    const dnsResolved = !!ipAddress.address
    
    if (!dnsResolved) {
      return {
        status: 'offline',
        ipAddress: null,
        responseTime: null,
        protocol: null,
        error: 'DNS resolution failed'
      }
    }
    
    // Try HTTPS first with reduced timeout
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
      const httpsResponse = await fetch(`https://${url}`, {
        method: 'HEAD',
        signal: controller.signal,
        redirect: 'follow'
      })
      
      clearTimeout(timeoutId)
      const responseTime = Date.now() - startTime
      
      if (httpsResponse.ok) {
        return {
          status: 'online',
          ipAddress: ipAddress.address,
          responseTime,
          protocol: 'https',
          error: null
        }
      }
    } catch (httpsError) {
      // HTTPS failed, try HTTP with timeout
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)
        
        const httpResponse = await fetch(`http://${url}`, {
          method: 'HEAD',
          signal: controller.signal,
          redirect: 'follow'
        })
        
        clearTimeout(timeoutId)
        const responseTime = Date.now() - startTime
        
        if (httpResponse.ok) {
          return {
            status: 'online',
            ipAddress: ipAddress.address,
            responseTime,
            protocol: 'http',
            error: null
          }
        }
      } catch (httpError) {
        // Both failed but DNS resolved
        return {
          status: 'dns-only',
          ipAddress: ipAddress.address,
          responseTime: null,
          protocol: null,
          error: 'HTTP/HTTPS not accessible'
        }
      }
    }
    
    return {
      status: 'dns-only',
      ipAddress: ipAddress.address,
      responseTime: null,
      protocol: null,
      error: 'Server not responding'
    }
    
  } catch (error) {
    return {
      status: 'offline',
      ipAddress: null,
      responseTime: null,
      protocol: null,
      error: error.message
    }
  }
}

/**
 * Get current batch number (1-4) based on current time
 * For 1-hour interval schedule - rotates every 4 hours
 */
function getCurrentBatch() {
  const now = new Date()
  const hour = now.getHours()
  
  // Batch rotation every 4 hours:
  // Batch 1: Hours 0, 4, 8, 12, 16, 20 (hour % 4 === 0)
  // Batch 2: Hours 1, 5, 9, 13, 17, 21 (hour % 4 === 1)
  // Batch 3: Hours 2, 6, 10, 14, 18, 22 (hour % 4 === 2)
  // Batch 4: Hours 3, 7, 11, 15, 19, 23 (hour % 4 === 3)
  
  return (hour % 4) + 1
}

/**
 * Get today's date string in YYYY-MM-DD format in Asia/Jakarta timezone
 */
function getTodayString() {
  const now = new Date()
  // Convert to Jakarta time
  const jakartaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }))
  return jakartaTime.toISOString().split('T')[0]
}

/**
 * Get current hour in Asia/Jakarta timezone (0-23)
 */
function getCurrentHour() {
  const now = new Date()
  const jakartaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }))
  return jakartaTime.getHours()
}

/**
 * Get or create daily stats for a domain
 */
async function getOrCreateDailyStats(domainId) {
  const today = getTodayString()
  const statsId = `${domainId}-${today}`
  
  try {
    const statsRef = fsDoc('domain-stats-daily', statsId)
    const statsSnap = await fsGetDoc(statsRef)
    
    if (docExists(statsSnap)) {
      return { id: statsId, ...statsSnap.data() }
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
        status: 'offline'
      })),
      incidentIds: []
    }
    
    await fsSetDoc(statsRef, newStats)
    return newStats
  } catch (error) {
    console.error(`[Stats] Error getting/creating stats for ${domainId}:`, error.message)
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
        status: 'offline'
      })),
      incidentIds: []
    }
  }
}

/**
 * Update daily stats with check result
 */
async function updateDailyStats(domainId, checkResult) {
  try {
    const stats = await getOrCreateDailyStats(domainId)
    const currentHour = getCurrentHour()
    
    // Update total checks
    stats.totalChecks++
    if (checkResult.status === 'online') {
      stats.successChecks++
    }
    
    // Update uptime percentage
    stats.uptimePercent = (stats.successChecks / stats.totalChecks) * 100
    
    // Update hourly aggregate
    const hourlyData = stats.hourly[currentHour]
    hourlyData.checks++
    if (checkResult.status === 'online') {
      hourlyData.successChecks++
    }
    hourlyData.status = checkResult.status
    
    // Update response time stats
    if (checkResult.responseTime) {
      // Update hourly avg
      if (!hourlyData.avgResponseTime) {
        hourlyData.avgResponseTime = checkResult.responseTime
      } else {
        hourlyData.avgResponseTime = 
          (hourlyData.avgResponseTime * (hourlyData.checks - 1) + checkResult.responseTime) / hourlyData.checks
      }
      
      // Update daily min/max
      if (!stats.minResponseTime || checkResult.responseTime < stats.minResponseTime) {
        stats.minResponseTime = checkResult.responseTime
      }
      if (!stats.maxResponseTime || checkResult.responseTime > stats.maxResponseTime) {
        stats.maxResponseTime = checkResult.responseTime
      }
      
      // Update daily average
      if (!stats.avgResponseTime) {
        stats.avgResponseTime = checkResult.responseTime
      } else {
        stats.avgResponseTime = 
          (stats.avgResponseTime * (stats.totalChecks - 1) + checkResult.responseTime) / stats.totalChecks
      }
    }
    
    // Save to Firestore
    const statsRef = fsDoc('domain-stats-daily', stats.id)
    await fsSetDoc(statsRef, stats, { merge: true })
    
    console.log(`[Stats] Updated stats for ${domainId}: ${stats.totalChecks} checks, ${stats.uptimePercent.toFixed(1)}% uptime`)
  } catch (error) {
    console.error(`[Stats] Error updating stats for ${domainId}:`, error.message)
  }
}

/**
 * Update domain status in domains collection
 */
async function updateDomainStatus(domainId, checkResult, allDomains) {
  try {
    // Find the domain in the array
    const domainIndex = allDomains.findIndex(d => d.id === domainId)
    if (domainIndex === -1) return
    
    // Update the domain object
    allDomains[domainIndex].status = checkResult.status
    allDomains[domainIndex].responseTime = checkResult.responseTime
    allDomains[domainIndex].ipAddress = checkResult.ipAddress
    allDomains[domainIndex].lastChecked = Date.now()
    allDomains[domainIndex].error = checkResult.error
    
    // Write back to Firebase (default-user document)
    const domainsRef = fsDoc('domains', 'default-user')
    await fsSetDoc(domainsRef, {
      domains: allDomains,
      updatedAt: Date.now()
    }, { merge: true })
    
    console.log(`[Domain] Updated domain status: ${allDomains[domainIndex].url} -> ${checkResult.status}`)
  } catch (error) {
    console.error(`[Domain] Error updating domain status:`, error.message)
  }
}

/**
 * Send Slack notification
 */
async function sendSlackNotification(message) {
  if (!SLACK_WEBHOOK_URL) return
  
  try {
    await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message })
    })
    console.log('[Slack] Notification sent')
  } catch (error) {
    console.error('[Slack] Error:', error.message)
  }
}

/**
 * Main monitoring function
 */
async function runMonitoring() {
  try {
    if (firestoreMode === 'client' && !clientAuthUid) {
      throw new Error('Client mode requires FIREBASE_CRON_EMAIL and FIREBASE_CRON_PASSWORD, or provide FIREBASE_SERVICE_ACCOUNT for admin mode')
    }

    console.log('[Monitor] Fetching domains from Firebase...')

    const domainsDocRef = fsDoc('domains', 'default-user')
    const domainsDocSnap = await fsGetDoc(domainsDocRef)

    if (!docExists(domainsDocSnap)) {
      console.log('[Monitor] domains/default-user not found in Firebase')
      return
    }

    const data = domainsDocSnap.data()
    const allDomains = Array.isArray(data.domains) ? data.domains : []

    if (allDomains.length === 0) {
      console.log('[Monitor] No domains found in domains/default-user')
      return
    }
    
    console.log(`[Monitor] Found ${allDomains.length} total domains`)
    
    // Get current batch (B1-B4) based on time
    const currentBatch = getCurrentBatch()
    console.log(`[Monitor] Current batch: B${currentBatch}`)
    
    // Filter domains by batch for manageable runtime (<1 min per batch)
    const domainsToCheck = allDomains.filter(d => d.checkBatch === currentBatch)
    console.log(`[Monitor] Checking ${domainsToCheck.length} domains in batch B${currentBatch}`)
    
    if (domainsToCheck.length === 0) {
      console.log('[Monitor] No domains in current batch')
      
      // Write log even if no domains checked
      try {
        const logsRef = fsCollection('github-actions-logs')
        await fsAddDoc(logsRef, {
          timestamp: fsServerTimestamp(),
          batch: currentBatch,
          totalDomains: allDomains.length,
          domainsChecked: 0,
          results: {
            online: 0,
            dnsOnly: 0,
            offline: 0
          },
          duration: null,
          status: 'success'
        })
        console.log('[Monitor] Empty batch log written to Firebase')
      } catch (logError) {
        console.error('[Monitor] Failed to write log:', logError.message)
      }
      
      return
    }
    
    // Check domains with concurrency limit
    const CONCURRENCY_LIMIT = 10
    const results = []
    
    for (let i = 0; i < domainsToCheck.length; i += CONCURRENCY_LIMIT) {
      const batch = domainsToCheck.slice(i, i + CONCURRENCY_LIMIT)
      const batchResults = await Promise.all(
        batch.map(async domain => {
          console.log(`[Monitor] Checking: ${domain.url}`)
          const result = await checkDomain(domain)
          
          // Update daily stats
          await updateDailyStats(domain.id, result)
          
          return {
            domain,
            result
          }
        })
      )
      results.push(...batchResults)
    }
    
    // Update domain statuses in batch
    for (const { domain, result } of results) {
      await updateDomainStatus(domain.id, result, allDomains)
    }
    
    // Count results
    const online = results.filter(r => r.result.status === 'online').length
    const dnsOnly = results.filter(r => r.result.status === 'dns-only').length
    const offline = results.filter(r => r.result.status === 'offline').length
    
    console.log(`[Monitor] Results: ${online} online, ${dnsOnly} DNS-only, ${offline} offline`)
    
    // Send summary to Slack
    const summary = `🔍 Domain Monitor - Batch ${currentBatch} Check Complete
✅ Online: ${online}
⚠️ DNS Only: ${dnsOnly}
❌ Offline: ${offline}
Total checked: ${domainsToCheck.length}
Time: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`
    
    await sendSlackNotification(summary)
    
    // Write log to Firebase for web app monitoring
    try {
      const logsRef = fsCollection('github-actions-logs')
      await fsAddDoc(logsRef, {
        timestamp: fsServerTimestamp(),
        batch: currentBatch,
        totalDomains: allDomains.length,
        domainsChecked: domainsToCheck.length,
        results: {
          online,
          dnsOnly,
          offline
        },
        duration: null, // GitHub Actions will track this
        status: 'success'
      })
      console.log('[Monitor] Log written to Firebase')
    } catch (logError) {
      console.error('[Monitor] Failed to write log:', logError.message)
    }
    
    console.log('[Monitor] Monitoring cycle complete')
    
  } catch (error) {
    console.error('[Monitor] Error:', error)
    
    // Write error log to Firebase
    try {
      const logsRef = fsCollection('github-actions-logs')
      await fsAddDoc(logsRef, {
        timestamp: fsServerTimestamp(),
        status: 'error',
        error: error.message,
        stack: error.stack
      })
    } catch (logError) {
      console.error('[Monitor] Failed to write error log:', logError.message)
    }
    
    await sendSlackNotification(`❌ Monitoring Error: ${error.message}`)
    process.exit(1)
  }
}

// Initialize and run monitoring
initializeFirestoreConnection()
  .then(() => runMonitoring())
  .then(() => {
    console.log('[Monitor] Done!')
    process.exit(0)
  })
  .catch(error => {
    console.error('[Monitor] Fatal error:', error)
    process.exit(1)
  })
