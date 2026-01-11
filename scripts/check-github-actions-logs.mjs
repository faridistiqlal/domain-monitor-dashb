import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, query, orderBy, limit } from 'firebase/firestore'

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

console.log('\n📋 Checking GitHub Actions logs...\n')

async function checkLogs() {
  try {
    const logsRef = collection(db, 'github-actions-logs')
    const q = query(logsRef, orderBy('timestamp', 'desc'), limit(50))
    const snapshot = await getDocs(q)
    
    console.log(`✅ Found ${snapshot.size} logs\n`)
    
    if (snapshot.empty) {
      console.log('❌ Tidak ada logs GitHub Actions!')
      return
    }
    
    // Group by date
    const logsByDate = new Map()
    
    snapshot.docs.forEach(doc => {
      const data = doc.data()
      const timestamp = data.timestamp?.toDate() || new Date()
      const dateStr = timestamp.toLocaleDateString('id-ID', { 
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
      
      if (!logsByDate.has(dateStr)) {
        logsByDate.set(dateStr, [])
      }
      
      logsByDate.get(dateStr).push({
        time: timestamp.toLocaleTimeString('id-ID'),
        batch: data.batch,
        checked: data.domainsChecked,
        results: data.results,
        status: data.status
      })
    })
    
    console.log('📅 Logs per tanggal:\n')
    
    Array.from(logsByDate.entries())
      .slice(0, 5)
      .forEach(([date, logs]) => {
        console.log(`📆 ${date} (${logs.length} runs)`)
        logs.slice(0, 10).forEach(log => {
          if (log.status === 'success') {
            console.log(`   ${log.time} | Batch ${log.batch} | ${log.checked} domains | ✅${log.results?.online || 0} ⚠️${log.results?.dnsOnly || 0} ❌${log.results?.offline || 0}`)
          } else {
            console.log(`   ${log.time} | Error: ${log.status}`)
          }
        })
        console.log('')
      })
    
    // Check untuk 10-11 Januari
    console.log('\n🔍 Checking 10-11 Januari 2026 specifically:\n')
    
    const allDocs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date()
    }))
    
    const jan10 = allDocs.filter(doc => {
      const dateStr = doc.timestamp.toISOString().split('T')[0]
      return dateStr === '2026-01-10'
    })
    
    const jan11 = allDocs.filter(doc => {
      const dateStr = doc.timestamp.toISOString().split('T')[0]
      return dateStr === '2026-01-11'
    })
    
    console.log(`📅 10 Januari: ${jan10.length} runs`)
    if (jan10.length > 0) {
      jan10.forEach(log => {
        console.log(`   Batch ${log.batch}: ${log.domainsChecked} domains checked`)
      })
    } else {
      console.log('   ❌ Tidak ada runs')
    }
    
    console.log(`\n📅 11 Januari: ${jan11.length} runs`)
    if (jan11.length > 0) {
      jan11.forEach(log => {
        console.log(`   Batch ${log.batch}: ${log.domainsChecked} domains checked`)
      })
    } else {
      console.log('   ❌ Tidak ada runs')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkLogs()
