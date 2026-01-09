import { initializeApp } from 'firebase/app'
import { getFirestore, doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'

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

const searchUrl = process.argv[2] || 'dokar'

console.log(`\n🔍 Mencari domain: "${searchUrl}"\n`)

async function findDomain() {
  try {
    // Get default-user document yang contains array of domains
    const userDoc = await getDoc(doc(db, 'domains', 'default-user'))
    
    if (!userDoc.exists()) {
      console.log('❌ Document default-user tidak ditemukan!')
      return
    }
    
    const userData = userDoc.data()
    const domains = userData.domains || []
    
    console.log(`📊 Total domains di sistem: ${domains.length}\n`)
    
    // Find matching domain
    const matchedDomains = domains.filter(d => 
      d.url?.toLowerCase().includes(searchUrl.toLowerCase())
    )
    
    if (matchedDomains.length === 0) {
      console.log(`❌ Domain dengan "${searchUrl}" tidak ditemukan!`)
      console.log('\n💡 Coba cari dengan keyword lain atau lihat semua domain dengan:')
      console.log('   node find-domain-nested.mjs ""\n')
      return
    }
    
    console.log(`✅ Ditemukan ${matchedDomains.length} domain:\n`)
    
    for (const domain of matchedDomains) {
      console.log(`📍 Domain: ${domain.url}`)
      console.log(`   ID: ${domain.id}`)
      console.log(`   Status: ${domain.status || 'N/A'}`)
      console.log(`   Group: ${domain.group || 'N/A'}`)
      console.log(`   Tags: ${domain.tags?.join(', ') || 'N/A'}`)
      console.log(`   Individual Monitoring: ${domain.enabled ? 'ENABLED ✅' : 'DISABLED ❌'}`)
      console.log(`   Last Checked: ${domain.lastChecked ? new Date(domain.lastChecked).toLocaleString('id-ID') : 'Never'}`)
      console.log(`   Response Time: ${domain.responseTime ? domain.responseTime + 'ms' : 'N/A'}`)
      console.log(`   IP: ${domain.ip || 'N/A'}`)
      
      // Now get stats from domain-stats-daily
      console.log(`\n   📈 Daily Stats (7 hari terakhir):`)
      const statsRef = collection(db, 'domain-stats-daily')
      const statsQuery = query(
        statsRef,
        where('domainId', '==', domain.id),
        orderBy('date', 'desc'),
        limit(7)
      )
      
      const statsSnap = await getDocs(statsQuery)
      
      if (statsSnap.empty) {
        console.log(`   ⚠️  Tidak ada stats! Domain belum pernah di-check atau data belum tersimpan.\n`)
      } else {
        console.log(`   ✅ ${statsSnap.size} hari data:\n`)
        
        statsSnap.docs.forEach((doc, i) => {
          const data = doc.data()
          console.log(`   ${i + 1}. ${data.date}`)
          console.log(`      Checks: ${data.totalChecks} | Success: ${data.successChecks} | Uptime: ${data.uptimePercent?.toFixed(2) || 0}%`)
          console.log(`      Response: avg ${data.avgResponseTime?.toFixed(0) || 'N/A'}ms | min ${data.minResponseTime || 'N/A'}ms | max ${data.maxResponseTime || 'N/A'}ms`)
          
          if (data.hourly) {
            const hours = data.hourly.filter(h => h.checks > 0)
            if (hours.length > 0) {
              console.log(`      Jam: ${hours.map(h => `${h.hour}:00(${h.checks}x,${h.successChecks}✓)`).join(' ')}`)
            }
          }
        })
      }
      
      // Get incidents
      console.log(`\n   🚨 Incidents (5 terakhir):`)
      const incidentsRef = collection(db, 'domain-incidents')
      const incidentsQuery = query(
        incidentsRef,
        where('domainId', '==', domain.id),
        orderBy('startTime', 'desc'),
        limit(5)
      )
      
      const incidentsSnap = await getDocs(incidentsQuery)
      
      if (incidentsSnap.empty) {
        console.log(`   ✅ Tidak ada incidents!\n`)
      } else {
        console.log(`   ⚠️  ${incidentsSnap.size} incidents:\n`)
        
        incidentsSnap.docs.forEach((doc, i) => {
          const data = doc.data()
          const start = new Date(data.startTime).toLocaleString('id-ID')
          const end = data.endTime ? new Date(data.endTime).toLocaleString('id-ID') : 'Ongoing'
          const duration = data.endTime ? `${((data.endTime - data.startTime) / 1000 / 60).toFixed(0)}m` : 'Ongoing'
          
          console.log(`   ${i + 1}. ${data.status.toUpperCase()} | ${start} → ${end} (${duration})`)
          console.log(`      Resolved: ${data.resolved ? 'YES ✅' : 'NO ❌'} | Error: ${data.error || 'N/A'}`)
        })
      }
      
      console.log('\n' + '='.repeat(80) + '\n')
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('Stack:', error.stack)
  }
}

findDomain().then(() => process.exit(0))
