import { useMemo, useState } from 'react'
import { Globe, CheckCircle, XCircle, Clock, Gauge, FolderOpen, Tag, TrendUp, ChartLine } from '@phosphor-icons/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Domain, DomainStatus, DomainGroup, DomainTag } from '@/lib/types'
import { DomainCharts } from './DomainCharts'

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
  const [activeTab, setActiveTab] = useState<'manual' | 'firebase'>('manual')

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
    <ScrollArea className="h-[calc(100vh-240px)]">
      <div className="space-y-4 pr-4">
        {/* Tabs untuk Manual vs Firebase */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="manual" className="gap-2">
              <Gauge size={16} />
              Statistik Real-time
            </TabsTrigger>
            <TabsTrigger value="firebase" className="gap-2">
              <ChartLine size={16} />
              Analytics (Firebase)
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Domain</CardTitle>
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Globe size={16} weight="duotone" className="text-primary" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.total}</div>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <FolderOpen size={12} />
                <span>{stats.groupedDomains} dalam grup</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Online</CardTitle>
                <div className="w-8 h-8 rounded-lg bg-success/20 flex items-center justify-center">
                  <CheckCircle size={16} weight="duotone" className="text-success" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" style={{ color: 'oklch(0.70 0.22 145)' }}>
                {stats.online}
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-success"
                    style={{ width: `${stats.onlinePercentage}%` }}
                  />
                </div>
                <span className="font-semibold" style={{ color: 'oklch(0.70 0.22 145)' }}>
                  {stats.onlinePercentage}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">DNS Only</CardTitle>
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <Clock size={16} weight="duotone" className="text-amber-500" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" style={{ color: 'rgb(245, 158, 11)' }}>
                {stats.dnsOnly}
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-amber-500"
                    style={{ width: `${stats.dnsOnlyPercentage}%` }}
                  />
                </div>
                <span className="font-semibold" style={{ color: 'rgb(245, 158, 11)' }}>
                  {stats.dnsOnlyPercentage}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Offline</CardTitle>
                <div className="w-8 h-8 rounded-lg bg-destructive/20 flex items-center justify-center">
                  <XCircle size={16} weight="duotone" className="text-destructive" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">{stats.offline}</div>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-destructive"
                    style={{ width: `${stats.offlinePercentage}%` }}
                  />
                </div>
                <span className="font-semibold text-destructive">
                  {stats.offlinePercentage}%
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Response Time Rata-rata</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {stats.avgResponseTime > 0 ? `${stats.avgResponseTime}ms` : '-'}
              </div>
              {stats.avgResponseTime > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Min: {stats.minResponseTime}ms • Max: {stats.maxResponseTime}ms
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Grup Domain</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{groups.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.ungroupedDomains} domain tanpa grup
              </p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Tag Domain</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{tags.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.taggedDomains} domain dengan tag
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Distribusi Status</CardTitle>
              <CardDescription>Persentase status domain keseluruhan</CardDescription>
            </CardHeader>
            <CardContent>
              {statusDistribution.length > 0 ? (
                <div className="space-y-3">
                  {statusDistribution.map((item, index) => (
                    <div key={index} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-foreground font-medium">{item.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">{item.value}</span>
                          <span className="font-semibold text-foreground w-12 text-right">
                            {item.percentage}%
                          </span>
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full transition-all duration-500"
                          style={{
                            width: `${item.percentage}%`,
                            backgroundColor: item.color,
                          }}
                        />
                      </div>
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
            <CardHeader>
              <CardTitle className="text-base font-semibold">Status Per Grup</CardTitle>
              <CardDescription>Ringkasan domain di setiap grup</CardDescription>
            </CardHeader>
            <CardContent>
              {groupStats.length > 0 ? (
                <ScrollArea className="h-[220px]">
                  <div className="space-y-3 pr-3">
                    {groupStats.map(({ group, total, online, offline, dnsOnly, onlinePercentage }) => (
                      <div key={group.id} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div
                              className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: `${group.color}20` }}
                            >
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: group.color }}
                              />
                            </div>
                            <span className="text-foreground font-medium truncate">{group.name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs flex-shrink-0">
                            <span className="text-success">{online}</span>
                            {dnsOnly > 0 && <span className="text-amber-500">{dnsOnly}</span>}
                            <span className="text-destructive">{offline}</span>
                            <span className="text-muted-foreground">/ {total}</span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-success transition-all duration-500"
                            style={{ width: `${onlinePercentage}%` }}
                          />
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Top 10 Domain Tercepat</CardTitle>
              <CardDescription>Domain dengan response time terendah</CardDescription>
            </CardHeader>
            <CardContent>
              {topFastestDomains.length > 0 ? (
                <ScrollArea className="h-[240px]">
                  <div className="space-y-2 pr-3">
                    {topFastestDomains.map(({ domain, responseTime }, index) => (
                      <div
                        key={domain.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0 text-xs flex-shrink-0">
                            {index + 1}
                          </Badge>
                          <span className="text-sm text-foreground truncate font-mono">{domain.url}</span>
                        </div>
                        <Badge className="ml-2 font-mono flex-shrink-0" style={{ backgroundColor: 'oklch(0.70 0.22 145)', color: 'white' }}>
                          {responseTime}ms
                        </Badge>
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
            <CardHeader>
              <CardTitle className="text-base font-semibold">Top 10 Domain Terlambat</CardTitle>
              <CardDescription>Domain dengan response time tertinggi</CardDescription>
            </CardHeader>
            <CardContent>
              {topSlowestDomains.length > 0 ? (
                <ScrollArea className="h-[240px]">
                  <div className="space-y-2 pr-3">
                    {topSlowestDomains.map(({ domain, responseTime }, index) => (
                      <div
                        key={domain.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0 text-xs flex-shrink-0">
                            {index + 1}
                          </Badge>
                          <span className="text-sm text-foreground truncate font-mono">{domain.url}</span>
                        </div>
                        <Badge
                          className="ml-2 font-mono flex-shrink-0"
                          variant={responseTime > 3000 ? 'destructive' : 'secondary'}
                        >
                          {responseTime}ms
                        </Badge>
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
          </TabsContent>

          {/* Tab Content: Firebase Analytics */}
          <TabsContent value="firebase" className="space-y-4 mt-4">
            {selectedDomain ? (
              <div>
                <DomainCharts
                  selectedDomain={selectedDomain}
                  onClose={() => setSelectedDomain(null)}
                />
              </div>
            ) : (
              <>
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
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pr-3">
                    {domains.slice(0, 50).map((domain) => {
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
                    })}
                  </div>
                </ScrollArea>
                {domains.length > 50 && (
                  <p className="text-xs text-muted-foreground text-center mt-3">
                    Menampilkan 50 dari {domains.length} domain
                  </p>
                )}
              </CardContent>
            </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  )
}
