import { initializeApp } from 'firebase/app'
import { getFirestore, doc, getDoc, collection, getDocs } from 'firebase/firestore'

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

const userId = 'default-user' // Default user ID dari app

console.log(`\n🔍 Checking User Data (userId: ${userId})\n`)
console.log('=' .repeat(70))

async function checkUserData() {
  try {
    // 1. Check Groups
    console.log('\n📁 GROUPS:')
    console.log('-'.repeat(70))
    const groupsDocRef = doc(db, 'groups', userId)
    const groupsSnap = await getDoc(groupsDocRef)
    
    if (groupsSnap.exists()) {
      const groupsData = groupsSnap.data()
      const groups = groupsData.groups || []
      
      console.log(`✅ Found ${groups.length} groups:`)
      groups.forEach((group, index) => {
        console.log(`\n   ${index + 1}. ${group.name}`)
        console.log(`      ID: ${group.id}`)
        console.log(`      Color: ${group.color}`)
        console.log(`      Description: ${group.description || 'N/A'}`)
        console.log(`      Created: ${new Date(group.createdAt).toLocaleString('id-ID')}`)
      })
    } else {
      console.log('❌ No groups found (document does not exist)')
    }

    // 2. Check Tags
    console.log('\n\n🏷️  TAGS:')
    console.log('-'.repeat(70))
    const tagsDocRef = doc(db, 'tags', userId)
    const tagsSnap = await getDoc(tagsDocRef)
    
    if (tagsSnap.exists()) {
      const tagsData = tagsSnap.data()
      const tags = tagsData.tags || []
      
      console.log(`✅ Found ${tags.length} tags:`)
      tags.forEach((tag, index) => {
        console.log(`\n   ${index + 1}. ${tag.name}`)
        console.log(`      ID: ${tag.id}`)
        console.log(`      Color: ${tag.color}`)
        console.log(`      Created: ${new Date(tag.createdAt).toLocaleString('id-ID')}`)
      })
    } else {
      console.log('❌ No tags found (document does not exist)')
    }

    // 3. Check Domains (with pin, group, tags info)
    console.log('\n\n🌐 DOMAINS (with pin/group/tags):')
    console.log('-'.repeat(70))
    const domainsDocRef = doc(db, 'domains', userId)
    const domainsSnap = await getDoc(domainsDocRef)
    
    if (domainsSnap.exists()) {
      const domainsData = domainsSnap.data()
      const domains = domainsData.domains || []
      
      // Count stats
      const pinnedDomains = domains.filter(d => d.pinned)
      const groupedDomains = domains.filter(d => d.groupId)
      const taggedDomains = domains.filter(d => d.tags && d.tags.length > 0)
      
      console.log(`✅ Found ${domains.length} total domains`)
      console.log(`   📌 ${pinnedDomains.length} pinned domains`)
      console.log(`   📁 ${groupedDomains.length} domains in groups`)
      console.log(`   🏷️  ${taggedDomains.length} domains with tags`)
      
      // Show pinned domains
      if (pinnedDomains.length > 0) {
        console.log('\n   📌 PINNED DOMAINS:')
        pinnedDomains.forEach((domain, index) => {
          console.log(`      ${index + 1}. ${domain.url}`)
          if (domain.groupId) console.log(`         Group: ${domain.groupId}`)
          if (domain.tags && domain.tags.length > 0) console.log(`         Tags: ${domain.tags.join(', ')}`)
        })
      }
      
      // Show domains by group
      if (groupedDomains.length > 0) {
        console.log('\n   📁 DOMAINS BY GROUP:')
        const groupMap = {}
        groupedDomains.forEach(domain => {
          if (!groupMap[domain.groupId]) {
            groupMap[domain.groupId] = []
          }
          groupMap[domain.groupId].push(domain.url)
        })
        
        Object.entries(groupMap).forEach(([groupId, urls]) => {
          console.log(`      Group ID: ${groupId}`)
          console.log(`         Domains (${urls.length}): ${urls.slice(0, 3).join(', ')}${urls.length > 3 ? ` ... +${urls.length - 3} more` : ''}`)
        })
      }
      
      // Show domains by tag
      if (taggedDomains.length > 0) {
        console.log('\n   🏷️  DOMAINS BY TAG:')
        const tagMap = {}
        taggedDomains.forEach(domain => {
          domain.tags.forEach(tagId => {
            if (!tagMap[tagId]) {
              tagMap[tagId] = []
            }
            tagMap[tagId].push(domain.url)
          })
        })
        
        Object.entries(tagMap).forEach(([tagId, urls]) => {
          console.log(`      Tag ID: ${tagId}`)
          console.log(`         Domains (${urls.length}): ${urls.slice(0, 3).join(', ')}${urls.length > 3 ? ` ... +${urls.length - 3} more` : ''}`)
        })
      }
      
    } else {
      console.log('❌ No domains found (document does not exist)')
    }

    console.log('\n' + '='.repeat(70))
    console.log('✅ Check complete!\n')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

checkUserData()
