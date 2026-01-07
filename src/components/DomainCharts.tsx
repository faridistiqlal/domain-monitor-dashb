import { useState, useEffect } from 'react'
import { TrendUp, ChartLine, Clock, ArrowLeft, ArrowClockwise } from '@phosphor-icons/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { getDomainStats, getDomainIncidents } from '@/lib/check-history'
import { Domain, DomainDailyStats, DomainIncident, DomainStatus } from '@/lib/types'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'

interface DomainChartsProps {
  selectedDomain: Domain
  onClose: () => void
  currentStatus?: DomainStatus
}

export function DomainCharts({ selectedDomain, onClose, currentStatus }: DomainChartsProps) {
  const [stats, setStats] = useState<DomainDailyStats[]>([])
  const [incidents, setIncidents] = useState<DomainIncident[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [days, setDays] = useState<7 | 30>(7)

  const loadData = async () => {
    const refreshing = !isLoading
    if (refreshing) setIsRefreshing(true)
    else setIsLoading(true)
    
    setError(null)
    try {
      const [statsData, incidentsData] = await Promise.all([
        getDomainStats(selectedDomain.id, days),
        getDomainIncidents(selectedDomain.id, days)
      ])
      setStats(statsData.reverse()) // Oldest first for chart
      setIncidents(incidentsData)
    } catch (error: any) {
      console.error('Error loading domain charts:', error)
      // Check if it's a quota error
      if (error?.code === 'resource-exhausted' || error?.message?.includes('Quota exceeded')) {
        setError('Firebase quota habis untuk hari ini. Data analytics akan tersedia kembali besok (UTC 00:00). Gunakan tab "Statistik Real-time" untuk monitoring manual.')
      } else {
        setError('Gagal memuat data. Silakan coba lagi nanti.')
      }
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedDomain.id, days])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Statistik Domain</h3>
            <p className="text-sm text-muted-foreground font-mono">{selectedDomain.url}</p>
          </div>
          <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground">
            Tutup
          </button>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  // Show error state if quota exceeded or other error
  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Statistik Domain</h3>
            <p className="text-sm text-muted-foreground font-mono">{selectedDomain.url}</p>
          </div>
          <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground">
            Tutup
          </button>
        </div>
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-3 text-center py-8">
              <div className="text-4xl">⚠️</div>
              <div className="space-y-2">
                <h4 className="font-semibold text-yellow-600 dark:text-yellow-500">Firebase Quota Exceeded</h4>
                <p className="text-sm text-muted-foreground max-w-md">
                  {error}
                </p>
              </div>
              <button
                onClick={() => {
                  setError(null)
                  setIsLoading(true)
                }}
                className="mt-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Coba Lagi
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Calculate summary stats
  const totalChecks = stats.reduce((sum, s) => sum + s.totalChecks, 0)
  const totalSuccess = stats.reduce((sum, s) => sum + s.successChecks, 0)
  const avgUptime = totalChecks > 0 ? ((totalSuccess / totalChecks) * 100).toFixed(2) : '0'
  const avgResponseTime = stats.length > 0
    ? Math.round(stats.reduce((sum, s) => sum + (s.avgResponseTime || 0), 0) / stats.filter(s => s.avgResponseTime).length)
    : 0

  // Get 24h stats
  const last24h = stats.slice(-1)[0] // Today's stats
  const uptime24h = last24h && last24h.totalChecks > 0
    ? ((last24h.successChecks / last24h.totalChecks) * 100).toFixed(1)
    : '0'

  // Create uptime bars data (last 90 checks from hourly data)
  const uptimeBars = stats.slice(-4).flatMap(stat => 
    stat.hourly
      .filter(h => h.checks > 0)
      .map(h => ({
        status: h.successChecks === h.checks ? 'online' : h.successChecks > 0 ? 'partial' : 'offline',
        checks: h.checks,
        successChecks: h.successChecks
      }))
  ).slice(-90) // Last 90 hourly checks

  // Find max values for chart scaling
  const maxChecks = Math.max(...stats.map(s => s.totalChecks), 1)
  const maxResponseTime = Math.max(...stats.map(s => s.avgResponseTime || 0), 1)

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg hover:bg-accent transition-colors"
            title="Kembali"
          >
            <ArrowLeft size={20} className="text-muted-foreground" />
          </button>
          <div>
            <h3 className="text-base font-semibold">Statistik Domain</h3>
            <p className="text-xs text-muted-foreground font-mono">{selectedDomain.url}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => loadData()}
            disabled={isRefreshing}
            variant="ghost"
            size="sm"
            className="h-8 px-2"
          >
            <ArrowClockwise 
              size={16} 
              className={isRefreshing ? 'animate-spin' : ''} 
            />
          </Button>
          <div className="flex gap-1 border rounded p-0.5">
            <button
              onClick={() => setDays(7)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                days === 7
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              7 Hari
            </button>
            <button
              onClick={() => setDays(30)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                days === 30
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              30 Hari
            </button>
          </div>
        </div>
      </div>

      {stats.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <ChartLine size={48} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm">Belum ada data untuk periode ini</p>
              <p className="text-xs mt-1">Data akan tersedia setelah beberapa check dilakukan</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Uptime Bars - Like Uptime Kuma */}
          {uptimeBars.length > 0 && (
            <Card>
              <CardContent className="p-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      Check every {last24h ? `${Math.round(24 * 60 / (last24h.totalChecks / last24h.hourly.filter(h => h.checks > 0).length))}` : '60'} minutes
                    </div>
                    <Badge 
                      variant={currentStatus?.status === 'online' ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {currentStatus?.status === 'online' ? 'Up' : currentStatus?.status === 'offline' ? 'Down' : 'Unknown'}
                    </Badge>
                  </div>
                  <div className="flex gap-0.5 flex-wrap">
                    {uptimeBars.map((bar, i) => (
                      <div
                        key={i}
                        className={`w-1.5 h-8 rounded-sm transition-all ${
                          bar.status === 'online'
                            ? 'bg-success hover:opacity-80'
                            : bar.status === 'partial'
                            ? 'bg-warning hover:opacity-80'
                            : 'bg-destructive hover:opacity-80'
                        }`}
                        title={`${bar.successChecks}/${bar.checks} checks successful`}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <Card>
              <CardContent className="p-3">
                <div className="text-xs text-muted-foreground mb-1">Response</div>
                <div className="text-2xl font-bold text-foreground leading-tight">
                  {currentStatus?.responseTime ? `${currentStatus.responseTime}ms` : '-'}
                </div>
                <div className="text-xs text-muted-foreground">(Current)</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3">
                <div className="text-xs text-muted-foreground mb-1">Avg. Response</div>
                <div className="text-2xl font-bold text-foreground leading-tight">
                  {last24h?.avgResponseTime ? `${Math.round(last24h.avgResponseTime)}ms` : '-'}
                </div>
                <div className="text-xs text-muted-foreground">(24-hour)</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3">
                <div className="text-xs text-muted-foreground mb-1">Uptime</div>
                <div className="text-2xl font-bold text-success leading-tight">{uptime24h}%</div>
                <div className="text-xs text-muted-foreground">(24-hour)</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3">
                <div className="text-xs text-muted-foreground mb-1">Uptime</div>
                <div className="text-2xl font-bold text-success leading-tight">{avgUptime}%</div>
                <div className="text-xs text-muted-foreground">({days}-day)</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3">
                <div className="text-xs text-muted-foreground mb-1">Incidents</div>
                <div className="text-2xl font-bold text-destructive leading-tight">{incidents.length}</div>
                <div className="text-xs text-muted-foreground">
                  {incidents.filter(i => i.resolved).length} resolved
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Grid - Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Uptime Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-1">
                  <TrendUp size={16} />
                  Daily Uptime
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={stats.map((stat) => ({
                    date: new Date(stat.date).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                    }),
                    uptime: stat.totalChecks > 0
                      ? parseFloat(((stat.successChecks / stat.totalChecks) * 100).toFixed(1))
                      : 0,
                    checks: stat.totalChecks,
                    success: stat.successChecks,
                  }))}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === 'uptime') return [`${value.toFixed(1)}%`, 'Uptime']
                      return [value, name]
                    }}
                  />
                  <Bar
                    dataKey="uptime"
                    fill="oklch(0.70 0.22 145)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

            {/* Response Time Chart */}
            {stats.some((s) => s.avgResponseTime) && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-1">
                    <Clock size={16} />
                    Response Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                  <LineChart
                    data={stats
                      .filter((s) => s.avgResponseTime)
                      .map((stat) => ({
                        date: new Date(stat.date).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                        }),
                        avg: Math.round(stat.avgResponseTime || 0),
                        min: stat.minResponseTime || 0,
                        max: stat.maxResponseTime || 0,
                      }))}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      label={{ value: 'ms', angle: -90, position: 'insideLeft', fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      formatter={(value: number) => [`${value}ms`, '']}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Line
                      type="monotone"
                      dataKey="avg"
                      stroke="oklch(0.70 0.22 145)"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      name="Average"
                    />
                    <Line
                      type="monotone"
                      dataKey="min"
                      stroke="oklch(0.75 0.15 200)"
                      strokeWidth={1}
                      strokeDasharray="3 3"
                      dot={false}
                      name="Min"
                    />
                    <Line
                      type="monotone"
                      dataKey="max"
                      stroke="rgb(245, 158, 11)"
                      strokeWidth={1}
                      strokeDasharray="3 3"
                      dot={false}
                      name="Max"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            )}
          </div>

          {/* Incidents Timeline */}
          {incidents.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-1">
                  <ChartLine size={16} />
                  Incident History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[160px] pr-3">
                  <div className="space-y-3">
                    {incidents.map((incident) => {
                      const startTime = new Date(incident.startTime)
                      const endTime = incident.endTime ? new Date(incident.endTime) : null
                      const duration = incident.duration
                        ? incident.duration < 60
                          ? `${incident.duration}s`
                          : incident.duration < 3600
                          ? `${Math.round(incident.duration / 60)}m`
                          : `${(incident.duration / 3600).toFixed(1)}h`
                        : 'Ongoing'

                      return (
                        <div
                          key={incident.id}
                          className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                        >
                          <div
                            className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                              incident.resolved ? 'bg-success' : 'bg-destructive animate-pulse'
                            }`}
                          />
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <Badge
                                variant={incident.status === 'offline' ? 'destructive' : 'secondary'}
                              >
                                {incident.status === 'offline' ? 'Offline' : 'DNS Only'}
                              </Badge>
                              <span className="text-xs text-muted-foreground">{duration}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              <div>
                                Start: {startTime.toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                              </div>
                              {endTime && (
                                <div>
                                  End: {endTime.toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                                </div>
                              )}
                            </div>
                            {incident.error && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Error: {incident.error}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
