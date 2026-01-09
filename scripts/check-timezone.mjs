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

const domainId = '1767714576487-tvrnuy8p7' // dokar.kendalkab.go.id

console.log('\n🕐 TIMEZONE DEBUG\n')
console.log('Server time (UTC):', new Date().toISOString())
console.log('Server time (WIB):', new Date().toLocaleString('id-ID', {timeZone: 'Asia/Jakarta'}))
console.log('Current date string (UTC):', new Date().toISOString().split('T')[0])
console.log('')

async function checkTimezone() {
  try {
    const statsRef = collection(db, 'domain-stats-daily')
    const statsQuery = query(statsRef, where('domainId', '==', domainId))
    
    const snapshot = await getDocs(statsQuery)
    
    console.log(`📊 Stats untuk dokar.kendalkab.go.id:\n`)
    
    const stats = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => b.date.localeCompare(a.date))
    
    stats.forEach((data, i) => {
      console.log(`${i + 1}. Date: ${data.date}`)
      console.log(`   Document ID: ${data.id}`)
      console.log(`   Total Checks: ${data.totalChecks}`)
      console.log(`   Success: ${data.successChecks}`)
      console.log(`   Uptime: ${data.uptimePercent?.toFixed(2)}%`)
      
      if (data.hourly) {
        const hours = data.hourly.filter(h => h.checks > 0)
        console.log(`   Active hours: ${hours.length}`)
        console.log(`   Hour range: ${Math.min(...hours.map(h => h.hour))}:00 - ${Math.max(...hours.map(h => h.hour))}:00`)
      }
      console.log('')
    })
    
    // Calculate total days from first to last
    if (stats.length > 0) {
      const firstDate = new Date(stats[stats.length - 1].date)
      const lastDate = new Date(stats[0].date)
      const daysDiff = Math.ceil((lastDate - firstDate) / (1000 * 60 * 60 * 24))
      
      console.log(`\n📅 Range Analysis:`)
      console.log(`   First record: ${stats[stats.length - 1].date}`)
      console.log(`   Last record: ${stats[0].date}`)
      console.log(`   Total days in range: ${daysDiff + 1} days`)
      console.log(`   Records found: ${stats.length} days`)
      console.log(`   Missing days: ${daysDiff + 1 - stats.length} days`)
    }
    
    // Chart bars explanation
    console.log(`\n📊 CHART BARS EXPLANATION:`)
    console.log(`   Di DomainCharts, chart menampilkan "uptime bars"`)
    console.log(`   Formula: Last 4 days × hourly data (max 90 bars)`)
    console.log(`   \n   Setiap BAR = 1 jam yang ada checks`)
    console.log(`   Bukan per hari, tapi per JAM!`)
    console.log(`   \n   Contoh: Jika hari ini ada checks di 8 jam berbeda,`)
    console.log(`           maka akan tampil 8 bar hijau untuk hari ini.`)
    console.log(`   \n   Total bars = jumlah jam aktif dari 4 hari terakhir`)
    
  } catch (error) {
    console.error('Error:', error.message)
  }
}

checkTimezone().then(() => process.exit(0))
