import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore'

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

const targetUrl = 'dokar.kendalkab.go.id'

console.log(`\n🔍 Mencari data untuk: ${targetUrl}\n`)

async function checkDomain() {
  try {
    // 1. Get domain list from default-user document
    const domainsRef = collection(db, 'domains')
    const domainsSnap = await getDocs(domainsRef)
    
    let domainId = null
    let domainData = null
    
    domainsSnap.docs.forEach(doc => {
      const data = doc.data()
      if (data.domains && Array.isArray(data.domains)) {
        const found = data.domains.find(d => d.url === targetUrl)
        if (found) {
          domainId = found.id
          domainData = found
        }
      }
    })
    
    if (!domainId) {
      console.log('❌ Domain tidak ditemukan!')
      return
    }
    
    console.log('✅ Domain ditemukan!')
    console.log(`   Domain ID: ${domainId}`)
    console.log(`   URL: ${domainData.url}`)
    console.log(`   Status: ${domainData.status}`)
    console.log(`   Last Checked: ${domainData.lastChecked ? new Date(domainData.lastChecked).toLocaleString('id-ID') : 'N/A'}`)
    
    // 2. Get stats daily untuk domain ini
    console.log('\n📊 Daily Stats:')
    const statsRef = collection(db, 'domain-stats-daily')
    const statsQuery = query(statsRef, where('domainId', '==', domainId))
    const statsSnap = await getDocs(statsQuery)
    
    if (statsSnap.empty) {
      console.log('   ❌ Tidak ada stats daily!')
      return
    }
    
    const stats = statsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })).sort((a, b) => a.date.localeCompare(b.date))
    
    console.log(`   ✅ Ditemukan ${stats.length} hari data:\n`)
    
    stats.forEach((stat, i) => {
      console.log(`   ${i + 1}. ${stat.date}`)
      console.log(`      Total Checks: ${stat.totalChecks}`)
      console.log(`      Success: ${stat.successChecks}`)
      console.log(`      Uptime: ${stat.uptimePercent?.toFixed(2)}%`)
      console.log(`      Avg Response: ${stat.avgResponseTime ? Math.round(stat.avgResponseTime) + 'ms' : 'N/A'}`)
      if (stat.hourly && stat.hourly.length > 0) {
        const hours = stat.hourly.filter(h => h.checks > 0).map(h => `${h.hour}:00`).join(', ')
        console.log(`      Jam dengan data: ${hours}`)
      }
      console.log('')
    })
    
    // Check untuk tanggal 7-11 Januari 2026
    console.log('\n📅 Checking range 7-11 Januari 2026:')
    for (let day = 7; day <= 11; day++) {
      const dateStr = `2026-01-${day.toString().padStart(2, '0')}`
      const found = stats.find(s => s.date === dateStr)
      if (found) {
        console.log(`   ✅ ${dateStr}: Ada (${found.totalChecks} checks, ${found.uptimePercent?.toFixed(1)}% uptime)`)
      } else {
        console.log(`   ❌ ${dateStr}: TIDAK ADA DATA`)
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkDomain()
