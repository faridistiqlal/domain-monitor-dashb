import { Domain, DomainStatus } from './types'

export interface DomainExportRow {
  domain: string
  status: string
  ipAddress: string
  responseTime: string
  lastChecked: string
  error: string
}

export interface ExportValidation {
  valid: boolean
  duplicates: string[]
  uniqueDomains: Domain[]
}

export function validateExportDomains(domains: Domain[]): ExportValidation {
  const seen = new Map<string, number>()
  const duplicates: string[] = []
  const uniqueDomains: Domain[] = []

  domains.forEach(domain => {
    const url = domain.url.toLowerCase()
    
    if (seen.has(url)) {
      const count = seen.get(url)!
      seen.set(url, count + 1)
      if (count === 1) {
        duplicates.push(domain.url)
      }
    } else {
      seen.set(url, 1)
      uniqueDomains.push(domain)
    }
  })

  return {
    valid: duplicates.length === 0,
    duplicates,
    uniqueDomains
  }
}

export function generateCSV(domains: Domain[], statuses: Record<string, DomainStatus>): string {
  const headers = ['Domain', 'Status', 'IP Address', 'Response Time (ms)', 'Last Checked', 'Error']
  const rows: string[][] = [headers]

  domains.forEach(domain => {
    const status = statuses[domain.id]
    const row = [
      domain.url,
      status?.status || 'unknown',
      status?.ipAddress || '-',
      status?.responseTime !== undefined ? status.responseTime.toString() : '-',
      status?.lastChecked ? new Date(status.lastChecked).toLocaleString('id-ID') : '-',
      status?.error || '-'
    ]
    rows.push(row)
  })

  return rows.map(row => 
    row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
  ).join('\n')
}

export function downloadCSV(csvContent: string, filename: string = 'domain-monitor-export.csv') {
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

export function exportDomainsToCSV(
  domains: Domain[], 
  statuses: Record<string, DomainStatus>
): { success: boolean; duplicates?: string[] } {
  const validation = validateExportDomains(domains)
  
  if (!validation.valid) {
    return {
      success: false,
      duplicates: validation.duplicates
    }
  }

  const csvContent = generateCSV(validation.uniqueDomains, statuses)
  const timestamp = new Date().toISOString().split('T')[0]
  const filename = `domain-monitor-${timestamp}.csv`
  downloadCSV(csvContent, filename)
  
  return { success: true }
}
