import { useState } from 'react'
import { Globe, X as XIcon, Clock } from '@phosphor-icons/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusIndicator } from './StatusIndicator'
import { UptimeBar } from './UptimeBar'
import { DomainStatisticsDialog } from './DomainStatisticsDialog'
import { Domain, DomainStatus } from '@/lib/types'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface PinnedDomainCardProps {
  domain: Domain
  status: DomainStatus
  onUnpin: (id: string) => void
}

export function PinnedDomainCard({ domain, status, onUnpin }: PinnedDomainCardProps) {
  const [showStats, setShowStats] = useState(false)

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

  return (
    <Card className="group hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <StatusIndicator status={status.status} />
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base font-mono truncate">
                {domain.url}
              </CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Badge 
                  variant="secondary" 
                  className="text-xs font-semibold"
                  style={{ backgroundColor: `${getStatusColor()}20`, color: getStatusColor() }}
                >
                  {getStatusText()}
                </Badge>
                {status.responseTime && (
                  <span className="text-xs text-muted-foreground">
                    {status.responseTime}ms
                  </span>
                )}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => window.open(`https://${domain.url}`, '_blank', 'noopener,noreferrer')}
                  className="h-8 w-8 text-muted-foreground hover:text-accent hover:bg-accent/10"
                >
                  <Globe size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Buka di tab baru</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onUnpin(domain.id)}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  <XIcon size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Unpin domain</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Last Check Info */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock size={14} />
          <span>Last checked: {formatLastChecked()}</span>
          {status.lastChecked && (
            <span className="text-muted-foreground/60">
              • {new Date(status.lastChecked).toLocaleString('id-ID', { 
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          )}
        </div>

        {/* Uptime Bar */}
        <div className="pt-2 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">90-day uptime • Daily view</span>
            <button
              onClick={() => setShowStats(true)}
              className="text-xs text-primary hover:underline"
            >
              View detailed →
            </button>
          </div>
          <UptimeBar domainId={domain.id} days={90} compact={false} />
        </div>

        {/* IP Address */}
        {status.ipAddress && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">IP:</span>
            <span className="font-mono text-accent">{status.ipAddress}</span>
          </div>
        )}

        {/* Error Message */}
        {status.error && (
          <div className="text-xs text-destructive bg-destructive/10 rounded p-2">
            {status.error}
          </div>
        )}
      </CardContent>

      {/* Statistics Dialog */}
      <DomainStatisticsDialog
        domainId={domain.id}
        domainUrl={domain.url}
        open={showStats}
        onOpenChange={setShowStats}
      />
    </Card>
  )
}
