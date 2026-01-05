export interface Domain {
  id: string
  url: string
  addedAt: number
}

export interface DomainStatus {
  id: string
  status: 'online' | 'offline' | 'checking'
  responseTime?: number
  lastChecked?: number
  error?: string
  ipAddress?: string
}
