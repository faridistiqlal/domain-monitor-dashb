import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, query, limit, where } from 'firebase/firestore'

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

const searchTerm = process.argv[2]

console.log(`\n📋 Listing domains dari Firebase...${searchTerm ? ` (filter: ${searchTerm})` : ''}\n`)

async function listDomains() {
  try {
    const domainsRef = collection(db, 'domains')
    let domainsQuery = query(domainsRef, limit(50))
    
    const domainsSnap = await getDocs(domainsQuery)
    
    if (domainsSnap.empty) {
      console.log('❌ Tidak ada domain di Firebase!')
      return
    }
    
    console.log(`✅ Total domains: ${domainsSnap.size}\n`)
    
    let filtered = domainsSnap.docs
    if (searchTerm) {
      filtered = filtered.filter(doc => 
        doc.data().url?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      console.log(`🔍 Hasil filter "${searchTerm}": ${filtered.length} domain\n`)
    }
    
    filtered.forEach((doc, index) => {
      const data = doc.data()
      console.log(`${index + 1}. ID: ${doc.id}`)
      console.log(`   URL: ${data.url}`)
      console.log(`   Status: ${data.status || 'N/A'}`)
      console.log(`   Group: ${data.group || 'N/A'}`)
      console.log(`   Individual Monitoring: ${data.enabled ? 'ON ✅' : 'OFF ❌'}`)
      console.log(`   Last Checked: ${data.lastChecked ? new Date(data.lastChecked).toLocaleString('id-ID') : 'Never'}`)
      console.log('')
    })
    
    console.log(`\n📝 Gunakan: node check-firebase-data.mjs "<url-exact>" untuk detail\n`)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

listDomains().then(() => process.exit(0))
