import { useMemo, useState } from 'react'
import { Globe, CheckCircle, XCircle, Clock, Gauge, FolderOpen, Tag, TrendUp, ChartLine, MagnifyingGlass, X } from '@phosphor-icons/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Domain, DomainStatus, DomainGroup, DomainTag } from '@/lib/types'
import { DomainCharts } from './DomainCharts'
import { GitHubActionsStatusCard } from './GitHubActionsStatusCard'

interface StatisticsViewProps {
  domains: Domain[]
  statuses: Record<string, DomainStatus>
  groups: DomainGroup[]
  tags: DomainTag[]
  hasChecked: boolean
  autoRefreshEnabled: boolean
}

export function StatisticsView({
  domains,
  statuses,
  groups,
  tags,
  hasChecked,
  autoRefreshEnabled,
}: StatisticsViewProps) {
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null)
  const [activeTab, setActiveTab] = useState<'manual' | 'firebase' | 'github-actions'>('manual')
  const [firebaseSearchQuery, setFirebaseSearchQuery] = useState('')

  const stats = useMemo(() => {
    const total = domains.length
    const online = domains.filter(d => statuses[d.id]?.status === 'online').length
    const offline = domains.filter(d => statuses[d.id]?.status === 'offline').length
    const dnsOnly = domains.filter(d => statuses[d.id]?.status === 'dns-only').length
    const checking = domains.filter(d => statuses[d.id]?.status === 'checking').length

    const responseTimes = domains
      .map(d => statuses[d.id]?.responseTime)
      .filter((rt): rt is number => rt !== undefined && rt > 0)
    
    const avgResponseTime = responseTimes.length > 0
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : 0

    const minResponseTime = responseTimes.length > 0 ? Math.min(...responseTimes) : 0
    const maxResponseTime = responseTimes.length > 0 ? Math.max(...responseTimes) : 0

    const onlinePercentage = total > 0 ? Math.round((online / total) * 100) : 0
    const offlinePercentage = total > 0 ? Math.round((offline / total) * 100) : 0
    const dnsOnlyPercentage = total > 0 ? Math.round((dnsOnly / total) * 100) : 0

    const lastCheckedTimestamps = domains
      .map(d => statuses[d.id]?.lastChecked)
      .filter((lc): lc is number => lc !== undefined)
    const lastChecked = lastCheckedTimestamps.length > 0
      ? Math.max(...lastCheckedTimestamps)
      : undefined

    const groupedDomains = domains.filter(d => d.groupId).length
    const ungroupedDomains = domains.filter(d => !d.groupId).length
    const taggedDomains = domains.filter(d => d.tags && d.tags.length > 0).length

    return {
      total,
      online,
      offline,
      dnsOnly,
      checking,
      onlinePercentage,
      offlinePercentage,
      dnsOnlyPercentage,
      avgResponseTime,
      minResponseTime,
      maxResponseTime,
      lastChecked,
      groupedDomains,
      ungroupedDomains,
      taggedDomains,
    }
  }, [domains, statuses])

  const groupStats = useMemo(() => {
    return groups.map(group => {
      const groupDomains = domains.filter(d => d.groupId === group.id)
      const online = groupDomains.filter(d => statuses[d.id]?.status === 'online').length
      const offline = groupDomains.filter(d => statuses[d.id]?.status === 'offline').length
      const dnsOnly = groupDomains.filter(d => statuses[d.id]?.status === 'dns-only').length
      return {
        group,
        total: groupDomains.length,
        online,
        offline,
        dnsOnly,
        onlinePercentage: groupDomains.length > 0 ? Math.round((online / groupDomains.length) * 100) : 0,
      }
    }).sort((a, b) => b.total - a.total)
  }, [domains, statuses, groups])

  const topFastestDomains = useMemo(() => {
    return domains
      .filter(d => statuses[d.id]?.status === 'online' && statuses[d.id]?.responseTime)
      .map(d => ({
        domain: d,
        responseTime: statuses[d.id].responseTime!,
      }))
      .sort((a, b) => a.responseTime - b.responseTime)
      .slice(0, 10)
  }, [domains, statuses])

  const topSlowestDomains = useMemo(() => {
    return domains
      .filter(d => statuses[d.id]?.status === 'online' && statuses[d.id]?.responseTime)
      .map(d => ({
        domain: d,
        responseTime: statuses[d.id].responseTime!,
      }))
      .sort((a, b) => b.responseTime - a.responseTime)
      .slice(0, 10)
  }, [domains, statuses])

  const statusDistribution = useMemo(() => {
    const total = stats.online + stats.offline + stats.dnsOnly
    if (total === 0) return []

    return [
      { label: 'Online', value: stats.online, percentage: stats.onlinePercentage, color: 'oklch(0.70 0.22 145)' },
      { label: 'DNS Only', value: stats.dnsOnly, percentage: stats.dnsOnlyPercentage, color: 'rgb(245, 158, 11)' },
      { label: 'Offline', value: stats.offline, percentage: stats.offlinePercentage, color: 'oklch(0.60 0.25 25)' },
    ].filter(item => item.value > 0)
  }, [stats])

  // Check if there's any status data available (from previous checks)
  const hasStatusData = Object.keys(statuses).length > 0 && 
    Object.values(statuses).some(s => s.lastChecked !== undefined)

  return (
    <ScrollArea className="flex-1 min-h-0">
      <div className="space-y-2 pr-4 pb-20 md:pb-4">
        {/* Tabs untuk Manual vs Firebase */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-3 h-auto p-1">
            <TabsTrigger value="manual" className="gap-1 md:gap-2 text-[10px] md:text-sm h-9 md:h-10 px-1 md:px-3 flex-col md:flex-row">
              <Gauge size={14} className="md:size-4" />
              <span className="leading-tight">Real-time</span>
            </TabsTrigger>
            <TabsTrigger value="firebase" className="gap-1 md:gap-2 text-[10px] md:text-sm h-9 md:h-10 px-1 md:px-3 flex-col md:flex-row">
              <ChartLine size={14} className="md:size-4" />
              <span className="leading-tight">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="github-actions" className="gap-1 md:gap-2 text-[10px] md:text-sm h-9 md:h-10 px-1 md:px-3 flex-col md:flex-row">
              <TrendUp size={14} className="md:size-4" />
              <span className="leading-tight">GitHub</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab Content: Manual/Real-time Stats */}
          <TabsContent value="manual" className="space-y-4 mt-4">
        {stats.lastChecked && (
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>
              Data terakhir diperbarui: {new Date(stats.lastChecked).toLocaleString('id-ID', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </span>
            <Badge variant="outline" className="text-xs">
              {autoRefreshEnabled ? 'Mode Auto-Refresh' : 'Mode Manual'}
            </Badge>
          </div>
        )}

        {!hasChecked && !autoRefreshEnabled && !hasStatusData ? (
          <div className="flex items-center justify-center h-[400px]">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-muted mx-auto flex items-center justify-center">
                <Gauge size={32} weight="duotone" className="text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-1 text-foreground">Data Belum Tersedia</h3>
                <p className="text-xs text-muted-foreground">
                  Silakan check domain terlebih dahulu untuk melihat statistik real-time
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* 5 Compact Cards in a Row */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {/* Total Card */}
              <Card className="border-border">
                <CardContent className="p-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1">
                      <Globe size={16} weight="duotone" className="text-primary" />
                      <span className="text-xs text-muted-foreground">Total</span>
                    </div>
                    <div className="text-2xl font-bold">{stats.total}</div>
                    <p className="text-[10px] text-muted-foreground">{stats.groupedDomains} grup</p>
                  </div>
                </CardContent>
              </Card>

              {/* Online Card */}
              <Card className="border-border">
                <CardContent className="p-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1">
                      <CheckCircle size={16} weight="duotone" className="text-success" />
                      <span className="text-xs text-muted-foreground">Online</span>
                    </div>
                    <div className="text-2xl font-bold" style={{ color: 'oklch(0.70 0.22 145)' }}>{stats.online}</div>
                    <div className="flex items-center gap-0.5">
                      <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-success" style={{ width: `${stats.onlinePercentage}%` }} />
                      </div>
                      <span className="text-[10px] font-semibold" style={{ color: 'oklch(0.70 0.22 145)' }}>{stats.onlinePercentage}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* DNS Only Card */}
              <Card className="border-border">
                <CardContent className="p-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1">
                      <Clock size={16} weight="duotone" className="text-amber-500" />
                      <span className="text-xs text-muted-foreground">DNS Only</span>
                    </div>
                    <div className="text-2xl font-bold" style={{ color: 'rgb(245, 158, 11)' }}>{stats.dnsOnly}</div>
                    <div className="flex items-center gap-0.5">
                      <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500" style={{ width: `${stats.dnsOnlyPercentage}%` }} />
                      </div>
                      <span className="text-[10px] font-semibold" style={{ color: 'rgb(245, 158, 11)' }}>{stats.dnsOnlyPercentage}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Offline Card */}
              <Card className="border-border">
                <CardContent className="p-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1">
                      <XCircle size={16} weight="duotone" className="text-destructive" />
                      <span className="text-xs text-muted-foreground">Offline</span>
                    </div>
                    <div className="text-2xl font-bold text-destructive">{stats.offline}</div>
                    <div className="flex items-center gap-0.5">
                      <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-destructive" style={{ width: `${stats.offlinePercentage}%` }} />
                      </div>
                      <span className="text-[10px] font-semibold text-destructive">{stats.offlinePercentage}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Info Card - Avg, Grup, Tag */}
              <Card className="border-border">
                <CardContent className="p-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1">
                      <Gauge size={16} className="text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Avg Response</span>
                    </div>
                    <div className="text-2xl font-bold">{stats.avgResponseTime > 0 ? `${stats.avgResponseTime}ms` : '-'}</div>
                    {stats.avgResponseTime > 0 && (
                      <p className="text-[10px] text-muted-foreground">{stats.minResponseTime}-{stats.maxResponseTime}ms</p>
                    )}
                    <div className="flex items-center gap-2 pt-0.5">
                      <div className="flex items-center gap-0.5">
                        <FolderOpen size={12} className="text-muted-foreground" />
                        <span className="text-[10px]"><span className="font-semibold">{groups.length}</span> <span className="text-muted-foreground">grup</span></span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <Tag size={12} className="text-muted-foreground" />
                        <span className="text-[10px]"><span className="font-semibold">{tags.length}</span> <span className="text-muted-foreground">tag</span></span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          <Card className="border-border">
            <CardHeader className="pb-0.5 pt-2 px-2">
              <CardTitle className="text-sm md:text-base font-semibold">Distribusi Status</CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-1.5">
              {statusDistribution.length > 0 ? (
                <div className="space-y-1">
                  {statusDistribution.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xs text-foreground font-medium min-w-[50px]">{item.label}</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full transition-all" style={{ width: `${item.percentage}%`, backgroundColor: item.color }} />
                      </div>
                      <span className="text-xs text-muted-foreground w-8">{item.value}</span>
                      <span className="text-xs font-semibold w-10 text-right">{item.percentage}%</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Tidak ada data status tersedia
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-0.5 pt-2 px-2">
              <CardTitle className="text-sm md:text-base font-semibold">Status Per Grup</CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-1.5">
              {groupStats.length > 0 ? (
                <ScrollArea className="h-[90px]">
                  <div className="space-y-1 pr-2">
                    {groupStats.map(({ group, total, online, offline, dnsOnly, onlinePercentage }) => (
                      <div key={group.id} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: group.color }} />
                        <span className="text-xs text-foreground font-medium truncate min-w-[60px] flex-1">{group.name}</span>
                        <div className="flex items-center gap-1 text-[10px] flex-shrink-0">
                          <span className="text-success">{online}</span>
                          {dnsOnly > 0 && <span className="text-amber-500">{dnsOnly}</span>}
                          <span className="text-destructive">{offline}</span>
                          <span className="text-muted-foreground">/{total}</span>
                        </div>
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-success" style={{ width: `${onlinePercentage}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Belum ada grup domain
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          <Card className="border-border">
            <CardHeader className="pb-0.5 pt-2 px-2">
              <CardTitle className="text-sm md:text-base font-semibold">Top 10 Tercepat</CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-1.5">
              {topFastestDomains.length > 0 ? (
                <ScrollArea className="h-[110px]">
                  <div className="space-y-1 pr-2">
                    {topFastestDomains.map(({ domain, responseTime }, index) => (
                      <div key={domain.id} className="flex items-center gap-2 text-xs">
                        <span className="w-4 text-center text-muted-foreground font-mono">{index + 1}</span>
                        <span className="flex-1 truncate font-mono text-foreground">{domain.url}</span>
                        <span className="font-semibold font-mono" style={{ color: 'oklch(0.70 0.22 145)' }}>{responseTime}ms</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Tidak ada domain online
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-0.5 pt-2 px-2">
              <CardTitle className="text-sm md:text-base font-semibold">Top 10 Terlambat</CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-1.5">
              {topSlowestDomains.length > 0 ? (
                <ScrollArea className="h-[110px]">
                  <div className="space-y-1 pr-2">
                    {topSlowestDomains.map(({ domain, responseTime }, index) => (
                      <div key={domain.id} className="flex items-center gap-2 text-xs">
                        <span className="w-4 text-center text-muted-foreground font-mono">{index + 1}</span>
                        <span className="flex-1 truncate font-mono text-foreground">{domain.url}</span>
                        <span className="font-semibold font-mono" style={{ color: responseTime > 3000 ? 'oklch(0.60 0.25 25)' : 'rgb(245, 158, 11)' }}>{responseTime}ms</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Tidak ada domain online
                </p>
              )}
            </CardContent>
          </Card>
        </div>
          </>
        )}
          </TabsContent>

          {/* Tab Content: Firebase Analytics */}
          <TabsContent value="firebase" className="space-y-4 mt-4">
            {selectedDomain ? (
              <div>
                <DomainCharts
                  selectedDomain={selectedDomain}
                  currentStatus={statuses[selectedDomain.id]}
                  onClose={() => setSelectedDomain(null)}
                />
              </div>
            ) : (
              <>
                {/* Firebase Quota Warning */}
                <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/5 p-4">
                  <div className="flex gap-3">
                    <div className="text-xl">⚠️</div>
                    <div className="space-y-1 flex-1">
                      <h4 className="text-sm font-semibold text-yellow-600 dark:text-yellow-500">
                        Firebase Analytics (Historical Data)
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Data dari Firebase memiliki quota limit 20,000 reads/day. Jika quota habis, tab ini tidak akan bisa load data sampai besok (UTC 00:00).
                        Gunakan tab <span className="font-semibold">&quot;Statistik Real-time&quot;</span> untuk monitoring langsung tanpa Firebase.
                      </p>
                    </div>
                  </div>
                </div>

                {stats.lastChecked && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                    <span>
                      Data dari Firebase domain-stats-daily collection
                    </span>
                    <Badge variant="outline" className="text-xs">
                      Historical Data
                    </Badge>
                  </div>
                )}

                {/* Domain Charts Section */}
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <ChartLine size={20} />
                      Statistik Detail Per Domain
                    </CardTitle>
                    <CardDescription>
                      Pilih domain untuk melihat uptime history, response time, dan incident timeline
                    </CardDescription>
                    {/* Search Input */}
                    <div className="mt-3 relative">
                      <MagnifyingGlass 
                        size={16} 
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" 
                      />
                      <Input
                        placeholder="Cari domain..."
                        value={firebaseSearchQuery}
                        onChange={(e) => setFirebaseSearchQuery(e.target.value)}
                        className="pl-9 h-9 text-sm"
                      />
                      {firebaseSearchQuery && (
                        <button
                          onClick={() => setFirebaseSearchQuery('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pr-3">
                    {(() => {
                      const filtered = domains.filter(d => 
                        d.url.toLowerCase().includes(firebaseSearchQuery.toLowerCase())
                      )
                      
                      return filtered.length > 0 ? filtered.map((domain) => {
                        const status = statuses[domain.id]
                        const statusColor =
                          status?.status === 'online'
                            ? 'oklch(0.70 0.22 145)'
                            : status?.status === 'dns-only'
                            ? 'rgb(245, 158, 11)'
                            : 'oklch(0.60 0.25 25)'

                        return (
                          <Button
                            key={domain.id}
                            variant="outline"
                            className="justify-start h-auto p-3 hover:bg-accent"
                            onClick={() => {
                              setSelectedDomain(domain)
                              console.log('Domain clicked:', domain.url)
                            }}
                          >
                            <div className="flex items-center gap-2 w-full">
                              <div
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: statusColor }}
                              />
                              <span className="text-xs font-mono truncate flex-1 text-left">
                                {domain.url}
                              </span>
                              <ChartLine size={14} className="text-muted-foreground flex-shrink-0" />
                            </div>
                          </Button>
                        )
                      }) : (
                        <div className="col-span-2 text-center py-8 text-sm text-muted-foreground">
                          Tidak ada domain yang cocok
                        </div>
                      )
                    })()}
                  </div>
                </ScrollArea>
                {firebaseSearchQuery && (
                  <p className="text-xs text-muted-foreground text-center mt-3">
                    Ditemukan {domains.filter(d => d.url.toLowerCase().includes(firebaseSearchQuery.toLowerCase())).length} domain
                  </p>
                )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Tab Content: GitHub Actions Status */}
          <TabsContent value="github-actions" className="space-y-4 mt-4">
            <GitHubActionsStatusCard />
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  )
}
