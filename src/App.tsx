import { useEffect, useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Globe, ArrowClockwise, DownloadSimple, MagnifyingGlass, X, SortAscending, Pause, Play, FolderOpen, Tag, ListBullets, Trash, CheckSquare, Toolbox } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { AddDomainForm } from '@/components/AddDomainForm'
import { DomainCard } from '@/components/DomainCard'
import { EmptyState } from '@/components/EmptyState'
import { ImportDialog } from '@/components/ImportDialog'
import { InfoDialog } from '@/components/InfoDialog'
import { GroupCard } from '@/components/GroupCard'
import { GroupFormDialog } from '@/components/GroupFormDialog'
import { AssignDomainsDialog } from '@/components/AssignDomainsDialog'
import { Domain, DomainStatus, DomainGroup } from '@/lib/types'
import { checkDomainStatus } from '@/lib/monitoring'
import { exportDomainsToCSV } from '@/lib/csv-export'
import { toast } from 'sonner'

type FilterType = 'all' | 'online' | 'dns-only' | 'offline'
type SortType = 'none' | 'name-asc' | 'name-desc' | 'status-online-first' | 'status-offline-first'
type ViewMode = 'all' | 'groups' | 'group-detail'

function App() {
  const [domains, setDomains] = useKV<Domain[]>('monitoring-domains', [])
  const [groups, setGroups] = useKV<DomainGroup[]>('domain-groups', [])
  const [statuses, setStatuses] = useState<Record<string, DomainStatus>>({})
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [filter, setFilter] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortType>('none')
  const [countdown, setCountdown] = useState(60)
  const [isPaused, setIsPaused] = useState(false)
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false)
  const [hasChecked, setHasChecked] = useState(false)
  const [activeTab, setActiveTab] = useState<'domains' | 'groups' | 'manage'>('domains')
  const [viewMode, setViewMode] = useState<ViewMode>('all')
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<DomainGroup | null>(null)
  const [selectedDomains, setSelectedDomains] = useState<Set<string>>(new Set())
  const [manageSearchQuery, setManageSearchQuery] = useState('')
  const [manageGroupFilter, setManageGroupFilter] = useState<string>('all')

  const checkAllDomains = async (showToast = false) => {
    if (!domains || domains.length === 0) return

    if (showToast) {
      toast.info(`Memeriksa ${domains.length} domain...`, { duration: 2000 })
    }

    const checkingStatuses: Record<string, DomainStatus> = {}
    domains.forEach(domain => {
      checkingStatuses[domain.id] = {
        id: domain.id,
        status: 'checking',
      }
    })
    setStatuses(checkingStatuses)

    const results = await Promise.all(
      domains.map(domain => checkDomainStatus(domain.url, domain.id))
    )

    const newStatuses: Record<string, DomainStatus> = {}
    results.forEach(result => {
      newStatuses[result.id] = result
    })
    setStatuses(newStatuses)
    setHasChecked(true)

    if (showToast) {
      const online = results.filter(r => r.status === 'online').length
      const offline = results.filter(r => r.status === 'offline').length
      const dnsOnly = results.filter(r => r.status === 'dns-only').length
      
      toast.success(
        `Selesai! Online: ${online}, DNS Only: ${dnsOnly}, Offline: ${offline}`,
        { duration: 4000 }
      )
    }
  }

  const handleAddDomain = (url: string) => {
    const isDuplicate = domains?.some(d => d.url === url)
    if (isDuplicate) {
      toast.error('Domain sudah ada dalam daftar')
      return
    }

    const newDomain: Domain = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      url,
      addedAt: Date.now(),
    }

    setDomains(current => [...(current || []), newDomain])
    toast.success('Domain berhasil ditambahkan')
  }

  const handleDeleteDomain = (id: string) => {
    setDomains(current => (current || []).filter(d => d.id !== id))
    setStatuses(current => {
      const newStatuses = { ...current }
      delete newStatuses[id]
      return newStatuses
    })
    setSelectedDomains(prev => {
      const newSet = new Set(prev)
      newSet.delete(id)
      return newSet
    })
    toast.success('Domain dihapus dari daftar')
  }

  const handleBulkDelete = () => {
    const count = selectedDomains.size
    if (count === 0) return

    setDomains(current => (current || []).filter(d => !selectedDomains.has(d.id)))
    setStatuses(current => {
      const newStatuses = { ...current }
      selectedDomains.forEach(id => delete newStatuses[id])
      return newStatuses
    })
    setSelectedDomains(new Set())
    toast.success(`${count} domain berhasil dihapus`)
  }

  const handleSelectDomain = (id: string, selected: boolean) => {
    setSelectedDomains(prev => {
      const newSet = new Set(prev)
      if (selected) {
        newSet.add(id)
      } else {
        newSet.delete(id)
      }
      return newSet
    })
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDomains(new Set(sortedDomains.map(d => d.id)))
    } else {
      setSelectedDomains(new Set())
    }
  }

  const handleManualRefresh = async () => {
    setIsRefreshing(true)
    setCountdown(60)
    if (autoRefreshEnabled) {
      setIsPaused(false)
    }
    await checkAllDomains(true)
    setIsRefreshing(false)
  }

  const handleTogglePause = () => {
    setIsPaused(prev => {
      const newPausedState = !prev
      if (newPausedState) {
        toast.info('Auto-refresh dijeda')
      } else {
        toast.info('Auto-refresh dilanjutkan')
        setCountdown(60)
      }
      return newPausedState
    })
  }

  const handleToggleAutoRefresh = () => {
    setAutoRefreshEnabled(prev => {
      const newState = !prev
      if (newState) {
        toast.success('Mode auto-refresh diaktifkan')
        setIsPaused(false)
        setCountdown(60)
        if (!hasChecked) {
          checkAllDomains(true)
        }
      } else {
        toast.info('Mode manual check diaktifkan')
        setIsPaused(true)
      }
      return newState
    })
  }

  const handleExportCSV = () => {
    if (!domains || domains.length === 0) {
      toast.error('Tidak ada data untuk diekspor')
      return
    }
    
    const result = exportDomainsToCSV(domains, statuses)
    
    if (!result.success && result.duplicates && result.duplicates.length > 0) {
      toast.error(
        `Ditemukan ${result.duplicates.length} domain duplikat. Harap hapus duplikat terlebih dahulu: ${result.duplicates.slice(0, 3).join(', ')}${result.duplicates.length > 3 ? '...' : ''}`,
        { duration: 6000 }
      )
      return
    }
    
    toast.success('Data berhasil diekspor ke CSV')
  }

  const handleExportFilteredCSV = () => {
    if (filteredDomains.length === 0) {
      toast.error('Tidak ada domain yang terfilter untuk diekspor')
      return
    }
    
    let filename = 'monitoring-domains'
    if (viewMode === 'group-detail' && selectedGroup) {
      filename = selectedGroup.name
    } else if (filter !== 'all') {
      filename += `-${filter}`
    }
    
    const result = exportDomainsToCSV(filteredDomains, statuses, filename)
    
    if (!result.success && result.duplicates && result.duplicates.length > 0) {
      toast.error(
        `Ditemukan ${result.duplicates.length} domain duplikat. Harap hapus duplikat terlebih dahulu: ${result.duplicates.slice(0, 3).join(', ')}${result.duplicates.length > 3 ? '...' : ''}`,
        { duration: 6000 }
      )
      return
    }
    
    toast.success(`${filteredDomains.length} domain terfilter berhasil diekspor ke CSV`)
  }

  const handleExportGroupCSV = (groupId: string) => {
    const group = groups?.find(g => g.id === groupId)
    if (!group) return

    const groupDomains = domains?.filter(d => d.groupId === groupId) || []
    
    if (groupDomains.length === 0) {
      toast.error('Tidak ada domain dalam grup ini')
      return
    }
    
    const result = exportDomainsToCSV(groupDomains, statuses, group.name)
    
    if (!result.success && result.duplicates && result.duplicates.length > 0) {
      toast.error(
        `Ditemukan ${result.duplicates.length} domain duplikat. Harap hapus duplikat terlebih dahulu: ${result.duplicates.slice(0, 3).join(', ')}${result.duplicates.length > 3 ? '...' : ''}`,
        { duration: 6000 }
      )
      return
    }
    
    toast.success(`Domain grup "${group.name}" berhasil diekspor ke CSV`)
  }

  const handleImportDomains = (importedDomains: Domain[], groupId?: string) => {
    if (importedDomains.length === 0) return

    const domainsWithGroup = groupId 
      ? importedDomains.map(d => ({ ...d, groupId }))
      : importedDomains

    setDomains(current => [...(current || []), ...domainsWithGroup])
    
    if (groupId) {
      const group = groups?.find(g => g.id === groupId)
      toast.success(`${importedDomains.length} domain berhasil diimport ke grup "${group?.name}"`)
    } else {
      toast.success(`${importedDomains.length} domain berhasil diimport`)
    }
  }

  const handleCreateGroup = (groupData: Omit<DomainGroup, 'id' | 'createdAt'>) => {
    const newGroup: DomainGroup = {
      ...groupData,
      id: `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
    }
    setGroups(current => [...(current || []), newGroup])
    toast.success('Grup berhasil dibuat')
  }

  const handleEditGroup = (groupData: Omit<DomainGroup, 'id' | 'createdAt'>) => {
    if (!editingGroup) return
    
    setGroups(current =>
      (current || []).map(g =>
        g.id === editingGroup.id
          ? { ...g, ...groupData }
          : g
      )
    )
    toast.success('Grup berhasil diperbarui')
    setEditingGroup(null)
  }

  const handleDeleteGroup = (groupId: string) => {
    setGroups(current => (current || []).filter(g => g.id !== groupId))
    setDomains(current =>
      (current || []).map(d =>
        d.groupId === groupId ? { ...d, groupId: undefined } : d
      )
    )
    toast.success('Grup berhasil dihapus')
  }

  const handleAssignDomains = (domainIds: string[], groupId: string | null) => {
    setDomains(current =>
      (current || []).map(d =>
        domainIds.includes(d.id)
          ? { ...d, groupId: groupId || undefined }
          : d
      )
    )
    toast.success('Domain berhasil diatur grupnya')
  }

  const handleViewGroupDomains = (groupId: string) => {
    setSelectedGroupId(groupId)
    setViewMode('group-detail')
    setActiveTab('domains')
  }

  useEffect(() => {
    if (!autoRefreshEnabled) return

    checkAllDomains()
    setCountdown(60)

    if (isPaused) return

    const interval = setInterval(() => {
      checkAllDomains()
      setCountdown(60)
    }, 60000)

    return () => clearInterval(interval)
  }, [domains, isPaused, autoRefreshEnabled])

  useEffect(() => {
    if (!autoRefreshEnabled || isPaused) return

    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) return 60
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(countdownInterval)
  }, [isPaused, autoRefreshEnabled])

  useEffect(() => {
    setSelectedDomains(new Set())
  }, [filter, searchQuery, sortBy, viewMode, selectedGroupId, activeTab, manageGroupFilter])

  const currentViewDomains = (() => {
    if (viewMode === 'group-detail' && selectedGroupId) {
      return domains?.filter(d => d.groupId === selectedGroupId) || []
    }
    return domains || []
  })()

  const onlineCount = currentViewDomains.filter(d => statuses[d.id]?.status === 'online').length
  const offlineCount = currentViewDomains.filter(d => statuses[d.id]?.status === 'offline').length
  const dnsOnlyCount = currentViewDomains.filter(d => statuses[d.id]?.status === 'dns-only').length
  const totalCount = currentViewDomains.length

  const globalOnlineCount = (domains || []).filter(d => statuses[d.id]?.status === 'online').length
  const globalOfflineCount = (domains || []).filter(d => statuses[d.id]?.status === 'offline').length
  const globalDnsOnlyCount = (domains || []).filter(d => statuses[d.id]?.status === 'dns-only').length
  const globalTotalCount = domains?.length || 0

  const filteredDomains = currentViewDomains.filter(domain => {
    const matchesFilter = filter === 'all' || (() => {
      const status = statuses[domain.id]?.status
      if (!status || status === 'checking') return true
      return status === filter
    })()
    
    const matchesSearch = searchQuery === '' || 
      domain.url.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesFilter && matchesSearch
  })

  const sortedDomains = (() => {
    if (sortBy === 'none') return filteredDomains

    const domainsCopy = [...filteredDomains]

    if (sortBy === 'name-asc') {
      return domainsCopy.sort((a, b) => a.url.localeCompare(b.url))
    }

    if (sortBy === 'name-desc') {
      return domainsCopy.sort((a, b) => b.url.localeCompare(a.url))
    }

    if (sortBy === 'status-online-first') {
      return domainsCopy.sort((a, b) => {
        const statusA = statuses[a.id]?.status || 'checking'
        const statusB = statuses[b.id]?.status || 'checking'
        
        const statusOrder: Record<string, number> = {
          'online': 1,
          'dns-only': 2,
          'offline': 3,
          'checking': 4
        }
        
        return (statusOrder[statusA] || 999) - (statusOrder[statusB] || 999)
      })
    }

    if (sortBy === 'status-offline-first') {
      return domainsCopy.sort((a, b) => {
        const statusA = statuses[a.id]?.status || 'checking'
        const statusB = statuses[b.id]?.status || 'checking'
        
        const statusOrder: Record<string, number> = {
          'offline': 1,
          'dns-only': 2,
          'online': 3,
          'checking': 4
        }
        
        return (statusOrder[statusA] || 999) - (statusOrder[statusB] || 999)
      })
    }

    return domainsCopy
  })()

  const selectedGroup = selectedGroupId ? groups?.find(g => g.id === selectedGroupId) : null

  const getGroupStats = (groupId: string) => {
    const groupDomains = domains?.filter(d => d.groupId === groupId) || []
    const count = groupDomains.length
    const online = groupDomains.filter(d => statuses[d.id]?.status === 'online').length
    const offline = groupDomains.filter(d => statuses[d.id]?.status === 'offline').length
    const dnsOnly = groupDomains.filter(d => statuses[d.id]?.status === 'dns-only').length
    return { count, online, offline, dnsOnly }
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-4 max-w-5xl">
          <header className="mb-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                  <Globe size={24} weight="duotone" className="text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">
                    Domain Monitor
                  </h1>
                  <p className="text-xs text-muted-foreground tracking-wide">
                    Kabupaten Kendal
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <InfoDialog />
                
                <ImportDialog
                  existingDomains={domains || []}
                  groups={groups || []}
                  onImport={handleImportDomains}
                />

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCSV}
                  disabled={isRefreshing}
                  className="h-8"
                >
                  <DownloadSimple size={14} />
                </Button>

                <div className="h-6 w-px bg-border" />

                <Button
                  variant={autoRefreshEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={handleToggleAutoRefresh}
                  className="h-8 text-xs"
                  title={autoRefreshEnabled ? "Switch ke Mode Manual" : "Switch ke Mode Auto-refresh"}
                >
                  {autoRefreshEnabled ? "Auto" : "Manual"}
                </Button>

                {autoRefreshEnabled && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTogglePause}
                    className="h-8"
                    title={isPaused ? "Resume Auto-refresh" : "Pause Auto-refresh"}
                  >
                    {isPaused ? <Play size={14} weight="fill" /> : <Pause size={14} weight="fill" />}
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  className="h-8"
                  title="Check Sekarang"
                >
                  <ArrowClockwise 
                    size={14} 
                    className={isRefreshing ? 'animate-spin' : ''} 
                  />
                  {isRefreshing && <span className="text-xs ml-1.5">Checking...</span>}
                </Button>
              </div>
            </div>
          </header>

        <Separator className="mb-4" />

        <Tabs value={activeTab} onValueChange={(val) => {
          setActiveTab(val as 'domains' | 'groups' | 'manage')
          if (val === 'domains' && viewMode === 'group-detail') {
            setViewMode('all')
            setSelectedGroupId(null)
          }
        }} className="space-y-4">
          <TabsList className="grid w-full max-w-2xl grid-cols-3">
            <TabsTrigger value="domains" className="gap-1.5">
              <ListBullets size={14} />
              Monitoring
            </TabsTrigger>
            <TabsTrigger value="groups" className="gap-1.5">
              <FolderOpen size={14} />
              Kelola Grup
            </TabsTrigger>
            <TabsTrigger value="manage" className="gap-1.5">
              <Toolbox size={14} />
              Kelola Data
            </TabsTrigger>
          </TabsList>

          <TabsContent value="domains" className="space-y-4 flex flex-col h-[calc(100vh-220px)]">
            {!autoRefreshEnabled && hasChecked && !isRefreshing && totalCount > 0 && (
              <div className="bg-success/10 border border-success/30 rounded-lg p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-success/20 flex items-center justify-center">
                      <CheckSquare size={18} weight="duotone" className="text-success" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-success">Check Selesai!</p>
                      <p className="text-xs text-muted-foreground">
                        Online: {onlineCount} • DNS Only: {dnsOnlyCount} • Offline: {offlineCount}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportCSV}
                    className="h-8 bg-success text-success-foreground hover:bg-success/90"
                  >
                    <DownloadSimple size={14} />
                    Export Hasil
                  </Button>
                </div>
              </div>
            )}

            {viewMode === 'group-detail' && selectedGroup && (
              <div className="flex items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setViewMode('all')
                      setSelectedGroupId(null)
                    }}
                    className="h-7 text-xs"
                  >
                    ← Kembali
                  </Button>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-6 h-6 rounded flex items-center justify-center"
                      style={{ backgroundColor: `${selectedGroup.color}20` }}
                    >
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: selectedGroup.color }}
                      />
                    </div>
                    <span className="text-sm font-semibold">{selectedGroup.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({currentViewDomains.length} domain)
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {filteredDomains.length !== currentViewDomains.length && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportFilteredCSV}
                      disabled={filteredDomains.length === 0}
                      className="h-7 text-xs"
                    >
                      <DownloadSimple size={14} />
                      Export Terfilter ({filteredDomains.length})
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportGroupCSV(selectedGroup.id)}
                    disabled={currentViewDomains.length === 0}
                    className="h-7 text-xs"
                  >
                    <DownloadSimple size={14} />
                    Export Semua
                  </Button>
                </div>
              </div>
            )}

            {totalCount > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs px-1">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-success shadow-[0_0_8px_rgba(76,175,80,0.6)]" />
                      <span className="text-muted-foreground">Online</span>
                      <span className="font-semibold text-success">{onlineCount}</span>
                    </div>
                    {dnsOnlyCount > 0 && (
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                        <span className="text-muted-foreground">DNS Only</span>
                        <span className="font-semibold text-amber-500">{dnsOnlyCount}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-destructive shadow-[0_0_8px_rgba(244,67,54,0.6)]" />
                      <span className="text-muted-foreground">Offline</span>
                      <span className="font-semibold text-destructive">{offlineCount}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">
                      {autoRefreshEnabled 
                        ? (isPaused ? 'Dijeda' : `Refresh dalam ${countdown}s`) 
                        : 'Mode Manual'} • {totalCount} domain
                    </span>
                    {filteredDomains.length !== totalCount && (
                      <Badge variant="secondary" className="text-xs font-mono">
                        {filteredDomains.length} ditampilkan
                      </Badge>
                    )}
                    {autoRefreshEnabled && !isPaused && (
                      <Progress 
                        value={(countdown / 60) * 100} 
                        className="w-16 h-1.5"
                      />
                    )}
                    {viewMode !== 'group-detail' && (filter !== 'all' || searchQuery !== '') && filteredDomains.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportFilteredCSV}
                        className="h-7 text-xs ml-2"
                      >
                        <DownloadSimple size={14} />
                        Export Terfilter
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">Filter:</span>
                    <div className="flex gap-1.5 flex-1">
                      <Button
                        variant={filter === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter('all')}
                        className="h-8 px-3 text-xs flex-1 lg:flex-none"
                      >
                        Semua
                      </Button>
                      <Button
                        variant={filter === 'online' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter('online')}
                        className="h-8 px-3 text-xs flex-1 lg:flex-none"
                      >
                        Online
                      </Button>
                      {dnsOnlyCount > 0 && (
                        <Button
                          variant={filter === 'dns-only' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setFilter('dns-only')}
                          className="h-8 px-3 text-xs flex-1 lg:flex-none"
                        >
                          DNS Only
                        </Button>
                      )}
                      <Button
                        variant={filter === 'offline' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter('offline')}
                        className="h-8 px-3 text-xs flex-1 lg:flex-none"
                      >
                        Offline
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex-1 lg:flex-none lg:w-40">
                      <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortType)}>
                        <SelectTrigger className="h-8 py-0 text-xs w-full">
                          <div className="flex items-center gap-1.5">
                            <SortAscending size={14} />
                            <SelectValue placeholder="Urutkan" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none" className="text-xs">Default</SelectItem>
                          <SelectItem value="name-asc" className="text-xs">Nama A-Z</SelectItem>
                          <SelectItem value="name-desc" className="text-xs">Nama Z-A</SelectItem>
                          <SelectItem value="status-online-first" className="text-xs">Online Pertama</SelectItem>
                          <SelectItem value="status-offline-first" className="text-xs">Offline Pertama</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="relative flex-1">
                      <MagnifyingGlass 
                        size={14} 
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" 
                      />
                      <Input
                        type="text"
                        placeholder="Cari domain..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-8 pl-8 pr-8 text-xs w-full"
                      />
                      {searchQuery && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSearchQuery('')}
                          className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
                        >
                          <X size={14} className="text-muted-foreground hover:text-foreground" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!domains || domains.length === 0 ? (
              <EmptyState />
            ) : !hasChecked && !autoRefreshEnabled ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-6 max-w-md mx-auto">
                  <div className="w-24 h-24 rounded-2xl bg-primary/10 mx-auto flex items-center justify-center">
                    <ArrowClockwise size={48} weight="duotone" className="text-primary" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-xl font-semibold">Mode Manual Check</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Klik tombol <strong>Check</strong> untuk memeriksa status semua domain.<br />
                      Setelah selesai, Anda dapat langsung export hasilnya.
                    </p>
                  </div>
                  <Button
                    onClick={handleManualRefresh}
                    disabled={isRefreshing}
                    size="lg"
                    className="mt-2"
                  >
                    <ArrowClockwise 
                      size={18} 
                      className={isRefreshing ? 'animate-spin' : ''} 
                    />
                    {isRefreshing ? 'Memeriksa...' : `Check ${totalCount} Domain`}
                  </Button>
                </div>
              </div>
            ) : filteredDomains.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {searchQuery 
                      ? `Tidak ada domain yang cocok dengan "${searchQuery}"` 
                      : viewMode === 'group-detail'
                        ? 'Tidak ada domain dalam grup ini'
                        : 'Tidak ada domain dengan status ini'}
                  </p>
                  <div className="flex gap-2 justify-center">
                    {searchQuery && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSearchQuery('')}
                        className="text-xs"
                      >
                        Hapus Pencarian
                      </Button>
                    )}
                    {filter !== 'all' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFilter('all')}
                        className="text-xs"
                      >
                        Tampilkan Semua
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <ScrollArea className="flex-1">
                <div className="space-y-2 pr-4">
                  {sortedDomains.map(domain => {
                    return (
                      <DomainCard
                        key={domain.id}
                        domain={domain}
                        status={statuses[domain.id] || { id: domain.id, status: 'checking' }}
                        onDelete={() => {}}
                        group={undefined}
                        isSelected={false}
                        onSelect={() => {}}
                        showCheckbox={false}
                      />
                    )
                  })}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="manage" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Kelola domain - tambah, hapus, dan edit data domain
              </p>
            </div>

            <AddDomainForm onAdd={handleAddDomain} />

            {globalTotalCount > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1 lg:flex-none lg:w-48">
                    <Select value={manageGroupFilter} onValueChange={setManageGroupFilter}>
                      <SelectTrigger className="h-9 py-0 text-xs w-full">
                        <div className="flex items-center gap-1.5">
                          <FolderOpen size={14} />
                          <SelectValue placeholder="Filter Grup" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="text-xs">Semua Grup</SelectItem>
                        <SelectItem value="ungrouped" className="text-xs">Tanpa Grup</SelectItem>
                        {groups && groups.length > 0 && groups.map(group => (
                          <SelectItem key={group.id} value={group.id} className="text-xs">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: group.color }}
                              />
                              {group.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="relative flex-1">
                    <MagnifyingGlass 
                      size={14} 
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" 
                    />
                    <Input
                      type="text"
                      placeholder="Cari domain untuk dihapus..."
                      value={manageSearchQuery}
                      onChange={(e) => setManageSearchQuery(e.target.value)}
                      className="h-9 pl-8 pr-8 text-xs"
                    />
                    {manageSearchQuery && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setManageSearchQuery('')}
                        className="absolute right-0 top-1/2 -translate-y-1/2 h-9 w-9 p-0 hover:bg-transparent"
                      >
                        <X size={14} className="text-muted-foreground hover:text-foreground" />
                      </Button>
                    )}
                  </div>
                  
                  {selectedDomains.size > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleBulkDelete}
                      className="h-9"
                    >
                      <Trash size={14} />
                      Hapus {selectedDomains.size} Domain
                    </Button>
                  )}
                </div>

                {selectedDomains.size > 0 && (
                  <div className="bg-primary/10 border border-primary rounded-lg p-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedDomains.size === (() => {
                            const filtered = (domains || []).filter(domain => {
                              const matchesSearch = manageSearchQuery === '' || 
                                domain.url.toLowerCase().includes(manageSearchQuery.toLowerCase())
                              
                              const matchesGroup = manageGroupFilter === 'all' || 
                                (manageGroupFilter === 'ungrouped' && !domain.groupId) ||
                                domain.groupId === manageGroupFilter
                              
                              return matchesSearch && matchesGroup
                            })
                            return filtered.length
                          })()}
                          onCheckedChange={(checked) => {
                            const filtered = (domains || []).filter(domain => {
                              const matchesSearch = manageSearchQuery === '' || 
                                domain.url.toLowerCase().includes(manageSearchQuery.toLowerCase())
                              
                              const matchesGroup = manageGroupFilter === 'all' || 
                                (manageGroupFilter === 'ungrouped' && !domain.groupId) ||
                                domain.groupId === manageGroupFilter
                              
                              return matchesSearch && matchesGroup
                            })
                            if (checked) {
                              setSelectedDomains(new Set(filtered.map(d => d.id)))
                            } else {
                              setSelectedDomains(new Set())
                            }
                          }}
                        />
                        <span className="text-sm font-medium text-primary">
                          {selectedDomains.size} domain dipilih
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedDomains(new Set())}
                        className="h-8"
                      >
                        Batal
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!domains || domains.length === 0 ? (
              <EmptyState />
            ) : (() => {
              const filteredManageDomains = (domains || []).filter(domain => {
                const matchesSearch = manageSearchQuery === '' || 
                  domain.url.toLowerCase().includes(manageSearchQuery.toLowerCase())
                
                const matchesGroup = manageGroupFilter === 'all' || 
                  (manageGroupFilter === 'ungrouped' && !domain.groupId) ||
                  domain.groupId === manageGroupFilter
                
                return matchesSearch && matchesGroup
              })
              return filteredManageDomains.length === 0 ? (
                <div className="flex items-center justify-center h-[calc(100vh-400px)]">
                  <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {manageSearchQuery 
                        ? `Tidak ada domain yang cocok dengan "${manageSearchQuery}"`
                        : 'Tidak ada domain dalam filter ini'}
                    </p>
                    <div className="flex gap-2 justify-center">
                      {manageSearchQuery && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setManageSearchQuery('')}
                          className="text-xs"
                        >
                          Hapus Pencarian
                        </Button>
                      )}
                      {manageGroupFilter !== 'all' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setManageGroupFilter('all')}
                          className="text-xs"
                        >
                          Tampilkan Semua Grup
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-1">
                    <Checkbox
                      checked={selectedDomains.size === filteredManageDomains.length && filteredManageDomains.length > 0}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedDomains(new Set(filteredManageDomains.map(d => d.id)))
                        } else {
                          setSelectedDomains(new Set())
                        }
                      }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {selectedDomains.size > 0 ? `${selectedDomains.size} terpilih` : 'Pilih semua'}
                    </span>
                  </div>
                  <ScrollArea className="h-[calc(100vh-380px)]">
                    <div className="space-y-2 pr-4">
                      {filteredManageDomains.map(domain => {
                        const domainGroup = domain.groupId 
                          ? groups?.find(g => g.id === domain.groupId)
                          : undefined
                        return (
                          <DomainCard
                            key={domain.id}
                            domain={domain}
                            status={statuses[domain.id] || { id: domain.id, status: 'checking' }}
                            onDelete={handleDeleteDomain}
                            group={domainGroup}
                            isSelected={selectedDomains.has(domain.id)}
                            onSelect={handleSelectDomain}
                            showCheckbox={true}
                            simpleMode={true}
                          />
                        )
                      })}
                    </div>
                  </ScrollArea>
                </div>
              )
            })()}
          </TabsContent>

          <TabsContent value="groups" className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs px-1">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <Globe size={14} weight="duotone" className="text-muted-foreground" />
                    <span className="text-muted-foreground">Total Domain</span>
                    <span className="font-semibold text-foreground">{globalTotalCount}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FolderOpen size={14} weight="duotone" className="text-muted-foreground" />
                    <span className="text-muted-foreground">Total Grup</span>
                    <span className="font-semibold text-foreground">{groups?.length || 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-success shadow-[0_0_8px_rgba(76,175,80,0.6)]" />
                    <span className="text-muted-foreground">Online</span>
                    <span className="font-semibold text-success">{globalOnlineCount}</span>
                  </div>
                  {globalDnsOnlyCount > 0 && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                      <span className="text-muted-foreground">DNS Only</span>
                      <span className="font-semibold text-amber-500">{globalDnsOnlyCount}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-destructive shadow-[0_0_8px_rgba(244,67,54,0.6)]" />
                    <span className="text-muted-foreground">Offline</span>
                    <span className="font-semibold text-destructive">{globalOfflineCount}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Kelola grup domain untuk organisasi yang lebih baik
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAssignDialogOpen(true)}
                    disabled={!domains || domains.length === 0}
                    className="h-8"
                  >
                    <Tag size={14} />
                    Atur Grup
                  </Button>
                  <GroupFormDialog onSave={handleCreateGroup} />
                </div>
              </div>
            </div>

            {!groups || groups.length === 0 ? (
              <div className="flex items-center justify-center h-[calc(100vh-300px)]">
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-muted mx-auto flex items-center justify-center">
                    <FolderOpen size={32} weight="duotone" className="text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold mb-1">Belum Ada Grup</h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      Buat grup untuk mengelompokkan domain
                    </p>
                    <GroupFormDialog onSave={handleCreateGroup} />
                  </div>
                </div>
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-300px)]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pr-4">
                  {groups.map(group => {
                    const stats = getGroupStats(group.id)
                    return (
                      <GroupCard
                        key={group.id}
                        group={group}
                        domainCount={stats.count}
                        onlineCount={stats.online}
                        offlineCount={stats.offline}
                        dnsOnlyCount={stats.dnsOnly}
                        onEdit={(g) => setEditingGroup(g)}
                        onDelete={handleDeleteGroup}
                        onViewDomains={handleViewGroupDomains}
                        onExport={handleExportGroupCSV}
                      />
                    )
                  })}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>

        <AssignDomainsDialog
          open={assignDialogOpen}
          onOpenChange={setAssignDialogOpen}
          domains={domains || []}
          groups={groups || []}
          onAssign={handleAssignDomains}
        />

        <GroupFormDialog
          group={editingGroup || undefined}
          onSave={handleEditGroup}
          open={editingGroup !== null}
          onOpenChange={(open) => {
            if (!open) setEditingGroup(null)
          }}
        />
      </div>
    </div>
    </TooltipProvider>
  )
}

export default App