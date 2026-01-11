import { initializeApp } from 'firebase/app'
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyDsONdN5q1vz5Gp6Irk0K7T4-GexuJ6Meo",
  authDomain: "kendal-monitor.firebaseapp.com",
  projectId: "kendal-monitor",
  storageBucket: "kendal-monitor.firebasestorage.app",
  messagingSenderId: "769565947746",
  appId: "1:769565947746:web:90ae2c85d894b0da44de3b",
  measurementId: "G-C3RLK090HK"
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function checkUptimeDetail() {
  try {
    // Get domains
    const domainsRef = collection(db, 'domains')
    const domainsSnap = await getDocs(domainsRef)
    const domainsDoc = domainsSnap.docs[0]
    const domains = domainsDoc?.data()?.domains || []
    
    const kendal = domains.find(d => d.url === 'kendalkab.go.id')
    
    if (!kendal) {
      console.log('❌ Domain tidak ditemukan')
      return
    }
    
    console.log('\n🔍 Domain ID:', kendal.id)
    console.log('📅 Today:', new Date().toISOString().split('T')[0])
    
    // Get stats
    const statsRef = collection(db, 'domain-stats-daily')
    const q = query(statsRef, where('domainId', '==', kendal.id))
    const snapshot = await getDocs(q)
    
    console.log('\n📊 Total docs di Firebase:', snapshot.size)
    
    const stats = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    // Sort by date
    const sortedStats = stats.sort((a, b) => a.date.localeCompare(b.date))
    
    console.log('\n📅 Semua data (sorted):')
    sortedStats.forEach((s, i) => {
      console.log(`${i + 1}. Date: ${s.date}`)
      console.log(`   Doc ID: ${s.id}`)
      console.log(`   Checks: ${s.totalChecks}, Success: ${s.successChecks}`)
      console.log(`   Uptime: ${s.uptimePercent?.toFixed(1)}%`)
      console.log(`   Has uptimePercent: ${s.uptimePercent !== undefined}`)
      console.log('')
    })
    
    // Simulate UptimeBar logic
    const days = 90
    const today = new Date()
    const startDate = new Date(today)
    startDate.setDate(startDate.getDate() - days + 1)
    
    console.log('\n🔄 Simulating UptimeBar logic (last 90 days):')
    console.log('Start date:', startDate.toISOString().split('T')[0])
    console.log('End date:', today.toISOString().split('T')[0])
    
    // Create map
    const statsMap = new Map(stats.map(s => [s.date, s]))
    
    // Fill array
    const filledStats = []
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]
      const stat = statsMap.get(dateStr)
      if (stat) {
        filledStats.push({ date: dateStr, hasData: true, uptime: stat.uptimePercent })
      } else {
        filledStats.push({ date: dateStr, hasData: false, uptime: null })
      }
    }
    
    // Count bars with data
    const barsWithData = filledStats.filter(s => s.hasData)
    console.log('\n📊 Bars with data:', barsWithData.length)
    barsWithData.forEach(s => {
      console.log(`  - ${s.date}: ${s.uptime?.toFixed(1)}% uptime`)
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkUptimeDetail().then(() => process.exit(0))
