import { useEffect } from 'react'
import { Domain } from '@/lib/types'

interface UseTabAutoChecksParams {
  activeTab: 'domains' | 'groups' | 'manage' | 'tags' | 'statistics' | 'pinned'
  isLoadingData: boolean
  autoRefreshEnabled: boolean
  hasChecked: boolean
  isRefreshing: boolean
  domains: Domain[]
  allowInitialManualCheck: boolean
  onManualRefresh: (enforceCooldown?: boolean) => void
}

export function useTabAutoChecks({
  activeTab,
  isLoadingData,
  autoRefreshEnabled,
  hasChecked,
  isRefreshing,
  domains,
  allowInitialManualCheck,
  onManualRefresh,
}: UseTabAutoChecksParams) {
  useEffect(() => {
    if (allowInitialManualCheck && activeTab === 'domains' && !isLoadingData && !autoRefreshEnabled && !hasChecked && !isRefreshing && domains.length > 0) {
      globalThis.console.log('[Monitoring Tab] Auto-checking all domains on initial load...')
      onManualRefresh(false)
    }
  }, [activeTab, allowInitialManualCheck, isLoadingData, autoRefreshEnabled, hasChecked, isRefreshing, domains.length, onManualRefresh])
}