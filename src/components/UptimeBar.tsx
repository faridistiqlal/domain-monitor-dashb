import { useState, useEffect } from 'react'
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
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
}

export function UptimeBar({ domainId, days = 90 }: UptimeBarProps) {
  const [stats, setStats] = useState<DomainDailyStats[]>([])
  const [loading, setLoading] = useState(true)
  const [overallUptime, setOverallUptime] = useState<number>(0)

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true)
        const statsRef = collection(db, 'domain-stats-daily')
        
        // Get last N days of stats for this domain
        const q = query(
          statsRef,
          where('domainId', '==', domainId),
          orderBy('date', 'desc'),
          limit(days)
        )
        
        const snapshot = await getDocs(q)
        const data = snapshot.docs.map(doc => doc.data() as DomainDailyStats)
        
        // Reverse to get chronological order (oldest first)
        const sortedData = data.reverse()
        
        // Calculate overall uptime
        const totalChecks = sortedData.reduce((sum, stat) => sum + (stat.totalChecks || 0), 0)
        const successChecks = sortedData.reduce((sum, stat) => sum + (stat.successChecks || 0), 0)
        const uptime = totalChecks > 0 ? (successChecks / totalChecks) * 100 : 0
        
        setStats(sortedData)
        setOverallUptime(uptime)
      } catch (error) {
        console.error('[UptimeBar] Error loading stats:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [domainId, days])

  if (loading) {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex gap-0.5 h-8 items-end">
          {Array.from({ length: Math.min(days, 90) }).map((_, i) => (
            <div
              key={i}
              className="w-1 bg-muted/30 rounded-sm animate-pulse"
              style={{ height: '16px' }}
            />
          ))}
        </div>
        <div className="text-xs text-muted-foreground">
          Loading uptime data...
        </div>
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
    if (uptime === undefined || uptime === null) return 'bg-muted/20'
    if (uptime >= 95) return 'bg-success' // Green
    if (uptime >= 80) return 'bg-yellow-500' // Yellow
    if (uptime >= 50) return 'bg-amber-500' // Orange
    if (uptime > 0) return 'bg-destructive' // Red
    return 'bg-muted/20' // Gray (no data)
  }

  const getBarHeight = (uptime: number | undefined) => {
    if (uptime === undefined || uptime === null) return 4
    return Math.max(4, (uptime / 100) * 32) // 4px min, 32px max
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
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-0.5 h-8 items-end">
        {filledStats.map((stat, index) => {
          const uptime = stat?.uptimePercent
          const barColor = getBarColor(uptime)
          const barHeight = getBarHeight(uptime)
          
          return (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <div
                  className={`w-1 ${barColor} rounded-sm transition-all cursor-pointer
                             hover:brightness-125 hover:scale-y-110`}
                  style={{ height: `${barHeight}px` }}
                />
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {stat ? (
                  <div className="space-y-0.5">
                    <div className="font-semibold">{formatDate(stat.date)}</div>
                    <div className="text-success">✅ {uptime?.toFixed(1)}% uptime</div>
                    <div className="text-muted-foreground">
                      {stat.successChecks}/{stat.totalChecks} checks OK
                    </div>
                    {stat.avgResponseTime && (
                      <div className="text-muted-foreground">
                        ⏱️ Avg: {Math.round(stat.avgResponseTime)}ms
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
      <div className="text-xs text-muted-foreground">
        {overallUptime > 0 ? (
          <span>
            <span className="font-semibold text-foreground">{overallUptime.toFixed(1)}%</span> uptime 
            <span className="text-muted-foreground/60"> (last {stats.length} days)</span>
          </span>
        ) : (
          <span className="text-muted-foreground/60">No uptime data available</span>
        )}
      </div>
    </div>
  )
}
