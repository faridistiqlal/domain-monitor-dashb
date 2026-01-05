import { Domain } from './types'
import { validateDomain, normalizeDomain } from './monitoring'

export interface ImportResult {
  success: Domain[]
  failed: { url: string; reason: string }[]
  duplicates: string[]
}

export function parseCSV(csvText: string): string[] {
  const lines = csvText.split('\n').map(line => line.trim()).filter(line => line)
  
  if (lines.length === 0) {
    return []
  }

  const urls: string[] = []
  
  lines.forEach((line, index) => {
    if (index === 0 && (line.toLowerCase().includes('domain') || line.toLowerCase().includes('url'))) {
      return
    }

    const columns = line.split(',').map(col => col.trim().replace(/^["']|["']$/g, ''))
    
    if (columns.length > 0 && columns[0]) {
      urls.push(columns[0])
    }
  })

  return urls
}

export function importDomainsFromCSV(
  csvText: string, 
  existingDomains: Domain[]
): ImportResult {
  const urls = parseCSV(csvText)
  const result: ImportResult = {
    success: [],
    failed: [],
    duplicates: []
  }

  const existingUrls = new Set(existingDomains.map(d => d.url))
  const processedUrls = new Set<string>()

  urls.forEach(url => {
    const validation = validateDomain(url)
    
    if (!validation.valid) {
      result.failed.push({
        url,
        reason: validation.error || 'Domain tidak valid'
      })
      return
    }

    const normalized = normalizeDomain(url)

    if (existingUrls.has(normalized)) {
      result.duplicates.push(normalized)
      return
    }

    if (processedUrls.has(normalized)) {
      return
    }

    processedUrls.add(normalized)

    const newDomain: Domain = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      url: normalized,
      addedAt: Date.now(),
    }

    result.success.push(newDomain)
  })

  return result
}
