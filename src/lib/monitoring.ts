import { DomainStatus } from './types'

export async function checkDomainStatus(url: string, domainId: string): Promise<DomainStatus> {
  const startTime = Date.now()
  
  try {
    const fullUrl = url.startsWith('http') ? url : `https://${url}`
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    const response = await fetch(fullUrl, {
      method: 'HEAD',
      mode: 'no-cors',
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    const responseTime = Date.now() - startTime

    return {
      id: domainId,
      status: 'online',
      responseTime,
      lastChecked: Date.now(),
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        id: domainId,
        status: 'offline',
        lastChecked: Date.now(),
        error: 'Timeout',
      }
    }

    return {
      id: domainId,
      status: 'online',
      responseTime,
      lastChecked: Date.now(),
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
