import { useCallback } from 'react'
import { toast } from 'sonner'
import { exportDomainsToCSV } from '@/lib/csv-export'
import { Domain, DomainGroup, DomainStatus } from '@/lib/types'

type FilterType = 'all' | 'online' | 'dns-only' | 'offline'
type ViewMode = 'all' | 'groups' | 'group-detail'

type UseDomainExportHandlersParams = {
  domains: Domain[]
  statuses: Record<string, DomainStatus>
  groups: DomainGroup[]
  filteredDomains: Domain[]
  viewMode: ViewMode
  selectedGroup?: DomainGroup | null
  filter: FilterType
  autoRefreshEnabled: boolean
  hasChecked: boolean
}

const showDuplicateToast = (duplicates: string[]) => {
  toast.error(
    `Ditemukan ${duplicates.length} domain duplikat. Harap hapus duplikat terlebih dahulu: ${duplicates.slice(0, 3).join(', ')}${duplicates.length > 3 ? '...' : ''}`,
    { duration: 6000 }
  )
}

export function useDomainExportHandlers({
  domains,
  statuses,
  groups,
  filteredDomains,
  viewMode,
  selectedGroup,
  filter,
  autoRefreshEnabled,
  hasChecked,
}: UseDomainExportHandlersParams) {
  const handleExportCSV = useCallback(() => {
    console.log('[Export] Starting export, domains:', domains.length, 'statuses:', Object.keys(statuses).length)

    if (domains.length === 0) {
      toast.error('Tidak ada data untuk diekspor')
      return
    }

    if (!autoRefreshEnabled && !hasChecked) {
      toast.error('Silakan check domain terlebih dahulu sebelum export')
      return
    }

    try {
      const result = exportDomainsToCSV(domains, statuses)
      console.log('[Export] Export result:', result)

      if (!result.success) {
        if (result.duplicates && result.duplicates.length > 0) {
          showDuplicateToast(result.duplicates)
        } else {
          toast.error('Gagal mengekspor data')
        }
        return
      }

      toast.success(`Berhasil mengekspor ${domains.length} domain ke CSV`)
    } catch (error) {
      console.error('[Export] Error during export:', error)
      toast.error('Terjadi kesalahan saat mengekspor data')
    }
  }, [autoRefreshEnabled, domains, hasChecked, statuses])

  const handleExportFilteredCSV = useCallback(() => {
    console.log('[Export Filtered] Starting export, filtered domains:', filteredDomains.length)

    if (filteredDomains.length === 0) {
      toast.error('Tidak ada domain yang terfilter untuk diekspor')
      return
    }

    if (!autoRefreshEnabled && !hasChecked) {
      toast.error('Silakan check domain terlebih dahulu sebelum export')
      return
    }

    try {
      let filename = 'monitoring-domains'
      if (viewMode === 'group-detail' && selectedGroup) {
        filename = selectedGroup.name
      } else if (filter !== 'all') {
        filename += `-${filter}`
      }

      const result = exportDomainsToCSV(filteredDomains, statuses, filename)
      console.log('[Export Filtered] Export result:', result)

      if (!result.success) {
        if (result.duplicates && result.duplicates.length > 0) {
          showDuplicateToast(result.duplicates)
        } else {
          toast.error('Gagal mengekspor data')
        }
        return
      }

      toast.success(`${filteredDomains.length} domain terfilter berhasil diekspor ke CSV`)
    } catch (error) {
      console.error('[Export Filtered] Error during export:', error)
      toast.error('Terjadi kesalahan saat mengekspor data')
    }
  }, [autoRefreshEnabled, filter, filteredDomains, hasChecked, selectedGroup, statuses, viewMode])

  const handleExportGroupCSV = useCallback((groupId: string) => {
    const group = groups.find(g => g.id === groupId)
    if (!group) return

    console.log('[Export Group] Starting export for group:', group.name)

    if (!autoRefreshEnabled && !hasChecked) {
      toast.error('Silakan check domain terlebih dahulu sebelum export')
      return
    }

    const groupDomains = domains.filter(d => d.groupId === groupId)
    console.log('[Export Group] Group domains:', groupDomains.length)

    if (groupDomains.length === 0) {
      toast.error('Tidak ada domain dalam grup ini')
      return
    }

    try {
      const result = exportDomainsToCSV(groupDomains, statuses, group.name)
      console.log('[Export Group] Export result:', result)

      if (!result.success) {
        if (result.duplicates && result.duplicates.length > 0) {
          showDuplicateToast(result.duplicates)
        } else {
          toast.error('Gagal mengekspor data')
        }
        return
      }

      toast.success(`Domain grup "${group.name}" berhasil diekspor ke CSV`)
    } catch (error) {
      console.error('[Export Group] Error during export:', error)
      toast.error('Terjadi kesalahan saat mengekspor data')
    }
  }, [autoRefreshEnabled, domains, groups, hasChecked, statuses])

  return {
    handleExportCSV,
    handleExportFilteredCSV,
    handleExportGroupCSV,
  }
}