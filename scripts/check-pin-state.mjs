import { initializeApp } from 'firebase/app'
import { getFirestore, doc, getDoc } from 'firebase/firestore'

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

console.log('\n📌 Checking pin state from Firebase...\n')

async function checkPinState() {
  try {
    const userId = 'default-user'
    const userDocRef = doc(db, 'domains', userId)
    const docSnap = await getDoc(userDocRef)
    
    if (!docSnap.exists()) {
      console.log('❌ Document tidak ditemukan di Firebase!')
      return
    }
    
    const data = docSnap.data()
    const domains = data.domains || []
    
    console.log(`✅ Total domains: ${domains.length}`)
    
    // Filter hanya yang pinned
    const pinnedDomains = domains.filter(d => d.pinned === true)
    
    console.log(`📌 Pinned domains: ${pinnedDomains.length}\n`)
    
    if (pinnedDomains.length > 0) {
      console.log('Pinned domains:')
      pinnedDomains.forEach((domain, index) => {
        console.log(`${index + 1}. ${domain.url}`)
        console.log(`   ID: ${domain.id}`)
        console.log(`   Group: ${domain.group || 'No group'}`)
        console.log(`   Pinned: ${domain.pinned}`)
        console.log('')
      })
    } else {
      console.log('ℹ️  Tidak ada domain yang di-pin saat ini.')
    }
    
    // Show recent 5 domains untuk reference
    console.log('\n📋 Recent 5 domains (for reference):')
    domains.slice(0, 5).forEach((domain, index) => {
      console.log(`${index + 1}. ${domain.url} - Pinned: ${domain.pinned ? '✅' : '❌'}`)
    })
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

checkPinState().then(() => process.exit(0))
