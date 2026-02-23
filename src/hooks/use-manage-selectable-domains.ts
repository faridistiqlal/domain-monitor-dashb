import { useMemo } from 'react'
import { Domain } from '@/lib/types'

interface UseManageSelectableDomainsParams {
  domains: Domain[]
  manageSearchQuery: string
  manageGroupFilter: string
}

export function useManageSelectableDomains({
  domains,
  manageSearchQuery,
  manageGroupFilter,
}: UseManageSelectableDomainsParams) {
  const selectableIds = useMemo(() => {
    return domains
      .filter(domain => {
        const matchesSearch =
          manageSearchQuery === '' ||
          domain.url.toLowerCase().includes(manageSearchQuery.toLowerCase())

        const matchesGroup =
          manageGroupFilter === 'all' ||
          (manageGroupFilter === 'ungrouped' && !domain.groupId) ||
          domain.groupId === manageGroupFilter

        return matchesSearch && matchesGroup
      })
      .map(domain => domain.id)
  }, [domains, manageSearchQuery, manageGroupFilter])

  return { selectableIds }
}
