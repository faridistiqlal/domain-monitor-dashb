import { initializeApp } from 'firebase/app'
import { getFirestore, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'

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

async function checkIssue() {
  try {
    // Get domains
    const domainsRef = collection(db, 'domains')
    const domainsSnap = await getDocs(domainsRef)
    const domainsDoc = domainsSnap.docs[0]
    const domains = domainsDoc?.data()?.domains || []
    
    const kendal = domains.find(d => d.url === 'kendalkab.go.id')
    const ppid = domains.find(d => d.url === 'ppid.kendalkab.go.id')
    
    console.log('\n🔍 Checking incidents pada 11 Januari untuk kedua domain...\n')
    
    // Check incidents for kendalkab
    if (kendal) {
      console.log('📊 Domain: kendalkab.go.id')
      console.log('   ID:', kendal.id)
      
      const incidentsRef = collection(db, 'domain-incidents')
      const q = query(
        incidentsRef, 
        where('domainId', '==', kendal.id),
        where('date', '>=', '2026-01-11'),
        where('date', '<=', '2026-01-11T23:59:59')
      )
      
      const snapshot = await getDocs(q)
      console.log('   Total incidents today:', snapshot.size)
      
      snapshot.docs.forEach(doc => {
        const data = doc.data()
        console.log('   -', new Date(data.timestamp).toLocaleString('id-ID'))
        console.log('     Type:', data.type)
        console.log('     Status:', data.status)
        console.log('     Error:', data.error)
      })
      console.log('')
    }
    
    // Check incidents for ppid
    if (ppid) {
      console.log('📊 Domain: ppid.kendalkab.go.id')
      console.log('   ID:', ppid.id)
      
      const incidentsRef = collection(db, 'domain-incidents')
      const q = query(
        incidentsRef, 
        where('domainId', '==', ppid.id),
        where('date', '>=', '2026-01-11'),
        where('date', '<=', '2026-01-11T23:59:59')
      )
      
      const snapshot = await getDocs(q)
      console.log('   Total incidents today:', snapshot.size)
      
      snapshot.docs.forEach(doc => {
        const data = doc.data()
        console.log('   -', new Date(data.timestamp).toLocaleString('id-ID'))
        console.log('     Type:', data.type)
        console.log('     Status:', data.status)
        console.log('     Error:', data.error)
      })
      console.log('')
    }
    
    // Check GitHub Actions logs for today
    console.log('\n🤖 GitHub Actions logs untuk 11 Januari:')
    const logsRef = collection(db, 'github-actions-logs')
    const logsQuery = query(
      logsRef,
      where('date', '>=', '2026-01-11'),
      where('date', '<=', '2026-01-11T23:59:59')
    )
    
    const logsSnap = await getDocs(logsQuery)
    console.log('Total runs today:', logsSnap.size)
    
    logsSnap.docs.forEach(doc => {
      const data = doc.data()
      console.log(`\n   Run at: ${new Date(data.timestamp).toLocaleString('id-ID')}`)
      console.log(`   Batch: B${data.batch}`)
      console.log(`   Domains checked: ${data.domainsChecked}`)
      console.log(`   Success: ${data.successCount}, Failed: ${data.failedCount}`)
      console.log(`   Duration: ${data.duration}s`)
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkIssue().then(() => process.exit(0))
