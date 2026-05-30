import { DomainStatus } from './types'

const DNS_LOOKUP_TIMEOUT_MS = 5000
const HTTP_HEAD_TIMEOUT_MS = 4000
const HTTP_GET_TIMEOUT_MS = 10000
const BULK_CHECK_CONCURRENCY = 8
const SERVER_CHECK_BATCH_SIZE = 8

export interface DomainCheckProgress<T extends { id: string; url: string }> {
  completed: number
  total: number
  domain: T
  result: DomainStatus
}

async function getIPAddress(domain: string): Promise<string | undefined> {
  try {
    const cleanDomain = domain.replace(/^https?:\/\//, '').split('/')[0]
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), DNS_LOOKUP_TIMEOUT_MS)
    
    const response = await fetch(`https://dns.google/resolve?name=${cleanDomain}&type=A`, {
      signal: controller.signal
    })
    clearTimeout(timeoutId)
    
    const data = await response.json()
    
    if (data.Answer && data.Answer.length > 0) {
      return data.Answer[0].data
    }
  } catch (error) {
    console.error('IP lookup failed:', error)
  }
  return undefined
}

async function checkHTTPAccess(url: string, timeout: number = HTTP_GET_TIMEOUT_MS): Promise<{ accessible: boolean; responseTime?: number; error?: string; statusCode?: number }> {
  const startTime = Date.now()
  const fullUrl = url.startsWith('http') ? url : `https://${url}`
  const isHttpsPage = typeof window !== 'undefined' && window.location.protocol === 'https:'

  if (isHttpsPage && fullUrl.startsWith('http://')) {
    return {
      accessible: false,
      error: 'HTTP blocked on HTTPS page (mixed content)',
      responseTime: 0,
    }
  }
  
  let lastError: { error?: string; responseTime?: number } = {}

  for (const method of ['HEAD', 'GET'] as const) {
    try {
      const controller = new AbortController()
      const methodTimeout = method === 'HEAD' ? Math.min(HTTP_HEAD_TIMEOUT_MS, timeout) : timeout
      const timeoutId = setTimeout(() => controller.abort(), methodTimeout)

      const response = await fetch(fullUrl, {
        method,
        mode: 'no-cors',
        cache: 'no-store',
        signal: controller.signal,
        redirect: 'follow',
      })

      clearTimeout(timeoutId)
      const responseTime = Date.now() - startTime

      return { 
        accessible: true, 
        responseTime,
        statusCode: response.status === 0 ? undefined : response.status
      }
    } catch (error) {
      lastError = normalizeHTTPError(error, Date.now() - startTime, method === 'HEAD' ? HTTP_HEAD_TIMEOUT_MS : timeout)
    }
  }

  return {
    accessible: false,
    error: lastError.error || 'Unknown Error',
    responseTime: lastError.responseTime,
  }
}

function normalizeHTTPError(error: unknown, responseTime: number, timeout: number): { error: string; responseTime: number } {
  if (error instanceof Error) {
    if (error.name === 'AbortError') {
      return { error: 'Timeout', responseTime: timeout }
    }
    
    if (error.message.includes('ERR_CERT_DATE_INVALID')) {
      return { error: 'Sertifikat SSL Kadaluarsa', responseTime }
    }
    
    if (error.message.includes('ERR_CERT_AUTHORITY_INVALID')) {
      return { error: 'Sertifikat SSL Tidak Valid', responseTime }
    }
    
    if (error.message.includes('ERR_CERT_COMMON_NAME_INVALID')) {
      return { error: 'SSL: Domain Tidak Cocok', responseTime }
    }
    
    if (error.message.includes('ERR_SSL_PROTOCOL_ERROR')) {
      return { error: 'SSL Protocol Error', responseTime }
    }
    
    if (error.message.includes('ERR_CONNECTION_REFUSED')) {
      return { error: 'Connection Refused', responseTime }
    }
    
    if (error.message.includes('ERR_CONNECTION_RESET')) {
      return { error: 'Connection Reset', responseTime }
    }
    
    if (error.message.includes('ERR_ADDRESS_UNREACHABLE')) {
      return { error: 'Address Unreachable', responseTime }
    }
    
    if (error.message.includes('ERR_NAME_NOT_RESOLVED')) {
      return { error: 'DNS Tidak Ditemukan', responseTime }
    }
    
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      return { error: 'CORS/Network Block', responseTime }
    }
    
    if (error.message.includes('ERR_')) {
      const errMatch = error.message.match(/ERR_[A-Z_]+/)
      return { error: errMatch ? errMatch[0] : error.message, responseTime }
    }
    
    return { error: 'Connection Failed', responseTime }
  }
  
  return { error: 'Unknown Error', responseTime }
}

async function checkHTTPSandHTTP(url: string): Promise<{ accessible: boolean; responseTime?: number; error?: string; protocol?: string; sslIssue?: boolean }> {
  const cleanUrl = url.replace(/^https?:\/\//, '')
  const isHttpsPage = typeof window !== 'undefined' && window.location.protocol === 'https:'
  
  // Try HTTPS first
  const httpsResult = await checkHTTPAccess(`https://${cleanUrl}`, HTTP_GET_TIMEOUT_MS)
  
  if (httpsResult.accessible) {
    return { ...httpsResult, protocol: 'https', sslIssue: false }
  }
  
  // If HTTPS failed, check if it's SSL related
  const isSSLError = httpsResult.error?.toLowerCase().includes('ssl') ||
                     httpsResult.error?.toLowerCase().includes('cert') ||
                     httpsResult.error?.toLowerCase().includes('sertifikat')

  if (isHttpsPage) {
    return {
      accessible: false,
      error: httpsResult.error || 'HTTPS tidak dapat diakses',
      responseTime: httpsResult.responseTime,
      sslIssue: isSSLError,
    }
  }
  
  // Try HTTP as fallback
  const httpResult = await checkHTTPAccess(`http://${cleanUrl}`, HTTP_GET_TIMEOUT_MS)
  
  if (httpResult.accessible) {
    return { 
      ...httpResult, 
      protocol: 'http',
      sslIssue: isSSLError, // Mark that SSL was the issue
      error: isSSLError ? httpsResult.error : undefined
    }
  }
  
  // Both failed - return the more informative error
  return {
    accessible: false,
    error: httpsResult.error || httpResult.error || 'Both HTTP and HTTPS failed',
    responseTime: Math.min(httpsResult.responseTime || HTTP_GET_TIMEOUT_MS, httpResult.responseTime || HTTP_GET_TIMEOUT_MS),
    sslIssue: isSSLError
  }
}

export async function checkDomainStatus(url: string, domainId: string): Promise<DomainStatus> {
  const ipAddress = await getIPAddress(url)
  const dnsResolvable = !!ipAddress
  
  let httpResult = await checkHTTPSandHTTP(url)
  
  // Retry once if timeout occurred
  if (!httpResult.accessible && httpResult.error === 'Timeout') {
    await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1s before retry
    httpResult = await checkHTTPSandHTTP(url)
  }
  
  const httpAccessible = httpResult.accessible
  
  let status: 'online' | 'offline' | 'dns-only' = 'offline'
  let error: string | undefined

  const isSSLIssue = !!(
    httpResult.error?.includes('SSL') ||
    httpResult.error?.includes('Sertifikat') ||
    httpResult.error?.includes('CERT') ||
    httpResult.error?.includes('cert')
  )

  if (httpAccessible) {
    status = 'online'
  } else if (dnsResolvable && isSSLIssue) {
    // True dns-only: server is running but SSL cert is broken
    status = 'dns-only'
    error = httpResult.error
  } else if (!httpAccessible) {
    // Server not reachable for any other reason → offline
    // (covers: Failed to fetch, CORS block, Address Unreachable,
    //  Connection Refused, Timeout, DNS not resolved, etc.)
    status = 'offline'
    if (httpResult.error === 'Timeout') {
      error = 'Server tidak merespons (timeout)'
    } else if (httpResult.error === 'CORS/Network Block') {
      error = 'Server tidak dapat diakses'
    } else if (httpResult.error === 'DNS Tidak Ditemukan') {
      error = 'DNS tidak dapat di-resolve'
    } else {
      error = httpResult.error || 'Server tidak dapat diakses'
    }
  }

  return {
    id: domainId,
    status,
    responseTime: httpResult.responseTime,
    lastChecked: Date.now(),
    error,
    ipAddress,
    httpAccessible,
    dnsResolvable,
    protocol: httpResult.protocol,
  }
}

export async function checkDomainStatuses<T extends { id: string; url: string }>(
  domains: T[],
  concurrency: number = BULK_CHECK_CONCURRENCY,
  onProgress?: (progress: DomainCheckProgress<T>) => void,
): Promise<DomainStatus[]> {
  const results: DomainStatus[] = new Array(domains.length)
  let nextIndex = 0
  let completed = 0
  const workerCount = Math.min(Math.max(1, concurrency), domains.length)

  await Promise.all(Array.from({ length: workerCount }, async () => {
    while (nextIndex < domains.length) {
      const currentIndex = nextIndex++
      const domain = domains[currentIndex]
      const result = await checkDomainStatus(domain.url, domain.id)
      results[currentIndex] = result
      completed += 1
      onProgress?.({ completed, total: domains.length, domain, result })
    }
  }))

  return results
}

export async function checkDomainStatusesFromServer<T extends { id: string; url: string }>(
  domains: T[],
  onProgress?: (progress: DomainCheckProgress<T>) => void,
): Promise<DomainStatus[]> {
  const results: DomainStatus[] = []
  let completed = 0
  const isLocalDev = typeof window !== 'undefined'
    && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

  try {
    for (let startIndex = 0; startIndex < domains.length; startIndex += SERVER_CHECK_BATCH_SIZE) {
      const batch = domains.slice(startIndex, startIndex + SERVER_CHECK_BATCH_SIZE)
      const response = await fetch('/api/check-domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domains: batch.map(domain => ({ id: domain.id, url: domain.url })),
        }),
      })

      if (!response.ok) {
        const message = await response.text().catch(() => '')
        throw new Error(message || `Server check gagal (${response.status})`)
      }

      const data = await response.json() as { results?: DomainStatus[] }
      const batchResults = Array.isArray(data.results) ? data.results : []

      batchResults.forEach((result, index) => {
        const domain = batch[index]
        if (!domain) return

        results[startIndex + index] = result
        completed += 1
        onProgress?.({ completed, total: domains.length, domain, result })
      })
    }
  } catch (error) {
    if (isLocalDev) {
      return checkDomainStatuses(domains, undefined, onProgress)
    }

    throw error
  }

  return results
}

export function validateDomain(url: string): { valid: boolean; error?: string } {
  const trimmedUrl = url.trim()
  
  if (!trimmedUrl) {
    return { valid: false, error: 'Domain tidak boleh kosong' }
  }

  const cleanUrl = trimmedUrl.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase()
  
  // Accept kendalkab.go.id or any subdomain (*.kendalkab.go.id)
  if (!cleanUrl.endsWith('kendalkab.go.id') && cleanUrl !== 'kendalkab.go.id') {
    return { valid: false, error: 'Hanya domain kendalkab.go.id atau subdomain-nya yang diperbolehkan' }
  }

  return { valid: true }
}

export function normalizeDomain(url: string): string {
  return url.trim().replace(/^https?:\/\//, '').replace(/\/$/, '')
}
