import { useEffect, useState } from 'react'
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Clock, CheckCircle, XCircle, Warning, ChartLine, Pause } from '@phosphor-icons/react'
import { formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

interface GitHubActionsLog {
  id: string
  timestamp: Date
  batch: number
  totalDomains: number
  domainsChecked: number
  results: {
    online: number
    dnsOnly: number
    offline: number
  }
  status: 'success' | 'error'
  error?: string
}

interface UsageData {
  usedSoFar: number
  projected: number
  quota: number
  percentage: number
  resetDate?: string
  isManual?: boolean
}

export function GitHubActionsStatusCard() {
  const [lastRun, setLastRun] = useState<GitHubActionsLog | null>(null)
  const [recentRuns, setRecentRuns] = useState<GitHubActionsLog[]>([])
  const [loading, setLoading] = useState(true)
  const [nextRunIn, setNextRunIn] = useState<string>('')
  
  // Auto-calculate usage based on date
  const calculateUsage = (): UsageData => {
    const now = new Date()
    const month = now.getMonth() // 0 = Jan, 1 = Feb, etc
    const dayOfMonth = now.getDate()
    const runsPerDay = 24 // Every 1 hour
    const estimatedMinutesPerRun = 2.4 // Based on measured actual runtime
    const estimatedDailyUsage = runsPerDay * estimatedMinutesPerRun // 57.6 minutes/day
    
    // January 2026: Quota exhausted (cron disabled mid-month)
    if (month === 0) {
      return {
        usedSoFar: 2000,
        projected: 2000,
        quota: 2000,
        percentage: 100,
        resetDate: 'Feb 1, 2026',
        isManual: false
      }
    }
    
    // February onwards: Calculate from daily usage
    const usedSoFar = dayOfMonth * estimatedDailyUsage
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const projectedMonthly = daysInMonth * estimatedDailyUsage
    
    return {
      usedSoFar: Math.round(usedSoFar),
      projected: Math.round(Math.min(projectedMonthly, 2000)), // Cap at quota
      quota: 2000,
      percentage: Math.round((usedSoFar / 2000) * 100),
      isManual: false
    }
  }
  
  const usage = calculateUsage()
  // Cron runs every 1 hour, so consider disabled if > 90 minutes without run (1.5x interval)
  const isCronDisabled = !lastRun || (Date.now() - lastRun.timestamp.getTime()) > 90 * 60 * 1000

  useEffect(() => {
    const logsRef = collection(db, 'github-actions-logs')
    const q = query(logsRef, orderBy('timestamp', 'desc'), limit(10))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      })) as GitHubActionsLog[]

      setRecentRuns(logs)
      setLastRun(logs[0] || null)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Calculate next run countdown
  useEffect(() => {
    if (!lastRun?.timestamp) return

    const updateCountdown = () => {
      const now = Date.now()
      const lastRunTime = lastRun.timestamp.getTime()
      const nextRunTime = lastRunTime + (60 * 60 * 1000) // 1 hour
      const timeLeft = nextRunTime - now

      if (timeLeft <= 0) {
        setNextRunIn('Running now...')
      } else {
        const minutes = Math.floor(timeLeft / 60000)
        const seconds = Math.floor((timeLeft % 60000) / 1000)
        setNextRunIn(`${minutes}m ${seconds}s`)
      }
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [lastRun])

  const getStatusColor = () => {
    if (!lastRun) return 'bg-gray-500'
    
    const minutesSinceLastRun = lastRun.timestamp 
      ? (Date.now() - lastRun.timestamp.getTime()) / 1000 / 60 
      : 999
    
    if (lastRun.status === 'error') return 'bg-red-500'
    if (minutesSinceLastRun > 90) return 'bg-yellow-500' // Should run every 60 min
    return 'bg-green-500'
  }

  const getStatusText = () => {
    if (!lastRun) return 'No runs detected'
    
    const minutesSinceLastRun = lastRun.timestamp 
      ? (Date.now() - lastRun.timestamp.getTime()) / 1000 / 60 
      : 999
    
    if (lastRun.status === 'error') return 'Last run failed'
    if (minutesSinceLastRun > 90) return 'Delayed (>90 min)'
    return 'Running normally'
  }

  const getStatusIcon = () => {
    if (!lastRun) return <Warning className="w-5 h-5" />
    
    const minutesSinceLastRun = lastRun.timestamp 
      ? (Date.now() - lastRun.timestamp.getTime()) / 1000 / 60 
      : 999
    
    if (lastRun.status === 'error') return <XCircle className="w-5 h-5" />
    if (minutesSinceLastRun > 90) return <Warning className="w-5 h-5" />
    return <CheckCircle className="w-5 h-5" />
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChartLine className="w-5 h-5" />
            GitHub Actions Status
          </CardTitle>
          <CardDescription>24/7 Background Monitoring</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ChartLine className="w-5 h-5" />
          GitHub Actions Status
        </CardTitle>
        <CardDescription>24/7 Background Monitoring (Every 1 hour • Batch rotation)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cron Disabled Warning + Usage Tracker - Compact 2 Column */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Left: Cron Status */}
          {isCronDisabled && (
            <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800/50 rounded-lg p-3">
              <div className="flex gap-2">
                <Pause className="h-4 w-4 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <div className="font-semibold text-yellow-800 dark:text-yellow-400">
                    No Recent Activity
                  </div>
                  <div className="text-yellow-700 dark:text-yellow-500/90">
                    No runs detected in last 90 minutes. Check GitHub Actions status.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Right: Usage Tracker */}
          <div className="bg-muted/50 dark:bg-muted/30 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-foreground/80 font-medium">Monthly Usage</span>
              <a 
                href="https://github.com/settings/billing" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Actual →
              </a>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all ${
                    usage.percentage > 100 ? 'bg-red-500' : 
                    usage.percentage > 80 ? 'bg-yellow-500' : 
                    'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(usage.percentage, 100)}%` }}
                />
              </div>
              <span className="text-xs font-bold min-w-[45px] text-right text-foreground">
                {usage.percentage}%
              </span>
            </div>
            <div className="text-xs text-muted-foreground space-y-0.5">
              <div>
                {usage.usedSoFar}/{usage.quota} min • Est: {usage.projected} min
              </div>
              {usage.resetDate && (
                <div className="text-[10px] text-muted-foreground/70">
                  Auto-calculated • Resets {usage.resetDate || 'monthly'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${getStatusColor()} ${isCronDisabled ? '' : 'animate-pulse'}`} />
          <div className="flex items-center gap-2 flex-1">
            {getStatusIcon()}
            <span className="font-medium">{getStatusText()}</span>
          </div>
        </div>

        {/* Last Run Info */}
        {lastRun && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              Last run: {formatDistanceToNow(lastRun.timestamp, { 
                addSuffix: true, 
                locale: idLocale 
              })}
            </div>

            {nextRunIn && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-foreground">Next run in: </span>
                <span className="font-semibold text-primary">{nextRunIn}</span>
              </div>
            )}

            {lastRun.status === 'success' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                <div className="bg-muted/50 rounded-lg p-2">
                  <div className="text-xs text-muted-foreground">Batch</div>
                  <div className="font-semibold">B{lastRun.batch}</div>
                </div>
                <div className="bg-green-500/10 rounded-lg p-2">
                  <div className="text-xs text-muted-foreground">Online</div>
                  <div className="font-semibold text-green-600 dark:text-green-400">
                    {lastRun.results.online}
                  </div>
                </div>
                <div className="bg-yellow-500/10 rounded-lg p-2">
                  <div className="text-xs text-muted-foreground">DNS Only</div>
                  <div className="font-semibold text-yellow-600 dark:text-yellow-400">
                    {lastRun.results.dnsOnly}
                  </div>
                </div>
                <div className="bg-red-500/10 rounded-lg p-2">
                  <div className="text-xs text-muted-foreground">Offline</div>
                  <div className="font-semibold text-red-600 dark:text-red-400">
                    {lastRun.results.offline}
                  </div>
                </div>
              </div>
            )}

            {lastRun.status === 'error' && lastRun.error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <div className="text-sm font-medium text-red-600 dark:text-red-400">
                  Error: {lastRun.error}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recent Runs History */}
        {recentRuns.length > 1 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Recent Runs</div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {recentRuns.slice(0, 5).map((run, idx) => (
                <div 
                  key={run.id}
                  className="flex items-center gap-2 text-xs text-muted-foreground"
                >
                  <Badge 
                    variant={run.status === 'success' ? 'default' : 'destructive'}
                    className="w-12"
                  >
                    B{run.batch}
                  </Badge>
                  <span className="flex-1">
                    {run.status === 'success' 
                      ? `${run.results.online}/${run.domainsChecked} online`
                      : 'Failed'
                    }
                  </span>
                  <span>
                    {formatDistanceToNow(run.timestamp, { 
                      addSuffix: true,
                      locale: idLocale 
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Data */}
        {!lastRun && (
          <div className="text-sm text-muted-foreground text-center py-4">
            <Warning className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No GitHub Actions runs detected yet.</p>
            <p className="text-xs mt-1">First run should appear within 1 hour.</p>
          </div>
        )}

        {/* Link to GitHub Actions */}
        <div className="pt-2 border-t">
          <a
            href="https://github.com/faridistiqlal/domain-monitor-dashb/actions"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            View detailed logs on GitHub →
          </a>
        </div>
      </CardContent>
    </Card>
  )
}
