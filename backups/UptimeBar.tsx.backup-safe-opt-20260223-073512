import { useState, useEffect } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { DomainDailyStats } from '@/lib/types'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface UptimeBarProps {
  domainId: string
  days?: number // Default: 90 days
  compact?: boolean // Compact mode for inline display
}

export function UptimeBar({ domainId, days = 90, compact = false }: UptimeBarProps) {
  const [stats, setStats] = useState<DomainDailyStats[]>([])
  const [loading, setLoading] = useState(true)
  const [overallUptime, setOverallUptime] = useState<number>(0)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    setRetryCount(0)
  }, [domainId, days])

  useEffect(() => {
    let isCancelled = false

    async function loadStats() {
      try {
        setLoading(true)
        const statsRef = collection(db, 'domain-stats-daily')
        
        // Query without orderBy to avoid composite index requirement
        // We'll sort in memory after fetching
        const q = query(
          statsRef,
          where('domainId', '==', domainId)
        )
        
        const snapshot = await getDocs(q)
        const data = snapshot.docs.map(doc => doc.data() as DomainDailyStats)
        
        // Sort by date descending and take last N days
        const sortedData = data
          .sort((a, b) => b.date.localeCompare(a.date))
          .slice(0, days)
          .reverse() // Reverse to get chronological order (oldest first)
        
        // Calculate overall uptime
        const totalChecks = sortedData.reduce((sum, stat) => sum + (stat.totalChecks || 0), 0)
        const successChecks = sortedData.reduce((sum, stat) => sum + (stat.successChecks || 0), 0)
        const uptime = totalChecks > 0 ? (successChecks / totalChecks) * 100 : 0
        
        if (isCancelled) return

        setStats(sortedData)
        setOverallUptime(uptime)
      } catch (error) {
        console.error('[UptimeBar] Error loading stats:', error)

        const code = (error as { code?: string } | undefined)?.code
        if (!isCancelled && code === 'permission-denied' && retryCount < 5) {
          const delayMs = 800 + (retryCount * 400)
          window.setTimeout(() => {
            if (!isCancelled) {
              setRetryCount(prev => prev + 1)
            }
          }, delayMs)
        }
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    loadStats()

    return () => {
      isCancelled = true
    }
  }, [domainId, days, retryCount])

  if (loading) {
    return (
      <div className={compact ? "flex gap-0.5 items-center" : "flex flex-col gap-1.5"}>
        <div className={`flex gap-0.5 ${compact ? 'h-3' : 'h-8'} items-end`}>
          {Array.from({ length: Math.min(days, 90) }).map((_, i) => (
            <div
              key={i}
              className="w-0.5 bg-muted/30 rounded-sm animate-pulse"
              style={{ height: compact ? '12px' : '16px' }}
            />
          ))}
        </div>
        {!compact && (
          <div className="text-xs text-muted-foreground">
            Loading uptime data...
          </div>
        )}
      </div>
    )
  }

  // Fill missing days with empty data
  const filledStats: Array<DomainDailyStats | null> = []
  const daysToShow = Math.min(days, 90)
  
  // Get date range
  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - daysToShow + 1)
  
  // Create map of existing stats
  const statsMap = new Map(stats.map(s => [s.date, s]))
  
  // Fill array with stats or null for missing days
  for (let i = 0; i < daysToShow; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    const dateStr = date.toISOString().split('T')[0]
    filledStats.push(statsMap.get(dateStr) || null)
  }

  const getBarColor = (uptime: number | undefined) => {
    if (uptime === undefined || uptime === null) return 'bg-gray-700' // Dark gray untuk no data
    if (uptime >= 95) return 'bg-success' // Green
    if (uptime >= 80) return 'bg-yellow-500' // Yellow
    if (uptime >= 50) return 'bg-amber-500' // Orange
    if (uptime >= 0) return 'bg-destructive' // Red (includes 0%)
    return 'bg-gray-700' // Dark gray (should not reach here)
  }

  const getBarHeight = (uptime: number | undefined, isCompact: boolean) => {
    if (uptime === undefined || uptime === null) return isCompact ? 3 : 4
    const maxHeight = isCompact ? 12 : 32
    const minHeight = isCompact ? 4 : 6 // Increased min height untuk visibility
    // For 0% uptime, use minimum height to ensure visibility
    if (uptime === 0) return minHeight
    return Math.max(minHeight, (uptime / 100) * maxHeight)
  }

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return 'No data'
    const date = new Date(dateStr)
    return date.toLocaleDateString('id-ID', { 
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <div className={compact ? "flex gap-1 items-center" : "flex flex-col gap-1.5"}>
      <div className={`flex gap-0.5 ${compact ? 'h-3' : 'h-8'} items-end w-full`}>
        {filledStats.map((stat, index) => {
          const uptime = stat?.uptimePercent
          const barColor = getBarColor(uptime)
          const barHeight = getBarHeight(uptime, compact)
          
          return (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <div
                  className={`flex-1 ${barColor} rounded-sm transition-all cursor-pointer
                             hover:brightness-125 hover:scale-y-110`}
                  style={{ height: `${barHeight}px` }}
                />
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs bg-popover text-popover-foreground border border-border shadow-lg p-0">
                {stat ? (
                  <div className="px-3 py-2 space-y-1 min-w-[140px]">
                    <div className="font-semibold text-foreground text-[13px] border-b border-border pb-1 mb-1">
                      {formatDate(stat.date)}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <span className="text-foreground">{uptime?.toFixed(1)}% uptime</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <span className="inline-block w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                      <span>{stat.successChecks}/{stat.totalChecks} checks OK</span>
                    </div>
                    {stat.avgResponseTime && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <span className="inline-block w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                        <span>Avg: {Math.round(stat.avgResponseTime)}ms</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>No data available</div>
                )}
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>
      {!compact && (
        <div className="text-xs text-muted-foreground">
          {stats.length > 0 ? (
            <span>
              <span className="font-semibold text-foreground">{overallUptime.toFixed(1)}%</span> uptime
              <span className="text-muted-foreground/60"> • {stats.length} day{stats.length !== 1 ? 's' : ''} of data</span>
            </span>
          ) : (
            <span className="text-muted-foreground/60">No uptime data yet • monitoring in progress</span>
          )}
        </div>
      )}
    </div>
  )
}
