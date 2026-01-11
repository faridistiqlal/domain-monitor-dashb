import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore'

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

console.log(`\n🔍 Mencari SEMUA data untuk: ${targetUrl}\n`)

async function checkAllData() {
  try {
    // 1. Get domain
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
    console.log(`   Status: ${domainData.status || 'N/A'}`)
    console.log(`   Response Time: ${domainData.responseTime || 'N/A'}ms`)
    console.log(`   Last Checked: ${domainData.lastChecked ? new Date(domainData.lastChecked).toLocaleString('id-ID') : 'N/A'}`)
    console.log(`   Individual Monitoring: ${domainData.enabled ? 'ENABLED ✅' : 'DISABLED ❌'}`)
    
    // 2. Check incidents (untuk melihat ada check atau tidak)
    console.log('\n🚨 Checking incidents (10 terakhir):')
    const incidentsRef = collection(db, 'domain-incidents')
    const incidentsQuery = query(
      incidentsRef,
      where('domainId', '==', domainId),
      orderBy('startTime', 'desc'),
      limit(10)
    )
    
    try {
      const incidentsSnap = await getDocs(incidentsQuery)
      
      if (incidentsSnap.empty) {
        console.log('   ✅ Tidak ada incidents (selalu online)')
      } else {
        console.log(`   Found ${incidentsSnap.size} incidents:\n`)
        incidentsSnap.docs.forEach((doc, i) => {
          const data = doc.data()
          const start = new Date(data.startTime)
          const end = data.endTime ? new Date(data.endTime) : null
          console.log(`   ${i+1}. Start: ${start.toLocaleString('id-ID')}`)
          if (end) {
            console.log(`      End: ${end.toLocaleString('id-ID')}`)
            console.log(`      Duration: ${((data.endTime - data.startTime) / 1000 / 60).toFixed(1)} minutes`)
          } else {
            console.log(`      Status: ONGOING`)
          }
          console.log(`      Status: ${data.status}`)
          console.log('')
        })
      }
    } catch (e) {
      console.log('   ⚠️  Error querying incidents (mungkin perlu index):', e.message)
    }
    
    // 3. Get stats daily
    console.log('\n📊 Daily Stats (semua tanggal):')
    const statsRef = collection(db, 'domain-stats-daily')
    const statsQuery = query(statsRef, where('domainId', '==', domainId))
    const statsSnap = await getDocs(statsQuery)
    
    if (statsSnap.empty) {
      console.log('   ❌ Tidak ada stats daily!')
    } else {
      const stats = statsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) => a.date.localeCompare(b.date))
      
      console.log(`   ✅ Ditemukan ${stats.length} hari:\n`)
      
      stats.forEach((stat, i) => {
        console.log(`   ${i + 1}. ${stat.date}`)
        console.log(`      Checks: ${stat.successChecks}/${stat.totalChecks} (${stat.uptimePercent?.toFixed(1)}%)`)
        console.log(`      Response: ${stat.avgResponseTime ? Math.round(stat.avgResponseTime) + 'ms' : 'N/A'}`)
        
        // Show hourly breakdown
        if (stat.hourly && stat.hourly.length > 0) {
          const hoursWithData = stat.hourly.filter(h => h.checks > 0)
          console.log(`      Hours (${hoursWithData.length}): ${hoursWithData.map(h => `${h.hour}h(${h.checks})`).join(', ')}`)
        }
        console.log('')
      })
    }
    
    // 4. Check untuk semua tanggal dari 7-11 Jan
    console.log('\n📅 Summary 7-11 Januari 2026:')
    for (let day = 7; day <= 11; day++) {
      const dateStr = `2026-01-${day.toString().padStart(2, '0')}`
      const statsQuery2 = query(
        statsRef, 
        where('domainId', '==', domainId),
        where('date', '==', dateStr)
      )
      const snap = await getDocs(statsQuery2)
      
      if (snap.empty) {
        console.log(`   ❌ ${dateStr}: TIDAK ADA DATA di Firebase`)
      } else {
        const data = snap.docs[0].data()
        console.log(`   ✅ ${dateStr}: ${data.totalChecks} checks, ${data.uptimePercent?.toFixed(1)}% uptime`)
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkAllData()
