import { useState } from 'react'
import { Globe, DotsThree, Trash, Clock, DownloadSimple, FilePdf } from '@phosphor-icons/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusIndicator } from './StatusIndicator'
import { UptimeBar } from './UptimeBar'
import { DomainStatisticsDialog } from './DomainStatisticsDialog'
import { Domain, DomainInsight, DomainStatus } from '@/lib/types'
import { ReportPeriodDays, generateMonitoringReportPdf } from '@/lib/monitoring-report-pdf'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface PinnedDomainCardProps {
  domain: Domain
  status: DomainStatus
  insight?: DomainInsight
  onUnpin?: (id: string) => void
}

const ResponseSparkline = ({ values }: { values: number[] }) => {
  if (!values || values.length < 2) return null

  const width = 72
  const height = 20
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width
      const y = height - ((value - min) / range) * height
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  )
}

export function PinnedDomainCard({ domain, status, insight, onUnpin }: PinnedDomainCardProps): JSX.Element {
  const [showStats, setShowStats] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [exportingPeriod, setExportingPeriod] = useState<ReportPeriodDays | null>(null)

  const handleUnpin = () => {
    if (!onUnpin) return
    setIsDeleting(true)
    onUnpin(domain.id)
  }

  const getStatusText = () => {
    if (status.status === 'online') return 'Online'
    if (status.status === 'offline') return 'Offline'
    if (status.status === 'dns-only') return 'DNS Only'
    return 'Checking...'
  }

  const getStatusColor = () => {
    if (status.status === 'online') return 'oklch(0.70 0.22 145)'
    if (status.status === 'dns-only') return 'rgb(245, 158, 11)'
    if (status.status === 'offline') return 'rgb(239, 68, 68)'
    return 'rgb(148, 163, 184)'
  }

  const formatLastChecked = () => {
    if (!status.lastChecked) return 'Never'
    const now = Date.now()
    const diff = now - status.lastChecked
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  const handleExportPdf = async (periodDays: ReportPeriodDays) => {
    if (exportingPeriod !== null) return

    try {
      setExportingPeriod(periodDays)
      const fileName = await generateMonitoringReportPdf({
        domainId: domain.id,
        domainUrl: domain.url,
        periodDays,
      })
      toast.success(`Laporan PDF berhasil diexport: ${fileName}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal mengekspor laporan PDF.'
      toast.error(message)
    } finally {
      setExportingPeriod(null)
    }
  }

  return (
    <Card className="group hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <StatusIndicator status={status.status} className="shrink-0" />
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm font-mono truncate leading-tight">
                {domain.url}
              </CardTitle>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge
                  variant="secondary"
                  className="text-[10px] h-4 px-1.5 font-semibold"
                  style={{ backgroundColor: `${getStatusColor()}20`, color: getStatusColor() }}
                >
                  {getStatusText()}
                </Badge>
                {status.responseTime && (
                  <span className="text-[10px] text-muted-foreground">
                    {status.responseTime}ms
                  </span>
                )}
                {status.ipAddress && (
                  <span className="text-[10px] font-mono text-muted-foreground/70">
                    {status.ipAddress}
                  </span>
                )}
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" aria-label={`Open actions for ${domain.url}`}>
                <DotsThree size={16} weight="bold" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => window.open(`https://${domain.url}`, '_blank', 'noopener,noreferrer')}>
                <Globe size={14} className="mr-2" />
                Buka di tab baru
              </DropdownMenuItem>

              <DropdownMenuSub>
                <DropdownMenuSubTrigger disabled={exportingPeriod !== null}>
                  <FilePdf size={14} className="mr-2" />
                  Export laporan PDF
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem
                    disabled={exportingPeriod !== null}
                    onClick={() => handleExportPdf(1)}
                  >
                    <DownloadSimple size={14} className="mr-2" />
                    1 hari
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={exportingPeriod !== null}
                    onClick={() => handleExportPdf(15)}
                  >
                    <DownloadSimple size={14} className="mr-2" />
                    15 hari
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={exportingPeriod !== null}
                    onClick={() => handleExportPdf(30)}
                  >
                    <DownloadSimple size={14} className="mr-2" />
                    30 hari
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              {onUnpin && (
                <DropdownMenuSeparator />
              )}
              {onUnpin && (
                <DropdownMenuItem
                  onClick={handleUnpin}
                  disabled={isDeleting}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash size={14} className="mr-2" />
                  Unpin domain
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-3 space-y-2">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground">90-day uptime</span>
            <button
              onClick={() => setShowStats(true)}
              className="text-primary hover:underline font-medium"
            >
              Details →
            </button>
          </div>
          <UptimeBar domainId={domain.id} days={90} compact={false} />
        </div>

        {status.lastChecked && (
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Clock size={12} />
            <span>{formatLastChecked()}</span>
            <span className="text-muted-foreground/50">
              • {new Date(status.lastChecked).toLocaleString('id-ID', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        )}

        {status.error && (
          <div className="text-[10px] text-destructive bg-destructive/10 rounded p-1.5 leading-tight">
            {status.error}
          </div>
        )}

        {insight && (
          <div className="flex items-center gap-1.5 mt-1 flex-wrap" aria-label="Pinned domain insights">
            {insight.uptime7d !== null && (
              <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-mono">7d {insight.uptime7d.toFixed(0)}%</Badge>
            )}
            {insight.uptime30d !== null && (
              <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-mono">30d {insight.uptime30d.toFixed(0)}%</Badge>
            )}
            {insight.responseTrend.length > 1 && (
              <div className="text-primary/80" title="Trend response time 7 hari" aria-label="Response time trend 7 days">
                <ResponseSparkline values={insight.responseTrend} />
              </div>
            )}
          </div>
        )}
      </CardContent>

      <DomainStatisticsDialog
        domainId={domain.id}
        domainUrl={domain.url}
        open={showStats}
        onOpenChange={setShowStats}
      />
    </Card>
  )
}
