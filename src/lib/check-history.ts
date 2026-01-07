import { collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, limit, writeBatch, Timestamp } from 'firebase/firestore'
import { db } from './firebase'
import type { DomainDailyStats, DomainIncident, HourlyAggregate, Domain, DomainStatus } from './types'

const DAILY_STATS_COLLECTION = 'domain-stats-daily'
const INCIDENTS_COLLECTION = 'domain-incidents'

/**
 * Get today's date string in YYYY-MM-DD format
 */
function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * Get current hour (0-23)
 */
function getCurrentHour(): number {
  return new Date().getHours()
}

/**
 * Generate daily stats document ID
 */
function getDailyStatsId(domainId: string, date: string): string {
  return `${domainId}-${date}`
}

/**
 * Initialize or get today's stats for a domain
 */
export async function getOrCreateDailyStats(domainId: string): Promise<DomainDailyStats> {
  const today = getTodayString()
  const statsId = getDailyStatsId(domainId, today)
  
  try {
    const statsRef = doc(db, DAILY_STATS_COLLECTION, statsId)
    const statsSnap = await getDoc(statsRef)
    
    if (statsSnap.exists()) {
      return statsSnap.data() as DomainDailyStats
    }
    
    // Create new stats document
    const newStats: DomainDailyStats = {
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
        status: 'offline' as const
      })),
      incidentIds: []
    }
    
    await setDoc(statsRef, newStats)
    return newStats
  } catch (error) {
    console.error('Error getting/creating daily stats:', error)
    // Return default stats if Firebase fails
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
        status: 'offline' as const
      })),
      incidentIds: []
    }
  }
}

/**
 * Update daily stats with new check result
 */
export async function updateDailyStats(
  domainId: string,
  status: DomainStatus
): Promise<void> {
  console.log(`[check-history] updateDailyStats called for ${domainId}`, { status: status.status, responseTime: status.responseTime })
  
  try {
    console.log(`[check-history] Getting or creating daily stats...`)
    const stats = await getOrCreateDailyStats(domainId)
    console.log(`[check-history] Stats retrieved:`, { id: stats.id, totalChecks: stats.totalChecks })
    
    const currentHour = getCurrentHour()
    
    // Update total checks
    stats.totalChecks++
    if (status.status === 'online') {
      stats.successChecks++
    }
    
    // Update uptime percentage
    stats.uptimePercent = (stats.successChecks / stats.totalChecks) * 100
    
    // Update hourly aggregate
    const hourlyData = stats.hourly[currentHour]
    hourlyData.checks++
    if (status.status === 'online') {
      hourlyData.successChecks++
    }
    // Only set non-checking statuses
    if (status.status !== 'checking') {
      hourlyData.status = status.status
    }
    
    // Update response time stats
    if (status.responseTime) {
      if (!hourlyData.avgResponseTime) {
        hourlyData.avgResponseTime = status.responseTime
      } else {
        // Running average
        hourlyData.avgResponseTime = 
          (hourlyData.avgResponseTime * (hourlyData.checks - 1) + status.responseTime) / hourlyData.checks
      }
      
      // Update daily min/max
      if (!stats.minResponseTime || status.responseTime < stats.minResponseTime) {
        stats.minResponseTime = status.responseTime
      }
      if (!stats.maxResponseTime || status.responseTime > stats.maxResponseTime) {
        stats.maxResponseTime = status.responseTime
      }
      
      // Update daily average
      if (!stats.avgResponseTime) {
        stats.avgResponseTime = status.responseTime
      } else {
        stats.avgResponseTime = 
          (stats.avgResponseTime * (stats.totalChecks - 1) + status.responseTime) / stats.totalChecks
      }
    }
    
    // Save to Firestore
    console.log(`[check-history] Saving to Firestore...`, { statsId: stats.id })
    const statsRef = doc(db, DAILY_STATS_COLLECTION, stats.id)
    await setDoc(statsRef, stats)
    console.log(`[check-history] ✅ Successfully saved to Firestore`)
    
  } catch (error) {
    console.error(`[check-history] ❌ Error updating daily stats for ${domainId}:`, error)
    console.error(`[check-history] Error details:`, {
      name: (error as Error).name,
      message: (error as Error).message,
      stack: (error as Error).stack
    })
    throw error // Re-throw to let caller handle it
  }
}

/**
 * Create incident when status changes to offline/dns-only
 */
export async function createIncident(
  domain: Domain,
  newStatus: DomainStatus,
  prevStatus: 'online' | 'offline' | 'dns-only'
): Promise<string | null> {
  try {
    const incidentId = `${domain.id}-${Date.now()}`
    
    const incident: DomainIncident = {
      id: incidentId,
      domainId: domain.id,
      startTime: Date.now(),
      status: newStatus.status as 'offline' | 'dns-only',
      prevStatus,
      error: newStatus.error,
      resolved: false
    }
    
    const incidentRef = doc(db, INCIDENTS_COLLECTION, incidentId)
    await setDoc(incidentRef, incident)
    
    // Add incident ID to daily stats
    const stats = await getOrCreateDailyStats(domain.id)
    stats.incidentIds.push(incidentId)
    const statsRef = doc(db, DAILY_STATS_COLLECTION, stats.id)
    await setDoc(statsRef, stats)
    
    return incidentId
  } catch (error) {
    console.error('Error creating incident:', error)
    return null
  }
}

/**
 * Resolve incident when status changes back to online
 */
export async function resolveIncident(
  domainId: string,
  incidentId: string
): Promise<void> {
  try {
    const incidentRef = doc(db, INCIDENTS_COLLECTION, incidentId)
    const incidentSnap = await getDoc(incidentRef)
    
    if (incidentSnap.exists()) {
      const incident = incidentSnap.data() as DomainIncident
      const endTime = Date.now()
      const duration = Math.floor((endTime - incident.startTime) / 1000) // seconds
      
      await setDoc(incidentRef, {
        ...incident,
        endTime,
        duration,
        resolved: true
      })
    }
  } catch (error) {
    console.error('Error resolving incident:', error)
  }
}

/**
 * Get recent incidents for a domain
 */
export async function getDomainIncidents(
  domainId: string,
  days: number = 7
): Promise<DomainIncident[]> {
  try {
    const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000)
    
    const q = query(
      collection(db, INCIDENTS_COLLECTION),
      where('domainId', '==', domainId),
      where('startTime', '>=', cutoffTime),
      orderBy('startTime', 'desc'),
      limit(50)
    )
    
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => doc.data() as DomainIncident)
  } catch (error) {
    console.error('Error getting domain incidents:', error)
    return []
  }
}

/**
 * Get daily stats for a domain for date range
 */
export async function getDomainStats(
  domainId: string,
  days: number = 30
): Promise<DomainDailyStats[]> {
  try {
    const stats: DomainDailyStats[] = []
    const today = new Date()
    
    for (let i = 0; i < days; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateString = date.toISOString().split('T')[0]
      const statsId = getDailyStatsId(domainId, dateString)
      
      const statsRef = doc(db, DAILY_STATS_COLLECTION, statsId)
      const statsSnap = await getDoc(statsRef)
      
      if (statsSnap.exists()) {
        stats.push(statsSnap.data() as DomainDailyStats)
      }
    }
    
    return stats
  } catch (error) {
    console.error('Error getting domain stats:', error)
    return []
  }
}

/**
 * Cleanup old stats (older than 30 days)
 */
export async function cleanupOldStats(): Promise<void> {
  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - 30)
    const cutoffString = cutoffDate.toISOString().split('T')[0]
    
    const q = query(
      collection(db, DAILY_STATS_COLLECTION),
      where('date', '<', cutoffString),
      limit(100)
    )
    
    const snapshot = await getDocs(q)
    
    if (snapshot.empty) return
    
    const batch = writeBatch(db)
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref)
    })
    
    await batch.commit()
    console.log(`Cleaned up ${snapshot.size} old stats documents`)
  } catch (error) {
    console.error('Error cleaning up old stats:', error)
  }
}

/**
 * Assign domain to check batch (1-4)
 */
export function assignCheckBatch(domainIndex: number, totalDomains: number): number {
  // Distribute evenly across 4 batches
  return (domainIndex % 4) + 1
}

/**
 * Get next check time for batch
 */
export function getNextCheckTime(batch: number): number {
  const now = new Date()
  const currentMinute = now.getMinutes()
  
  // Batch schedule: every 20 minutes
  // Batch 1: 0, 20, 40
  // Batch 2: 5, 25, 45
  // Batch 3: 10, 30, 50
  // Batch 4: 15, 35, 55
  
  const offset = (batch - 1) * 5 // 0, 5, 10, 15
  const scheduleMinutes = [offset, offset + 20, offset + 40]
  
  // Find next scheduled minute
  let nextMinute = scheduleMinutes.find(m => m > currentMinute)
  
  if (!nextMinute) {
    // Next check is in the next hour
    nextMinute = offset
    now.setHours(now.getHours() + 1)
  }
  
  now.setMinutes(nextMinute, 0, 0)
  return now.getTime()
}

/**
 * Check if domain should be checked now
 */
export function shouldCheckNow(domain: Domain): boolean {
  if (!domain.checkBatch) return true // No batch assigned, check now
  
  const now = Date.now()
  const nextCheckTime = getNextCheckTime(domain.checkBatch)
  
  // Check if within 1 minute window
  return Math.abs(now - nextCheckTime) < 60000
}
