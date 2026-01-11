import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs } from 'firebase/firestore'

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

const targetUrl = 'dokar.kendalkab.go.id'

async function findDomainBatch() {
  try {
    const domainsRef = collection(db, 'domains')
    const snapshot = await getDocs(domainsRef)
    
    let found = null
    snapshot.docs.forEach(doc => {
      const data = doc.data()
      if (data.domains && Array.isArray(data.domains)) {
        const domain = data.domains.find(d => d.url === targetUrl)
        if (domain) {
          found = domain
        }
      }
    })
    
    if (found) {
      console.log(`✅ Domain: ${found.url}`)
      console.log(`   Batch: B${found.checkBatch}`)
      console.log(`   Domain ID: ${found.id}`)
    } else {
      console.log('❌ Domain tidak ditemukan')
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

findDomainBatch()
