#!/usr/bin/env node

/**
 * Standalone Domain Monitoring Script for Render.com Cron Job
 * 
 * This script runs independently without React/browser
 * Checks domains, writes to Firebase, sends Slack notifications
 */

import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore'
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
 * Check single domain
 */
async function checkDomain(domain) {
  const url = domain.url.replace(/^https?:\/\//, '')
  const startTime = Date.now()
  
  try {
    // DNS lookup
    const ipAddress = await dnsLookup(url)
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
    
    // Try HTTPS first
    try {
      const httpsResponse = await fetch(`https://${url}`, {
        method: 'HEAD',
        timeout: 10000,
        redirect: 'follow'
      })
      
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
      // HTTPS failed, try HTTP
      try {
        const httpResponse = await fetch(`http://${url}`, {
          method: 'HEAD',
          timeout: 10000,
          redirect: 'follow'
        })
        
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
          error: 'HTTP/HTTPS not accessible (CORS or firewall)'
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
    
    // Get current batch
    const currentBatch = getCurrentBatch()
    console.log(`[Monitor] Current batch: B${currentBatch}`)
    
    // Filter domains by batch
    const domainsToCheck = allDomains.filter(d => d.checkBatch === currentBatch)
    console.log(`[Monitor] Checking ${domainsToCheck.length} domains in batch B${currentBatch}`)
    
    if (domainsToCheck.length === 0) {
      console.log('[Monitor] No domains in current batch')
      
      // Write log even if no domains checked
      try {
        const logsRef = collection(db, 'github-actions-logs')
        await addDoc(logsRef, {
          timestamp: serverTimestamp(),
          batch: currentBatch,
          totalDomains: allDomains.length,
          domainsChecked: 0,
          results: {
            online: 0,
            dnsOnly: 0,
            offline: 0
          },
          status: 'success',
          message: 'No domains in current batch'
        })
        console.log('[Monitor] Log written to Firebase (empty batch)')
      } catch (logError) {
        console.error('[Monitor] Failed to write log:', logError.message)
      }
      
      return
    }
    
    // Check all domains in current batch
    const results = await Promise.all(
      domainsToCheck.map(async domain => {
        console.log(`[Monitor] Checking: ${domain.url}`)
        const result = await checkDomain(domain)
        return {
          domain,
          result
        }
      })
    )
    
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
      const logsRef = collection(db, 'github-actions-logs')
      await addDoc(logsRef, {
        timestamp: serverTimestamp(),
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
