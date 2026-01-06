import { DomainHistory, UptimeRecord, UptimeStats } from './types'

const MAX_RECORDS_PER_DOMAIN = 168

export function addUptimeRecord(
  history: DomainHistory[],
  domainId: string,
  status: 'online' | 'offline' | 'dns-only',
  responseTime?: number
): DomainHistory[] {
  const now = Date.now()
  const newRecord: UptimeRecord = {
    timestamp: now,
    status,
    responseTime,
  }

  const existingIndex = history.findIndex(h => h.domainId === domainId)

  if (existingIndex >= 0) {
    const updated = [...history]
    const records = [...updated[existingIndex].records, newRecord]
    
    if (records.length > MAX_RECORDS_PER_DOMAIN) {
      records.splice(0, records.length - MAX_RECORDS_PER_DOMAIN)
    }

    updated[existingIndex] = {
      ...updated[existingIndex],
      records,
    }
    return updated
  } else {
    return [
      ...history,
      {
        domainId,
        records: [newRecord],
      },
    ]
  }
}

export function calculateUptimeStats(
  history: DomainHistory,
  timeRangeHours?: number
): UptimeStats {
  if (!history.records || history.records.length === 0) {
    return {
      uptimePercentage: 0,
      totalChecks: 0,
      onlineCount: 0,
      offlineCount: 0,
      dnsOnlyCount: 0,
    }
  }

  let records = history.records
  
  if (timeRangeHours) {
    const cutoffTime = Date.now() - timeRangeHours * 60 * 60 * 1000
    records = records.filter(r => r.timestamp >= cutoffTime)
  }

  if (records.length === 0) {
    return {
      uptimePercentage: 0,
      totalChecks: 0,
      onlineCount: 0,
      offlineCount: 0,
      dnsOnlyCount: 0,
    }
  }

  const onlineCount = records.filter(r => r.status === 'online').length
  const offlineCount = records.filter(r => r.status === 'offline').length
  const dnsOnlyCount = records.filter(r => r.status === 'dns-only').length
  const totalChecks = records.length

  const uptimePercentage = (onlineCount / totalChecks) * 100

  const responseTimes = records
    .filter(r => r.responseTime !== undefined)
    .map(r => r.responseTime!)
  
  const averageResponseTime = responseTimes.length > 0
    ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
    : undefined

  const lastOnlineRecord = [...records]
    .reverse()
    .find(r => r.status === 'online')
  
  const lastOfflineRecord = [...records]
    .reverse()
    .find(r => r.status === 'offline')

  return {
    uptimePercentage,
    totalChecks,
    onlineCount,
    offlineCount,
    dnsOnlyCount,
    averageResponseTime,
    lastOnlineAt: lastOnlineRecord?.timestamp,
    lastOfflineAt: lastOfflineRecord?.timestamp,
  }
}

export function getTimelineData(
  history: DomainHistory,
  buckets: number = 48
): Array<{ timestamp: number; status: 'online' | 'offline' | 'dns-only' | 'unknown' }> {
  if (!history.records || history.records.length === 0) {
    return Array.from({ length: buckets }, (_, i) => ({
      timestamp: Date.now() - (buckets - i - 1) * 60 * 60 * 1000,
      status: 'unknown' as const,
    }))
  }

  const now = Date.now()
  const timeRange = buckets * 60 * 60 * 1000
  const bucketSize = timeRange / buckets

  const bucketData = Array.from({ length: buckets }, (_, i) => {
    const bucketStart = now - timeRange + i * bucketSize
    const bucketEnd = bucketStart + bucketSize

    const recordsInBucket = history.records.filter(
      r => r.timestamp >= bucketStart && r.timestamp < bucketEnd
    )

    if (recordsInBucket.length === 0) {
      return {
        timestamp: bucketStart,
        status: 'unknown' as const,
      }
    }

    const onlineCount = recordsInBucket.filter(r => r.status === 'online').length
    const offlineCount = recordsInBucket.filter(r => r.status === 'offline').length
    const dnsOnlyCount = recordsInBucket.filter(r => r.status === 'dns-only').length

    let status: 'online' | 'offline' | 'dns-only'
    if (onlineCount >= offlineCount && onlineCount >= dnsOnlyCount) {
      status = 'online'
    } else if (dnsOnlyCount >= offlineCount) {
      status = 'dns-only'
    } else {
      status = 'offline'
    }

    return {
      timestamp: bucketStart,
      status,
    }
  })

  return bucketData
}
