import { useCallback, useEffect, useMemo, useState } from 'react'

export function useManualRefreshCooldown() {
  const [manualRefreshCooldownUntil, setManualRefreshCooldownUntil] = useState(0)
  const [manualRefreshNowTick, setManualRefreshNowTick] = useState(() => Date.now())

  const manualRefreshRemainingSeconds = useMemo(
    () => Math.max(0, Math.ceil((manualRefreshCooldownUntil - manualRefreshNowTick) / 1000)),
    [manualRefreshCooldownUntil, manualRefreshNowTick]
  )

  useEffect(() => {
    if (manualRefreshCooldownUntil <= Date.now()) {
      return
    }

    const intervalId = window.setInterval(() => {
      setManualRefreshNowTick(Date.now())
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [manualRefreshCooldownUntil])

  const startManualRefreshCooldown = useCallback((durationMs: number = 30_000) => {
    const now = Date.now()
    setManualRefreshNowTick(now)
    setManualRefreshCooldownUntil(now + durationMs)
  }, [])

  return {
    manualRefreshRemainingSeconds,
    startManualRefreshCooldown,
  }
}
