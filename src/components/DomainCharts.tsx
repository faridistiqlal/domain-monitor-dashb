import { useState, useEffect } from 'react'
import { TrendUp, ChartLine, Clock } from '@phosphor-icons/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { getDomainStats, getDomainIncidents } from '@/lib/check-history'
import { Domain, DomainDailyStats, DomainIncident } from '@/lib/types'

interface DomainChartsProps {
  selectedDomain: Domain
  onClose: () => void
}

export function DomainCharts({ selectedDomain, onClose }: DomainChartsProps) {
  const [stats, setStats] = useState<DomainDailyStats[]>([])
  const [incidents, setIncidents] = useState<DomainIncident[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [days, setDays] = useState<7 | 30>(7)

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const [statsData, incidentsData] = await Promise.all([
          getDomainStats(selectedDomain.id, days),
          getDomainIncidents(selectedDomain.id, days)
        ])
        setStats(statsData.reverse()) // Oldest first for chart
        setIncidents(incidentsData)
      } catch (error) {
        console.error('Error loading domain charts:', error)
      } finally {
        setIsLoading(false)
      }
    }
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

  // Calculate summary stats
  const totalChecks = stats.reduce((sum, s) => sum + s.totalChecks, 0)
  const totalSuccess = stats.reduce((sum, s) => sum + s.successChecks, 0)
  const avgUptime = totalChecks > 0 ? ((totalSuccess / totalChecks) * 100).toFixed(2) : '0'
  const avgResponseTime = stats.length > 0
    ? Math.round(stats.reduce((sum, s) => sum + (s.avgResponseTime || 0), 0) / stats.filter(s => s.avgResponseTime).length)
    : 0

  // Find max values for chart scaling
  const maxChecks = Math.max(...stats.map(s => s.totalChecks), 1)
  const maxResponseTime = Math.max(...stats.map(s => s.avgResponseTime || 0), 1)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Statistik Domain</h3>
          <p className="text-sm text-muted-foreground font-mono">{selectedDomain.url}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 border rounded-lg p-1">
            <button
              onClick={() => setDays(7)}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                days === 7
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              7 Hari
            </button>
            <button
              onClick={() => setDays(30)}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                days === 30
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              30 Hari
            </button>
          </div>
          <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground">
            Tutup
          </button>
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
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground">Uptime</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">{avgUptime}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {totalSuccess} / {totalChecks} checks
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground">Avg Response</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {avgResponseTime > 0 ? `${avgResponseTime}ms` : '-'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Last {days} days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground">Total Checks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{totalChecks}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  ~{Math.round(totalChecks / stats.length)} per day
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground">Incidents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{incidents.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {incidents.filter(i => i.resolved).length} resolved
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Uptime Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <TrendUp size={20} />
                Daily Uptime
              </CardTitle>
              <CardDescription>Persentase uptime per hari</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.map((stat) => {
                  const uptime = stat.totalChecks > 0
                    ? ((stat.successChecks / stat.totalChecks) * 100).toFixed(1)
                    : '0'
                  const date = new Date(stat.date)
                  const formattedDate = date.toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                  })

                  return (
                    <div key={stat.id} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground font-mono text-xs">
                          {formattedDate}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">
                            {stat.successChecks}/{stat.totalChecks}
                          </span>
                          <Badge
                            variant={parseFloat(uptime) >= 95 ? 'default' : 'destructive'}
                            className="w-14 justify-center"
                          >
                            {uptime}%
                          </Badge>
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full transition-all duration-300"
                          style={{
                            width: `${uptime}%`,
                            backgroundColor:
                              parseFloat(uptime) >= 95
                                ? 'oklch(0.70 0.22 145)'
                                : parseFloat(uptime) >= 80
                                ? 'rgb(245, 158, 11)'
                                : 'oklch(0.60 0.25 25)',
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Response Time Chart */}
          {stats.some((s) => s.avgResponseTime) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Clock size={20} />
                  Response Time Trend
                </CardTitle>
                <CardDescription>Average response time per hari</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats
                    .filter((s) => s.avgResponseTime)
                    .map((stat) => {
                      const avgRT = Math.round(stat.avgResponseTime || 0)
                      const barWidth = (avgRT / maxResponseTime) * 100
                      const date = new Date(stat.date)
                      const formattedDate = date.toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                      })

                      return (
                        <div key={stat.id} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground font-mono text-xs">
                              {formattedDate}
                            </span>
                            <div className="flex items-center gap-3">
                              {stat.minResponseTime && stat.maxResponseTime && (
                                <span className="text-xs text-muted-foreground">
                                  {stat.minResponseTime}-{stat.maxResponseTime}ms
                                </span>
                              )}
                              <Badge variant="outline" className="w-20 justify-center font-mono">
                                {avgRT}ms
                              </Badge>
                            </div>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full transition-all duration-300"
                              style={{
                                width: `${Math.min(barWidth, 100)}%`,
                                backgroundColor:
                                  avgRT < 500
                                    ? 'oklch(0.70 0.22 145)'
                                    : avgRT < 2000
                                    ? 'rgb(245, 158, 11)'
                                    : 'oklch(0.60 0.25 25)',
                              }}
                            />
                          </div>
                        </div>
                      )
                    })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Incidents Timeline */}
          {incidents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <ChartLine size={20} />
                  Incident History
                </CardTitle>
                <CardDescription>Riwayat downtime dan recovery</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] pr-3">
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
