import { useCallback, useEffect, useRef, useState } from 'react'

interface UseAutoRefreshSchedulerParams {
  autoRefreshEnabled: boolean
  isPaused: boolean
  onAutoCheck: () => void
}

export function useAutoRefreshScheduler({
  autoRefreshEnabled,
  isPaused,
  onAutoCheck,
}: UseAutoRefreshSchedulerParams) {
  const [countdown, setCountdown] = useState(60)
  const onAutoCheckRef = useRef(onAutoCheck)

  useEffect(() => {
    onAutoCheckRef.current = onAutoCheck
  }, [onAutoCheck])

  const getSecondsUntilNextBatch = useCallback(() => {
    const now = new Date()
    const currentMinute = now.getMinutes()
    const currentSecond = now.getSeconds()

    const nextBatchMinute = Math.ceil((currentMinute + 1) / 5) * 5
    const minutesUntilNext = nextBatchMinute - currentMinute
    const secondsUntilNext = (minutesUntilNext * 60) - currentSecond

    return secondsUntilNext
  }, [])

  const resetCountdownToNextBatch = useCallback(() => {
    setCountdown(getSecondsUntilNextBatch())
  }, [getSecondsUntilNextBatch])

  useEffect(() => {
    if (!autoRefreshEnabled || isPaused) return

    const initialDelay = setTimeout(() => {
      onAutoCheckRef.current()
      resetCountdownToNextBatch()
    }, 10000)

    return () => {
      clearTimeout(initialDelay)
    }
  }, [autoRefreshEnabled, isPaused, resetCountdownToNextBatch])

  useEffect(() => {
    if (!autoRefreshEnabled || isPaused) return

    const worker = new Worker(new URL('@/lib/background-worker.ts', import.meta.url), {
      type: 'module'
    })

    resetCountdownToNextBatch()

    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          return 300
        }
        return prev - 1
      })
    }, 1000)

    worker.onmessage = (event: MessageEvent) => {
      if (event.data?.type === 'CHECK') {
        onAutoCheckRef.current()
        resetCountdownToNextBatch()
      }
    }

    worker.postMessage({ type: 'START' })

    return () => {
      worker.postMessage({ type: 'STOP' })
      worker.terminate()
      clearInterval(countdownInterval)
    }
  }, [autoRefreshEnabled, isPaused, resetCountdownToNextBatch])

  return {
    countdown,
    resetCountdownToNextBatch,
  }
}
