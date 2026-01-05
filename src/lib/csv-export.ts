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
  const headers = ['Domain', 'Status', 'IP Address', 'DNS Resolvable', 'HTTP Accessible', 'Response Time (ms)', 'Last Checked', 'Error']
  const rows: string[][] = [headers]

  domains.forEach(domain => {
    const status = statuses[domain.id]
    const row = [
      domain.url,
      status?.status || 'unknown',
      status?.ipAddress || '-',
      status?.dnsResolvable !== undefined ? (status.dnsResolvable ? 'Yes' : 'No') : '-',
      status?.httpAccessible !== undefined ? (status.httpAccessible ? 'Yes' : 'No') : '-',
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
  console.log('[Download CSV] Starting download:', filename, 'Content length:', csvContent.length)
  
  try {
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
    
    console.log('[Download CSV] Blob created, size:', blob.size, 'type:', blob.type)
    
    if ((navigator as any).msSaveBlob) {
      (navigator as any).msSaveBlob(blob, filename)
      console.log('[Download CSV] Downloaded via msSaveBlob (IE)')
      return
    }
    
    const url = URL.createObjectURL(blob)
    console.log('[Download CSV] Object URL created:', url)
    
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.style.visibility = 'hidden'
    link.style.position = 'absolute'
    link.style.top = '0'
    link.style.left = '0'
    link.setAttribute('target', '_blank')
    
    document.body.appendChild(link)
    console.log('[Download CSV] Link added to body')
    console.log('[Download CSV] Link href:', link.href)
    console.log('[Download CSV] Link download:', link.download)
    console.log('[Download CSV] Link is in DOM:', document.body.contains(link))
    
    requestAnimationFrame(() => {
      console.log('[Download CSV] Triggering click in next frame')
      link.dispatchEvent(
        new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window
        })
      )
      console.log('[Download CSV] Click dispatched')
      
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link)
          console.log('[Download CSV] Link removed from DOM')
        }
        URL.revokeObjectURL(url)
        console.log('[Download CSV] URL revoked')
      }, 1000)
    })
    
    console.log('[Download CSV] Download process initiated')
  } catch (error) {
    console.error('[Download CSV] Critical error:', error)
    console.error('[Download CSV] Error stack:', (error as Error).stack)
    throw error
  }
}

export function exportDomainsToCSV(
  domains: Domain[], 
  statuses: Record<string, DomainStatus>,
  groupName?: string
): { success: boolean; duplicates?: string[] } {
  console.log('[CSV Export] Starting export with', domains.length, 'domains')
  
  if (!domains || domains.length === 0) {
    console.error('[CSV Export] No domains to export')
    return { success: false, duplicates: [] }
  }
  
  const validation = validateExportDomains(domains)
  console.log('[CSV Export] Validation result:', validation)
  
  if (!validation.valid) {
    return {
      success: false,
      duplicates: validation.duplicates
    }
  }

  const csvContent = generateCSV(validation.uniqueDomains, statuses)
  console.log('[CSV Export] Generated CSV content length:', csvContent.length)
  
  const timestamp = new Date().toISOString().split('T')[0]
  const groupSuffix = groupName ? `-${groupName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}` : ''
  const filename = `domain-monitor${groupSuffix}-${timestamp}.csv`
  
  console.log('[CSV Export] Downloading as:', filename)
  downloadCSV(csvContent, filename)
  
  return { success: true }
}
