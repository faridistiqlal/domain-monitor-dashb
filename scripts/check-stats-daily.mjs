import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, query, orderBy, limit } from 'firebase/firestore'

// Firebase config
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

console.log(`\n📊 Mengecek domain-stats-daily...\n`)

async function checkStats() {
  try {
    const statsRef = collection(db, 'domain-stats-daily')
    
    // Get SEMUA data tanpa limit untuk lihat semua tanggal
    const snapshot = await getDocs(statsRef)
    
    console.log(`✅ Total documents di query: ${snapshot.size}\n`)
    
    // Group by date untuk lihat berapa domain per tanggal
    const dateMap = new Map()
    const domainMap = new Map()
    
    snapshot.docs.forEach(doc => {
      const data = doc.data()
      const date = data.date
      const domainId = data.domainId
      
      // Count by date
      if (!dateMap.has(date)) {
        dateMap.set(date, [])
      }
      dateMap.get(date).push(domainId)
      
      // Count by domain
      if (!domainMap.has(domainId)) {
        domainMap.set(domainId, [])
      }
      domainMap.get(domainId).push(date)
    })
    
    console.log('📅 Stats per tanggal (10 terakhir):')
    const sortedDates = Array.from(dateMap.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 10)
    
    sortedDates.forEach(([date, domains]) => {
      console.log(`   ${date}: ${domains.length} domains`)
    })
    
    console.log('\n🌐 Stats per domain (top 10):')
    const sortedDomains = Array.from(domainMap.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 10)
    
    sortedDomains.forEach(([domainId, dates]) => {
      console.log(`   ${domainId}: ${dates.length} hari data`)
      console.log(`      Tanggal: ${dates.sort().join(', ')}`)
    })
    
    // Sample beberapa data untuk melihat strukturnya
    console.log('\n📝 Sample 3 data terakhir:')
    snapshot.docs.slice(0, 3).forEach((doc, i) => {
      const data = doc.data()
      console.log(`\n   ${i + 1}. Doc ID: ${doc.id}`)
      console.log(`      Domain ID: ${data.domainId}`)
      console.log(`      Date: ${data.date}`)
      console.log(`      Total Checks: ${data.totalChecks}`)
      console.log(`      Success Checks: ${data.successChecks}`)
      console.log(`      Uptime: ${data.uptimePercent?.toFixed(2)}%`)
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkStats()
