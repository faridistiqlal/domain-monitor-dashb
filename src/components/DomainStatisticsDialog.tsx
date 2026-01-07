import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts'
import { ChartLine, Clock, TrendUp, Warning, CheckCircle } from '@phosphor-icons/react'
import { Skeleton } from '@/components/ui/skeleton'
import { getFirestore, collection, query, where, orderBy, getDocs } from 'firebase/firestore'
import { DomainDailyStats, DomainIncident } from '@/lib/types'

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
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const startDateStr = startDate.toISOString().split('T')[0]
      const endDateStr = endDate.toISOString().split('T')[0]

      // Load daily stats
      const statsQuery = query(
        collection(db, 'domain-stats-daily'),
        where('domainId', '==', domainId),
        where('date', '>=', startDateStr),
        where('date', '<=', endDateStr),
        orderBy('date', 'asc')
      )

      const statsSnapshot = await getDocs(statsQuery)
      const loadedStats = statsSnapshot.docs.map(doc => doc.data() as DomainDailyStats)
      setStats(loadedStats)

      // Load incidents
      const incidentsQuery = query(
        collection(db, 'domain-incidents'),
        where('domainId', '==', domainId),
        where('startTime', '>=', startDate.getTime()),
        orderBy('startTime', 'desc')
      )

      const incidentsSnapshot = await getDocs(incidentsQuery)
      const loadedIncidents = incidentsSnapshot.docs.map(doc => doc.data() as DomainIncident)
      setIncidents(loadedIncidents)

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-2">
            <ChartLine size={24} weight="duotone" className="text-primary" />
            <DialogTitle className="text-2xl font-bold">Statistics</DialogTitle>
          </div>
          <DialogDescription className="font-mono text-sm">
            {domainUrl}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(85vh-100px)]">
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
              <div className="space-y-4">
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="border rounded-lg p-4">
                    <div className="text-sm text-muted-foreground mb-1">Total Uptime</div>
                    <div className="text-2xl font-bold text-success">{summary.totalUptime}%</div>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="text-sm text-muted-foreground mb-1">Avg Response</div>
                    <div className="text-2xl font-bold">{summary.avgResponse}ms</div>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="text-sm text-muted-foreground mb-1">Total Checks</div>
                    <div className="text-2xl font-bold">{summary.totalChecks.toLocaleString()}</div>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="text-sm text-muted-foreground mb-1">Incidents</div>
                    <div className="text-2xl font-bold text-destructive">{summary.totalIncidents}</div>
                  </div>
                </div>

                {/* Charts */}
                <Tabs defaultValue="uptime" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="uptime">Uptime Trend</TabsTrigger>
                    <TabsTrigger value="response">Response Time</TabsTrigger>
                  </TabsList>

                  <TabsContent value="uptime" className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <TrendUp size={18} />
                        Uptime Percentage
                      </h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis domain={[0, 100]} />
                          <RechartsTooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="uptime"
                            stroke="hsl(var(--success))"
                            strokeWidth={2}
                            dot={{ fill: 'hsl(var(--success))' }}
                            name="Uptime %"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </TabsContent>

                  <TabsContent value="response" className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <Clock size={18} />
                        Response Time (ms)
                      </h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <RechartsTooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="responseTime"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
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
