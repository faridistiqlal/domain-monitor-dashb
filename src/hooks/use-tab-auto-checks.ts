import { useEffect } from 'react'
import { Domain, DomainStatus } from '@/lib/types'
import { checkDomainStatuses } from '@/lib/monitoring'

interface UseTabAutoChecksParams {
  activeTab: 'domains' | 'groups' | 'manage' | 'tags' | 'statistics' | 'pinned'
  isLoadingData: boolean
  autoRefreshEnabled: boolean
  hasChecked: boolean
  isRefreshing: boolean
  domains: Domain[]
  statuses: Record<string, DomainStatus>
  onManualRefresh: (enforceCooldown?: boolean) => void
  setStatuses: React.Dispatch<React.SetStateAction<Record<string, DomainStatus>>>
}

export function useTabAutoChecks({
  activeTab,
  isLoadingData,
  autoRefreshEnabled,
  hasChecked,
  isRefreshing,
  domains,
  statuses,
  onManualRefresh,
  setStatuses,
}: UseTabAutoChecksParams) {
  useEffect(() => {
    if (activeTab === 'domains' && !isLoadingData && !autoRefreshEnabled && !hasChecked && !isRefreshing && domains.length > 0) {
      globalThis.console.log('[Monitoring Tab] Auto-checking all domains on initial load...')
      onManualRefresh(false)
    }
  }, [activeTab, isLoadingData, autoRefreshEnabled, hasChecked, isRefreshing, domains.length])

  useEffect(() => {
    if (activeTab === 'pinned' && !isLoadingData) {
      const pinnedDomains = domains.filter(d => d.pinned)
      if (pinnedDomains.length > 0) {
        const uncheckedDomains = pinnedDomains.filter(d => {
          const status = statuses[d.id]
          return !status || status.status === 'checking' || !status.lastChecked
        })

        if (uncheckedDomains.length > 0) {
          globalThis.console.log(`[Pin Tab] Auto-checking ${uncheckedDomains.length} pinned domains...`)

          const checkingStatuses: Record<string, DomainStatus> = {}
          uncheckedDomains.forEach(domain => {
            checkingStatuses[domain.id] = { id: domain.id, status: 'checking' }
          })
          setStatuses(prev => ({ ...prev, ...checkingStatuses }))

          checkDomainStatuses(uncheckedDomains).then(results => {
            const newStatuses: Record<string, DomainStatus> = {}
            results.forEach(result => {
              newStatuses[result.id] = result
            })
            setStatuses(prev => ({ ...prev, ...newStatuses }))
          })
        }
      }
    }
  }, [activeTab, isLoadingData])
}