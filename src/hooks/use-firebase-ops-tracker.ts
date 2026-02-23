import { useCallback, useState } from 'react'

interface FirebaseOps {
  reads: number
  writes: number
}

export function useFirebaseOpsTracker() {
  const [firebaseOps, setFirebaseOps] = useState<FirebaseOps>(() => {
    const saved = localStorage.getItem('firebase-ops-today')
    const today = new Date().toISOString().split('T')[0]
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed.date === today) {
        return { reads: parsed.reads || 0, writes: parsed.writes || 0 }
      }
    }
    return { reads: 0, writes: 0 }
  })

  const trackFirebaseRead = useCallback((count: number = 1) => {
    setFirebaseOps(prev => {
      const next = { reads: prev.reads + count, writes: prev.writes }
      const today = new Date().toISOString().split('T')[0]
      localStorage.setItem('firebase-ops-today', JSON.stringify({ ...next, date: today }))
      return next
    })
  }, [])

  const trackFirebaseWrite = useCallback((count: number = 1) => {
    setFirebaseOps(prev => {
      const next = { reads: prev.reads, writes: prev.writes + count }
      const today = new Date().toISOString().split('T')[0]
      localStorage.setItem('firebase-ops-today', JSON.stringify({ ...next, date: today }))
      return next
    })
  }, [])

  return {
    firebaseOps,
    trackFirebaseRead,
    trackFirebaseWrite,
  }
}
