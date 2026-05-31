import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore'
import { db, COLLECTIONS } from './firebase'
import { Domain, DomainGroup, DomainTag, ManagedUser, AuditLogEntry, ManagedUserRole, UserPermissions, MonitoringControl } from './types'

// Shared data owner for domains/groups/tags
const getSharedDataUserId = () => {
  return 'default-user'
}

// Get current authenticated user ID (from localStorage)
const getCurrentUserId = () => {
  return localStorage.getItem('app-current-auth-uid') || localStorage.getItem('app-current-user-id') || 'default-user'
}

const USER_DIRECTORY_DOC_ID = 'user-directory'
const MAX_WRITE_RETRIES = 3
const BASE_RETRY_MS = 350

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const isRetryableFirestoreError = (error: unknown): boolean => {
  const code = (error as { code?: string } | undefined)?.code
  return code === 'aborted'
    || code === 'unavailable'
    || code === 'deadline-exceeded'
    || code === 'resource-exhausted'
}

const isPermissionDeniedError = (error: unknown): boolean => {
  const code = (error as { code?: string } | undefined)?.code
  return code === 'permission-denied'
}

const logFirestoreReadError = (label: string, error: unknown) => {
  if (isPermissionDeniedError(error)) {
    console.info(`${label}: permission denied (expected before login or without profile)`)
    return
  }
  console.error(label, error)
}

const runWithRetry = async <T>(task: () => Promise<T>): Promise<T> => {
  let lastError: unknown

  for (let attempt = 0; attempt < MAX_WRITE_RETRIES; attempt += 1) {
    try {
      return await task()
    } catch (error) {
      lastError = error
      if (!isRetryableFirestoreError(error) || attempt === MAX_WRITE_RETRIES - 1) {
        throw error
      }

      const backoffMs = BASE_RETRY_MS * Math.pow(2, attempt)
      const jitterMs = Math.floor(Math.random() * 120)
      await sleep(backoffMs + jitterMs)
    }
  }

  throw lastError
}

const removeUndefinedDeep = <T>(value: T): T => {
  if (Array.isArray(value)) {
    return value.map(item => removeUndefinedDeep(item)) as T
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entryValue]) => entryValue !== undefined)
      .map(([entryKey, entryValue]) => [entryKey, removeUndefinedDeep(entryValue)])

    return Object.fromEntries(entries) as T
  }

  return value
}

const normalizeManagedUser = (user: ManagedUser): ManagedUser => {
  const normalized: ManagedUser = {
    id: user.id,
    username: user.username,
    role: user.role,
    permissions: {
      canView: !!user.permissions?.canView,
      canAddDomain: !!user.permissions?.canAddDomain,
      canEdit: !!user.permissions?.canEdit,
      canManageUsers: !!user.permissions?.canManageUsers,
    },
    isActive: user.isActive !== false,
    revision: typeof user.revision === 'number' ? user.revision : 1,
    createdAt: typeof user.createdAt === 'number' ? user.createdAt : Date.now(),
    updatedAt: typeof user.updatedAt === 'number' ? user.updatedAt : Date.now(),
  }

  if (typeof user.password === 'string') normalized.password = user.password
  if (typeof user.email === 'string') normalized.email = user.email
  if (typeof user.authUid === 'string') normalized.authUid = user.authUid
  if (typeof user.createdBy === 'string') normalized.createdBy = user.createdBy

  return normalized
}

export interface ManagedUsersSnapshot {
  users: ManagedUser[]
  revision: number
}

export interface ManagedUsersWriteResult {
  ok: boolean
  revision: number
  conflict?: boolean
}

export interface UserAccessProfile {
  appUserId?: string
  username?: string
  email?: string | null
  role?: ManagedUserRole
  permissions?: UserPermissions
  isActive?: boolean
  updatedAt?: number
}

export interface UserAccessProfileMatch extends UserAccessProfile {
  authUid: string
}

const toPermissionsByRole = (role: ManagedUserRole): UserPermissions => {
  if (role === 'admin') {
    return {
      canView: true,
      canAddDomain: true,
      canEdit: true,
      canManageUsers: true,
    }
  }

  if (role === 'add-only') {
    return {
      canView: true,
      canAddDomain: true,
      canEdit: false,
      canManageUsers: false,
    }
  }

  return {
    canView: true,
    canAddDomain: false,
    canEdit: false,
    canManageUsers: false,
  }
}

const normalizeRole = (value: unknown): ManagedUserRole => {
  if (value === 'admin' || value === 'viewer' || value === 'add-only') {
    return value
  }
  return 'viewer'
}

// === DOMAINS ===

export const syncDomainsToFirestore = async (domains: Domain[]) => {
  const userId = getSharedDataUserId()
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
  const userId = getSharedDataUserId()
  const userDocRef = doc(db, COLLECTIONS.DOMAINS, userId)
  
  try {
    const docSnap = await getDoc(userDocRef)
    if (docSnap.exists()) {
      return docSnap.data().domains || []
    }
    return []
  } catch (error) {
    logFirestoreReadError('Error getting domains', error)
    throw error
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
  const userId = getSharedDataUserId()
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
  const userId = getSharedDataUserId()
  const userDocRef = doc(db, COLLECTIONS.GROUPS, userId)
  
  try {
    const docSnap = await getDoc(userDocRef)
    if (docSnap.exists()) {
      return docSnap.data().groups || []
    }
    return []
  } catch (error) {
    logFirestoreReadError('Error getting groups', error)
    throw error
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
  const userId = getSharedDataUserId()
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
  const userId = getSharedDataUserId()
  const userDocRef = doc(db, COLLECTIONS.TAGS, userId)
  
  try {
    const docSnap = await getDoc(userDocRef)
    if (docSnap.exists()) {
      return docSnap.data().tags || []
    }
    return []
  } catch (error) {
    logFirestoreReadError('Error getting tags', error)
    throw error
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
    console.log('[loadGroups] Got from Firebase:', firebaseGroups.length, 'groups')
    // Always return Firebase data (even empty array) - it's the source of truth
    return firebaseGroups
  } catch (error) {
    console.log('[loadGroups] Firebase error, using localStorage fallback:', error)
    // Only fallback to localStorage if Firebase completely fails
    const saved = localStorage.getItem('domain-groups')
    return saved ? JSON.parse(saved) : []
  }
}

export const loadTags = async (): Promise<DomainTag[]> => {
  try {
    const firebaseTags = await getTagsFromFirestore()
    console.log('[loadTags] Got from Firebase:', firebaseTags.length, 'tags')
    // Always return Firebase data (even empty array) - it's the source of truth
    return firebaseTags
  } catch (error) {
    console.log('[loadTags] Firebase error, using localStorage fallback:', error)
    // Only fallback to localStorage if Firebase completely fails
    const saved = localStorage.getItem('domain-tags')
    return saved ? JSON.parse(saved) : []
  }
}

// === USER SETTINGS (Password) ===

export const syncPasswordToFirestore = async (password: string) => {
  const userId = getCurrentUserId()
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
  const userId = getCurrentUserId()
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
  return localStorage.getItem('app-password') || ''
}

// === NOTIFICATION SETTINGS ===

export const syncNotificationSettingsToFirestore = async (settings: any) => {
  const userId = getCurrentUserId()
  const userDocRef = doc(db, COLLECTIONS.USERS, userId)
  
  try {
    await setDoc(userDocRef, {
      notificationSettings: settings,
      updatedAt: Date.now()
    }, { merge: true })
    console.log('✅ Notification settings synced to Firebase')
    return true
  } catch (error) {
    console.error('❌ Error syncing notification settings:', error)
    return false
  }
}

export const getNotificationSettingsFromFirestore = async (): Promise<any | null> => {
  const userId = getCurrentUserId()
  const userDocRef = doc(db, COLLECTIONS.USERS, userId)
  
  try {
    const docSnap = await getDoc(userDocRef)
    if (docSnap.exists() && docSnap.data().notificationSettings) {
      return docSnap.data().notificationSettings
    }
    return null
  } catch (error) {
    logFirestoreReadError('Error getting notification settings', error)
    return null
  }
}

export const loadNotificationSettings = async (): Promise<any | null> => {
  console.log('[loadNotificationSettings] Starting...')
  try {
    const firebaseSettings = await getNotificationSettingsFromFirestore()
    if (firebaseSettings) {
      // Sync to localStorage for offline access
      localStorage.setItem('notification-settings', JSON.stringify(firebaseSettings))
      console.log('✅ Loaded notification settings from Firebase')
      return firebaseSettings
    } else {
      console.log('[loadNotificationSettings] No settings in Firebase')
    }
  } catch (error) {
    console.error('[loadNotificationSettings] Firebase error:', error)
  }
  
  // Fallback to localStorage
  console.log('[loadNotificationSettings] Checking localStorage...')
  const saved = localStorage.getItem('notification-settings')
  const result = saved ? JSON.parse(saved) : null
  console.log('[loadNotificationSettings] Loaded from localStorage:', !!result)
  return result
}

// === GLOBAL MONITORING CONTROL ===

const MONITORING_CONTROL_CACHE_KEY = 'monitoring-control'

export const syncMonitoringControlToFirestore = async (enabled: boolean) => {
  const userDocRef = doc(db, COLLECTIONS.USERS, getSharedDataUserId())
  const payload: MonitoringControl = {
    enabled,
    updatedAt: Date.now(),
    updatedBy: getCurrentUserId(),
  }

  try {
    await setDoc(userDocRef, {
      monitoringControl: payload,
      updatedAt: Date.now(),
    }, { merge: true })

    localStorage.setItem(MONITORING_CONTROL_CACHE_KEY, JSON.stringify(payload))
    console.log('✅ Monitoring control synced to Firebase')
    return {
      ok: true as const,
    }
  } catch (error) {
    const firestoreError = error as { code?: string; message?: string } | undefined
    console.error('❌ Error syncing monitoring control:', firestoreError)
    return {
      ok: false as const,
      code: firestoreError?.code,
      message: firestoreError?.message,
    }
  }
}

export const getMonitoringControlFromFirestore = async (): Promise<MonitoringControl | null> => {
  const userDocRef = doc(db, COLLECTIONS.USERS, getSharedDataUserId())

  try {
    const docSnap = await getDoc(userDocRef)
    if (!docSnap.exists()) {
      return null
    }

    const data = docSnap.data().monitoringControl
    if (!data || typeof data.enabled !== 'boolean') {
      return null
    }

    return {
      enabled: data.enabled,
      updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : Date.now(),
      updatedBy: typeof data.updatedBy === 'string' ? data.updatedBy : undefined,
    }
  } catch (error) {
    logFirestoreReadError('Error getting monitoring control', error)
    return null
  }
}

export const loadMonitoringControl = async (): Promise<MonitoringControl> => {
  try {
    const firebaseControl = await getMonitoringControlFromFirestore()
    if (firebaseControl) {
      localStorage.setItem(MONITORING_CONTROL_CACHE_KEY, JSON.stringify(firebaseControl))
      return firebaseControl
    }
  } catch (error) {
    console.warn('[loadMonitoringControl] Firebase unavailable, using local cache', error)
  }

  const cached = localStorage.getItem(MONITORING_CONTROL_CACHE_KEY)
  if (cached) {
    try {
      const parsed = JSON.parse(cached) as MonitoringControl
      if (typeof parsed.enabled === 'boolean') {
        return {
          enabled: parsed.enabled,
          updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : Date.now(),
          updatedBy: typeof parsed.updatedBy === 'string' ? parsed.updatedBy : undefined,
        }
      }
    } catch {
      // ignore parse errors and fallback to default
    }
  }

  return {
    enabled: true,
    updatedAt: Date.now(),
  }
}

// === USER DIRECTORY (MANAGEMENT) ===

export const getManagedUsersFromFirestore = async (): Promise<ManagedUser[]> => {
  const snapshot = await getManagedUsersSnapshotFromFirestore()
  return snapshot.users
}

export const getManagedUsersSnapshotFromFirestore = async (): Promise<ManagedUsersSnapshot> => {
  const userDirectoryRef = doc(db, COLLECTIONS.USERS, USER_DIRECTORY_DOC_ID)

  try {
    const docSnap = await getDoc(userDirectoryRef)
    if (!docSnap.exists()) {
      return { users: [], revision: 0 }
    }

    const data = docSnap.data()
    const users = Array.isArray(data.users)
      ? (data.users as ManagedUser[]).map(normalizeManagedUser)
      : []
    const revision = typeof data.revision === 'number' ? data.revision : 0
    return { users, revision }
  } catch (error) {
    logFirestoreReadError('Error getting managed users snapshot', error)
    throw error
  }
}

export const syncManagedUsersWithRevision = async (
  users: ManagedUser[],
  expectedRevision: number,
): Promise<ManagedUsersWriteResult> => {
  const userDirectoryRef = doc(db, COLLECTIONS.USERS, USER_DIRECTORY_DOC_ID)

  try {
    return await runWithRetry(async () => {
      const latestSnapshot = await getManagedUsersSnapshotFromFirestore()
      if (latestSnapshot.revision !== expectedRevision) {
        return {
          ok: false,
          conflict: true,
          revision: latestSnapshot.revision,
        }
      }

      const nextRevision = expectedRevision + 1
      const normalizedUsers = users.map(normalizeManagedUser).map(user => removeUndefinedDeep(user))

      await setDoc(userDirectoryRef, {
        users: normalizedUsers,
        revision: nextRevision,
        updatedAt: Date.now(),
        updatedBy: getCurrentUserId(),
      }, { merge: true })

      return {
        ok: true,
        revision: nextRevision,
      }
    })
  } catch (error) {
    console.error('Error syncing managed users with revision:', error)
    return {
      ok: false,
      revision: expectedRevision,
    }
  }
}

export const syncManagedUsersToFirestore = async (users: ManagedUser[]) => {
  const userDirectoryRef = doc(db, COLLECTIONS.USERS, USER_DIRECTORY_DOC_ID)

  try {
    await runWithRetry(async () => {
      const normalizedUsers = users.map(normalizeManagedUser).map(user => removeUndefinedDeep(user))
      await setDoc(userDirectoryRef, {
        users: normalizedUsers,
        updatedAt: Date.now(),
        updatedBy: getCurrentUserId(),
      }, { merge: true })
    })

    return true
  } catch (error) {
    console.error('Error syncing managed users:', error)
    return false
  }
}

export const syncUserAccessProfileToFirestore = async (authUid: string, profile: {
  appUserId: string
  username: string
  email?: string
  role: string
  permissions: UserPermissions
  isActive: boolean
}) => {
  const userDocRef = doc(db, COLLECTIONS.USERS, authUid)

  try {
    await setDoc(userDocRef, {
      appUserId: profile.appUserId,
      username: profile.username,
      email: profile.email || null,
      role: profile.role,
      permissions: profile.permissions,
      isActive: profile.isActive,
      updatedAt: Date.now(),
    }, { merge: true })

    return true
  } catch (error) {
    console.error('Error syncing user access profile:', error)
    return false
  }
}

export const syncUserActiveStateByAppUserId = async (appUserId: string, isActive: boolean): Promise<boolean> => {
  try {
    const usersRef = collection(db, COLLECTIONS.USERS)
    const q = query(usersRef, where('appUserId', '==', appUserId))
    const snapshot = await getDocs(q)

    if (snapshot.empty) {
      return false
    }

    await Promise.all(
      snapshot.docs
        .filter(docSnap => docSnap.id !== USER_DIRECTORY_DOC_ID)
        .map(docSnap =>
          setDoc(doc(db, COLLECTIONS.USERS, docSnap.id), {
            isActive,
            updatedAt: Date.now(),
          }, { merge: true })
        )
    )

    return true
  } catch (error) {
    console.error('Error syncing user active state by appUserId:', error)
    return false
  }
}

export const revokeUserAccessProfile = async (payload: {
  appUserId: string
  authUid?: string
  username?: string
  email?: string
}): Promise<boolean> => {
  const revokedProfilePayload = {
    appUserId: payload.appUserId,
    username: payload.username,
    email: payload.email || null,
    role: 'viewer',
    permissions: {
      canView: false,
      canAddDomain: false,
      canEdit: false,
      canManageUsers: false,
    },
    isActive: false,
    updatedAt: Date.now(),
  }

  try {
    const updateTasks: Promise<unknown>[] = []

    if (payload.authUid && payload.authUid !== USER_DIRECTORY_DOC_ID) {
      updateTasks.push(
        setDoc(doc(db, COLLECTIONS.USERS, payload.authUid), revokedProfilePayload, { merge: true })
      )
    }

    const usersRef = collection(db, COLLECTIONS.USERS)
    const q = query(usersRef, where('appUserId', '==', payload.appUserId))
    const snapshot = await getDocs(q)

    snapshot.docs
      .filter(docSnap => docSnap.id !== USER_DIRECTORY_DOC_ID && docSnap.id !== payload.authUid)
      .forEach(docSnap => {
        updateTasks.push(
          setDoc(doc(db, COLLECTIONS.USERS, docSnap.id), revokedProfilePayload, { merge: true })
        )
      })

    if (updateTasks.length === 0) {
      return false
    }

    await Promise.all(updateTasks)
    return true
  } catch (error) {
    console.error('Error revoking user access profile:', error)
    return false
  }
}

export const getUserAccessProfileByUid = async (authUid: string): Promise<UserAccessProfile | null> => {
  const userDocRef = doc(db, COLLECTIONS.USERS, authUid)

  try {
    const docSnap = await getDoc(userDocRef)
    if (!docSnap.exists()) {
      return null
    }

    const data = docSnap.data()
    const role = normalizeRole(data.role)
    const permissions = (data.permissions && typeof data.permissions === 'object')
      ? {
          canView: !!data.permissions.canView,
          canAddDomain: !!data.permissions.canAddDomain,
          canEdit: !!data.permissions.canEdit,
          canManageUsers: !!data.permissions.canManageUsers,
        }
      : toPermissionsByRole(role)

    return {
      appUserId: typeof data.appUserId === 'string' ? data.appUserId : undefined,
      username: typeof data.username === 'string' ? data.username : undefined,
      email: typeof data.email === 'string' ? data.email : null,
      role,
      permissions,
      isActive: data.isActive !== false,
      updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : undefined,
    }
  } catch (error) {
    console.error('Error getting user access profile:', error)
    return null
  }
}

export const findUserAccessProfileByUsername = async (username: string): Promise<UserAccessProfileMatch | null> => {
  const normalizedUsername = username.trim().toLowerCase()
  if (!normalizedUsername) {
    return null
  }

  try {
    const usersRef = collection(db, COLLECTIONS.USERS)
    const snapshot = await getDocs(usersRef)
    const matchedDoc = snapshot.docs.find(docSnap => {
      if (docSnap.id === USER_DIRECTORY_DOC_ID) {
        return false
      }

      const data = docSnap.data()
      return typeof data.username === 'string' && data.username.toLowerCase() === normalizedUsername
    })

    if (!matchedDoc) {
      return null
    }

    const data = matchedDoc.data()
    const role = normalizeRole(data.role)
    const permissions = (data.permissions && typeof data.permissions === 'object')
      ? {
          canView: !!data.permissions.canView,
          canAddDomain: !!data.permissions.canAddDomain,
          canEdit: !!data.permissions.canEdit,
          canManageUsers: !!data.permissions.canManageUsers,
        }
      : toPermissionsByRole(role)

    return {
      authUid: matchedDoc.id,
      appUserId: typeof data.appUserId === 'string' ? data.appUserId : undefined,
      username: typeof data.username === 'string' ? data.username : undefined,
      email: typeof data.email === 'string' ? data.email : null,
      role,
      permissions,
      isActive: data.isActive !== false,
      updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : undefined,
    }
  } catch (error) {
    console.error('Error finding user access profile by username:', error)
    return null
  }
}

export const loadManagedUsers = async (): Promise<ManagedUser[]> => {
  try {
    const firebaseUsers = await getManagedUsersFromFirestore()
    if (firebaseUsers.length >= 0) {
      localStorage.setItem('managed-users-cache', JSON.stringify(firebaseUsers))
      return firebaseUsers
    }
  } catch (error) {
    console.log('Firebase managed users not available, using localStorage fallback')
  }

  const saved = localStorage.getItem('managed-users-cache')
  return saved ? JSON.parse(saved) : []
}

export const loadManagedUsersSnapshot = async (): Promise<ManagedUsersSnapshot> => {
  try {
    const snapshot = await getManagedUsersSnapshotFromFirestore()
    localStorage.setItem('managed-users-cache', JSON.stringify(snapshot.users))
    return snapshot
  } catch (error) {
    console.log('Firebase managed users snapshot not available, using localStorage fallback')
  }

  const saved = localStorage.getItem('managed-users-cache')
  const users = saved ? (JSON.parse(saved) as ManagedUser[]).map(normalizeManagedUser) : []
  return { users, revision: 0 }
}

export const writeAuditLog = async (payload: Omit<AuditLogEntry, 'id' | 'timestamp'> & { timestamp?: number }) => {
  const timestamp = payload.timestamp ?? Date.now()
  const logId = `audit-${timestamp}-${Math.random().toString(36).slice(2, 10)}`
  const logRef = doc(db, COLLECTIONS.AUDIT_LOGS, logId)

  try {
    await runWithRetry(async () => {
      await setDoc(logRef, {
        id: logId,
        actorUserId: payload.actorUserId,
        actorUsername: payload.actorUsername,
        action: payload.action,
        targetType: payload.targetType,
        targetId: payload.targetId,
        changes: payload.changes,
        timestamp,
      })
    })

    return true
  } catch (error) {
    console.error('Error writing audit log:', error)
    return false
  }
}

export const fetchAuditLogs = async (maxCount = 100): Promise<AuditLogEntry[]> => {
  try {
    const logsRef = collection(db, COLLECTIONS.AUDIT_LOGS)
    const q = query(logsRef, orderBy('timestamp', 'desc'), limit(maxCount))
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => doc.data() as AuditLogEntry)
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return []
  }
}
