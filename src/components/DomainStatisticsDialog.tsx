import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts'
import { ChartLine, Clock, TrendUp, Warning, CheckCircle } from '@phosphor-icons/react'
import { Skeleton } from '@/components/ui/skeleton'
import { getFirestore, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore'
import { DomainDailyStats, DomainIncident } from '@/lib/types'
import { UptimeBar } from './UptimeBar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const DOMAIN_STATS_CACHE_TTL_MS = 5 * 60 * 1000
const domainStatisticsCache = new Map<string, {
  timestamp: number
  stats: DomainDailyStats[]
  incidents: DomainIncident[]
}>()

interface DomainStatisticsDialogProps {
  domainId: string
  domainUrl: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DomainStatisticsDialog({ domainId, domainUrl, open, onOpenChange }: DomainStatisticsDialogProps) {
  const [period, setPeriod] = useState<'7' | '30'>('7')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DomainDailyStats[]>([])
  const [incidents, setIncidents] = useState<DomainIncident[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && domainId) {
      loadStatistics()
    }
  }, [open, domainId, period])

  const loadStatistics = async () => {
    setLoading(true)
    setError(null)

    try {
      const db = getFirestore()
      const days = parseInt(period)
      const cacheKey = `${domainId}::${period}`
      const cached = domainStatisticsCache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < DOMAIN_STATS_CACHE_TTL_MS) {
        setStats(cached.stats)
        setIncidents(cached.incidents)
        setLoading(false)
        return
      }

      let loadedStats: DomainDailyStats[] = []

      try {
        const boundedStatsQuery = query(
          collection(db, 'domain-stats-daily'),
          where('domainId', '==', domainId),
          orderBy('date', 'desc'),
          limit(days)
        )

        const boundedStatsSnapshot = await getDocs(boundedStatsQuery)
        loadedStats = boundedStatsSnapshot.docs
          .map(doc => doc.data() as DomainDailyStats)
          .sort((a, b) => a.date.localeCompare(b.date))
      } catch (boundedStatsError) {
        console.warn('[DomainStatisticsDialog] Falling back to legacy stats query:', boundedStatsError)

        const fallbackStatsQuery = query(
          collection(db, 'domain-stats-daily'),
          where('domainId', '==', domainId),
          limit(Math.max(days * 4, 180))
        )

        const fallbackStatsSnapshot = await getDocs(fallbackStatsQuery)
        loadedStats = fallbackStatsSnapshot.docs
          .map(doc => doc.data() as DomainDailyStats)
          .sort((a, b) => a.date.localeCompare(b.date))
          .slice(-days)
      }

      setStats(loadedStats)

      // Load incidents (bounded first, fallback legacy)
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      let loadedIncidents: DomainIncident[] = []

      try {
        const boundedIncidentsQuery = query(
          collection(db, 'domain-incidents'),
          where('domainId', '==', domainId),
          orderBy('startTime', 'desc'),
          limit(Math.max(days * 3, 120))
        )

        const boundedIncidentsSnapshot = await getDocs(boundedIncidentsQuery)
        loadedIncidents = boundedIncidentsSnapshot.docs
          .map(doc => doc.data() as DomainIncident)
          .filter(inc => inc.startTime >= startDate.getTime())
          .sort((a, b) => b.startTime - a.startTime)
      } catch (boundedIncidentsError) {
        console.warn('[DomainStatisticsDialog] Falling back to legacy incidents query:', boundedIncidentsError)

        const fallbackIncidentsQuery = query(
          collection(db, 'domain-incidents'),
          where('domainId', '==', domainId),
          limit(Math.max(days * 8, 240))
        )

        const fallbackIncidentsSnapshot = await getDocs(fallbackIncidentsQuery)
        loadedIncidents = fallbackIncidentsSnapshot.docs
          .map(doc => doc.data() as DomainIncident)
          .filter(inc => inc.startTime >= startDate.getTime())
          .sort((a, b) => b.startTime - a.startTime)
      }

      setIncidents(loadedIncidents)
      domainStatisticsCache.set(cacheKey, {
        timestamp: Date.now(),
        stats: loadedStats,
        incidents: loadedIncidents,
      })

    } catch (err) {
      console.error('Error loading statistics:', err)
      setError('Gagal memuat statistik. Pastikan Firebase sudah terkonfigurasi dengan benar.')
    } finally {
      setLoading(false)
    }
  }

  const calculateSummary = () => {
    if (stats.length === 0) {
      return {
        totalUptime: 0,
        avgResponse: 0,
        totalChecks: 0,
        totalIncidents: incidents.length
      }
    }

    const totalChecks = stats.reduce((sum, s) => sum + s.totalChecks, 0)
    const successChecks = stats.reduce((sum, s) => sum + s.successChecks, 0)
    const totalUptime = totalChecks > 0 ? (successChecks / totalChecks) * 100 : 0

    const responseTimes = stats
      .map(s => s.avgResponseTime)
      .filter(rt => rt !== undefined) as number[]
    const avgResponse = responseTimes.length > 0
      ? responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length
      : 0

    return {
      totalUptime: Math.round(totalUptime * 10) / 10,
      avgResponse: Math.round(avgResponse),
      totalChecks,
      totalIncidents: incidents.length
    }
  }

  const getChartData = () => {
    return stats.map(stat => ({
      date: new Date(stat.date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' }),
      uptime: Math.round(stat.uptimePercent * 10) / 10,
      responseTime: stat.avgResponseTime || 0
    }))
  }

  const getHourlyBarsData = () => {
    // Get last 7 days for hourly view
    const last7Days = stats.slice(-7)
    return last7Days.flatMap(stat => 
      stat.hourly
        .filter(h => h.checks > 0)
        .map(h => ({
          status: h.successChecks === h.checks ? 'online' : h.successChecks > 0 ? 'partial' : 'offline',
          checks: h.checks,
          successChecks: h.successChecks,
          date: stat.date,
          hour: h.hour
        }))
    ).slice(-168) // Max 7 days × 24 hours
  }

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds} detik`
    if (seconds < 3600) return `${Math.round(seconds / 60)} menit`
    return `${Math.round(seconds / 3600)} jam`
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('id-ID', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const summary = calculateSummary()
  const chartData = getChartData()
  const hourlyBars = getHourlyBarsData()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
          <div className="flex items-center gap-2">
            <ChartLine size={24} weight="duotone" className="text-primary" />
            <DialogTitle className="text-2xl font-bold">Statistics</DialogTitle>
          </div>
          <DialogDescription className="font-mono text-sm">
            {domainUrl}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="px-6 pb-6 space-y-6">
            {/* Period Selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Period:</span>
              <div className="flex gap-2">
                <Button
                  variant={period === '7' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPeriod('7')}
                >
                  7 Hari
                </Button>
                <Button
                  variant={period === '30' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPeriod('30')}
                >
                  30 Hari
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <Warning size={48} className="mx-auto text-destructive mb-4" />
                <p className="text-destructive">{error}</p>
              </div>
            ) : stats.length === 0 ? (
              <div className="text-center py-12">
                <ChartLine size={48} className="mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Belum ada data statistik untuk period ini</p>
              </div>
            ) : (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
                  <div className="border rounded p-2">
                    <div className="text-[10px] text-muted-foreground mb-0.5">Uptime</div>
                    <div className="text-base font-bold text-success">{summary.totalUptime}%</div>
                  </div>
                  <div className="border rounded p-2">
                    <div className="text-[10px] text-muted-foreground mb-0.5">Response</div>
                    <div className="text-base font-bold">{summary.avgResponse}ms</div>
                  </div>
                  <div className="border rounded p-2">
                    <div className="text-[10px] text-muted-foreground mb-0.5">Checks</div>
                    <div className="text-base font-bold">{summary.totalChecks.toLocaleString()}</div>
                  </div>
                  <div className="border rounded p-2">
                    <div className="text-[10px] text-muted-foreground mb-0.5">Incidents</div>
                    <div className="text-base font-bold text-destructive">{summary.totalIncidents}</div>
                  </div>
                </div>

                {/* Charts */}
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview">Daily Overview</TabsTrigger>
                    <TabsTrigger value="hourly">Hourly Detail</TabsTrigger>
                    <TabsTrigger value="response">Response Time</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-3">
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold flex items-center gap-2">
                          <TrendUp size={18} />
                          30-Day Uptime Overview
                        </h4>
                        <span className="text-xs text-muted-foreground">Compact View</span>
                      </div>
                      <div className="space-y-1.5">
                        <UptimeBar domainId={domainId} days={30} compact={false} />
                        <p className="text-xs text-muted-foreground text-center">
                          Each bar represents 1 day • Hover for details
                        </p>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <TrendUp size={18} />
                        Uptime Trend ({period} Days)
                      </h4>
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis 
                            dataKey="date" 
                            className="text-xs"
                            tick={{ fill: 'hsl(var(--foreground))' }}
                          />
                          <YAxis 
                            domain={[0, 100]} 
                            className="text-xs"
                            tick={{ fill: 'hsl(var(--foreground))' }}
                          />
                          <RechartsTooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--popover))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '0.5rem',
                              padding: '8px 12px',
                              color: 'hsl(var(--popover-foreground))'
                            }}
                            labelStyle={{ 
                              color: 'hsl(var(--popover-foreground))',
                              fontWeight: 600,
                              marginBottom: '4px'
                            }}
                            itemStyle={{ 
                              color: 'hsl(var(--popover-foreground))' 
                            }}
                          />
                          <Legend 
                            wrapperStyle={{ 
                              color: 'hsl(var(--foreground))' 
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="uptime"
                            stroke="#22c55e"
                            strokeWidth={3}
                            dot={{ fill: '#22c55e', r: 4 }}
                            activeDot={{ r: 6 }}
                            name="Uptime %"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </TabsContent>

                  <TabsContent value="hourly" className="space-y-3">
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold flex items-center gap-2">
                          <Clock size={18} />
                          Hourly Breakdown (Last 7 Days)
                        </h4>
                        <Badge variant="secondary" className="text-xs">
                          {hourlyBars.length} hours monitored
                        </Badge>
                      </div>
                      {hourlyBars.length > 0 ? (
                        <>
                          <div className="flex gap-0.5 flex-wrap items-end min-h-10 mb-6">
                            {hourlyBars.map((bar, i) => (
                              <Tooltip key={i}>
                                <TooltipTrigger asChild>
                                  <div
                                    className={`w-1.5 h-8 rounded-sm transition-all cursor-pointer hover:brightness-125 ${
                                      bar.status === 'online'
                                        ? 'bg-success'
                                        : bar.status === 'partial'
                                        ? 'bg-warning'
                                        : 'bg-destructive'
                                    }`}
                                    title={`${bar.date} ${String(bar.hour).padStart(2, '0')}:00`}
                                  />
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-xs">
                                  <div className="space-y-0.5">
                                    <div className="font-semibold">
                                      {new Date(bar.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} • {String(bar.hour).padStart(2, '0')}:00
                                    </div>
                                    <div>
                                      {bar.successChecks}/{bar.checks} checks successful
                                    </div>
                                    <div className={bar.status === 'online' ? 'text-success' : bar.status === 'partial' ? 'text-warning' : 'text-destructive'}>
                                      {bar.status === 'online' ? '✅ All Online' : bar.status === 'partial' ? '⚠️ Partial' : '❌ All Failed'}
                                    </div>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground text-center px-2">
                            1 bar = 1 hour • <span className="text-success">Green</span> = 100%, <span className="text-warning">Yellow</span> = partial, <span className="text-destructive">Red</span> = failed
                          </p>
                        </>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Clock size={32} className="mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No hourly data available</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="response" className="space-y-3">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <Clock size={18} />
                        Response Time ({period} Days)
                      </h4>
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis 
                            dataKey="date" 
                            className="text-xs"
                            tick={{ fill: 'hsl(var(--foreground))' }}
                          />
                          <YAxis 
                            className="text-xs"
                            tick={{ fill: 'hsl(var(--foreground))' }}
                          />
                          <RechartsTooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--popover))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '0.5rem',
                              padding: '8px 12px',
                              color: 'hsl(var(--popover-foreground))'
                            }}
                            labelStyle={{ 
                              color: 'hsl(var(--popover-foreground))',
                              fontWeight: 600,
                              marginBottom: '4px'
                            }}
                            itemStyle={{ 
                              color: 'hsl(var(--popover-foreground))' 
                            }}
                          />
                          <Legend 
                            wrapperStyle={{ 
                              color: 'hsl(var(--foreground))' 
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="responseTime"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            activeDot={{ r: 6 }}
                            dot={{ fill: 'hsl(var(--primary))' }}
                            name="Response Time (ms)"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Incidents List */}
                {incidents.length > 0 && (
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <Warning size={18} weight="fill" className="text-destructive" />
                      Recent Incidents
                    </h4>
                    <div className="space-y-2">
                      {incidents.map((incident) => (
                        <div
                          key={incident.id}
                          className="flex items-start justify-between border-l-2 border-destructive pl-3 py-2"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="destructive" className="text-xs">
                                {incident.status === 'offline' ? 'Down' : 'DNS Only'}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {formatDate(incident.startTime)}
                              </span>
                            </div>
                            {incident.duration && (
                              <div className="text-xs text-muted-foreground">
                                Duration: {formatDuration(incident.duration)}
                              </div>
                            )}
                            {incident.error && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {incident.error}
                              </div>
                            )}
                          </div>
                          {incident.resolved && (
                            <CheckCircle size={16} weight="fill" className="text-success mt-1" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
