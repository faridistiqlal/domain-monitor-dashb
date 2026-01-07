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
        return { accessible: false, error: 'Timeout', responseTime: timeout }
      }
      
      if (error.message.includes('ERR_CERT_DATE_INVALID')) {
        return { accessible: false, error: 'Sertifikat SSL Kadaluarsa', responseTime }
      }
      
      if (error.message.includes('ERR_CERT_AUTHORITY_INVALID')) {
        return { accessible: false, error: 'Sertifikat SSL Tidak Valid', responseTime }
      }
      
      if (error.message.includes('ERR_CERT_COMMON_NAME_INVALID')) {
        return { accessible: false, error: 'SSL: Domain Tidak Cocok', responseTime }
      }
      
      if (error.message.includes('ERR_SSL_PROTOCOL_ERROR')) {
        return { accessible: false, error: 'SSL Protocol Error', responseTime }
      }
      
      if (error.message.includes('ERR_CONNECTION_REFUSED')) {
        return { accessible: false, error: 'Connection Refused', responseTime }
      }
      
      if (error.message.includes('ERR_CONNECTION_RESET')) {
        return { accessible: false, error: 'Connection Reset', responseTime }
      }
      
      if (error.message.includes('ERR_ADDRESS_UNREACHABLE')) {
        return { accessible: false, error: 'Address Unreachable', responseTime }
      }
      
      if (error.message.includes('ERR_NAME_NOT_RESOLVED')) {
        return { accessible: false, error: 'DNS Tidak Ditemukan', responseTime }
      }
      
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        return { accessible: false, error: 'CORS/Network Block', responseTime }
      }
      
      if (error.message.includes('ERR_')) {
        const errMatch = error.message.match(/ERR_[A-Z_]+/)
        return { accessible: false, error: errMatch ? errMatch[0] : error.message, responseTime }
      }
      
      return { accessible: false, error: 'Connection Failed', responseTime }
    }
    
    return { accessible: false, error: 'Unknown Error', responseTime }
  }
}

async function checkHTTPSandHTTP(url: string): Promise<{ accessible: boolean; responseTime?: number; error?: string; protocol?: string; sslIssue?: boolean }> {
  const cleanUrl = url.replace(/^https?:\/\//, '')
  
  // Try HTTPS first
  const httpsResult = await checkHTTPAccess(`https://${cleanUrl}`, 6000)
  
  if (httpsResult.accessible) {
    return { ...httpsResult, protocol: 'https', sslIssue: false }
  }
  
  // If HTTPS failed, check if it's SSL related
  const isSSLError = httpsResult.error?.toLowerCase().includes('ssl') ||
                     httpsResult.error?.toLowerCase().includes('cert') ||
                     httpsResult.error?.toLowerCase().includes('sertifikat')
  
  // Try HTTP as fallback
  const httpResult = await checkHTTPAccess(`http://${cleanUrl}`, 6000)
  
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
    responseTime: Math.min(httpsResult.responseTime || 6000, httpResult.responseTime || 6000),
    sslIssue: isSSLError
  }
}

export async function checkDomainStatus(url: string, domainId: string): Promise<DomainStatus> {
  const ipAddress = await getIPAddress(url)
  const dnsResolvable = !!ipAddress
  
  let httpResult = await checkHTTPSandHTTP(url)
  
  // Retry once if timeout occurred
  if (!httpResult.accessible && httpResult.error === 'Timeout') {
    console.log(`Retrying ${url} after timeout...`)
    await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1s before retry
    httpResult = await checkHTTPSandHTTP(url)
  }
  
  const httpAccessible = httpResult.accessible
  
  let status: 'online' | 'offline' | 'dns-only' = 'offline'
  let error: string | undefined
  
  if (httpAccessible) {
    status = 'online'
  } else if (dnsResolvable && !httpAccessible) {
    status = 'dns-only'
    
    if (httpResult.error?.includes('SSL') || 
        httpResult.error?.includes('Sertifikat') ||
        httpResult.error?.includes('CERT')) {
      error = httpResult.error
    } else if (httpResult.error === 'Timeout') {
      error = 'Server lambat atau tidak merespons'
    } else if (httpResult.error === 'CORS/Network Block') {
      error = 'Browser CORS/Network - Coba akses manual'
    } else {
      error = httpResult.error || 'DNS OK, Server tidak dapat diakses'
    }
  } else if (!dnsResolvable && !httpAccessible) {
    if (httpResult.error === 'Timeout') {
      status = 'dns-only'
      error = 'Timeout - Server lambat'
    } else if (httpResult.error === 'DNS Tidak Ditemukan') {
      status = 'offline'
      error = 'DNS tidak dapat di-resolve'
    } else {
      status = 'offline'
      error = httpResult.error || 'Domain tidak dapat diakses'
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
