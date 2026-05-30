export interface Domain {
  id: string
  url: string
  addedAt: number
  status?: 'online' | 'offline' | 'dns-only'
  responseTime?: number | null
  lastChecked?: number
  error?: string | null
  ipAddress?: string | null
  protocol?: string | null
  groupId?: string
  tags?: string[]
  notificationsEnabled?: boolean
  enabled?: boolean // Individual monitoring status (default: true)
  checkBatch?: number // 1-4 for staggered checking
  lastStatusChange?: number // timestamp when status last changed
  consecutiveFailures?: number // track failure count for smart retry
  lastStatsWrite?: number // timestamp of last Firebase stats write (for hourly policy)
  pinned?: boolean // Pin domain for quick access dashboard
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

export interface MonitoringControl {
  enabled: boolean
  updatedAt: number
  updatedBy?: string
}

export type ManagedUserRole = 'admin' | 'viewer' | 'add-only'

export interface UserPermissions {
  canView: boolean
  canAddDomain: boolean
  canEdit: boolean
  canManageUsers: boolean
}

export interface ManagedUser {
  id: string
  username: string
  password?: string
  email?: string
  authUid?: string
  role: ManagedUserRole
  permissions: UserPermissions
  isActive: boolean
  revision?: number
  createdAt: number
  updatedAt: number
  createdBy?: string
}

export interface AuditLogEntry {
  id: string
  actorUserId: string
  actorUsername: string
  action: 'create-user' | 'update-user-permission' | 'toggle-user-active' | 'change-password' | 'delete-user'
  targetType: 'user'
  targetId: string
  changes: Record<string, unknown>
  timestamp: number
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

export interface DomainInsight {
  uptime7d: number | null
  uptime30d: number | null
  responseTrend: number[]
}

export interface CheckSchedule {
  batch: number // 1-4
  nextCheckTime: number
  interval: number // minutes
  priority: 'low' | 'normal' | 'high'
}
