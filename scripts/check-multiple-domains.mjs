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

const targetUrls = [
  'ppid.kendalkab.go.id',
  'gampil.kendalkab.go.id',
  'kendalkab.go.id'
]

console.log('\n🔍 Checking multiple domains stats...\n')

async function checkMultipleDomains() {
  try {
    // Get all domains
    const domainsRef = collection(db, 'domains')
    const domainsSnap = await getDocs(domainsRef)
    
    const domainMap = new Map()
    
    domainsSnap.docs.forEach(doc => {
      const data = doc.data()
      if (data.domains && Array.isArray(data.domains)) {
        data.domains.forEach(d => {
          if (targetUrls.includes(d.url)) {
            domainMap.set(d.url, d.id)
          }
        })
      }
    })
    
    // Get stats for each domain
    const statsRef = collection(db, 'domain-stats-daily')
    const statsSnap = await getDocs(statsRef)
    
    for (const url of targetUrls) {
      const domainId = domainMap.get(url)
      
      console.log(`\n📊 ${url}`)
      
      if (!domainId) {
        console.log('   ❌ Domain not found')
        continue
      }
      
      console.log(`   Domain ID: ${domainId}`)
      
      // Filter stats for this domain
      const domainStats = statsSnap.docs
        .filter(doc => doc.data().domainId === domainId)
        .map(doc => ({
          date: doc.data().date,
          totalChecks: doc.data().totalChecks,
          successChecks: doc.data().successChecks,
          uptime: doc.data().uptimePercent?.toFixed(1)
        }))
        .sort((a, b) => a.date.localeCompare(b.date))
      
      console.log(`   Total days with data: ${domainStats.length}`)
      
      if (domainStats.length === 0) {
        console.log('   ❌ No stats found')
      } else {
        console.log('\n   Last 5 days:')
        domainStats.slice(-5).forEach(stat => {
          console.log(`   • ${stat.date}: ${stat.totalChecks} checks, ${stat.uptime}% uptime`)
        })
        
        // Check for today
        const today = new Date().toISOString().split('T')[0]
        const todayStats = domainStats.find(s => s.date === today)
        
        if (todayStats) {
          console.log(`\n   ✅ Today (${today}): ${todayStats.totalChecks} checks`)
        } else {
          console.log(`\n   ⚠️  No data for today (${today})`)
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkMultipleDomains()
