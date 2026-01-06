export interface Domain {
  id: string
  url: string
  addedAt: number
  groupId?: string
  tags?: string[]
}

export interface DomainTag {
  id: string
  name: string
  color: string
  createdAt: number
}

export interface DomainGroup {
  id: string
  name: string
  color: string
  createdAt: number
  description?: string
}

export interface DomainStatus {
  id: string
  status: 'online' | 'offline' | 'checking' | 'dns-only'
  responseTime?: number
  lastChecked?: number
  error?: string
  ipAddress?: string
  httpAccessible?: boolean
  dnsResolvable?: boolean
  protocol?: string
}

export interface UptimeRecord {
  timestamp: number
  status: 'online' | 'offline' | 'dns-only'
  responseTime?: number
}

export interface DomainHistory {
  domainId: string
  records: UptimeRecord[]
}

export interface UptimeStats {
  uptimePercentage: number
  totalChecks: number
  onlineCount: number
  offlineCount: number
  dnsOnlyCount: number
  averageResponseTime?: number
  lastOnlineAt?: number
  lastOfflineAt?: number
}
