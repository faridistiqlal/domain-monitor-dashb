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

async function checkStats() {
  try {
    // Get domains first
    const domainsRef = collection(db, 'domains')
    const domainsSnap = await getDocs(domainsRef)
    const domainsDoc = domainsSnap.docs[0]
    const domains = domainsDoc?.data()?.domains || []
    
    // Find kendalkab.go.id and ppid
    const kendal = domains.find(d => d.url === 'kendalkab.go.id')
    const ppid = domains.find(d => d.url === 'ppid.kendalkab.go.id')
    
    console.log('\n🔍 Domain IDs:')
    console.log('kendalkab.go.id:', kendal?.id)
    console.log('ppid.kendalkab.go.id:', ppid?.id)
    
    // Check stats for kendalkab
    if (kendal) {
      const statsRef = collection(db, 'domain-stats-daily')
      const q = query(statsRef, where('domainId', '==', kendal.id))
      const snapshot = await getDocs(q)
      
      console.log('\n📊 Stats untuk kendalkab.go.id:')
      console.log('Total records:', snapshot.size)
      
      if (snapshot.size > 0) {
        const stats = snapshot.docs.map(doc => doc.data())
        const sortedStats = stats.sort((a, b) => b.date.localeCompare(a.date))
        
        console.log('\n📅 Latest 5 stats:')
        sortedStats.slice(0, 5).forEach(s => {
          console.log(`  ${s.date}: ${s.totalChecks} checks, ${s.successChecks} success, ${s.uptimePercent?.toFixed(1)}% uptime`)
        })
      }
    }
    
    // Check stats for ppid
    if (ppid) {
      const statsRef = collection(db, 'domain-stats-daily')
      const q = query(statsRef, where('domainId', '==', ppid.id))
      const snapshot = await getDocs(q)
      
      console.log('\n📊 Stats untuk ppid.kendalkab.go.id:')
      console.log('Total records:', snapshot.size)
      
      if (snapshot.size > 0) {
        const stats = snapshot.docs.map(doc => doc.data())
        const sortedStats = stats.sort((a, b) => b.date.localeCompare(a.date))
        
        console.log('\n📅 Latest 5 stats:')
        sortedStats.slice(0, 5).forEach(s => {
          console.log(`  ${s.date}: ${s.totalChecks} checks, ${s.successChecks} success, ${s.uptimePercent?.toFixed(1)}% uptime`)
        })
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkStats().then(() => process.exit(0))
