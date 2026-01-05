import { useEffect, useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Globe, ArrowClockwise, DownloadSimple, MagnifyingGlass, X, SortAscending } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AddDomainForm } from '@/components/AddDomainForm'
import { DomainCard } from '@/components/DomainCard'
import { EmptyState } from '@/components/EmptyState'
import { ImportDialog } from '@/components/ImportDialog'
import { InfoDialog } from '@/components/InfoDialog'
import { Domain, DomainStatus } from '@/lib/types'
import { checkDomainStatus } from '@/lib/monitoring'
import { exportDomainsToCSV } from '@/lib/csv-export'
import { toast } from 'sonner'

type FilterType = 'all' | 'online' | 'dns-only' | 'offline'
type SortType = 'none' | 'name-asc' | 'name-desc' | 'status-online-first' | 'status-offline-first'

function App() {
  const [domains, setDomains] = useKV<Domain[]>('monitoring-domains', [])
  const [statuses, setStatuses] = useState<Record<string, DomainStatus>>({})
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [filter, setFilter] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortType>('none')

  const checkAllDomains = async () => {
    if (!domains || domains.length === 0) return

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
    toast.success('Domain dihapus dari daftar')
  }

  const handleManualRefresh = async () => {
    setIsRefreshing(true)
    await checkAllDomains()
    setIsRefreshing(false)
    toast.success('Status diperbarui')
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

  const handleImportDomains = (importedDomains: Domain[]) => {
    if (importedDomains.length === 0) return

    setDomains(current => [...(current || []), ...importedDomains])
    toast.success(`${importedDomains.length} domain berhasil diimport`)
  }

  useEffect(() => {
    checkAllDomains()

    const interval = setInterval(() => {
      checkAllDomains()
    }, 60000)

    return () => clearInterval(interval)
  }, [domains])

  const onlineCount = Object.values(statuses).filter(s => s.status === 'online').length
  const offlineCount = Object.values(statuses).filter(s => s.status === 'offline').length
  const dnsOnlyCount = Object.values(statuses).filter(s => s.status === 'dns-only').length
  const totalCount = domains?.length || 0

  const filteredDomains = domains?.filter(domain => {
    const matchesFilter = filter === 'all' || (() => {
      const status = statuses[domain.id]?.status
      if (!status || status === 'checking') return true
      return status === filter
    })()
    
    const matchesSearch = searchQuery === '' || 
      domain.url.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesFilter && matchesSearch
  }) || []

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

  return (
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
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <InfoDialog />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Panduan Monitoring</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <ImportDialog
                      existingDomains={domains || []}
                      onImport={handleImportDomains}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Import dari CSV</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportCSV}
                    className="h-8"
                  >
                    <DownloadSimple size={14} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Export ke CSV</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleManualRefresh}
                    disabled={isRefreshing}
                    className="h-8"
                  >
                    <ArrowClockwise 
                      size={14} 
                      className={isRefreshing ? 'animate-spin' : ''} 
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Refresh Status</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </header>

        <Separator className="mb-4" />

        <div className="space-y-4 flex flex-col h-[calc(100vh-180px)]">
          <AddDomainForm onAdd={handleAddDomain} />

          {totalCount > 0 && (
            <div className="space-y-2">
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
                <div className="text-muted-foreground">
                  Auto-refresh 60s • {totalCount} domain
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 px-1">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">Filter:</span>
                  <div className="flex gap-1.5 flex-wrap">
                    <Button
                      variant={filter === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilter('all')}
                      className="h-7 px-3 text-xs"
                    >
                      Semua
                    </Button>
                    <Button
                      variant={filter === 'online' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilter('online')}
                      className="h-7 px-3 text-xs"
                    >
                      Online
                    </Button>
                    {dnsOnlyCount > 0 && (
                      <Button
                        variant={filter === 'dns-only' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter('dns-only')}
                        className="h-7 px-3 text-xs"
                      >
                        DNS Only
                      </Button>
                    )}
                    <Button
                      variant={filter === 'offline' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilter('offline')}
                      className="h-7 px-3 text-xs"
                    >
                      Offline
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="w-36">
                        <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortType)}>
                          <SelectTrigger className="h-7 text-xs">
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
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Urutkan domain</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <div className="relative w-full sm:w-52">
                    <MagnifyingGlass 
                      size={14} 
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" 
                    />
                    <Input
                      type="text"
                      placeholder="Cari domain..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-7 pl-8 pr-8 text-xs"
                    />
                    {searchQuery && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-0 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-transparent"
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
          ) : filteredDomains.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  {searchQuery 
                    ? `Tidak ada domain yang cocok dengan "${searchQuery}"` 
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
                {sortedDomains.map(domain => (
                  <DomainCard
                    key={domain.id}
                    domain={domain}
                    status={statuses[domain.id] || { id: domain.id, status: 'checking' }}
                    onDelete={handleDeleteDomain}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>
    </div>
  )
}

export default App