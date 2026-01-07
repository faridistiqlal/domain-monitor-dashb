export interface Domain {
  id: string
  url: string
  addedAt: number
  groupId?: string
  tags?: string[]
  notificationsEnabled?: boolean
  checkBatch?: number // 1-4 for staggered checking
  lastStatusChange?: number // timestamp when status last changed
  consecutiveFailures?: number // track failure count for smart retry
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

export interface NotificationSettings {
  enabled: boolean
  webhookUrl: string
  notifyOnDown: boolean
  notifyOnRecovery: boolean
  notifyOnSlow: boolean
  slowThreshold: number
  cooldownMinutes: number
}

export interface NotificationHistory {
  id: string
  timestamp: number
  domain: string
  status: 'down' | 'recovery' | 'slow'
  success: boolean
  errorMessage?: string
  groupName?: string
  tags?: string[]
  responseTime?: number
  ipAddress?: string
  protocol?: string
}

export interface HourlyAggregate {
  hour: number // 0-23
  checks: number
  successChecks: number
  avgResponseTime?: number
  status: 'online' | 'offline' | 'dns-only'
}

export interface DomainIncident {
  id: string
  domainId: string
  startTime: number
  endTime?: number
  duration?: number // seconds
  status: 'offline' | 'dns-only'
  prevStatus: 'online' | 'offline' | 'dns-only'
  error?: string
  resolved: boolean
}

export interface DomainDailyStats {
  id: string // format: domainId-YYYY-MM-DD
  domainId: string
  date: string // YYYY-MM-DD
  totalChecks: number
  successChecks: number
  uptimePercent: number
  avgResponseTime?: number
  minResponseTime?: number
  maxResponseTime?: number
  hourly: HourlyAggregate[]
  incidentIds: string[] // references to DomainIncident
}

export interface CheckSchedule {
  batch: number // 1-4
  nextCheckTime: number
  interval: number // minutes
  priority: 'low' | 'normal' | 'high'
}
