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

console.log('\n🔍 Memeriksa semua collections di Firebase...\n')

async function checkAllCollections() {
  try {
    const collections = [
      'domains',
      'domain-stats-daily',
      'domain-incidents',
      'groups',
      'tags',
      'users'
    ]
    
    for (const collectionName of collections) {
      const colRef = collection(db, collectionName)
      const snapshot = await getDocs(colRef)
      
      console.log(`📦 Collection: ${collectionName}`)
      console.log(`   Total documents: ${snapshot.size}`)
      
      if (snapshot.size > 0 && snapshot.size <= 5) {
        console.log('   Documents:')
        snapshot.docs.forEach((doc, i) => {
          console.log(`   ${i + 1}. ID: ${doc.id}`)
          const data = doc.data()
          // Show first few fields
          const keys = Object.keys(data).slice(0, 3)
          keys.forEach(key => {
            let value = data[key]
            if (typeof value === 'object' && value !== null) {
              value = JSON.stringify(value).substring(0, 50) + '...'
            }
            console.log(`      ${key}: ${value}`)
          })
        })
      }
      console.log('')
    }
    
    console.log('\n✅ Check selesai!\n')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

checkAllCollections().then(() => process.exit(0))
