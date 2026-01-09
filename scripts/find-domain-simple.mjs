import { initializeApp } from 'firebase/app'
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'

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
    const userDoc = await getDoc(doc(db, 'domains', 'default-user'))
    
    if (!userDoc.exists()) {
      console.log('❌ Document default-user tidak ditemukan!')
      return
    }
    
    const userData = userDoc.data()
    const domains = userData.domains || []
    
    console.log(`📊 Total domains di sistem: ${domains.length}\n`)
    
    const matchedDomains = domains.filter(d => 
      d.url?.toLowerCase().includes(searchUrl.toLowerCase())
    )
    
    if (matchedDomains.length === 0) {
      console.log(`❌ Domain dengan "${searchUrl}" tidak ditemukan!\n`)
      return
    }
    
    console.log(`✅ Ditemukan ${matchedDomains.length} domain:\n`)
    
    for (const domain of matchedDomains) {
      console.log(`${'='.repeat(80)}`)
      console.log(`📍 ${domain.url}`)
      console.log(`${'='.repeat(80)}`)
      console.log(`   ID: ${domain.id}`)
      console.log(`   Status: ${domain.status || 'Belum pernah di-check'}`)
      console.log(`   Group: ${domain.group || 'Tidak ada'}`)
      console.log(`   Tags: ${domain.tags?.join(', ') || 'Tidak ada'}`)
      console.log(`   Individual Monitoring: ${domain.enabled ? '✅ AKTIF' : '❌ TIDAK AKTIF'}`)
      console.log(`   Last Checked: ${domain.lastChecked ? new Date(domain.lastChecked).toLocaleString('id-ID') : 'Belum pernah'}`)
      console.log(`   Response Time: ${domain.responseTime ? domain.responseTime + 'ms' : 'N/A'}`)
      console.log(`   IP Address: ${domain.ip || 'N/A'}`)
      console.log(`   Pinned: ${domain.pinned ? 'Ya' : 'Tidak'}`)
      
      // Get stats WITHOUT orderBy to avoid index requirement
      console.log(`\n   📈 DAILY STATS - Query sederhana (tanpa sort):`)
      const statsRef = collection(db, 'domain-stats-daily')
      const statsQuery = query(statsRef, where('domainId', '==', domain.id))
      
      const statsSnap = await getDocs(statsQuery)
      
      if (statsSnap.empty) {
        console.log(`   ❌ TIDAK ADA DATA STATS!`)
        console.log(`   Kemungkinan:`)
        console.log(`   1. Domain belum pernah di-check (manual/auto/individual)`)
        console.log(`   2. Individual monitoring tidak aktif`)
        console.log(`   3. Tidak ada check yang berhasil tersimpan`)
      } else {
        // Sort manually
        const statsDocs = statsSnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => b.date.localeCompare(a.date))
          .slice(0, 7)
        
        console.log(`   ✅ ${statsSnap.size} hari total, menampilkan 7 terakhir:\n`)
        
        statsDocs.forEach((data, i) => {
          console.log(`   ${i + 1}. 📅 ${data.date}`)
          console.log(`      ├─ Checks: ${data.totalChecks} kali`)
          console.log(`      ├─ Success: ${data.successChecks} kali`)
          console.log(`      ├─ Uptime: ${data.uptimePercent?.toFixed(2) || 0}%`)
          console.log(`      ├─ Response Time:`)
          console.log(`      │  • Average: ${data.avgResponseTime?.toFixed(0) || 'N/A'} ms`)
          console.log(`      │  • Min: ${data.minResponseTime || 'N/A'} ms`)
          console.log(`      │  • Max: ${data.maxResponseTime || 'N/A'} ms`)
          
          if (data.hourly) {
            const hours = data.hourly.filter(h => h.checks > 0)
            if (hours.length > 0) {
              console.log(`      └─ Jam aktif (${hours.length} jam):`)
              hours.forEach(h => {
                console.log(`         • ${String(h.hour).padStart(2, '0')}:00 - ${h.checks} checks, ${h.successChecks} success, status: ${h.status}`)
              })
            }
          }
          console.log('')
        })
      }
      
      // Get incidents
      console.log(`   🚨 INCIDENTS:`)
      const incidentsRef = collection(db, 'domain-incidents')
      const incidentsQuery = query(incidentsRef, where('domainId', '==', domain.id))
      
      const incidentsSnap = await getDocs(incidentsQuery)
      
      if (incidentsSnap.empty) {
        console.log(`   ✅ Tidak ada incidents! Domain selalu online atau belum pernah di-check.\n`)
      } else {
        // Sort manually
        const incidents = incidentsSnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => b.startTime - a.startTime)
          .slice(0, 5)
        
        console.log(`   ⚠️  ${incidentsSnap.size} total incidents, menampilkan 5 terakhir:\n`)
        
        incidents.forEach((data, i) => {
          const start = new Date(data.startTime)
          const end = data.endTime ? new Date(data.endTime) : null
          const duration = end ? `${((data.endTime - data.startTime) / 1000 / 60).toFixed(0)} menit` : 'Masih berlangsung'
          
          console.log(`   ${i + 1}. Incident: ${data.status.toUpperCase()}`)
          console.log(`      ├─ Mulai: ${start.toLocaleString('id-ID')}`)
          console.log(`      ├─ Selesai: ${end ? end.toLocaleString('id-ID') : 'Belum resolved'}`)
          console.log(`      ├─ Durasi: ${duration}`)
          console.log(`      ├─ Status sebelumnya: ${data.prevStatus}`)
          console.log(`      ├─ Resolved: ${data.resolved ? 'Ya ✅' : 'Tidak ❌'}`)
          console.log(`      └─ Error: ${data.error || 'Tidak ada error message'}`)
          console.log('')
        })
      }
      
      console.log(`${'='.repeat(80)}\n`)
    }
    
    console.log('✅ Query selesai!\n')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

findDomain().then(() => process.exit(0))
