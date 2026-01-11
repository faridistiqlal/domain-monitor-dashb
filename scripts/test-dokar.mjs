#!/usr/bin/env node

/**
 * Test script untuk check dokar.kendalkab.go.id secara langsung
 */

import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore'
import dns from 'dns'
import { promisify } from 'util'
import fetch from 'node-fetch'

const dnsLookup = promisify(dns.lookup)

const firebaseConfig = {
  apiKey: "AIzaSyDsONdN5q1vz5Gp6Irk0K7T4-GexuJ6Meo",
  authDomain: "kendal-monitor.firebaseapp.com",
  projectId: "kendal-monitor",
  storageBucket: "kendal-monitor.firebasestorage.app",
  messagingSenderId: "769565947746",
  appId: "1:769565947746:web:90ae2c85d894b0da44de3b",
  measurementId: "G-C3RLK090HK"
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

console.log('🧪 Testing dokar.kendalkab.go.id check and stats write...\n')

async function checkDomain(url) {
  const cleanUrl = url.replace(/^https?:\/\//, '')
  const startTime = Date.now()
  
  try {
    const ipAddress = await dnsLookup(cleanUrl)
    
    if (!ipAddress.address) {
      return { status: 'offline', ipAddress: null, responseTime: null, error: 'DNS failed' }
    }
    
    try {
      const response = await fetch(`https://${cleanUrl}`, {
        method: 'HEAD',
        timeout: 10000,
        redirect: 'follow'
      })
      
      const responseTime = Date.now() - startTime
      
      if (response.ok) {
        return {
          status: 'online',
          ipAddress: ipAddress.address,
          responseTime,
          protocol: 'https',
          error: null
        }
      }
    } catch (httpsError) {
      try {
        const httpResponse = await fetch(`http://${cleanUrl}`, {
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
        return {
          status: 'dns-only',
          ipAddress: ipAddress.address,
          responseTime: null,
          error: 'HTTP/HTTPS not accessible'
        }
      }
    }
    
    return { status: 'dns-only', ipAddress: ipAddress.address, responseTime: null, error: 'No response' }
  } catch (error) {
    return { status: 'offline', ipAddress: null, responseTime: null, error: error.message }
  }
}

function getTodayString() {
  const now = new Date()
  const jakartaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }))
  return jakartaTime.toISOString().split('T')[0]
}

function getCurrentHour() {
  const now = new Date()
  const jakartaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }))
  return jakartaTime.getHours()
}

async function getOrCreateDailyStats(domainId) {
  const today = getTodayString()
  const statsId = `${domainId}-${today}`
  
  const statsRef = doc(db, 'domain-stats-daily', statsId)
  const statsSnap = await getDoc(statsRef)
  
  if (statsSnap.exists()) {
    return { id: statsId, ...statsSnap.data() }
  }
  
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
}

async function updateDailyStats(domainId, checkResult) {
  const stats = await getOrCreateDailyStats(domainId)
  const currentHour = getCurrentHour()
  
  stats.totalChecks++
  if (checkResult.status === 'online') {
    stats.successChecks++
  }
  
  stats.uptimePercent = (stats.successChecks / stats.totalChecks) * 100
  
  const hourlyData = stats.hourly[currentHour]
  hourlyData.checks++
  if (checkResult.status === 'online') {
    hourlyData.successChecks++
  }
  hourlyData.status = checkResult.status
  
  if (checkResult.responseTime) {
    if (!hourlyData.avgResponseTime) {
      hourlyData.avgResponseTime = checkResult.responseTime
    } else {
      hourlyData.avgResponseTime = 
        (hourlyData.avgResponseTime * (hourlyData.checks - 1) + checkResult.responseTime) / hourlyData.checks
    }
    
    if (!stats.minResponseTime || checkResult.responseTime < stats.minResponseTime) {
      stats.minResponseTime = checkResult.responseTime
    }
    if (!stats.maxResponseTime || checkResult.responseTime > stats.maxResponseTime) {
      stats.maxResponseTime = checkResult.responseTime
    }
    
    if (!stats.avgResponseTime) {
      stats.avgResponseTime = checkResult.responseTime
    } else {
      stats.avgResponseTime = 
        (stats.avgResponseTime * (stats.totalChecks - 1) + checkResult.responseTime) / stats.totalChecks
    }
  }
  
  const statsRef = doc(db, 'domain-stats-daily', stats.id)
  await setDoc(statsRef, stats, { merge: true })
  
  console.log(`✅ Stats updated:`)
  console.log(`   Total checks: ${stats.totalChecks}`)
  console.log(`   Success checks: ${stats.successChecks}`)
  console.log(`   Uptime: ${stats.uptimePercent.toFixed(1)}%`)
  console.log(`   Avg response: ${stats.avgResponseTime ? Math.round(stats.avgResponseTime) + 'ms' : 'N/A'}`)
}

async function testDokar() {
  const url = 'dokar.kendalkab.go.id'
  const domainId = '1767714576487-tvrnuy8p7'
  
  console.log(`📍 Checking ${url}...`)
  const result = await checkDomain(url)
  
  console.log(`\n📊 Check result:`)
  console.log(`   Status: ${result.status}`)
  console.log(`   IP: ${result.ipAddress || 'N/A'}`)
  console.log(`   Response time: ${result.responseTime ? result.responseTime + 'ms' : 'N/A'}`)
  console.log(`   Protocol: ${result.protocol || 'N/A'}`)
  console.log(`   Error: ${result.error || 'None'}`)
  
  console.log(`\n💾 Writing to Firebase...`)
  await updateDailyStats(domainId, result)
  
  console.log(`\n✅ Done!`)
}

testDokar()
  .catch(error => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
