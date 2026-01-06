import { useMemo } from 'react'
import { DomainHistory } from '@/lib/types'
import { getTimelineData, calculateUptimeStats } from '@/lib/uptime-tracker'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatDistanceToNow } from 'date-fns'
import { id } from 'date-fns/locale/id'

interface UptimeTimelineProps {
  history: DomainHistory
  timeRangeHours?: 24 | 48 | 168
  compact?: boolean
}

export function UptimeTimeline({ history, timeRangeHours = 48, compact = false }: UptimeTimelineProps) {
  const buckets = timeRangeHours === 24 ? 24 : timeRangeHours === 48 ? 48 : 168
  const timelineData = useMemo(
    () => getTimelineData(history, buckets),
    [history, buckets]
  )

  const stats = useMemo(
    () => calculateUptimeStats(history, timeRangeHours),
    [history, timeRangeHours]
  )

  const getStatusColor = (status: 'online' | 'offline' | 'dns-only' | 'unknown') => {
    switch (status) {
      case 'online':
        return 'oklch(0.70 0.22 145)'
      case 'dns-only':
        return 'rgb(245, 158, 11)'
      case 'offline':
        return 'oklch(0.60 0.25 25)'
      case 'unknown':
        return 'oklch(0.35 0.02 250)'
    }
  }

  const getStatusLabel = (status: 'online' | 'offline' | 'dns-only' | 'unknown') => {
    switch (status) {
      case 'online':
        return 'Online'
      case 'dns-only':
        return 'DNS Only'
      case 'offline':
        return 'Offline'
      case 'unknown':
        return 'Tidak Ada Data'
    }
  }

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex gap-0.5">
          {timelineData.map((data, index) => (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <div
                  className="w-1.5 h-4 rounded-sm transition-all hover:scale-110 cursor-pointer"
                  style={{ backgroundColor: getStatusColor(data.status) }}
                />
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                <div>
                  <p className="font-semibold">{getStatusLabel(data.status)}</p>
                  <p className="text-muted-foreground">{formatTimestamp(data.timestamp)}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
        <span className="text-xs font-semibold font-mono">
          {stats.uptimePercentage.toFixed(1)}%
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono" style={{ color: 'oklch(0.70 0.22 145)' }}>
              {stats.uptimePercentage.toFixed(2)}%
            </span>
            <span className="text-sm text-muted-foreground">Uptime</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{stats.totalChecks} checks</span>
            <span>•</span>
            <span className="text-success">{stats.onlineCount} online</span>
            {stats.dnsOnlyCount > 0 && (
              <>
                <span>•</span>
                <span style={{ color: 'rgb(245, 158, 11)' }}>{stats.dnsOnlyCount} DNS only</span>
              </>
            )}
            <span>•</span>
            <span className="text-destructive">{stats.offlineCount} offline</span>
          </div>
        </div>
        {stats.averageResponseTime && (
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Avg Response</div>
            <div className="text-lg font-semibold font-mono">
              {stats.averageResponseTime.toFixed(0)}ms
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex gap-0.5">
          {timelineData.map((data, index) => (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <div
                  className="flex-1 h-12 rounded transition-all hover:scale-105 cursor-pointer"
                  style={{ backgroundColor: getStatusColor(data.status) }}
                />
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                <div>
                  <p className="font-semibold">{getStatusLabel(data.status)}</p>
                  <p className="text-muted-foreground">{formatTimestamp(data.timestamp)}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{timeRangeHours === 168 ? '7 hari lalu' : `${timeRangeHours} jam lalu`}</span>
          <span>Sekarang</span>
        </div>
      </div>

      {(stats.lastOnlineAt || stats.lastOfflineAt) && (
        <div className="pt-2 border-t border-border space-y-1 text-xs">
          {stats.lastOnlineAt && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Terakhir Online:</span>
              <span className="font-medium">
                {formatDistanceToNow(stats.lastOnlineAt, { addSuffix: true, locale: id })}
              </span>
            </div>
          )}
          {stats.lastOfflineAt && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Terakhir Offline:</span>
              <span className="font-medium">
                {formatDistanceToNow(stats.lastOfflineAt, { addSuffix: true, locale: id })}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
