import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

interface UseSessionTimeoutParams {
  isAuthenticated: boolean
  individualMonitorIntervals: Record<string, NodeJS.Timeout>
  onUpdateActivity: (timestamp: number) => void
  onTimeout: () => void
}

export function useSessionTimeout({
  isAuthenticated,
  individualMonitorIntervals,
  onUpdateActivity,
  onTimeout,
}: UseSessionTimeoutParams) {
  const onTimeoutRef = useRef(onTimeout)
  const onUpdateActivityRef = useRef(onUpdateActivity)

  useEffect(() => {
    onTimeoutRef.current = onTimeout
  }, [onTimeout])

  useEffect(() => {
    onUpdateActivityRef.current = onUpdateActivity
  }, [onUpdateActivity])

  useEffect(() => {
    if (!isAuthenticated) return

    const timeoutDuration = 30 * 60 * 1000
    const warningDuration = 2 * 60 * 1000

    const updateActivity = () => {
      const now = Date.now()
      onUpdateActivityRef.current(now)
      localStorage.setItem('app-last-activity', now.toString())
    }

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click']
    events.forEach(event => window.addEventListener(event, updateActivity))

    const timeoutChecker = setInterval(() => {
      const lastActivity = parseInt(localStorage.getItem('app-last-activity') || Date.now().toString())
      const now = Date.now()
      const timeSinceActivity = now - lastActivity

      if (timeSinceActivity >= timeoutDuration - warningDuration && timeSinceActivity < timeoutDuration) {
        const minutesLeft = Math.ceil((timeoutDuration - timeSinceActivity) / 60000)
        toast.warning(`Session akan berakhir dalam ${minutesLeft} menit karena tidak ada aktivitas`)
      }

      if (timeSinceActivity >= timeoutDuration) {
        onTimeoutRef.current()
        toast.error('Session berakhir karena tidak ada aktivitas selama 30 menit')
      }
    }, 60000)

    return () => {
      events.forEach(event => window.removeEventListener(event, updateActivity))
      clearInterval(timeoutChecker)

      Object.values(individualMonitorIntervals).forEach(intervalId => {
        clearInterval(intervalId)
      })
    }
  }, [isAuthenticated, individualMonitorIntervals])
}