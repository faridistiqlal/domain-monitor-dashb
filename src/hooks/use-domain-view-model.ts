import { useCallback, useMemo } from 'react'
import { useFilteredDomains } from '@/hooks/use-filtered-domains'
import { Domain, DomainGroup, DomainStatus } from '@/lib/types'

type FilterType = 'all' | 'online' | 'dns-only' | 'offline'
type SortType = 'none' | 'name-asc' | 'name-desc' | 'status-online-first' | 'status-offline-first'
type ViewMode = 'all' | 'groups' | 'group-detail'

interface UseDomainViewModelParams {
  domains: Domain[]
  statuses: Record<string, DomainStatus>
  groups: DomainGroup[]
  viewMode: ViewMode
  selectedGroupId: string | null
  filter: FilterType
  debouncedSearchQuery: string
  sortBy: SortType
  debouncedManageSearchQuery: string
  manageGroupFilter: string
  manageTagFilter: string
  manageNotificationFilter: string
  managePinFilter: string
}

export function useDomainViewModel({
  domains,
  statuses,
  groups,
  viewMode,
  selectedGroupId,
  filter,
  debouncedSearchQuery,
  sortBy,
  debouncedManageSearchQuery,
  manageGroupFilter,
  manageTagFilter,
  manageNotificationFilter,
  managePinFilter,
}: UseDomainViewModelParams) {
  const currentViewDomains = useMemo(() => {
    if (viewMode === 'group-detail' && selectedGroupId) {
      return domains.filter(d => d.groupId === selectedGroupId)
    }
    return domains
  }, [domains, viewMode, selectedGroupId])

  const onlineCount = useMemo(
    () => currentViewDomains.filter(d => statuses[d.id]?.status === 'online').length,
    [currentViewDomains, statuses]
  )

  const offlineCount = useMemo(
    () => currentViewDomains.filter(d => statuses[d.id]?.status === 'offline').length,
    [currentViewDomains, statuses]
  )

  const dnsOnlyCount = useMemo(
    () => currentViewDomains.filter(d => statuses[d.id]?.status === 'dns-only').length,
    [currentViewDomains, statuses]
  )

  const totalCount = currentViewDomains.length

  const globalOnlineCount = useMemo(
    () => domains.filter(d => statuses[d.id]?.status === 'online').length,
    [domains, statuses]
  )

  const globalOfflineCount = useMemo(
    () => domains.filter(d => statuses[d.id]?.status === 'offline').length,
    [domains, statuses]
  )

  const globalDnsOnlyCount = useMemo(
    () => domains.filter(d => statuses[d.id]?.status === 'dns-only').length,
    [domains, statuses]
  )

  const globalTotalCount = domains.length

  const filteredDomains = useMemo(
    () =>
      currentViewDomains.filter(domain => {
        const matchesFilter =
          filter === 'all' ||
          (() => {
            const domainStatus = statuses[domain.id]?.status
            if (!domainStatus || domainStatus === 'checking') return true
            return domainStatus === filter
          })()

        const matchesSearch =
          debouncedSearchQuery === '' ||
          domain.url.toLowerCase().includes(debouncedSearchQuery.toLowerCase())

        return matchesFilter && matchesSearch
      }),
    [currentViewDomains, filter, debouncedSearchQuery, statuses]
  )

  const sortedDomains = useFilteredDomains({
    domains: filteredDomains,
    statuses,
    filter: 'all',
    searchQuery: '',
    sortBy,
  })

  const filteredManageDomains = useMemo(
    () =>
      domains.filter(domain => {
        const matchesSearch =
          debouncedManageSearchQuery === '' ||
          domain.url.toLowerCase().includes(debouncedManageSearchQuery.toLowerCase())

        const matchesGroup =
          manageGroupFilter === 'all' ||
          (manageGroupFilter === 'ungrouped' && !domain.groupId) ||
          domain.groupId === manageGroupFilter

        const matchesTag =
          manageTagFilter === 'all' ||
          (manageTagFilter === 'untagged' && (!domain.tags || domain.tags.length === 0)) ||
          (domain.tags && domain.tags.includes(manageTagFilter))

        const matchesNotification =
          manageNotificationFilter === 'all' ||
          (manageNotificationFilter === 'enabled' && domain.notificationsEnabled === true) ||
          (manageNotificationFilter === 'disabled' && domain.notificationsEnabled !== true)

        const matchesPin =
          managePinFilter === 'all' ||
          (managePinFilter === 'pinned' && domain.pinned === true) ||
          (managePinFilter === 'unpinned' && domain.pinned !== true)

        return (
          matchesSearch &&
          matchesGroup &&
          matchesTag &&
          matchesNotification &&
          matchesPin
        )
      }),
    [
      domains,
      debouncedManageSearchQuery,
      manageGroupFilter,
      manageTagFilter,
      manageNotificationFilter,
      managePinFilter,
    ]
  )

  const selectedGroup = useMemo(
    () => (selectedGroupId ? groups.find(g => g.id === selectedGroupId) : null),
    [groups, selectedGroupId]
  )

  const getGroupStats = useCallback(
    (groupId: string) => {
      const groupDomains = domains.filter(d => d.groupId === groupId)
      const count = groupDomains.length
      const online = groupDomains.filter(d => statuses[d.id]?.status === 'online').length
      const offline = groupDomains.filter(d => statuses[d.id]?.status === 'offline').length
      const dnsOnly = groupDomains.filter(d => statuses[d.id]?.status === 'dns-only').length
      return { count, online, offline, dnsOnly }
    },
    [domains, statuses]
  )

  return {
    currentViewDomains,
    onlineCount,
    offlineCount,
    dnsOnlyCount,
    totalCount,
    globalOnlineCount,
    globalOfflineCount,
    globalDnsOnlyCount,
    globalTotalCount,
    filteredDomains,
    sortedDomains,
    filteredManageDomains,
    selectedGroup,
    getGroupStats,
  }
}
