import { DomainStatus } from './types'

async function getIPAddress(domain: string): Promise<string | undefined> {
  try {
    const cleanDomain = domain.replace(/^https?:\/\//, '').split('/')[0]
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)
    
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

async function checkHTTPAccess(url: string, timeout: number = 6000): Promise<{ accessible: boolean; responseTime?: number; error?: string; statusCode?: number }> {
  const startTime = Date.now()
  const fullUrl = url.startsWith('http') ? url : `https://${url}`
  
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const response = await fetch(fullUrl, {
      method: 'HEAD',
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
    const responseTime = Date.now() - startTime
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return { accessible: false, error: 'Connection Timeout', responseTime: timeout }
      }
      
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        return { accessible: false, error: 'Network Unreachable', responseTime }
      }
      
      if (error.message.includes('ERR_')) {
        return { accessible: false, error: error.message, responseTime }
      }
      
      return { accessible: false, error: 'Connection Failed', responseTime }
    }
    
    return { accessible: false, error: 'Unknown Error', responseTime }
  }
}

async function checkHTTPSandHTTP(url: string): Promise<{ accessible: boolean; responseTime?: number; error?: string; protocol?: string }> {
  const cleanUrl = url.replace(/^https?:\/\//, '')
  
  const httpsResult = await checkHTTPAccess(`https://${cleanUrl}`, 6000)
  
  if (httpsResult.accessible) {
    return { ...httpsResult, protocol: 'https' }
  }
  
  const httpResult = await checkHTTPAccess(`http://${cleanUrl}`, 6000)
  
  if (httpResult.accessible) {
    return { ...httpResult, protocol: 'http' }
  }
  
  return {
    accessible: false,
    error: httpsResult.error || httpResult.error || 'Both HTTP and HTTPS failed',
    responseTime: Math.min(httpsResult.responseTime || 6000, httpResult.responseTime || 6000)
  }
}

export async function checkDomainStatus(url: string, domainId: string): Promise<DomainStatus> {
  const ipAddress = await getIPAddress(url)
  const dnsResolvable = !!ipAddress
  
  const httpResult = await checkHTTPSandHTTP(url)
  const httpAccessible = httpResult.accessible
  
  let status: 'online' | 'offline' | 'dns-only' = 'offline'
  let error: string | undefined
  
  if (httpAccessible) {
    status = 'online'
  } else if (dnsResolvable && !httpAccessible) {
    status = 'dns-only'
    error = httpResult.error || 'DNS resolve berhasil tetapi HTTP/HTTPS tidak dapat diakses'
  } else if (!dnsResolvable && !httpAccessible) {
    if (httpResult.error === 'Connection Timeout') {
      status = 'dns-only'
      error = 'Timeout - Server lambat atau tidak merespons'
    } else {
      status = 'offline'
      error = 'DNS tidak dapat di-resolve dan HTTP tidak accessible'
    }
  } else {
    status = 'offline'
    error = httpResult.error || 'Domain tidak dapat diakses'
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
