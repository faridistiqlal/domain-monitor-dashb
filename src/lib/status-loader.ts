import { getDomainStats } from './check-history'
import { DomainStatus } from './types'

/**
 * Load last known status from Firebase daily stats
 * Useful for populating statistics on app load when localStorage is empty
 */
export async function loadLastKnownStatuses(domainIds: string[]): Promise<Record<string, DomainStatus>> {
  const statuses: Record<string, DomainStatus> = {}
  
  // Load today's stats for each domain (contains last check info)
  const statsPromises = domainIds.map(async (domainId) => {
    try {
      const todayStats = await getDomainStats(domainId, 1)
      if (todayStats.length > 0) {
        const stat = todayStats[0]
        const currentHour = new Date().getHours()
        
        // Find most recent hourly data
        let mostRecentHour = stat.hourly[currentHour]
        if (!mostRecentHour || mostRecentHour.checks === 0) {
          // Look for last non-empty hour
          for (let i = currentHour - 1; i >= 0; i--) {
            if (stat.hourly[i] && stat.hourly[i].checks > 0) {
              mostRecentHour = stat.hourly[i]
              break
            }
          }
        }
        
        if (mostRecentHour && mostRecentHour.checks > 0) {
          statuses[domainId] = {
            id: domainId,
            status: mostRecentHour.status,
            responseTime: mostRecentHour.avgResponseTime,
            lastChecked: Date.now() - 3600000,
          }
        }
      }
    } catch (error) {
      console.error(`Failed to load status for ${domainId}:`, error)
    }
  })
  
  await Promise.all(statsPromises)
  return statuses
}
