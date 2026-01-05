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

export async function checkDomainStatus(url: string, domainId: string): Promise<DomainStatus> {
  const startTime = Date.now()
  
  try {
    const fullUrl = url.startsWith('http') ? url : `https://${url}`
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    const [response, ipAddress] = await Promise.all([
      fetch(fullUrl, {
        method: 'HEAD',
        mode: 'no-cors',
        signal: controller.signal,
      }),
      getIPAddress(url)
    ])

    clearTimeout(timeoutId)
    const responseTime = Date.now() - startTime

    return {
      id: domainId,
      status: 'online',
      responseTime,
      lastChecked: Date.now(),
      ipAddress,
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    const ipAddress = await getIPAddress(url)
    
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        id: domainId,
        status: 'offline',
        lastChecked: Date.now(),
        error: 'Timeout',
        ipAddress,
      }
    }

    return {
      id: domainId,
      status: 'online',
      responseTime,
      lastChecked: Date.now(),
      ipAddress,
    }
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
