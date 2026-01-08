/**
 * Background Worker for Auto-Check
 * Runs independently of main thread to ensure checks continue even when tab is inactive
 */

const INTERVAL = 5 * 60 * 1000 // 5 minutes

let intervalId: NodeJS.Timeout | null = null

self.addEventListener('message', (event) => {
  if (event.data.type === 'START') {
    console.log('🟢 [WORKER] Background check worker started')
    console.log('⏰ [WORKER] Interval: 5 minutes (300 seconds)')
    
    // Check immediately on start
    self.postMessage({ type: 'CHECK', timestamp: Date.now() })
    
    // Clear existing interval if any
    if (intervalId) {
      clearInterval(intervalId)
    }
    
    // Set up 5-minute interval
    intervalId = setInterval(() => {
      const now = new Date()
      console.log('🔔 [WORKER] Interval triggered at:', now.toLocaleTimeString())
      console.log('📤 [WORKER] Sending CHECK signal to main thread')
      self.postMessage({ type: 'CHECK', timestamp: Date.now() })
    }, INTERVAL)
    
    console.log('✅ [WORKER] Interval setup complete - next check in 5 minutes')
  }
  
  if (event.data.type === 'STOP') {
    console.log('🛑 [WORKER] Stopping background worker')
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  }
  
  if (event.data.type === 'PING') {
    // Health check from main thread
    self.postMessage({ type: 'PONG', timestamp: Date.now() })
  }
})

// Log when worker is initialized
console.log('🔧 [WORKER] Background worker initialized and ready')
