import { initializeApp } from 'firebase/app'
import { getFirestore, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'

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

const domainUrl = process.argv[2] || 'dokar.kendalkab.go.id'

console.log(`\n🔍 Mencari data untuk domain: ${domainUrl}\n`)

async function checkDomain() {
  try {
    // 1. Cari domain di collection 'domains'
    console.log('📊 Step 1: Mencari domain di collection "domains"...')
    const domainsRef = collection(db, 'domains')
    const domainQuery = query(domainsRef, where('url', '==', domainUrl))
    const domainSnap = await getDocs(domainQuery)
    
    if (domainSnap.empty) {
      console.log('❌ Domain tidak ditemukan di Firebase!')
      console.log('   Kemungkinan: Domain belum ditambahkan atau URL tidak cocok')
      return
    }
    
    const domainData = domainSnap.docs[0].data()
    const domainId = domainSnap.docs[0].id
    
    console.log('✅ Domain ditemukan!')
    console.log(`   ID: ${domainId}`)
    console.log(`   URL: ${domainData.url}`)
    console.log(`   Group: ${domainData.group || 'N/A'}`)
    console.log(`   Individual Monitoring: ${domainData.enabled ? 'ENABLED ✅' : 'DISABLED ❌'}`)
    console.log(`   Last Check: ${domainData.lastChecked ? new Date(domainData.lastChecked).toLocaleString('id-ID') : 'Belum pernah'}`)
    console.log(`   Last Status: ${domainData.status || 'N/A'}`)
    console.log(`   Response Time: ${domainData.responseTime ? domainData.responseTime + 'ms' : 'N/A'}`)
    
    // 2. Cari stats harian (7 hari terakhir)
    console.log('\n📈 Step 2: Mencari daily stats (7 hari terakhir)...')
    const statsRef = collection(db, 'domain-stats-daily')
    const statsQuery = query(
      statsRef, 
      where('domainId', '==', domainId),
      orderBy('date', 'desc'),
      limit(7)
    )
    
    const statsSnap = await getDocs(statsQuery)
    
    if (statsSnap.empty) {
      console.log('⚠️  Tidak ada daily stats ditemukan!')
      console.log('   Kemungkinan: Domain belum pernah di-check atau data belum tersimpan')
    } else {
      console.log(`✅ Ditemukan ${statsSnap.size} hari data:\n`)
      
      statsSnap.docs.forEach((doc, index) => {
        const data = doc.data()
        console.log(`   ${index + 1}. Tanggal: ${data.date}`)
        console.log(`      Total Checks: ${data.totalChecks}`)
        console.log(`      Success Checks: ${data.successChecks}`)
        console.log(`      Uptime: ${data.uptimePercent ? data.uptimePercent.toFixed(2) : 0}%`)
        console.log(`      Avg Response: ${data.avgResponseTime ? data.avgResponseTime.toFixed(0) + 'ms' : 'N/A'}`)
        console.log(`      Min Response: ${data.minResponseTime ? data.minResponseTime + 'ms' : 'N/A'}`)
        console.log(`      Max Response: ${data.maxResponseTime ? data.maxResponseTime + 'ms' : 'N/A'}`)
        
        // Tampilkan jam yang ada checks
        if (data.hourly) {
          const hoursWithChecks = data.hourly.filter(h => h.checks > 0)
          if (hoursWithChecks.length > 0) {
            console.log(`      Jam dengan checks: ${hoursWithChecks.map(h => `${h.hour}:00(${h.checks}x)`).join(', ')}`)
          }
        }
        console.log('')
      })
    }
    
    // 3. Cari incidents (10 terakhir)
    console.log('🚨 Step 3: Mencari incidents (10 terakhir)...')
    const incidentsRef = collection(db, 'domain-incidents')
    const incidentsQuery = query(
      incidentsRef,
      where('domainId', '==', domainId),
      orderBy('startTime', 'desc'),
      limit(10)
    )
    
    const incidentsSnap = await getDocs(incidentsQuery)
    
    if (incidentsSnap.empty) {
      console.log('✅ Tidak ada incidents! Domain selalu online.')
    } else {
      console.log(`⚠️  Ditemukan ${incidentsSnap.size} incidents:\n`)
      
      incidentsSnap.docs.forEach((doc, index) => {
        const data = doc.data()
        const startTime = new Date(data.startTime).toLocaleString('id-ID')
        const endTime = data.endTime ? new Date(data.endTime).toLocaleString('id-ID') : 'Ongoing'
        const duration = data.endTime ? ((data.endTime - data.startTime) / 1000 / 60).toFixed(0) + ' menit' : 'Ongoing'
        
        console.log(`   ${index + 1}. Incident ID: ${doc.id}`)
        console.log(`      Status: ${data.status} (dari ${data.prevStatus})`)
        console.log(`      Start: ${startTime}`)
        console.log(`      End: ${endTime}`)
        console.log(`      Duration: ${duration}`)
        console.log(`      Resolved: ${data.resolved ? 'YES ✅' : 'NO ❌'}`)
        console.log(`      Error: ${data.error || 'N/A'}`)
        console.log('')
      })
    }
    
    console.log('✅ Query selesai!\n')
    
  } catch (error) {
    console.error('\n❌ Error:', error.message)
    if (error.code) {
      console.error(`   Error code: ${error.code}`)
    }
  }
}

checkDomain().then(() => process.exit(0))
