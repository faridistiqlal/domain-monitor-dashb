import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc,
  query,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore'
import { db, COLLECTIONS } from './firebase'
import { Domain, DomainGroup, DomainTag } from './types'

// Get current user ID (from localStorage for now)
const getUserId = () => {
  return localStorage.getItem('app-current-user-id') || 'default-user'
}

// === DOMAINS ===

export const syncDomainsToFirestore = async (domains: Domain[]) => {
  const userId = getUserId()
  const userDocRef = doc(db, COLLECTIONS.DOMAINS, userId)
  
  try {
    // Clean undefined values (Firebase doesn't accept undefined)
    const cleanDomains = domains.map(domain => {
      const cleaned: any = {}
      Object.keys(domain).forEach(key => {
        const value = (domain as any)[key]
        if (value !== undefined) {
          cleaned[key] = value
        }
      })
      return cleaned as Domain
    })
    
    await setDoc(userDocRef, {
      domains: cleanDomains,
      updatedAt: Date.now()
    }, { merge: true })
    return true
  } catch (error) {
    console.error('Error syncing domains:', error)
    return false
  }
}

export const getDomainsFromFirestore = async (): Promise<Domain[]> => {
  const userId = getUserId()
  const userDocRef = doc(db, COLLECTIONS.DOMAINS, userId)
  
  try {
    const docSnap = await getDoc(userDocRef)
    if (docSnap.exists()) {
      return docSnap.data().domains || []
    }
    return []
  } catch (error) {
    console.error('Error getting domains:', error)
    return []
  }
}

// Real-time listeners removed - app uses polling strategy for better Firebase quota management
// If you need real-time updates in the future, uncomment and use these functions:
// export const subscribeToDomainsUpdates = (callback: (domains: Domain[]) => void): Unsubscribe => {
//   const userId = getUserId()
//   const userDocRef = doc(db, COLLECTIONS.DOMAINS, userId)
//   return onSnapshot(userDocRef, (doc) => {
//     if (doc.exists()) callback(doc.data().domains || [])
//   })
// }

// === GROUPS ===

export const syncGroupsToFirestore = async (groups: DomainGroup[]) => {
  const userId = getUserId()
  const userDocRef = doc(db, COLLECTIONS.GROUPS, userId)
  
  try {
    // Clean undefined fields from groups (Firebase doesn't accept undefined)
    const cleanedGroups = groups.map(group => {
      const cleaned: any = {
        id: group.id,
        name: group.name,
        color: group.color,
        createdAt: group.createdAt
      }
      // Only add description if it's defined
      if (group.description !== undefined && group.description !== null) {
        cleaned.description = group.description
      }
      return cleaned
    })
    
    await setDoc(userDocRef, {
      groups: cleanedGroups,
      updatedAt: Date.now()
    }, { merge: true })
    return true
  } catch (error) {
    console.error('Error syncing groups:', error)
    return false
  }
}

export const getGroupsFromFirestore = async (): Promise<DomainGroup[]> => {
  const userId = getUserId()
  const userDocRef = doc(db, COLLECTIONS.GROUPS, userId)
  
  try {
    const docSnap = await getDoc(userDocRef)
    if (docSnap.exists()) {
      return docSnap.data().groups || []
    }
    return []
  } catch (error) {
    console.error('Error getting groups:', error)
    return []
  }
}

// export const subscribeToGroupsUpdates = (callback: (groups: DomainGroup[]) => void): Unsubscribe => {
//   const userId = getUserId()
//   const userDocRef = doc(db, COLLECTIONS.GROUPS, userId)
//   return onSnapshot(userDocRef, (doc) => {
//     if (doc.exists()) callback(doc.data().groups || [])
//   })
// }

// === TAGS ===

export const syncTagsToFirestore = async (tags: DomainTag[]) => {
  const userId = getUserId()
  const userDocRef = doc(db, COLLECTIONS.TAGS, userId)
  
  try {
    await setDoc(userDocRef, {
      tags: tags,
      updatedAt: Date.now()
    }, { merge: true })
    return true
  } catch (error) {
    console.error('Error syncing tags:', error)
    return false
  }
}

export const getTagsFromFirestore = async (): Promise<DomainTag[]> => {
  const userId = getUserId()
  const userDocRef = doc(db, COLLECTIONS.TAGS, userId)
  
  try {
    const docSnap = await getDoc(userDocRef)
    if (docSnap.exists()) {
      return docSnap.data().tags || []
    }
    return []
  } catch (error) {
    console.error('Error getting tags:', error)
    return []
  }
}

// export const subscribeToTagsUpdates = (callback: (tags: DomainTag[]) => void): Unsubscribe => {
//   const userId = getUserId()
//   const userDocRef = doc(db, COLLECTIONS.TAGS, userId)
//   return onSnapshot(userDocRef, (doc) => {
//     if (doc.exists()) callback(doc.data().tags || [])
//   })
// }

// === HYBRID SYNC (localStorage fallback) ===

export const loadDomains = async (): Promise<Domain[]> => {
  try {
    const firebaseDomains = await getDomainsFromFirestore()
    if (firebaseDomains.length > 0) {
      return firebaseDomains
    }
  } catch (error) {
    console.log('Firebase not available, using localStorage')
  }
  
  // Fallback to localStorage
  const saved = localStorage.getItem('monitoring-domains')
  return saved ? JSON.parse(saved) : []
}

export const loadGroups = async (): Promise<DomainGroup[]> => {
  try {
    const firebaseGroups = await getGroupsFromFirestore()
    if (firebaseGroups.length > 0) {
      return firebaseGroups
    }
  } catch (error) {
    console.log('Firebase not available, using localStorage')
  }
  
  // Fallback to localStorage
  const saved = localStorage.getItem('domain-groups')
  return saved ? JSON.parse(saved) : []
}

export const loadTags = async (): Promise<DomainTag[]> => {
  try {
    const firebaseTags = await getTagsFromFirestore()
    if (firebaseTags.length > 0) {
      return firebaseTags
    }
  } catch (error) {
    console.log('Firebase not available, using localStorage')
  }
  
  // Fallback to localStorage
  const saved = localStorage.getItem('domain-tags')
  return saved ? JSON.parse(saved) : []
}

// === USER SETTINGS (Password) ===

export const syncPasswordToFirestore = async (password: string) => {
  const userId = getUserId()
  const userDocRef = doc(db, COLLECTIONS.USERS, userId)
  
  try {
    await setDoc(userDocRef, {
      password: password,
      updatedAt: Date.now()
    }, { merge: true })
    console.log('✅ Password synced to Firebase')
    return true
  } catch (error) {
    console.error('❌ Error syncing password:', error)
    return false
  }
}

export const getPasswordFromFirestore = async (): Promise<string | null> => {
  const userId = getUserId()
  const userDocRef = doc(db, COLLECTIONS.USERS, userId)
  
  try {
    const docSnap = await getDoc(userDocRef)
    if (docSnap.exists() && docSnap.data().password) {
      return docSnap.data().password
    }
    return null
  } catch (error) {
    console.error('❌ Error getting password:', error)
    return null
  }
}

export const loadPassword = async (): Promise<string> => {
  try {
    const firebasePassword = await getPasswordFromFirestore()
    if (firebasePassword) {
      // Sync to localStorage
      localStorage.setItem('app-password', firebasePassword)
      return firebasePassword
    }
  } catch (error) {
    console.log('Firebase not available, using localStorage')
  }
  
  // Fallback to localStorage
  return localStorage.getItem('app-password') || 'admin123'
}
