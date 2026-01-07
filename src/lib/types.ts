export interface Domain {
  id: string
  url: string
  addedAt: number
  groupId?: string
  tags?: string[]
  notificationsEnabled?: boolean
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
