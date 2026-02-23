import { useCallback, useState } from 'react'

interface FirebaseOps {
  reads: number
  writes: number
  totalOps: number
  dailyBudget: number
  remainingOps: number
  usagePercent: number
  isOverBudget: boolean
}

const FALLBACK_DAILY_BUDGET = 667

const resolveDailyBudget = () => {
  const rawBudget = Number(import.meta.env.VITE_FIRESTORE_DAILY_BUDGET || FALLBACK_DAILY_BUDGET)
  if (!Number.isFinite(rawBudget) || rawBudget <= 0) {
    return FALLBACK_DAILY_BUDGET
  }
  return Math.floor(rawBudget)
}

const toOpsState = (reads: number, writes: number, dailyBudget: number): FirebaseOps => {
  const totalOps = reads + writes
  const remainingOps = Math.max(0, dailyBudget - totalOps)
  const usagePercent = dailyBudget > 0 ? Math.min(100, Math.round((totalOps / dailyBudget) * 100)) : 100

  return {
    reads,
    writes,
    totalOps,
    dailyBudget,
    remainingOps,
    usagePercent,
    isOverBudget: totalOps > dailyBudget,
  }
}

export function useFirebaseOpsTracker() {
  const dailyBudget = resolveDailyBudget()

  const [firebaseOps, setFirebaseOps] = useState<FirebaseOps>(() => {
    const saved = localStorage.getItem('firebase-ops-today')
    const today = new Date().toISOString().split('T')[0]
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed.date === today) {
        return toOpsState(parsed.reads || 0, parsed.writes || 0, dailyBudget)
      }
    }
    return toOpsState(0, 0, dailyBudget)
  })

  const trackFirebaseRead = useCallback((count: number = 1) => {
    setFirebaseOps(prev => {
      const nextReads = prev.reads + count
      const nextWrites = prev.writes
      const next = toOpsState(nextReads, nextWrites, dailyBudget)
      const today = new Date().toISOString().split('T')[0]
      localStorage.setItem('firebase-ops-today', JSON.stringify({ reads: nextReads, writes: nextWrites, date: today }))
      return next
    })
  }, [dailyBudget])

  const trackFirebaseWrite = useCallback((count: number = 1) => {
    setFirebaseOps(prev => {
      const nextReads = prev.reads
      const nextWrites = prev.writes + count
      const next = toOpsState(nextReads, nextWrites, dailyBudget)
      const today = new Date().toISOString().split('T')[0]
      localStorage.setItem('firebase-ops-today', JSON.stringify({ reads: nextReads, writes: nextWrites, date: today }))
      return next
    })
  }, [dailyBudget])

  return {
    firebaseOps,
    trackFirebaseRead,
    trackFirebaseWrite,
  }
}
