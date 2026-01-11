import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs } from 'firebase/firestore'

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

async function checkDomainStatus() {
  try {
    // Get domains
    const domainsRef = collection(db, 'domains')
    const domainsSnap = await getDocs(domainsRef)
    const domainsDoc = domainsSnap.docs[0]
    const domains = domainsDoc?.data()?.domains || []
    
    const kendal = domains.find(d => d.url === 'kendalkab.go.id')
    const ppid = domains.find(d => d.url === 'ppid.kendalkab.go.id')
    
    console.log('\n📊 Current status dari collection domains:\n')
    
    if (kendal) {
      console.log('🌐 kendalkab.go.id')
      console.log('   Status:', kendal.status || 'unknown')
      console.log('   Last Checked:', kendal.lastChecked ? new Date(kendal.lastChecked).toLocaleString('id-ID') : 'Never')
      console.log('   Response Time:', kendal.responseTime || 'N/A', 'ms')
      console.log('   IP Address:', kendal.ipAddress || 'N/A')
      console.log('   Error:', kendal.error || 'None')
      console.log('   Batch:', kendal.checkBatch || 'N/A')
      console.log('')
    }
    
    if (ppid) {
      console.log('🌐 ppid.kendalkab.go.id')
      console.log('   Status:', ppid.status || 'unknown')
      console.log('   Last Checked:', ppid.lastChecked ? new Date(ppid.lastChecked).toLocaleString('id-ID') : 'Never')
      console.log('   Response Time:', ppid.responseTime || 'N/A', 'ms')
      console.log('   IP Address:', ppid.ipAddress || 'N/A')
      console.log('   Error:', ppid.error || 'None')
      console.log('   Batch:', ppid.checkBatch || 'N/A')
      console.log('')
    }
    
    // Check GitHub Actions logs
    console.log('\n🤖 Latest GitHub Actions runs:\n')
    const logsRef = collection(db, 'github-actions-logs')
    const logsSnap = await getDocs(logsRef)
    
    const logs = logsSnap.docs.map(doc => doc.data())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5)
    
    logs.forEach((log, i) => {
      console.log(`${i + 1}. ${new Date(log.timestamp).toLocaleString('id-ID')}`)
      console.log(`   Batch: B${log.batch} | Checked: ${log.domainsChecked} domains`)
      console.log(`   Success: ${log.successCount}, Failed: ${log.failedCount}`)
      console.log(`   Duration: ${log.duration}s`)
      console.log('')
    })
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

checkDomainStatus().then(() => process.exit(0))
