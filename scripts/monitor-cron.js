#!/usr/bin/env node

/**
 * Standalone Domain Monitoring Script for Render.com Cron Job
 * 
 * This script runs independently without React/browser
 * Checks domains, writes to Firebase, sends Slack notifications
 */

import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, addDoc, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
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

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// Slack webhook URL
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL

console.log('[Monitor] Starting domain monitoring cron job...')
console.log('[Monitor] Firebase Project:', firebaseConfig.projectId)
console.log('[Monitor] Slack Enabled:', !!SLACK_WEBHOOK_URL)

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
 */
function getCurrentBatch() {
  const now = new Date()
  const minutes = now.getMinutes()
  
  // Batch 1: 0, 20, 40
  // Batch 2: 5, 25, 45
  // Batch 3: 10, 30, 50
  // Batch 4: 15, 35, 55
  
  const offset = minutes % 20
  if (offset >= 0 && offset < 5) return 1
  if (offset >= 5 && offset < 10) return 2
  if (offset >= 10 && offset < 15) return 3
  return 4
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
    const statsRef = doc(db, 'domain-stats-daily', statsId)
    const statsSnap = await getDoc(statsRef)
    
    if (statsSnap.exists()) {
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
    
    await setDoc(statsRef, newStats)
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
    const statsRef = doc(db, 'domain-stats-daily', stats.id)
    await setDoc(statsRef, stats, { merge: true })
    
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
    const domainsRef = doc(db, 'domains', 'default-user')
    await setDoc(domainsRef, {
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
    console.log('[Monitor] Fetching domains from Firebase...')
    
    const domainsRef = collection(db, 'domains')
    const snapshot = await getDocs(domainsRef)
    
    if (snapshot.empty) {
      console.log('[Monitor] No domains found in Firebase')
      return
    }
    
    // Get domains array from default-user document
    let allDomains = []
    snapshot.docs.forEach(doc => {
      const data = doc.data()
      if (data.domains && Array.isArray(data.domains)) {
        allDomains = allDomains.concat(data.domains)
      }
    })
    
    console.log(`[Monitor] Found ${allDomains.length} total domains`)
    
    // Check ALL domains every hour (not batch-filtered)
    // GitHub Actions runs at minute 0 every hour, so checking all domains ensures even coverage
    const domainsToCheck = allDomains
    console.log(`[Monitor] Checking all ${domainsToCheck.length} domains`)
    
    if (domainsToCheck.length === 0) {
      console.log('[Monitor] No domains to check')
      
      // Write log even if no domains checked
      try {
        const logsRef = collection(db, 'github-actions-logs')
        await addDoc(logsRef, {
          timestamp: serverTimestamp(),
          batch: 0,
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
    const summary = `🔍 Domain Monitor - Check Complete
✅ Online: ${online}
⚠️ DNS Only: ${dnsOnly}
❌ Offline: ${offline}
Total checked: ${domainsToCheck.length}
Time: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`
    
    await sendSlackNotification(summary)
    
    // Write log to Firebase for web app monitoring
    try {
      const logsRef = collection(db, 'github-actions-logs')
      await addDoc(logsRef, {
        timestamp: serverTimestamp(),
        batch: 0, // All domains checked (not batch-specific)
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
      const logsRef = collection(db, 'github-actions-logs')
      await addDoc(logsRef, {
        timestamp: serverTimestamp(),
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

// Run monitoring
runMonitoring()
  .then(() => {
    console.log('[Monitor] Done!')
    process.exit(0)
  })
  .catch(error => {
    console.error('[Monitor] Fatal error:', error)
    process.exit(1)
  })
