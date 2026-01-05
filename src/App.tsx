import { useEffect, useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Globe, ArrowClockwise, DownloadSimple } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
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

function App() {
  const [domains, setDomains] = useKV<Domain[]>('monitoring-domains', [])
  const [statuses, setStatuses] = useState<Record<string, DomainStatus>>({})
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [filter, setFilter] = useState<FilterType>('all')

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
    if (filter === 'all') return true
    const status = statuses[domain.id]?.status
    if (!status || status === 'checking') return true
    return status === filter
  }) || []

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

              <div className="flex items-center gap-2 px-1">
                <span className="text-xs text-muted-foreground">Filter:</span>
                <div className="flex gap-1.5">
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
            </div>
          )}

          {!domains || domains.length === 0 ? (
            <EmptyState />
          ) : filteredDomains.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">Tidak ada domain dengan status ini</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilter('all')}
                  className="text-xs"
                >
                  Tampilkan Semua
                </Button>
              </div>
            </div>
          ) : (
            <ScrollArea className="flex-1">
              <div className="space-y-2 pr-4">
                {filteredDomains.map(domain => (
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