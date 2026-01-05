import { useMemo } from 'react'
import { Domain, DomainStatus } from '@/lib/types'

type FilterType = 'all' | 'online' | 'dns-only' | 'offline'
type SortType = 'none' | 'name-asc' | 'name-desc' | 'status-online-first' | 'status-offline-first'

interface UseFilteredDomainsProps {
  domains: Domain[]
  statuses: Record<string, DomainStatus>
  filter: FilterType
  searchQuery: string
  sortBy: SortType
}

export function useFilteredDomains({
  domains,
  statuses,
  filter,
  searchQuery,
  sortBy,
}: UseFilteredDomainsProps) {
  const filteredAndSorted = useMemo(() => {
    let result = domains

    if (filter !== 'all') {
      result = result.filter(domain => {
        const status = statuses[domain.id]?.status
        if (!status || status === 'checking') return true
        return status === filter
      })
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(domain =>
        domain.url.toLowerCase().includes(query)
      )
    }

    if (sortBy !== 'none') {
      result = [...result]

      if (sortBy === 'name-asc') {
        result.sort((a, b) => a.url.localeCompare(b.url))
      } else if (sortBy === 'name-desc') {
        result.sort((a, b) => b.url.localeCompare(a.url))
      } else if (sortBy === 'status-online-first') {
        const statusOrder: Record<string, number> = {
          'online': 1,
          'dns-only': 2,
          'offline': 3,
          'checking': 4
        }
        result.sort((a, b) => {
          const statusA = statuses[a.id]?.status || 'checking'
          const statusB = statuses[b.id]?.status || 'checking'
          return (statusOrder[statusA] || 999) - (statusOrder[statusB] || 999)
        })
      } else if (sortBy === 'status-offline-first') {
        const statusOrder: Record<string, number> = {
          'offline': 1,
          'dns-only': 2,
          'online': 3,
          'checking': 4
        }
        result.sort((a, b) => {
          const statusA = statuses[a.id]?.status || 'checking'
          const statusB = statuses[b.id]?.status || 'checking'
          return (statusOrder[statusA] || 999) - (statusOrder[statusB] || 999)
        })
      }
    }

    return result
  }, [domains, statuses, filter, searchQuery, sortBy])

  return filteredAndSorted
}
