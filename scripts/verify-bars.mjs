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

async function verifyBars() {
  const domainsRef = collection(db, 'domains')
  const domainsSnap = await getDocs(domainsRef)
  const domains = domainsSnap.docs[0]?.data()?.domains || []
  
  const ppid = domains.find(d => d.url === 'ppid.kendalkab.go.id')
  
  if (!ppid) return
  
  const statsRef = collection(db, 'domain-stats-daily')
  const q = query(statsRef, where('domainId', '==', ppid.id))
  const snapshot = await getDocs(q)
  
  const stats = snapshot.docs.map(doc => doc.data())
    .sort((a, b) => a.date.localeCompare(b.date))
  
  console.log('\n📊 Data ppid.kendalkab.go.id untuk UptimeBar:\n')
  console.log(`Total records: ${stats.length}`)
  console.log('\nDates with data:')
  
  stats.forEach((s, i) => {
    let color = '⚫ Grey'
    const uptime = s.uptimePercent
    
    if (uptime >= 95) color = '🟢 Green'
    else if (uptime >= 80) color = '🟡 Yellow'
    else if (uptime >= 50) color = '🟠 Orange'
    else if (uptime >= 0) color = '🔴 Red'
    
    console.log(`${i + 1}. ${s.date}: ${uptime?.toFixed(1)}% → ${color}`)
  })
  
  console.log('\nMissing dates:')
  const today = new Date()
  for (let i = 0; i < 7; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    
    if (!stats.find(s => s.date === dateStr)) {
      console.log(`  - ${dateStr}: NO DATA (will show grey bar)`)
    }
  }
  
  console.log(`\n✅ Seharusnya tampil: ${stats.length} colored bars + grey bars untuk missing dates`)
}

verifyBars().then(() => process.exit(0))
