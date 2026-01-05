import { DomainStatus } from './types'

async function getIPAddress(domain: string): Promise<string | undefined> {
  try {
    const cleanDomain = domain.replace(/^https?:\/\//, '').split('/')[0]
    const response = await fetch(`https://dns.google/resolve?name=${cleanDomain}&type=A`)
    const data = await response.json()
    
    if (data.Answer && data.Answer.length > 0) {
      return data.Answer[0].data
    }
  } catch (error) {
    console.error('IP lookup failed:', error)
  }
  return undefined
}

async function checkHTTPAccess(url: string, timeout: number = 10000): Promise<{ accessible: boolean; responseTime?: number; error?: string }> {
  const startTime = Date.now()
  
  try {
    const fullUrl = url.startsWith('http') ? url : `https://${url}`
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    await fetch(fullUrl, {
      method: 'HEAD',
      mode: 'no-cors',
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    const responseTime = Date.now() - startTime

    return { accessible: true, responseTime }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { accessible: false, error: 'Timeout' }
    }
    return { accessible: true, responseTime: Date.now() - startTime }
  }
}

export async function checkDomainStatus(url: string, domainId: string): Promise<DomainStatus> {
  const ipAddress = await getIPAddress(url)
  const dnsResolvable = !!ipAddress
  
  const httpResult = await checkHTTPAccess(url)
  const httpAccessible = httpResult.accessible
  
  let status: 'online' | 'offline' | 'dns-only' = 'offline'
  let error: string | undefined
  
  if (dnsResolvable && httpAccessible) {
    status = 'online'
  } else if (dnsResolvable && !httpAccessible) {
    status = 'dns-only'
    error = httpResult.error || 'Server dapat di-ping tetapi HTTP/HTTPS tidak dapat diakses'
  } else if (!dnsResolvable) {
    status = 'offline'
    error = 'DNS tidak dapat di-resolve'
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
  }
}

export function validateDomain(url: string): { valid: boolean; error?: string } {
  const trimmedUrl = url.trim()
  
  if (!trimmedUrl) {
    return { valid: false, error: 'Domain tidak boleh kosong' }
  }

  const cleanUrl = trimmedUrl.replace(/^https?:\/\//, '')
  
  if (!cleanUrl.includes('kendalkab.go.id')) {
    return { valid: false, error: 'Hanya domain .kendalkab.go.id yang diperbolehkan' }
  }

  return { valid: true }
}

export function normalizeDomain(url: string): string {
  return url.trim().replace(/^https?:\/\//, '').replace(/\/$/, '')
}
