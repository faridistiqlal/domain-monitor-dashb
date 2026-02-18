import { useEffect, useState, useMemo, useRef } from 'react'
import { Globe, ArrowClockwise, DownloadSimple, MagnifyingGlass, X, SortAscending, Pause, Play, FolderOpen, Tag, Monitor, Trash, CheckSquare, Toolbox, Info, ChartBar, ChartLine, SignOut, LockKey, Lock, Bell, MapPin, Clock, UserCircle } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Progress } from '@/components/ui/progress'
import { APP_VERSION } from '@/lib/version'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { AddDomainForm } from '@/components/AddDomainForm'
import { DomainCard } from '@/components/DomainCard'
import { PinnedDomainCard } from '@/components/PinnedDomainCard'
import { EmptyState } from '@/components/EmptyState'
import { ImportDialog } from '@/components/ImportDialog'
import { InfoDialog } from '@/components/InfoDialog'
import { MobileNav } from '@/components/MobileNav'
import { GroupCard } from '@/components/GroupCard'
import { GroupFormDialog } from '@/components/GroupFormDialog'
import { AssignDomainsDialog } from '@/components/AssignDomainsDialog'
import { TagFormDialog } from '@/components/TagFormDialog'
import { AssignTagsDialog } from '@/components/AssignTagsDialog'
import { TagCard } from '@/components/TagCard'
import { OptimizedDomainList } from '@/components/VirtualizedDomainList'
import { StatisticsView } from '@/components/StatisticsView'
import { GitHubActionsStatusCard } from '@/components/GitHubActionsStatusCard'
import { ChangelogDialog } from '@/components/ChangelogDialog'
import { PrivacyPolicyDialog } from '@/components/PrivacyPolicyDialog'
import { TermsOfServiceDialog } from '@/components/TermsOfServiceDialog'
import { FAQDialog } from '@/components/FAQDialog'
import { LoginDialog, LoginForm } from '@/components/LoginDialog'
import { SettingsDialog } from '@/components/SettingsDialog'
import { NotificationSettingsDialog } from '@/components/NotificationSettingsDialog'
import { NotificationHistoryDialog } from '@/components/NotificationHistoryDialog'
import { SettingsMenuDialog } from '@/components/SettingsMenuDialog'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Domain, DomainStatus, DomainGroup, DomainTag, NotificationSettings, ManagedUser, ManagedUserRole, UserPermissions } from '@/lib/types'
import { NotificationService, NotificationDetails } from '@/lib/notifications'
import { checkDomainStatus } from '@/lib/monitoring'
import { exportDomainsToCSV } from '@/lib/csv-export'
import { 
  loadDomains, 
  loadGroups, 
  loadTags,
  syncDomainsToFirestore,
  syncGroupsToFirestore,
  syncTagsToFirestore,
  loadNotificationSettings,
  syncNotificationSettingsToFirestore,
  loadManagedUsersSnapshot,
  syncManagedUsersWithRevision,
  writeAuditLog,
  syncUserAccessProfileToFirestore,
  getUserAccessProfileByUid,
  syncUserActiveStateByAppUserId,
  revokeUserAccessProfile
} from '@/lib/firestore-sync'
import { 
  updateDailyStats, 
  createIncident, 
  resolveIncident,
  assignCheckBatch,
  shouldCheckNow
} from '@/lib/check-history'
import { loadLastKnownStatuses } from '@/lib/status-loader'
import {
  signInWithUsernamePassword,
  createAuthUserWithUsername,
  signInWithUsernamePasswordSecondary,
  signOutAuth,
  onAuthUserChanged,
  emailToUsername,
  changeCurrentUserPassword,
} from '@/lib/firebase-auth'
import { toast } from 'sonner'
import { useDebounce } from '@/hooks/use-debounce'
import { useFilteredDomains } from '@/hooks/use-filtered-domains'

type FilterType = 'all' | 'online' | 'dns-only' | 'offline'
type SortType = 'none' | 'name-asc' | 'name-desc' | 'status-online-first' | 'status-offline-first'
type ViewMode = 'all' | 'groups' | 'group-detail'

function App() {
  const skipInitialDomainsSync = useRef(true)
  const skipInitialGroupsSync = useRef(true)
  const skipInitialTagsSync = useRef(true)

  const getPermissionsByRole = (role: ManagedUserRole): UserPermissions => {
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

  const createDefaultAdminUser = (): ManagedUser => ({
    id: 'default-user',
    username: 'admin',
    password: localStorage.getItem('app-password') || 'admin123',
    role: 'admin',
    permissions: getPermissionsByRole('admin'),
    isActive: true,
    revision: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    createdBy: 'system',
  })

  // Authentication & Security States
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const auth = localStorage.getItem('app-authenticated')
    return auth === 'true'
  })
  const [showLoginDialog, setShowLoginDialog] = useState(!isAuthenticated)
  const [lastActivityTime, setLastActivityTime] = useState<number>(Date.now())
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>([])
  const [managedUsersRevision, setManagedUsersRevision] = useState<number>(0)
  const [currentUser, setCurrentUser] = useState<ManagedUser | null>(null)

  // Domain & App States
  const [domains, setDomains] = useState<Domain[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [groups, setGroups] = useState<DomainGroup[]>([])
  const [tags, setTags] = useState<DomainTag[]>([])
  const [statuses, setStatuses] = useState<Record<string, DomainStatus>>({})
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [filter, setFilter] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearchQuery = useDebounce(searchQuery, 300)
  const [sortBy, setSortBy] = useState<SortType>('none')
  const [countdown, setCountdown] = useState(60)
  const [isPaused, setIsPaused] = useState(false)
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false)
  const [hasChecked, setHasChecked] = useState(false)
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null)
  const [individualMonitorIntervals, setIndividualMonitorIntervals] = useState<Record<string, NodeJS.Timeout>>({})
  const [activeTab, setActiveTab] = useState<'domains' | 'groups' | 'manage' | 'tags' | 'statistics' | 'pinned'>('pinned')
  const [viewMode, setViewMode] = useState<ViewMode>('all')
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<DomainGroup | null>(null)
  const [selectedDomains, setSelectedDomains] = useState<Set<string>>(new Set())
  const [manageSearchQuery, setManageSearchQuery] = useState('')
  const debouncedManageSearchQuery = useDebounce(manageSearchQuery, 300)
  const [manageGroupFilter, setManageGroupFilter] = useState<string>('all')
  const [manageTagFilter, setManageTagFilter] = useState<string>('all')
  const [manageNotificationFilter, setManageNotificationFilter] = useState<string>('all')
  const [managePinFilter, setManagePinFilter] = useState<string>('all')
  const [editingTag, setEditingTag] = useState<DomainTag | null>(null)
  
  // Firebase operation tracking (for development monitoring)
  const [firebaseOps, setFirebaseOps] = useState(() => {
    const saved = localStorage.getItem('firebase-ops-today')
    const today = new Date().toISOString().split('T')[0]
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed.date === today) {
        return { reads: parsed.reads || 0, writes: parsed.writes || 0 }
      }
    }
    return { reads: 0, writes: 0 }
  })
  
  // Track Firebase operations
  const trackFirebaseRead = (count: number = 1) => {
    setFirebaseOps(prev => {
      const newOps = { reads: prev.reads + count, writes: prev.writes }
      const today = new Date().toISOString().split('T')[0]
      localStorage.setItem('firebase-ops-today', JSON.stringify({ ...newOps, date: today }))
      return newOps
    })
  }
  
  const trackFirebaseWrite = (count: number = 1) => {
    setFirebaseOps(prev => {
      const newOps = { reads: prev.reads, writes: prev.writes + count }
      const today = new Date().toISOString().split('T')[0]
      localStorage.setItem('firebase-ops-today', JSON.stringify({ ...newOps, date: today }))
      return newOps
    })
  }

  // Notification States
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    enabled: false,
    webhookUrl: '',
    notifyOnDown: true,
    notifyOnRecovery: true,
    notifyOnSlow: false,
    slowThreshold: 5,
    cooldownMinutes: 5
  })
  const [notificationService] = useState(() => new NotificationService())
  
  // Track previous statuses for incident detection
  const [previousStatuses, setPreviousStatuses] = useState<Record<string, 'online' | 'offline' | 'dns-only'>>({})
  const [activeIncidents, setActiveIncidents] = useState<Record<string, string>>({}) // domainId -> incidentId

  const applyAuthenticatedSession = (user: ManagedUser) => {
    setCurrentUser(user)
    localStorage.setItem('app-current-user-id', user.id)
    localStorage.setItem('app-current-username', user.username)
    if (user.authUid) {
      localStorage.setItem('app-current-auth-uid', user.authUid)
    } else {
      localStorage.removeItem('app-current-auth-uid')
    }

    setIsAuthenticated(true)
    localStorage.setItem('app-authenticated', 'true')
    localStorage.setItem('app-last-activity', Date.now().toString())
    setLastActivityTime(Date.now())
    setShowLoginDialog(false)
  }

  const isAuthConfigurationError = (error: unknown): boolean => {
    const authError = error as { code?: string; message?: string } | undefined
    return authError?.code === 'auth/configuration-not-found'
      || authError?.message?.toLowerCase().includes('configuration-not-found')
      || false
  }

  const isAuthEmailAlreadyInUseError = (error: unknown): boolean => {
    const authError = error as { code?: string; message?: string } | undefined
    return authError?.code === 'auth/email-already-in-use'
      || authError?.message?.toLowerCase().includes('email-already-in-use')
      || false
  }

  const refreshManagedUsersState = async () => {
    const latestSnapshot = await loadManagedUsersSnapshot()
    setManagedUsers(latestSnapshot.users)
    setManagedUsersRevision(latestSnapshot.revision)
    return latestSnapshot
  }

  const buildManagedUserFromAccessProfile = (authUid: string, profile: {
    appUserId?: string
    username?: string
    email?: string | null
    role?: ManagedUserRole
    permissions?: UserPermissions
    isActive?: boolean
  }): ManagedUser => ({
    id: profile.appUserId || authUid,
    username: profile.username || emailToUsername(profile.email || ''),
    email: profile.email || undefined,
    authUid,
    role: profile.role || 'viewer',
    permissions: profile.permissions || getPermissionsByRole(profile.role || 'viewer'),
    isActive: profile.isActive ?? true,
    revision: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  })

  const syncManagedUsersStateSafely = async (nextUsers: ManagedUser[], expectedRevision: number) => {
    const syncResult = await syncManagedUsersWithRevision(nextUsers, expectedRevision)
    if (syncResult.ok) {
      setManagedUsers(nextUsers)
      setManagedUsersRevision(syncResult.revision)
      return { ok: true as const }
    }

    await refreshManagedUsersState()
    return { ok: false as const, conflict: !!syncResult.conflict }
  }

  // Load data from localStorage first, then refresh from Firebase after delay
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load managed users (user directory)
        let managedSnapshot = await loadManagedUsersSnapshot()
        let loadedManagedUsers = managedSnapshot.users
        if (!loadedManagedUsers || loadedManagedUsers.length === 0) {
          const defaultAdmin = createDefaultAdminUser()
          loadedManagedUsers = [defaultAdmin]
          const bootstrapResult = await syncManagedUsersWithRevision(loadedManagedUsers, managedSnapshot.revision)
          if (bootstrapResult.ok) {
            managedSnapshot = {
              users: loadedManagedUsers,
              revision: bootstrapResult.revision,
            }
          }
          localStorage.setItem('app-current-user-id', defaultAdmin.id)
          localStorage.setItem('app-current-username', defaultAdmin.username)
          console.log('[Users] Bootstrap default admin user')
        }

        setManagedUsers(loadedManagedUsers)
        setManagedUsersRevision(managedSnapshot.revision)

        // Restore current user session context
        const storedUserId = localStorage.getItem('app-current-user-id') || 'default-user'
        const sessionUser = loadedManagedUsers.find(u => u.id === storedUserId)
        if (sessionUser && sessionUser.isActive) {
          setCurrentUser(sessionUser)
        } else {
          setCurrentUser(null)
          if (isAuthenticated) {
            setIsAuthenticated(false)
            localStorage.setItem('app-authenticated', 'false')
            setShowLoginDialog(true)
          }
        }

        // ALWAYS load tags from Firebase first (for data consistency)
        console.log('[Tags] Loading tags directly from Firebase...')
        const loadedTags = await loadTags()
        setTags(loadedTags)
        console.log('[Tags] ✅ Loaded', loadedTags.length, 'tags from Firebase')
        
        // Load groups from Firebase (small critical data - always fresh)
        console.log('[Groups] Loading groups from Firebase...')
        const loadedGroups = await loadGroups()
        trackFirebaseRead(1)
        console.log('[Groups] Loaded from Firebase:', loadedGroups.length, 'groups')
        console.log('[Groups] Data:', loadedGroups.map(g => ({ id: g.id, name: g.name })))
        setGroups(loadedGroups)
        console.log('[Groups] ✅ Set to state:', loadedGroups.length, 'groups')
        
        // ALWAYS load domains from Firebase (no cache for pin/group state sync)
        // Cache is removed to ensure pin and group states sync across devices
        console.log('[Domains] Loading domains from Firebase (no cache)...')
        
        try {
          const loadedDomains = await loadDomains()
              
          
          // Track Firebase reads (1 collection - tags and groups already loaded)
          trackFirebaseRead(1)
            
          // Assign batch to domains that don't have one (old domains)
          // RESET enabled field on page load - individual monitoring is not persistent across refresh
          const domainsWithBatch = loadedDomains.map((domain, index) => {
            if (!domain.checkBatch) {
              return {
                ...domain,
                checkBatch: assignCheckBatch(index, loadedDomains.length),
                lastStatusChange: domain.lastStatusChange || Date.now(),
                consecutiveFailures: domain.consecutiveFailures || 0,
                enabled: false // Reset on page load - user must manually start monitoring
              }
            }
            // Reset enabled field on page load for all domains
            return {
              ...domain,
              enabled: false // Individual monitoring is not persistent across refresh
            }
          })
      
          setDomains(domainsWithBatch)
          // Groups already loaded from Firebase at the start
          
          // No localStorage cache - always load fresh from Firebase for pin/group sync
          console.log('[Domains] ✅ Loaded', domainsWithBatch.length, 'domains from Firebase')
          const pinnedCount = domainsWithBatch.filter(d => d.pinned).length
          const groupedCount = domainsWithBatch.filter(d => d.groupId).length
          console.log(`[Domains] ${pinnedCount} pinned, ${groupedCount} in groups`)
        } catch (error: any) {
          console.error('Firebase quota exceeded or error loading data:', error)
          // If quota exceeded, show user message and use empty data temporarily
          if (error?.code === 'resource-exhausted') {
            alert('Firebase quota exceeded. Refresh halaman nanti untuk load data terbaru.')
            // Only set empty domains - groups and tags were already loaded successfully
            setDomains([])
          } else {
            throw error // Re-throw non-quota errors
          }
        }
        
        // MIGRATION: Clear old localStorage data only on version change
        const appVersion = localStorage.getItem('app-version')
        if (!appVersion) {
          // First time - set version without clearing
          localStorage.setItem('app-version', APP_VERSION)
        } else if (appVersion !== APP_VERSION) {
          console.log(`🔄 Version changed: ${appVersion} → ${APP_VERSION}`)
          console.log('Clearing cache to load fresh data from Firebase...')
          
          // Clear all caches to force reload from Firebase
          localStorage.removeItem('domains-cache')
          localStorage.removeItem('tags-cache')
          localStorage.removeItem('domain-last-statuses')
          
          // Update version
          localStorage.setItem('app-version', APP_VERSION)
          
          // Force immediate Firebase load (no cache) - tags already loaded at start
          const [loadedDomains, loadedGroups] = await Promise.all([
            loadDomains(),
            loadGroups()
          ])
          
          // Assign batch and reset enabled field
          const domainsWithBatch = loadedDomains.map((domain, index) => {
            if (!domain.checkBatch) {
              return {
                ...domain,
                checkBatch: assignCheckBatch(index, loadedDomains.length),
                lastStatusChange: domain.lastStatusChange || Date.now(),
                consecutiveFailures: domain.consecutiveFailures || 0,
                enabled: false
              }
            }
            return { ...domain, enabled: false }
          })
          
          setDomains(domainsWithBatch)
          // Groups already loaded from Firebase at the start
          
          // No localStorage cache - always use Firebase as source of truth for pin/group sync
          console.log('✅ Fresh data loaded from Firebase after version update')
        }
        
        // AUTO-CLEAR: Always clear status on browser refresh
        // This prevents confusion with outdated status counts
        // User needs to manually "Check All" or enable auto-refresh to see status
        console.log('Status cleared on browser refresh - please check domains to see current status')
        localStorage.removeItem('domain-last-statuses')
        setStatuses({})
        setPreviousStatuses({})
        
        // NOTE: Removed Firebase fallback load to prevent quota exhaustion
        // Previously: loaded from Firebase if localStorage empty (312 domain reads!)
        // Now: localStorage populated only by auto-check, manual check is local-only
        // User must enable auto-refresh to get Firebase data persistence
        
        // Password already synced to localStorage by loadPassword()
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setIsLoadingData(false)
      }
    }
    loadData()
  }, [])

  // Sync to Firebase with debouncing (reduce writes)
  useEffect(() => {
    if (!isLoadingData && domains.length >= 0) {
      if (skipInitialDomainsSync.current) {
        skipInitialDomainsSync.current = false
        return
      }

      // No localStorage cache - always use Firebase as source of truth
      // Debounce Firebase sync to reduce writes
      const timeoutId = setTimeout(() => {
        syncDomainsToFirestore(domains)
          .then(() => console.log('[Domains Sync] ✅ Auto-synced to Firebase'))
          .catch(err => console.error('[Domains Sync] ❌ Error:', err))
      }, 2000) // Wait 2s before syncing
      return () => clearTimeout(timeoutId)
    }
  }, [domains, isLoadingData])

  // Auto-sync groups to Firebase (same pattern as tags and domains)
  useEffect(() => {
    if (!isLoadingData && groups.length >= 0) {
      if (skipInitialGroupsSync.current) {
        skipInitialGroupsSync.current = false
        return
      }

      console.log('[Groups Sync] Auto-syncing', groups.length, 'groups to Firebase')
      const timeoutId = setTimeout(() => {
        syncGroupsToFirestore(groups)
          .then(() => console.log('[Groups Sync] ✅ Synced to Firebase'))
          .catch(err => {
            console.error('[Groups Sync] ❌ Error:', err)
            toast.error('Gagal sync groups ke Firebase')
          })
      }, 2000) // Wait 2s before syncing
      return () => clearTimeout(timeoutId)
    }
  }, [groups, isLoadingData])
  
  useEffect(() => {
    if (!isLoadingData) {
      if (skipInitialTagsSync.current) {
        skipInitialTagsSync.current = false
        return
      }

      console.log('[Tags Sync] Syncing', tags.length, 'tags to Firebase')
      // Sync to Firebase only (no localStorage - always load from Firebase)
      const timeoutId = setTimeout(() => {
        syncTagsToFirestore(tags)
          .then(() => console.log('[Tags Sync] ✅ Synced to Firebase'))
          .catch(err => console.error('[Tags Sync] ❌ Error:', err))
      }, 2000)
      return () => clearTimeout(timeoutId)
    }
  }, [tags, isLoadingData])

  // Load notification settings from Firebase (separate useEffect for reliability)
  useEffect(() => {
    const loadNotificationSettingsFromFirebase = async () => {
      console.log('[Notification Settings] Starting separate load...')
      try {
        const loadedNotificationSettings = await loadNotificationSettings()
        console.log('[Notification Settings] Result:', loadedNotificationSettings)
        if (loadedNotificationSettings) {
          setNotificationSettings(loadedNotificationSettings)
          console.log('[Notification Settings] ✅ Loaded from Firebase:', loadedNotificationSettings)
        } else {
          console.log('[Notification Settings] ⚠️ No settings found, using default')
        }
      } catch (error) {
        console.error('[Notification Settings] ❌ Error loading:', error)
      }
    }
    
    // Load after initial data loading is done
    if (!isLoadingData) {
      loadNotificationSettingsFromFirebase()
    }
  }, [isLoadingData])

  // DEBUG: Monitor notification settings changes
  useEffect(() => {
    console.log('[notificationSettings State Changed]', notificationSettings)
  }, [notificationSettings])

  // Auto-logout after 30 minutes of inactivity
  useEffect(() => {
    if (!isAuthenticated) return

    const TIMEOUT_DURATION = 30 * 60 * 1000 // 30 minutes in milliseconds
    const WARNING_DURATION = 2 * 60 * 1000 // 2 minutes before logout

    // Update activity time on user interactions
    const updateActivity = () => {
      const now = Date.now()
      setLastActivityTime(now)
      localStorage.setItem('app-last-activity', now.toString())
    }

    // Add event listeners for user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click']
    events.forEach(event => window.addEventListener(event, updateActivity))

    // Check for timeout every minute
    const timeoutChecker = setInterval(() => {
      const lastActivity = parseInt(localStorage.getItem('app-last-activity') || Date.now().toString())
      const now = Date.now()
      const timeSinceActivity = now - lastActivity

      // Show warning 2 minutes before logout
      if (timeSinceActivity >= TIMEOUT_DURATION - WARNING_DURATION && timeSinceActivity < TIMEOUT_DURATION) {
        const minutesLeft = Math.ceil((TIMEOUT_DURATION - timeSinceActivity) / 60000)
        toast.warning(`Session akan berakhir dalam ${minutesLeft} menit karena tidak ada aktivitas`)
      }

      // Auto-logout if timeout reached
      if (timeSinceActivity >= TIMEOUT_DURATION) {
        handleLogout()
        toast.error('Session berakhir karena tidak ada aktivitas selama 30 menit')
      }
    }, 60000) // Check every minute

    // Cleanup
    return () => {
      events.forEach(event => window.removeEventListener(event, updateActivity))
      clearInterval(timeoutChecker)
      
      // Clear all individual monitoring intervals on unmount
      Object.values(individualMonitorIntervals).forEach(intervalId => {
        clearInterval(intervalId)
      })
    }
  }, [isAuthenticated, individualMonitorIntervals])

  useEffect(() => {
    const unsubscribe = onAuthUserChanged(async (authUser) => {
      if (!authUser) {
        const hasLegacySession = localStorage.getItem('app-authenticated') === 'true'
          && !!localStorage.getItem('app-current-user-id')
          && !localStorage.getItem('app-current-auth-uid')

        if (hasLegacySession) {
          return
        }

        setIsAuthenticated(false)
        setCurrentUser(null)
        localStorage.setItem('app-authenticated', 'false')
        localStorage.removeItem('app-last-activity')
        localStorage.removeItem('app-current-auth-uid')
        setShowLoginDialog(true)
        return
      }

      const accessProfile = await getUserAccessProfileByUid(authUser.uid)
      if (!accessProfile) {
        await signOutAuth().catch(() => undefined)
        toast.error('Akun auth tidak terdaftar di user directory')
        return
      }

      if (accessProfile.isActive === false) {
        await signOutAuth().catch(() => undefined)
        toast.error('Akun nonaktif. Hubungi admin.')
        return
      }

      const normalizedUsername = emailToUsername(authUser.email || '').trim().toLowerCase()
      const matchedUser = managedUsers.find(user =>
        user.authUid === authUser.uid || user.username.toLowerCase() === normalizedUsername
      )

      const effectiveUser = matchedUser
        ? {
            ...matchedUser,
            id: accessProfile.appUserId || matchedUser.id,
            username: accessProfile.username || matchedUser.username,
            email: accessProfile.email || authUser.email || matchedUser.email,
            authUid: authUser.uid,
            role: accessProfile.role || matchedUser.role,
            permissions: accessProfile.permissions || matchedUser.permissions,
            isActive: accessProfile.isActive ?? true,
          }
        : buildManagedUserFromAccessProfile(authUser.uid, {
            appUserId: accessProfile.appUserId,
            username: accessProfile.username,
            email: accessProfile.email || authUser.email,
            role: accessProfile.role,
            permissions: accessProfile.permissions,
            isActive: accessProfile.isActive,
          })

      const needsMetadataSync = !matchedUser
        || matchedUser.authUid !== authUser.uid
        || matchedUser.email !== (authUser.email || matchedUser.email)
      if (needsMetadataSync) {
        const updatedUsers = managedUsers.map(user =>
          user.id === effectiveUser.id
            ? {
                ...effectiveUser,
                authUid: authUser.uid,
                email: authUser.email || user.email,
                updatedAt: Date.now(),
              }
            : user
        )
        const nextUsers = matchedUser ? updatedUsers : [...managedUsers, { ...effectiveUser, updatedAt: Date.now() }]
        const syncStateResult = await syncManagedUsersStateSafely(nextUsers, managedUsersRevision)
        if (!syncStateResult.ok) {
          console.warn('[Users] Metadata sync skipped due to revision conflict, state refreshed')
        }
      }

      await syncUserAccessProfileToFirestore(authUser.uid, {
        appUserId: effectiveUser.id,
        username: effectiveUser.username,
        email: authUser.email || effectiveUser.email,
        role: effectiveUser.role,
        permissions: effectiveUser.permissions,
        isActive: effectiveUser.isActive,
      }).catch(console.error)

      const activeUser = {
        ...effectiveUser,
        authUid: authUser.uid,
        email: authUser.email || effectiveUser.email,
      }

      if (!currentUser || currentUser.id !== activeUser.id || !isAuthenticated) {
        applyAuthenticatedSession(activeUser)
      }
    })

    return () => unsubscribe()
  }, [managedUsers, currentUser, isAuthenticated])

  // Authentication Handlers
  const handleLogin = async (username: string, password: string) => {
    const normalized = username.trim().toLowerCase()

    let users = managedUsers
    if (!users || users.length === 0) {
      const snapshot = await loadManagedUsersSnapshot()
      users = snapshot.users
      setManagedUsersRevision(snapshot.revision)
      if (!users || users.length === 0) {
        const defaultAdmin = createDefaultAdminUser()
        users = [defaultAdmin]
        const bootstrapSyncResult = await syncManagedUsersWithRevision(users, snapshot.revision)
        if (bootstrapSyncResult.ok) {
          setManagedUsersRevision(bootstrapSyncResult.revision)
        }
      }
      setManagedUsers(users)
    }

    try {
      const authUser = await signInWithUsernamePassword(username, password)

      const accessProfile = await getUserAccessProfileByUid(authUser.uid)
      if (!accessProfile) {
        await signOutAuth().catch(() => undefined)
        toast.error('Akun tidak terdaftar di direktori user')
        return
      }

      if (accessProfile.isActive === false) {
        await signOutAuth().catch(() => undefined)
        toast.error('Akun nonaktif. Hubungi admin.')
        return
      }

      // Always refresh managed users from Firestore after auth is ready
      // to avoid stale local cache data after page refresh.
      const freshSnapshot = await loadManagedUsersSnapshot()
      if (freshSnapshot.users.length > 0 || managedUsers.length === 0) {
        users = freshSnapshot.users
        setManagedUsers(freshSnapshot.users)
        setManagedUsersRevision(freshSnapshot.revision)
      }

      const matchedUser = users.find(
        user => user.authUid === authUser.uid || user.username.toLowerCase() === normalized
      )

      const effectiveUser = matchedUser
        ? {
            ...matchedUser,
            id: accessProfile.appUserId || matchedUser.id,
            username: accessProfile.username || matchedUser.username,
            email: accessProfile.email || authUser.email || matchedUser.email,
            authUid: authUser.uid,
            role: accessProfile.role || matchedUser.role,
            permissions: accessProfile.permissions || matchedUser.permissions,
            isActive: accessProfile.isActive ?? true,
          }
        : buildManagedUserFromAccessProfile(authUser.uid, {
            appUserId: accessProfile.appUserId,
            username: accessProfile.username,
            email: accessProfile.email || authUser.email,
            role: accessProfile.role,
            permissions: accessProfile.permissions,
            isActive: accessProfile.isActive,
          })

      const metadataNeedsSync = !matchedUser
        || matchedUser.authUid !== authUser.uid
        || matchedUser.email !== (authUser.email || matchedUser.email)
      const activeUser = {
        ...effectiveUser,
        authUid: authUser.uid,
        email: authUser.email || effectiveUser.email,
      }

      if (metadataNeedsSync) {
        const updatedUsers = users.map(user =>
          user.id === activeUser.id
            ? {
                ...activeUser,
                authUid: authUser.uid,
                email: authUser.email || user.email,
                updatedAt: Date.now(),
              }
            : user
        )
        const nextUsers = matchedUser ? updatedUsers : [...users, { ...activeUser, updatedAt: Date.now() }]
        const syncStateResult = await syncManagedUsersStateSafely(nextUsers, managedUsersRevision)
        if (!syncStateResult.ok) {
          console.warn('[Users] Login metadata sync skipped due to revision conflict, state refreshed')
        }
      }

      await syncUserAccessProfileToFirestore(authUser.uid, {
        appUserId: activeUser.id,
        username: activeUser.username,
        email: activeUser.email,
        role: activeUser.role,
        permissions: activeUser.permissions,
        isActive: activeUser.isActive,
      }).catch(console.error)

      applyAuthenticatedSession(activeUser)
      toast.success(`Login berhasil! Selamat datang, ${activeUser.username}`)
    } catch (authError) {
      console.error('[Auth] Firebase sign-in failed:', authError)

      if (isAuthConfigurationError(authError)) {
        const matchedLegacyUser = users.find(
          user => user.username.toLowerCase() === normalized && (user.password || '') === password
        )

        if (!matchedLegacyUser) {
          toast.error('Username atau password salah')
          return
        }

        if (!matchedLegacyUser.isActive) {
          toast.error('Akun nonaktif. Hubungi admin.')
          return
        }

        applyAuthenticatedSession(matchedLegacyUser)
        toast.warning('Firebase Auth belum aktif. Masuk menggunakan mode legacy sementara.')
        return
      }

      const legacyUser = users.find(user => user.username.toLowerCase() === normalized)
      const canBootstrapLegacyAuth = legacyUser && !legacyUser.authUid && (legacyUser.password || '') === password

      if (canBootstrapLegacyAuth && legacyUser) {
        try {
          const bootstrappedAuth = await createAuthUserWithUsername(legacyUser.username, password)
          const updatedUsers = users.map(user =>
            user.id === legacyUser.id
              ? {
                  ...user,
                  authUid: bootstrappedAuth.uid,
                  email: bootstrappedAuth.email,
                  updatedAt: Date.now(),
                }
              : user
          )

          const syncStateResult = await syncManagedUsersStateSafely(updatedUsers, managedUsersRevision)
          if (!syncStateResult.ok) {
            toast.error('Data user berubah saat bootstrap auth. Silakan login ulang.')
            return
          }

          await syncUserAccessProfileToFirestore(bootstrappedAuth.uid, {
            appUserId: legacyUser.id,
            username: legacyUser.username,
            email: bootstrappedAuth.email,
            role: legacyUser.role,
            permissions: legacyUser.permissions,
            isActive: legacyUser.isActive,
          })

          await signInWithUsernamePassword(username, password)
          toast.success('Akun user berhasil dimigrasikan ke Firebase Auth. Silakan login ulang sekali lagi jika perlu.')
          return
        } catch (bootstrapError) {
          console.error('[Auth] Legacy user bootstrap failed:', bootstrapError)
        }
      }

      toast.error('Username atau password salah / akun auth belum aktif')
      return
    }

    // Re-load groups and tags after login to ensure fresh data
    try {
      console.log('[Login] Re-loading groups and tags from Firebase...')
      const [freshGroups, freshTags] = await Promise.all([
        loadGroups(),
        loadTags()
      ])
      setGroups(freshGroups)
      setTags(freshTags)
      console.log('[Login] ✅ Reloaded:', freshGroups.length, 'groups and', freshTags.length, 'tags')
    } catch (error) {
      console.error('[Login] Error reloading groups/tags:', error)
    }
  }

  const handleLogout = () => {
    signOutAuth().catch(console.error)
    setIsAuthenticated(false)
    setCurrentUser(null)
    localStorage.setItem('app-authenticated', 'false')
    localStorage.removeItem('app-last-activity')
    localStorage.removeItem('app-current-auth-uid')
    localStorage.removeItem('app-current-user-id')
    localStorage.removeItem('app-current-username')
    setShowLoginDialog(true)
    toast.info('Anda telah logout')
  }

  const handlePasswordChange = async (oldPassword: string, newPassword: string): Promise<boolean> => {
    if (!currentUser) {
      return false
    }

    const userIndex = managedUsers.findIndex(u => u.id === currentUser.id)
    if (userIndex === -1) {
      return false
    }

    if (!currentUser.authUid) {
      toast.error('Akun belum terhubung ke Firebase Auth')
      return false
    }

    try {
      await changeCurrentUserPassword(oldPassword, newPassword)
    } catch (error) {
      console.error('[Auth] Failed to change Firebase password:', error)
      return false
    }

    const updatedUser: ManagedUser = {
      ...managedUsers[userIndex],
      revision: (managedUsers[userIndex].revision ?? 1) + 1,
      updatedAt: Date.now(),
    }

    const updatedUsers = [...managedUsers]
    updatedUsers[userIndex] = updatedUser

    const syncResult = await syncManagedUsersWithRevision(updatedUsers, managedUsersRevision)
    if (!syncResult.ok) {
      await refreshManagedUsersState()
      if (syncResult.conflict) {
        toast.error('Perubahan user bentrok dengan update lain. Data dimuat ulang, silakan ulangi.')
      }
      return false
    }

    setManagedUsers(updatedUsers)
    setManagedUsersRevision(syncResult.revision)
    setCurrentUser(updatedUser)

    await writeAuditLog({
      actorUserId: currentUser.id,
      actorUsername: currentUser.username,
      action: 'change-password',
      targetType: 'user',
      targetId: currentUser.id,
      changes: {
        method: 'firebase-auth',
      },
    }).catch(console.error)

    return true
  }

  const handleCreateUser = async (payload: { username: string; password: string; role: ManagedUserRole }): Promise<boolean> => {
    if (!currentUser?.permissions.canManageUsers) {
      toast.error('Anda tidak memiliki akses manajemen user')
      return false
    }

    if (managedUsers.some(user => user.username.toLowerCase() === payload.username.toLowerCase())) {
      toast.error('Username sudah digunakan')
      return false
    }

    let authUser: { uid: string; email: string } | null = null
    try {
      authUser = await createAuthUserWithUsername(payload.username, payload.password)
    } catch (error) {
      console.error('[Auth] Failed to create Firebase auth user:', error)

      if (isAuthEmailAlreadyInUseError(error)) {
        try {
          authUser = await signInWithUsernamePasswordSecondary(payload.username, payload.password)
        } catch (existingAuthError) {
          console.error('[Auth] Existing auth account cannot be claimed with provided password:', existingAuthError)
          toast.error('Email auth sudah terpakai. Gunakan username lain atau password yang sesuai akun lama.')
          return false
        }
      }

      if (!isAuthConfigurationError(error)) {
        if (!authUser) {
          toast.error('Gagal membuat akun auth user')
          return false
        }
      }

      if (authUser) {
        toast.info('Akun auth sudah ada. User directory akan dihubungkan ke akun tersebut.')
      } else if (isAuthConfigurationError(error)) {
        toast.warning('Firebase Auth belum aktif. User dibuat dengan mode legacy sementara.')
      }

      if (!authUser && !isAuthConfigurationError(error)) {
        return false
      }
    }

    const now = Date.now()
    const newUser: ManagedUser = {
      id: `user-${now}-${Math.random().toString(36).slice(2, 8)}`,
      username: payload.username,
      email: authUser?.email,
      authUid: authUser?.uid,
      password: authUser ? undefined : payload.password,
      role: payload.role,
      permissions: getPermissionsByRole(payload.role),
      isActive: true,
      revision: 1,
      createdAt: now,
      updatedAt: now,
      createdBy: currentUser.username,
    }

    const updatedUsers = [...managedUsers, newUser]
    const syncResult = await syncManagedUsersWithRevision(updatedUsers, managedUsersRevision)

    if (!syncResult.ok) {
      await refreshManagedUsersState()
      if (syncResult.conflict) {
        toast.error('Data user berubah di tempat lain. Muat ulang selesai, silakan coba lagi.')
      } else {
        toast.error('Gagal menyimpan user ke Firebase')
      }
      return false
    }

    setManagedUsers(updatedUsers)
    setManagedUsersRevision(syncResult.revision)

    // Re-sync from server snapshot to keep list consistent across cache/auth timing.
    await refreshManagedUsersState().catch(console.error)

    if (authUser?.uid) {
      const syncedProfile = await syncUserAccessProfileToFirestore(authUser.uid, {
        appUserId: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        permissions: newUser.permissions,
        isActive: newUser.isActive,
      })

      if (!syncedProfile) {
        toast.warning('User dibuat, tetapi profile akses belum sinkron ke Firebase')
      }
    }

    await writeAuditLog({
      actorUserId: currentUser.id,
      actorUsername: currentUser.username,
      action: 'create-user',
      targetType: 'user',
      targetId: newUser.id,
      changes: {
        username: newUser.username,
        role: newUser.role,
        isActive: newUser.isActive,
      },
    }).catch(console.error)

    toast.success(`User ${newUser.username} berhasil dibuat`)
    return true
  }

  const handleToggleUserActive = async (userId: string, isActive: boolean): Promise<boolean> => {
    if (!currentUser?.permissions.canManageUsers) {
      toast.error('Anda tidak memiliki akses manajemen user')
      return false
    }

    const targetUser = managedUsers.find(user => user.id === userId)
    if (!targetUser) return false

    if (targetUser.role === 'admin' && !isActive) {
      toast.error('Admin tidak dapat dinonaktifkan')
      return false
    }

    const updatedUsers = managedUsers.map(user =>
      user.id === userId
        ? { ...user, isActive, revision: (user.revision ?? 1) + 1, updatedAt: Date.now() }
        : user
    )

    const syncResult = await syncManagedUsersWithRevision(updatedUsers, managedUsersRevision)

    if (!syncResult.ok) {
      await refreshManagedUsersState()
      if (syncResult.conflict) {
        toast.error('Perubahan bentrok dengan update lain. Data dimuat ulang, silakan ulangi.')
      } else {
        toast.error('Gagal memperbarui status user')
      }
      return false
    }

    setManagedUsers(updatedUsers)
    setManagedUsersRevision(syncResult.revision)

    const updatedTargetUser = updatedUsers.find(user => user.id === userId)
    let profileSynced = false
    if (updatedTargetUser?.authUid) {
      profileSynced = await syncUserAccessProfileToFirestore(updatedTargetUser.authUid, {
        appUserId: updatedTargetUser.id,
        username: updatedTargetUser.username,
        email: updatedTargetUser.email,
        role: updatedTargetUser.role,
        permissions: updatedTargetUser.permissions,
        isActive: updatedTargetUser.isActive,
      })
    }

    if (!profileSynced && updatedTargetUser) {
      profileSynced = await syncUserActiveStateByAppUserId(updatedTargetUser.id, updatedTargetUser.isActive)
    }

    if (!profileSynced) {
      toast.warning('Status user tersimpan di directory, tetapi profile auth belum sinkron')
    }

    await writeAuditLog({
      actorUserId: currentUser.id,
      actorUsername: currentUser.username,
      action: 'toggle-user-active',
      targetType: 'user',
      targetId: userId,
      changes: {
        isActive,
      },
    }).catch(console.error)

    toast.success(isActive ? 'User diaktifkan' : 'User dinonaktifkan')
    return true
  }

  const handleDeleteUser = async (userId: string): Promise<boolean> => {
    if (!currentUser?.permissions.canManageUsers) {
      toast.error('Anda tidak memiliki akses manajemen user')
      return false
    }

    const targetUser = managedUsers.find(user => user.id === userId)
    if (!targetUser) {
      toast.error('User tidak ditemukan')
      return false
    }

    if (targetUser.role === 'admin') {
      toast.error('User admin tidak bisa dihapus')
      return false
    }

    if (currentUser.id === targetUser.id) {
      toast.error('Tidak bisa menghapus akun yang sedang dipakai')
      return false
    }

    const updatedUsers = managedUsers.filter(user => user.id !== userId)
    const syncResult = await syncManagedUsersWithRevision(updatedUsers, managedUsersRevision)

    if (!syncResult.ok) {
      await refreshManagedUsersState()
      if (syncResult.conflict) {
        toast.error('Perubahan bentrok dengan update lain. Data dimuat ulang, silakan ulangi.')
      } else {
        toast.error('Gagal menghapus user')
      }
      return false
    }

    setManagedUsers(updatedUsers)
    setManagedUsersRevision(syncResult.revision)

    const profileRevoked = await revokeUserAccessProfile({
      appUserId: targetUser.id,
      authUid: targetUser.authUid,
      username: targetUser.username,
      email: targetUser.email,
    })

    if (!profileRevoked) {
      toast.warning('User terhapus dari directory, tetapi profile auth tidak ditemukan untuk direvoke')
    }

    await writeAuditLog({
      actorUserId: currentUser.id,
      actorUsername: currentUser.username,
      action: 'delete-user',
      targetType: 'user',
      targetId: targetUser.id,
      changes: {
        username: targetUser.username,
        role: targetUser.role,
      },
    }).catch(console.error)

    toast.success(`User ${targetUser.username} berhasil dihapus`)
    return true
  }

  const handleNotificationSettingsSave = async (settings: NotificationSettings) => {
    console.log('[Save Notification Settings] Saving:', settings)
    setNotificationSettings(settings)
    localStorage.setItem('notification-settings', JSON.stringify(settings))
    console.log('[Save Notification Settings] ✅ Saved to localStorage')
    
    // Sync to Firebase
    const synced = await syncNotificationSettingsToFirestore(settings)
    console.log('[Save Notification Settings] Firebase sync result:', synced)
    if (synced) {
      toast.success('Notification settings saved successfully')
    } else {
      toast.warning('Settings saved locally, but failed to sync to Firebase')
    }
  }

  const handleTestNotification = async () => {
    if (!notificationSettings.webhookUrl) {
      toast.error('Please enter a webhook URL first')
      return
    }

    // Clear cooldown for test domain before sending
    notificationService.clearCooldown('example.com')

    const testSettings: NotificationSettings = {
      ...notificationSettings,
      enabled: true,
      notifyOnDown: true
    }

    const testDetails: NotificationDetails = {
      domain: 'example.com',
      status: 'down',
      error: 'This is a test notification from Domain Monitor Dashboard',
      groupName: 'Test Group',
      tags: ['test', 'demo'],
      ipAddress: '93.184.216.34',
      protocol: 'https'
    }

    const success = await notificationService.sendSlackNotification(
      testSettings,
      testDetails
    )

    if (success) {
      toast.success('Test notification sent! Check your Slack channel.')
    } else {
      toast.error('Failed to send test notification. Please check your webhook URL.')
    }
  }

  // Auto-check all domains when monitoring tab is opened/loaded
  useEffect(() => {
    if (activeTab === 'domains' && !isLoadingData && !autoRefreshEnabled && !hasChecked && !isRefreshing && domains.length > 0) {
      console.log('[Monitoring Tab] Auto-checking all domains on initial load...')
      handleManualRefresh()
    }
  }, [activeTab, isLoadingData, autoRefreshEnabled, hasChecked, isRefreshing, domains.length])

  // Auto-check pinned domains when Pin tab is opened
  useEffect(() => {
    if (activeTab === 'pinned' && !isLoadingData) {
      const pinnedDomains = domains.filter(d => d.pinned)
      if (pinnedDomains.length > 0) {
        // Check if any pinned domain hasn't been checked yet
        const uncheckedDomains = pinnedDomains.filter(d => {
          const status = statuses[d.id]
          return !status || status.status === 'checking' || !status.lastChecked
        })
        
        if (uncheckedDomains.length > 0) {
          console.log(`[Pin Tab] Auto-checking ${uncheckedDomains.length} pinned domains...`)
          
          // Set checking status
          const checkingStatuses: Record<string, DomainStatus> = {}
          uncheckedDomains.forEach(domain => {
            checkingStatuses[domain.id] = { id: domain.id, status: 'checking' }
          })
          setStatuses(prev => ({ ...prev, ...checkingStatuses }))
          
          // Check domains
          Promise.all(
            uncheckedDomains.map(domain => checkDomainStatus(domain.url, domain.id))
          ).then(results => {
            const newStatuses: Record<string, DomainStatus> = {}
            results.forEach(result => {
              newStatuses[result.id] = result
            })
            setStatuses(prev => ({ ...prev, ...newStatuses }))
          })
        }
      }
    }
  }, [activeTab, isLoadingData])

  // Capability checks based on current user permissions
  const canView = isAuthenticated && (currentUser?.permissions.canView ?? false)
  const canAddDomain = isAuthenticated && (currentUser?.permissions.canAddDomain ?? false)
  const canEdit = isAuthenticated && (currentUser?.permissions.canEdit ?? false)
  const canManageUsers = isAuthenticated && (currentUser?.permissions.canManageUsers ?? false)
  const currentUserRoleLabel = currentUser?.role === 'admin'
    ? 'Admin'
    : currentUser?.role === 'add-only'
      ? 'Add URL Only'
      : 'Readonly'

  const checkAllDomains = async (showToast = false, batchCheckOnly = false, isAutoCheck = false) => {
    if (!domains || domains.length === 0) return

    const now = new Date()
    const currentMinute = now.getMinutes()
    const currentHour = now.getHours()
    
    // Determine current batch and next batch schedule
    let currentBatch = 0
    let nextBatchMinute = 0
    if (currentMinute >= 0 && currentMinute < 5) { currentBatch = 1; nextBatchMinute = 5 }
    else if (currentMinute >= 5 && currentMinute < 10) { currentBatch = 2; nextBatchMinute = 10 }
    else if (currentMinute >= 10 && currentMinute < 15) { currentBatch = 3; nextBatchMinute = 15 }
    else if (currentMinute >= 15 && currentMinute < 20) { currentBatch = 4; nextBatchMinute = 20 }
    else if (currentMinute >= 20 && currentMinute < 25) { currentBatch = 1; nextBatchMinute = 25 }
    else if (currentMinute >= 25 && currentMinute < 30) { currentBatch = 2; nextBatchMinute = 30 }
    else if (currentMinute >= 30 && currentMinute < 35) { currentBatch = 3; nextBatchMinute = 35 }
    else if (currentMinute >= 35 && currentMinute < 40) { currentBatch = 4; nextBatchMinute = 40 }
    else if (currentMinute >= 40 && currentMinute < 45) { currentBatch = 1; nextBatchMinute = 45 }
    else if (currentMinute >= 45 && currentMinute < 50) { currentBatch = 2; nextBatchMinute = 50 }
    else if (currentMinute >= 50 && currentMinute < 55) { currentBatch = 3; nextBatchMinute = 55 }
    else { currentBatch = 4; nextBatchMinute = 0 } // 55-60
    
    const nextBatchHour = nextBatchMinute === 0 ? (currentHour + 1) % 24 : currentHour
    const nextBatchTime = `${String(nextBatchHour).padStart(2, '0')}:${String(nextBatchMinute).padStart(2, '0')}`

    // Filter domains to check based on batch schedule (if staggered checking enabled)
    let domainsToCheck = domains
    
    if (batchCheckOnly && autoRefreshEnabled) {
      console.log(`\n🔄 [BATCH CHECK] Starting batch check...`)
      console.log(`📅 Current time: ${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`)
      console.log(`📦 Current batch: BATCH ${currentBatch}`)
      console.log(`⏭️  Next batch: BATCH ${(currentBatch % 4) + 1} at ${nextBatchTime}`)
      
      domainsToCheck = domains.filter(domain => shouldCheckNow(domain))
      
      if (domainsToCheck.length === 0) {
        console.log(`⏸️  No domains in current batch window - skipping`)
        return // No domains in current batch window
      }
      
      console.log(`✅ Domains to check in BATCH ${currentBatch}: ${domainsToCheck.length}/${domains.length}`)
      const batchDomains = domainsToCheck.map(d => d.checkBatch).filter((v, i, a) => a.indexOf(v) === i)
      console.log(`📊 Batch distribution: ${batchDomains.join(', ')}`)
    }

    if (showToast) {
      toast.info(`Memeriksa ${domainsToCheck.length} domain...`, { duration: 2000 })
    }

    const checkingStatuses: Record<string, DomainStatus> = {}
    domainsToCheck.forEach(domain => {
      checkingStatuses[domain.id] = {
        id: domain.id,
        status: 'checking',
      }
    })
    setStatuses(prev => ({ ...prev, ...checkingStatuses }))

    const results = await Promise.all(
      domainsToCheck.map(domain => checkDomainStatus(domain.url, domain.id))
    )

    const newStatuses: Record<string, DomainStatus> = {}
    results.forEach(result => {
      newStatuses[result.id] = result
    })

    // Process results: update stats, detect incidents, send notifications
    for (const result of results) {
      const domain = domains.find(d => d.id === result.id)
      if (!domain) continue
      
      const oldStatus = previousStatuses[result.id] || 'online'
      const newStatus = result.status === 'checking' ? 'offline' : result.status
      
      // Hourly Write Policy: Write to Firebase if status changed OR 1 hour passed
      const statusChanged = oldStatus !== newStatus && oldStatus !== undefined
      const lastStatsWrite = domain.lastStatsWrite || 0
      const hoursSinceLastWrite = (Date.now() - lastStatsWrite) / (1000 * 60 * 60)
      const shouldWriteHourly = hoursSinceLastWrite >= 1
      
      // Write to Firebase: ONLY for auto-check (not manual check)
      // Manual check is local-only for real-time view without Firebase writes
      if (isAutoCheck && (statusChanged || shouldWriteHourly)) {
        console.log(`💾 [FIREBASE WRITE] Domain: ${domain.url}`)
        console.log(`   └─ Status: ${result.status} (changed: ${statusChanged}, hourly: ${shouldWriteHourly})`)
        console.log(`   └─ Response time: ${result.responseTime}ms`)
        
        try {
          await updateDailyStats(result.id, result)
          console.log(`   └─ ✅ Successfully written to Firebase`)
          trackFirebaseRead(1) // Read daily stats
          trackFirebaseWrite(1) // Write updated stats
          
          // Update lastStatsWrite timestamp
          setDomains(prevDomains => 
            prevDomains.map(d => 
              d.id === domain.id 
                ? { ...d, lastStatsWrite: Date.now() }
                : d
            )
          )
        } catch (error) {
          console.error(`   └─ ❌ Firebase write FAILED:`, error)
          console.error(`Failed to update stats for ${domain.url}:`, error)
        }
      } else if (isAutoCheck) {
        console.log(`⏭️  [FIREBASE SKIP] ${domain.url} - No write needed (last write: ${Math.round(hoursSinceLastWrite * 60)}min ago)`)
      }
      
      // Detect status changes (already calculated above for write policy)
      
      if (statusChanged) {
        // Update domain lastStatusChange timestamp
        const updatedDomain = { ...domain, lastStatusChange: Date.now() }
        setDomains(prevDomains => 
          prevDomains.map(d => d.id === domain.id ? updatedDomain : d)
        )
        
        // Handle incidents - ONLY for auto-check (not manual check)
        // Manual check should not create/resolve Firebase incidents
        if (isAutoCheck) {
          if (newStatus === 'offline' || newStatus === 'dns-only') {
            // Create new incident
            const incidentId = await createIncident(domain, result, oldStatus)
            if (incidentId) {
              trackFirebaseWrite(2) // Create incident + update stats
              setActiveIncidents(prev => ({ ...prev, [domain.id]: incidentId }))
            }
          } else if (newStatus === 'online' && (oldStatus === 'offline' || oldStatus === 'dns-only')) {
            // Resolve incident
            const incidentId = activeIncidents[domain.id]
            if (incidentId) {
              await resolveIncident(domain.id, incidentId)
              trackFirebaseRead(1) // Read incident
              trackFirebaseWrite(1) // Resolve incident
              setActiveIncidents(prev => {
                const newIncidents = { ...prev }
                delete newIncidents[domain.id]
                return newIncidents
              })
            }
          }
        }
        
        // Send notifications - ONLY for auto-check (not manual check)
        // Manual check should not trigger notifications
        if (isAutoCheck && notificationSettings.enabled && (domain.notificationsEnabled ?? false)) {
          const group = domain.groupId ? groups.find(g => g.id === domain.groupId) : undefined
          const domainTags = domain.tags?.map(tagId => tags.find(t => t.id === tagId)?.name).filter(Boolean) as string[] | undefined

          // Down notification
          if (oldStatus === 'online' && (newStatus === 'offline' || newStatus === 'dns-only')) {
            const details: NotificationDetails = {
              domain: domain.url,
              status: 'down',
              error: result.error,
              groupName: group?.name,
              tags: domainTags,
              ipAddress: result.ipAddress,
              protocol: result.protocol
            }
            await notificationService.sendSlackNotification(notificationSettings, details)
          }
          // Recovery notification
          else if ((oldStatus === 'offline' || oldStatus === 'dns-only') && newStatus === 'online') {
            const details: NotificationDetails = {
              domain: domain.url,
              status: 'recovery',
              responseTime: result.responseTime,
              groupName: group?.name,
              tags: domainTags,
              ipAddress: result.ipAddress,
              protocol: result.protocol
            }
            await notificationService.sendSlackNotification(notificationSettings, details)
          }
        }
        
        // Update previous status
        setPreviousStatuses(prev => ({ ...prev, [result.id]: newStatus }))
      }
      
      // Slow response notification - ONLY for auto-check (not manual check)
      // Manual check should not trigger slow response notifications
      if (isAutoCheck && 
          notificationSettings.enabled && 
          (domain.notificationsEnabled ?? false) &&
          result.status === 'online' && 
          result.responseTime && 
          result.responseTime >= (notificationSettings.slowThreshold * 1000)) {
        const group = domain.groupId ? groups.find(g => g.id === domain.groupId) : undefined
        const domainTags = domain.tags?.map(tagId => tags.find(t => t.id === tagId)?.name).filter(Boolean) as string[] | undefined
        
        const details: NotificationDetails = {
          domain: domain.url,
          status: 'slow',
          responseTime: result.responseTime,
          groupName: group?.name,
          tags: domainTags,
          ipAddress: result.ipAddress,
          protocol: result.protocol
        }
        await notificationService.sendSlackNotification(notificationSettings, details)
      }
    }

    setStatuses(prev => {
      const updated = { ...prev, ...newStatuses }
      // Save to localStorage ONLY for auto-check (not manual check)
      // Manual check is temporary view, should not persist after page refresh
      if (isAutoCheck) {
        localStorage.setItem('domain-last-statuses', JSON.stringify(updated))
      }
      return updated
    })
    setHasChecked(true)

    if (showToast) {
      const online = results.filter(r => r.status === 'online').length
      const offline = results.filter(r => r.status === 'offline').length
      const dnsOnly = results.filter(r => r.status === 'dns-only').length
      
      toast.success(
        `Selesai! Online: ${online}, DNS Only: ${dnsOnly}, Offline: ${offline}`,
        { duration: 4000 }
      )
    }
  }

  const handleAddDomain = (url: string) => {
    if (!canAddDomain) {
      toast.error('Anda tidak memiliki akses untuk menambah domain')
      return
    }

    const isDuplicate = domains?.some(d => d.url === url)
    if (isDuplicate) {
      toast.error('Domain sudah ada dalam daftar')
      return
    }

    // Assign batch using round-robin strategy
    const currentCount = domains?.length || 0
    const batch = assignCheckBatch(currentCount, currentCount + 1)

    const newDomain: Domain = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      url,
      addedAt: Date.now(),
      checkBatch: batch,
      lastStatusChange: Date.now(),
      consecutiveFailures: 0
    }

    const updatedDomains = [...(domains || []), newDomain]
    setDomains(updatedDomains)
    
    // No localStorage cache - useEffect will auto-sync to Firebase after 2s
    toast.success(`Domain berhasil ditambahkan (Batch ${batch})`)
  }

  const handleDeleteDomain = (id: string) => {
    if (!canEdit) {
      toast.error('Anda tidak memiliki akses untuk menghapus domain')
      return
    }

    const updatedDomains = (domains || []).filter(d => d.id !== id)
    setDomains(updatedDomains)
    
    // No localStorage cache - useEffect will auto-sync to Firebase after 2s
    
    setStatuses(current => {
      const newStatuses = { ...current }
      delete newStatuses[id]
      return newStatuses
    })
    setSelectedDomains(prev => {
      const newSet = new Set(prev)
      newSet.delete(id)
      return newSet
    })
    toast.success('Domain dihapus dari daftar')
  }

  const handleEditDomain = (id: string, newUrl: string, notificationsEnabled?: boolean) => {
    if (!canEdit) {
      toast.error('Anda tidak memiliki akses untuk mengedit domain')
      return
    }

    const updatedDomains = (domains || []).map(d =>
      d.id === id ? { ...d, url: newUrl, notificationsEnabled } : d
    )
    
    setDomains(updatedDomains)
    
    // No localStorage cache - useEffect will auto-sync to Firebase after 2s
    
    setStatuses(current => {
      const newStatuses = { ...current }
      delete newStatuses[id]
      return newStatuses
    })
    toast.success('Pengaturan domain berhasil disimpan')
  }

  const handleTogglePin = async (id: string) => {
    if (!canEdit) {
      toast.error('Anda tidak memiliki akses untuk pin/unpin domain')
      return
    }

    const domain = domains.find(d => d.id === id)
    const newPinnedState = !domain?.pinned
    
    const updatedDomains = (domains || []).map(d =>
      d.id === id ? { ...d, pinned: newPinnedState } : d
    )
    
    setDomains(updatedDomains)
    
    // No localStorage cache - useEffect will sync to Firebase after 2s debounce
    // Immediate sync for critical pin state
    try {
      await syncDomainsToFirestore(updatedDomains)
      console.log(`[Pin Sync] ✅ Domain ${domain?.url} pinned=${newPinnedState} synced to Firebase`)
      
      if (newPinnedState) {
        toast.success('Domain di-pin dan disinkronkan ke semua device')
      } else {
        toast.success('Domain di-unpin dan disinkronkan ke semua device')
      }
    } catch (error) {
      console.error('[Pin Sync] ❌ Failed to sync to Firebase:', error)
      toast.error('Gagal sync ke Firebase. Coba lagi.')
      // Revert state on error
      setDomains(domains)
      return
    }
  }

  const handleToggleDomainMonitoring = async (id: string) => {
    if (!canEdit) {
      toast.error('Anda tidak memiliki akses untuk mengubah monitoring domain')
      return
    }

    const domain = domains?.find(d => d.id === id)
    if (!domain) {
      console.error('Domain not found:', id)
      return
    }

    const newEnabledState = domain.enabled === true ? false : true

    if (newEnabledState) {
      // PLAY: Start continuous individual monitoring (every 2 minutes)
      console.log(`[Individual Monitor] PLAY clicked for: ${domain.url}`)
      toast.info(`Starting monitoring for ${domain.url}...`)

      try {
        // 1. Update domain enabled state in local state AND Firebase
        console.log(`[Individual Monitor] Step 1: Syncing enabled state to Firebase`)
        const updatedDomains = (domains || []).map(d =>
          d.id === id ? { ...d, enabled: true } : d
        )
        setDomains(updatedDomains)
        await syncDomainsToFirestore(updatedDomains)
        console.log(`[Individual Monitor] Step 1 complete`)

        // 2. Initial check immediately
        console.log(`[Individual Monitor] Step 2: Starting initial check for ${domain.url}`)
        setStatuses(current => ({
          ...current,
          [id]: { ...current[id], id, status: 'checking' }
        }))

        const result = await checkDomainStatus(domain.url, id)
        console.log(`[Individual Monitor] Step 2 complete - Result:`, result)
        setStatuses(current => ({ ...current, [id]: result }))

        // 3. Write to Firebase (individual monitoring always writes)
        console.log(`[Individual Monitor] Step 3: Writing to Firebase`)
        try {
          await updateDailyStats(result.id, result)
          console.log(`[Individual Monitor] Step 3 complete - Stats written to Firebase`)
          trackFirebaseRead(1)
          trackFirebaseWrite(1)
          
          setDomains(prevDomains => 
            prevDomains.map(d => 
              d.id === id ? { ...d, lastStatsWrite: Date.now() } : d
            )
          )
        } catch (error) {
          console.error(`[Individual Monitor] Failed to update stats:`, error)
        }

        // 4. Setup continuous monitoring interval (5 minutes)
        console.log(`[Individual Monitor] Step 4: Setting up 5-minute interval`)
        const intervalId = setInterval(async () => {
          console.log(`[Individual Monitor] Interval triggered for ${domain.url}`)
          
          // Use functional update to get latest domains state (avoid closure staleness)
          let currentDomain: typeof domain | undefined
          setDomains(currentDomains => {
            currentDomain = currentDomains?.find(d => d.id === id)
            return currentDomains // Don't modify, just read
          })
          
          console.log(`[Individual Monitor] Current domain enabled:`, currentDomain?.enabled)
          
          if (!currentDomain || currentDomain.enabled !== true) {
            console.log(`[Individual Monitor] Domain disabled or not found, skipping check`)
            return // Stop if domain was disabled
          }

          setStatuses(current => ({
            ...current,
            [id]: { ...current[id], id, status: 'checking' }
          }))
          
          const checkResult = await checkDomainStatus(domain.url, id)
          console.log(`[Individual Monitor] Interval check result:`, checkResult)
          setStatuses(current => ({ ...current, [id]: checkResult }))

          // Write to Firebase
          try {
            await updateDailyStats(checkResult.id, checkResult)
            console.log(`[Individual Monitor] Interval stats written to Firebase`)
            trackFirebaseRead(1)
            trackFirebaseWrite(1)
            
            setDomains(prevDomains => 
              prevDomains.map(d => 
                d.id === id ? { ...d, lastStatsWrite: Date.now() } : d
              )
            )
          } catch (error) {
            console.error(`[Individual Monitor] Interval failed to update stats:`, error)
          }
        }, 300000) // 5 minutes

        // Store interval ID to clear later
        setIndividualMonitorIntervals(prev => ({
          ...prev,
          [id]: intervalId
        }))
        console.log(`[Individual Monitor] Setup complete - monitoring every 5 minutes`)

        toast.success(`Monitoring started for ${domain.url} (checks every 5 minutes)`)
      } catch (error) {
        console.error(`[Individual Monitor] Error during setup:`, error)
        toast.error(`Failed to check ${domain.url}`)
        console.error(error)
      }
    } else {
      // PAUSE: Stop continuous individual monitoring
      console.log(`[Individual Monitor] PAUSE clicked for: ${domain.url}`)
      const updatedDomains = (domains || []).map(d =>
        d.id === id ? { ...d, enabled: false } : d
      )
      console.log(`[Individual Monitor] Setting enabled=false for domain ${domain.url}`)
      setDomains(updatedDomains)
      
      // Sync to Firebase
      console.log(`[Individual Monitor] Syncing PAUSE state to Firebase`)
      await syncDomainsToFirestore(updatedDomains)
      console.log(`[Individual Monitor] Firebase sync complete - enabled=false saved`)

      // Clear interval if exists
      if (individualMonitorIntervals[id]) {
        clearInterval(individualMonitorIntervals[id])
        setIndividualMonitorIntervals(prev => {
          const updated = { ...prev }
          delete updated[id]
          return updated
        })
      }

      toast.info(`Monitoring stopped for ${domain.url}`)
    }
  }

  const handleBulkDelete = () => {
    if (!canEdit) {
      toast.error('Anda tidak memiliki akses untuk menghapus domain')
      return
    }

    const count = selectedDomains.size
    if (count === 0) return

    setDomains(current => (current || []).filter(d => !selectedDomains.has(d.id)))
    setStatuses(current => {
      const newStatuses = { ...current }
      selectedDomains.forEach(id => delete newStatuses[id])
      return newStatuses
    })
    setSelectedDomains(new Set())
    toast.success(`${count} domain berhasil dihapus`)
  }

  const handleSelectDomain = (id: string, selected: boolean) => {
    setSelectedDomains(prev => {
      const newSet = new Set(prev)
      if (selected) {
        newSet.add(id)
      } else {
        newSet.delete(id)
      }
      return newSet
    })
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDomains(new Set(sortedDomains.map(d => d.id)))
    } else {
      setSelectedDomains(new Set())
    }
  }

  const handleManualRefresh = async () => {
    setIsRefreshing(true)
    setCountdown(getSecondsUntilNextBatch())
    if (autoRefreshEnabled) {
      setIsPaused(false)
    }
    await checkAllDomains(true, false, false) // Manual check: local only, no Firebase
    setIsRefreshing(false)
    setLastCheckTime(new Date())
  }

  const handleTogglePause = () => {
    setIsPaused(prev => {
      const newPausedState = !prev
      if (newPausedState) {
        toast.info('Auto-refresh dijeda')
      } else {
        toast.info('Auto-refresh dilanjutkan')
        setCountdown(getSecondsUntilNextBatch())
      }
      return newPausedState
    })
  }

  const handleToggleAutoRefresh = () => {
    setAutoRefreshEnabled(prev => {
      const newState = !prev
      if (newState) {
        toast.success('Mode auto-refresh diaktifkan')
        setIsPaused(false)
        setCountdown(getSecondsUntilNextBatch())
        if (!hasChecked) {
          checkAllDomains(true, false, true) // Auto check: write to Firebase
        }
      } else {
        toast.info('Mode manual check diaktifkan')
        setIsPaused(true)
      }
      return newState
    })
  }

  const handleExportCSV = () => {
    console.log('[Export] Starting export, domains:', domains?.length, 'statuses:', Object.keys(statuses).length)
    
    if (!domains || domains.length === 0) {
      toast.error('Tidak ada data untuk diekspor')
      return
    }

    if (!autoRefreshEnabled && !hasChecked) {
      toast.error('Silakan check domain terlebih dahulu sebelum export')
      return
    }
    
    try {
      const result = exportDomainsToCSV(domains, statuses)
      console.log('[Export] Export result:', result)
      
      if (!result.success) {
        if (result.duplicates && result.duplicates.length > 0) {
          toast.error(
            `Ditemukan ${result.duplicates.length} domain duplikat. Harap hapus duplikat terlebih dahulu: ${result.duplicates.slice(0, 3).join(', ')}${result.duplicates.length > 3 ? '...' : ''}`,
            { duration: 6000 }
          )
        } else {
          toast.error('Gagal mengekspor data')
        }
        return
      }
      
      toast.success(`Berhasil mengekspor ${domains.length} domain ke CSV`)
    } catch (error) {
      console.error('[Export] Error during export:', error)
      toast.error('Terjadi kesalahan saat mengekspor data')
    }
  }

  const handleExportFilteredCSV = () => {
    console.log('[Export Filtered] Starting export, filtered domains:', filteredDomains.length)
    
    if (filteredDomains.length === 0) {
      toast.error('Tidak ada domain yang terfilter untuk diekspor')
      return
    }

    if (!autoRefreshEnabled && !hasChecked) {
      toast.error('Silakan check domain terlebih dahulu sebelum export')
      return
    }
    
    try {
      let filename = 'monitoring-domains'
      if (viewMode === 'group-detail' && selectedGroup) {
        filename = selectedGroup.name
      } else if (filter !== 'all') {
        filename += `-${filter}`
      }
      
      const result = exportDomainsToCSV(filteredDomains, statuses, filename)
      console.log('[Export Filtered] Export result:', result)
      
      if (!result.success) {
        if (result.duplicates && result.duplicates.length > 0) {
          toast.error(
            `Ditemukan ${result.duplicates.length} domain duplikat. Harap hapus duplikat terlebih dahulu: ${result.duplicates.slice(0, 3).join(', ')}${result.duplicates.length > 3 ? '...' : ''}`,
            { duration: 6000 }
          )
        } else {
          toast.error('Gagal mengekspor data')
        }
        return
      }
      
      toast.success(`${filteredDomains.length} domain terfilter berhasil diekspor ke CSV`)
    } catch (error) {
      console.error('[Export Filtered] Error during export:', error)
      toast.error('Terjadi kesalahan saat mengekspor data')
    }
  }

  const handleExportGroupCSV = (groupId: string) => {
    const group = groups?.find(g => g.id === groupId)
    if (!group) return

    console.log('[Export Group] Starting export for group:', group.name)

    if (!autoRefreshEnabled && !hasChecked) {
      toast.error('Silakan check domain terlebih dahulu sebelum export')
      return
    }

    const groupDomains = domains?.filter(d => d.groupId === groupId) || []
    console.log('[Export Group] Group domains:', groupDomains.length)
    
    if (groupDomains.length === 0) {
      toast.error('Tidak ada domain dalam grup ini')
      return
    }
    
    try {
      const result = exportDomainsToCSV(groupDomains, statuses, group.name)
      console.log('[Export Group] Export result:', result)
      
      if (!result.success) {
        if (result.duplicates && result.duplicates.length > 0) {
          toast.error(
            `Ditemukan ${result.duplicates.length} domain duplikat. Harap hapus duplikat terlebih dahulu: ${result.duplicates.slice(0, 3).join(', ')}${result.duplicates.length > 3 ? '...' : ''}`,
            { duration: 6000 }
          )
        } else {
          toast.error('Gagal mengekspor data')
        }
        return
      }
      
      toast.success(`Domain grup "${group.name}" berhasil diekspor ke CSV`)
    } catch (error) {
      console.error('[Export Group] Error during export:', error)
      toast.error('Terjadi kesalahan saat mengekspor data')
    }
  }

  const handleImportDomains = (importedDomains: Domain[], groupId?: string) => {
    if (!canEdit) {
      toast.error('Anda tidak memiliki akses untuk import domain')
      return
    }

    if (importedDomains.length === 0) return

    const domainsWithGroup = groupId 
      ? importedDomains.map(d => ({ ...d, groupId }))
      : importedDomains

    setDomains(current => [...(current || []), ...domainsWithGroup])
    
    if (groupId) {
      const group = groups?.find(g => g.id === groupId)
      toast.success(`${importedDomains.length} domain berhasil diimport ke grup "${group?.name}"`)
    } else {
      toast.success(`${importedDomains.length} domain berhasil diimport`)
    }
  }

  const handleCreateGroup = async (groupData: Omit<DomainGroup, 'id' | 'createdAt'>) => {
    if (!canEdit) {
      toast.error('Anda tidak memiliki akses untuk membuat grup')
      return
    }

    const newGroup: DomainGroup = {
      ...groupData,
      id: `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
    }
    const updatedGroups = [...(groups || []), newGroup]
    console.log('[Create Group] Adding new group:', newGroup.name)
    console.log('[Create Group] Total groups after add:', updatedGroups.length)
    console.log('[Create Group] All groups:', updatedGroups.map(g => ({ id: g.id, name: g.name })))
    setGroups(updatedGroups)
    
    // useEffect will auto-sync after 2s, but also sync immediately for critical operation
    console.log('[Create Group] Syncing to Firebase...')
    try {
      await syncGroupsToFirestore(updatedGroups)
      console.log('[Create Group] ✅ Synced to Firebase')
      toast.success('Grup berhasil dibuat dan disinkronkan ke semua device')
    } catch (err) {
      console.error('[Create Group] ❌ Firebase error:', err)
      toast.error('Grup dibuat tapi gagal sync ke Firebase. Cek koneksi internet.')
    }
  }

  const handleEditGroup = async (groupData: Omit<DomainGroup, 'id' | 'createdAt'>) => {
    if (!editingGroup) return
    
    const updatedGroups = (groups || []).map(g =>
      g.id === editingGroup.id
        ? { ...g, ...groupData }
        : g
    )
    console.log('[Edit Group] Updating group:', editingGroup.name)
    setGroups(updatedGroups)
    
    // useEffect will auto-sync after 2s, but also sync immediately for critical operation
    try {
      await syncGroupsToFirestore(updatedGroups)
      console.log('[Edit Group] ✅ Synced to Firebase')
      toast.success('Grup berhasil diperbarui dan disinkronkan ke semua device')
    } catch (err) {
      console.error('[Edit Group] ❌ Firebase error:', err)
      toast.error('Grup diperbarui tapi gagal sync ke Firebase. Cek koneksi internet.')
    }
    
    setEditingGroup(null)
  }

  const handleDeleteGroup = async (groupId: string) => {
    if (!canEdit) {
      toast.error('Anda tidak memiliki akses untuk menghapus grup')
      return
    }

    const updatedGroups = (groups || []).filter(g => g.id !== groupId)
    console.log('[Delete Group] Deleting group:', groupId)
    setGroups(updatedGroups)
    
    // useEffect will auto-sync after 2s, but also sync immediately for critical operation
    try {
      await syncGroupsToFirestore(updatedGroups)
      console.log('[Delete Group] ✅ Synced to Firebase')
    } catch (err) {
      console.error('[Delete Group] ❌ Firebase error:', err)
      toast.error('Grup dihapus tapi gagal sync ke Firebase. Cek koneksi internet.')
    }
    
    const updatedDomains = (domains || []).map(d =>
      d.groupId === groupId ? { ...d, groupId: undefined } : d
    )
    setDomains(updatedDomains)
    
    // No localStorage cache - useEffect will sync domains to Firebase
    toast.success('Grup berhasil dihapus dan disinkronkan ke semua device')
  }

  const handleAssignDomains = (domainIds: string[], groupId: string | null) => {
    const updatedDomains = (domains || []).map(d =>
      domainIds.includes(d.id)
        ? { ...d, groupId: groupId || undefined }
        : d
    )
    
    console.log('[Assign Domains] Updating', domainIds.length, 'domains to group:', groupId)
    setDomains(updatedDomains)
    
    // No localStorage cache - useEffect will auto-sync to Firebase after 2s
    toast.success('Domain berhasil diatur grupnya')
  }

  const handleViewGroupDomains = (groupId: string) => {
    setSelectedGroupId(groupId)
    setViewMode('group-detail')
    setActiveTab('domains')
  }

  const handleCreateTag = (tagData: Omit<DomainTag, 'id' | 'createdAt'>) => {
    if (!canEdit) {
      toast.error('Anda tidak memiliki akses untuk membuat tag')
      return
    }

    const newTag: DomainTag = {
      ...tagData,
      id: `tag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
    }
    const updatedTags = [...(tags || []), newTag]
    console.log('[Create Tag] Adding new tag:', newTag.name, '- Total tags:', updatedTags.length)
    setTags(updatedTags)
    // useEffect will sync to Firebase after 2s
    
    toast.success('Tag berhasil dibuat')
  }

  const handleEditTag = (tagData: Omit<DomainTag, 'id' | 'createdAt'>) => {
    if (!editingTag) return
    
    const updatedTags = (tags || []).map(t =>
      t.id === editingTag.id
        ? { ...t, ...tagData }
        : t
    )
    console.log('[Edit Tag] Updating tag:', editingTag.name, '- Total tags:', updatedTags.length)
    setTags(updatedTags)
    // useEffect will sync to Firebase after 2s
    
    toast.success('Tag berhasil diperbarui')
    setEditingTag(null)
  }

  const handleDeleteTag = (tagId: string) => {
    if (!canEdit) {
      toast.error('Anda tidak memiliki akses untuk menghapus tag')
      return
    }

    const updatedTags = (tags || []).filter(t => t.id !== tagId)
    console.log('[Delete Tag] Deleting tag:', tagId, '- Remaining tags:', updatedTags.length)
    setTags(updatedTags)
    // useEffect will sync to Firebase after 2s
    
    setDomains(current =>
      (current || []).map(d => ({
        ...d,
        tags: d.tags?.filter(t => t !== tagId)
      }))
    )
    toast.success('Tag berhasil dihapus')
  }

  const handleAssignTags = (domainIds: string[], tagIds: string[]) => {
    const updatedDomains = (domains || []).map(d => {
      if (!domainIds.includes(d.id)) return d
      
      const existingTags = d.tags || []
      const newTags = [...new Set([...existingTags, ...tagIds])]
      return { ...d, tags: newTags }
    })
    
    console.log('[Assign Tags] Updating', domainIds.length, 'domains with', tagIds.length, 'tags')
    setDomains(updatedDomains)
    
    // No localStorage cache - useEffect will auto-sync to Firebase after 2s
    
    toast.success(`Tag berhasil ditambahkan ke ${domainIds.length} domain`)
  }

  // Initial auto-check delay when auto-refresh enabled
  useEffect(() => {
    if (!autoRefreshEnabled || isPaused) return

    // Delay initial check by 10 seconds to avoid Firebase quota on app load
    const initialDelay = setTimeout(() => {
      console.log('[Auto-Check] Initial check after 10s delay')
      checkAllDomains(false, true, true) // Initial batch check with Firebase
      setCountdown(getSecondsUntilNextBatch())
    }, 10000)

    return () => {
      clearTimeout(initialDelay)
    }
  }, [autoRefreshEnabled, isPaused])

  // Auto-cleanup old stats (runs once per day)
  useEffect(() => {
    const checkAndCleanup = async () => {
      const lastCleanup = localStorage.getItem('last-cleanup-date')
      const today = new Date().toISOString().split('T')[0]
      
      if (lastCleanup !== today) {
        try {
          const { cleanupOldStats } = await import('@/lib/check-history')
          await cleanupOldStats()
          localStorage.setItem('last-cleanup-date', today)
          console.log('✅ Old stats cleaned up successfully')
        } catch (error) {
          console.error('❌ Error cleaning up old stats:', error)
        }
      }
    }
    
    // Run cleanup check 1 minute after app load
    const cleanupTimer = setTimeout(checkAndCleanup, 60000)
    return () => clearTimeout(cleanupTimer)
  }, [])

  // Calculate seconds until next batch check
  const getSecondsUntilNextBatch = () => {
    const now = new Date()
    const currentMinute = now.getMinutes()
    const currentSecond = now.getSeconds()
    
    // Find next batch time (every 5 minutes: 0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55)
    const nextBatchMinute = Math.ceil((currentMinute + 1) / 5) * 5
    const minutesUntilNext = nextBatchMinute - currentMinute
    const secondsUntilNext = (minutesUntilNext * 60) - currentSecond
    
    return secondsUntilNext
  }

  // Web Worker for background auto-checking (not affected by browser tab throttling)
  useEffect(() => {
    if (!autoRefreshEnabled || isPaused) return

    console.log('[Worker] Initializing background worker for auto-check...')
    
    // Create Web Worker
    const worker = new Worker(new URL('@/lib/background-worker.ts', import.meta.url), {
      type: 'module'
    })

    // Initialize countdown to next batch
    setCountdown(getSecondsUntilNextBatch())

    // Countdown UI updater (runs every second in main thread)
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          return 300 // Reset to 5 minutes
        }
        return prev - 1
      })
    }, 1000)

    // Handle messages from worker
    worker.onmessage = (e: MessageEvent) => {
      if (e.data.type === 'CHECK') {
        console.log('[Worker] Received CHECK signal from worker, triggering batch check...')
        checkAllDomains(false, true, true) // Batch check with Firebase write
        setCountdown(getSecondsUntilNextBatch()) // Reset countdown
      }
    }

    // Start worker interval
    worker.postMessage({ type: 'START' })
    console.log('[Worker] Background worker started')

    return () => {
      console.log('[Worker] Cleaning up background worker')
      worker.postMessage({ type: 'STOP' })
      worker.terminate()
      clearInterval(countdownInterval)
    }
  }, [isPaused, autoRefreshEnabled])

  useEffect(() => {
    setSelectedDomains(new Set())
  }, [filter, debouncedSearchQuery, sortBy, viewMode, selectedGroupId, activeTab, manageGroupFilter, manageTagFilter])

  const currentViewDomains = useMemo(() => {
    if (viewMode === 'group-detail' && selectedGroupId) {
      return domains?.filter(d => d.groupId === selectedGroupId) || []
    }
    return domains || []
  }, [domains, viewMode, selectedGroupId])

  const onlineCount = useMemo(() => 
    currentViewDomains.filter(d => statuses[d.id]?.status === 'online').length,
    [currentViewDomains, statuses]
  )
  const offlineCount = useMemo(() => 
    currentViewDomains.filter(d => statuses[d.id]?.status === 'offline').length,
    [currentViewDomains, statuses]
  )
  const dnsOnlyCount = useMemo(() => 
    currentViewDomains.filter(d => statuses[d.id]?.status === 'dns-only').length,
    [currentViewDomains, statuses]
  )
  const totalCount = currentViewDomains.length

  const globalOnlineCount = useMemo(() => 
    (domains || []).filter(d => statuses[d.id]?.status === 'online').length,
    [domains, statuses]
  )
  const globalOfflineCount = useMemo(() => 
    (domains || []).filter(d => statuses[d.id]?.status === 'offline').length,
    [domains, statuses]
  )
  const globalDnsOnlyCount = useMemo(() => 
    (domains || []).filter(d => statuses[d.id]?.status === 'dns-only').length,
    [domains, statuses]
  )
  const globalTotalCount = domains?.length || 0

  const filteredDomains = useMemo(() => 
    currentViewDomains.filter(domain => {
      const matchesFilter = filter === 'all' || (() => {
        const status = statuses[domain.id]?.status
        if (!status || status === 'checking') return true
        return status === filter
      })()
      
      const matchesSearch = debouncedSearchQuery === '' || 
        domain.url.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      
      return matchesFilter && matchesSearch
    }),
    [currentViewDomains, filter, debouncedSearchQuery, statuses]
  )

  const sortedDomains = useFilteredDomains({
    domains: filteredDomains,
    statuses,
    filter: 'all',
    searchQuery: '',
    sortBy,
  })

  const filteredManageDomains = useMemo(() => 
    (domains || []).filter(domain => {
      const matchesSearch = debouncedManageSearchQuery === '' || 
        domain.url.toLowerCase().includes(debouncedManageSearchQuery.toLowerCase())
      
      const matchesGroup = manageGroupFilter === 'all' || 
        (manageGroupFilter === 'ungrouped' && !domain.groupId) ||
        domain.groupId === manageGroupFilter
      
      const matchesTag = manageTagFilter === 'all' ||
        (manageTagFilter === 'untagged' && (!domain.tags || domain.tags.length === 0)) ||
        (domain.tags && domain.tags.includes(manageTagFilter))
      
      const matchesNotification = manageNotificationFilter === 'all' ||
        (manageNotificationFilter === 'enabled' && domain.notificationsEnabled === true) ||
        (manageNotificationFilter === 'disabled' && domain.notificationsEnabled !== true)
      
      const matchesPin = managePinFilter === 'all' ||
        (managePinFilter === 'pinned' && domain.pinned === true) ||
        (managePinFilter === 'unpinned' && domain.pinned !== true)
      
      return matchesSearch && matchesGroup && matchesTag && matchesNotification && matchesPin
    }),
    [domains, debouncedManageSearchQuery, manageGroupFilter, manageTagFilter, manageNotificationFilter, managePinFilter]
  )

  const selectedGroup = selectedGroupId ? groups?.find(g => g.id === selectedGroupId) : null

  const getGroupStats = (groupId: string) => {
    const groupDomains = domains?.filter(d => d.groupId === groupId) || []
    const count = groupDomains.length
    const online = groupDomains.filter(d => statuses[d.id]?.status === 'online').length
    const offline = groupDomains.filter(d => statuses[d.id]?.status === 'offline').length
    const dnsOnly = groupDomains.filter(d => statuses[d.id]?.status === 'dns-only').length
    return { count, online, offline, dnsOnly }
  }

  return (
    <TooltipProvider>
      <div className="h-screen bg-card overflow-hidden flex flex-col">
        {!isAuthenticated ? (
          /* Landing Page - Login Screen */
          <div className="flex-1 flex flex-col items-center justify-center px-4 relative">
            {/* Theme toggle on landing page */}
            <div className="absolute top-4 right-4">
              <ThemeToggle />
            </div>
            <div className="w-full max-w-sm space-y-8">
              {/* Branding */}
              <div className="text-center space-y-3">
                <div className="flex justify-center">
                  <img 
                    src="/logo.webp" 
                    alt="Logo Kendal"
                    className="w-16 h-16 md:w-20 md:h-20 object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                    Domain Monitor
                  </h1>
                  <p className="text-sm text-muted-foreground tracking-wide mt-1">
                    Kabupaten Kendal
                  </p>
                </div>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Monitoring availability & uptime subdomain secara real-time
                </p>
              </div>

              {/* Login Form */}
              <div className="bg-card border border-border rounded-lg p-6 shadow-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Lock className="h-5 w-5 text-muted-foreground" weight="duotone" />
                  <h2 className="text-lg font-semibold text-foreground">Login</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Masuk dengan akun Anda untuk mengakses dashboard
                </p>
                <LoginForm onLogin={handleLogin} />
              </div>
            </div>
          </div>
        ) : (
        <div className="container mx-auto px-2 md:px-4 py-4 max-w-5xl flex-1 flex flex-col overflow-hidden min-h-0">
          <header className="mb-4">
            <div className="flex items-center justify-between gap-2">
              {/* Mobile Hamburger - Only visible on mobile */}
              <MobileNav
                onImport={() => {}} 
                onExport={handleExportCSV}
                notificationSettings={notificationSettings}
                onNotificationSettingsSave={handleNotificationSettingsSave}
                onTestNotification={handleTestNotification}
                getHistory={() => notificationService.getHistory()}
                clearHistory={() => notificationService.clearHistory()}
                onChangePassword={handlePasswordChange}
                onLogout={handleLogout}
                isAutoRefresh={autoRefreshEnabled}
                onToggleAutoRefresh={handleToggleAutoRefresh}
                canManageUsers={canManageUsers}
              />
              
              <div className="flex items-center gap-2.5">
                <img 
                  src="/logo.webp" 
                  alt="Logo Kendal"
                  className="w-8 h-8 md:w-10 md:h-10 object-contain"
                />
                <div>
                  <h1 className="text-lg md:text-2xl font-bold tracking-tight text-foreground">
                    Domain Monitor
                  </h1>
                  <p className="text-[10px] md:text-xs text-muted-foreground tracking-wide">
                    Kabupaten Kendal
                  </p>
                </div>
              </div>

              {/* Desktop Actions - Hidden on mobile */}
              <div className="hidden md:flex items-center gap-2">
                {isAuthenticated && currentUser && (
                  <div className="h-8 flex items-center gap-1.5 px-2 rounded-md border border-border bg-muted/20">
                    <UserCircle size={17} className="text-muted-foreground" />
                    <div className="leading-[1.05]">
                      <p className="text-xs font-medium text-foreground">{currentUser.username}</p>
                      <p className="text-[10px] text-muted-foreground">{currentUserRoleLabel}</p>
                    </div>
                  </div>
                )}

                {/* Settings Menu Button */}
                {isAuthenticated && (
                  <SettingsMenuDialog
                    notificationSettings={notificationSettings}
                    onNotificationSettingsSave={handleNotificationSettingsSave}
                    onTestNotification={handleTestNotification}
                    getHistory={() => notificationService.getHistory()}
                    clearHistory={() => notificationService.clearHistory()}
                    onChangePassword={handlePasswordChange}
                    onLogout={handleLogout}
                    canManageUsers={canManageUsers}
                    managedUsers={managedUsers}
                    currentUserId={currentUser?.id}
                    onCreateUser={handleCreateUser}
                    onToggleUserActive={handleToggleUserActive}
                    onDeleteUser={handleDeleteUser}
                  />
                )}

                <ThemeToggle />

                <div className="h-6 w-px bg-border" />

                {canEdit && (
                  <ImportDialog
                    existingDomains={domains || []}
                    groups={groups || []}
                    onImport={handleImportDomains}
                  />
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCSV}
                  disabled={isRefreshing || (!autoRefreshEnabled && !hasChecked) || !domains || domains.length === 0}
                  className="h-8"
                  title={!autoRefreshEnabled && !hasChecked ? "Check domain terlebih dahulu" : "Export semua domain"}
                >
                  <DownloadSimple size={14} />
                  <span className="ml-1.5">Export</span>
                </Button>

                <div className="h-6 w-px bg-border" />

                <Button
                  variant={autoRefreshEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={handleToggleAutoRefresh}
                  className="h-8 text-xs"
                  title={autoRefreshEnabled ? "Switch ke Mode Manual" : "Switch ke Mode Auto-refresh"}
                >
                  {autoRefreshEnabled ? "Auto" : "Manual"}
                </Button>

                {autoRefreshEnabled && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTogglePause}
                    className="h-8"
                    title={isPaused ? "Resume Auto-refresh" : "Pause Auto-refresh"}
                  >
                    {isPaused ? <Play size={14} weight="fill" /> : <Pause size={14} weight="fill" />}
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  className="h-8"
                  title="Check Sekarang"
                >
                  <ArrowClockwise 
                    size={14} 
                    className={isRefreshing ? 'animate-spin' : ''} 
                  />
                  {isRefreshing && <span className="text-xs ml-1.5">Checking...</span>}
                </Button>
              </div>
              
              {/* Mobile Quick Action - Only Check button visible */}
              <div className="flex md:hidden items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  className="h-10 w-10 p-0"
                  title="Check Sekarang"
                >
                  <ArrowClockwise 
                    size={18} 
                    className={isRefreshing ? 'animate-spin' : ''} 
                  />
                </Button>
              </div>
            </div>
          </header>

        <Tabs value={activeTab} onValueChange={(val) => {
          setActiveTab(val as 'domains' | 'groups' | 'manage' | 'tags' | 'statistics' | 'pinned')
          if (val === 'domains' && viewMode === 'group-detail') {
            setViewMode('all')
            setSelectedGroupId(null)
          }
          // Auto-check domains when opening monitoring tab for the first time
          if (val === 'domains' && !autoRefreshEnabled && !hasChecked && !isRefreshing && domains.length > 0) {
            handleManualRefresh()
          }
        }} className="flex-1 flex flex-col overflow-hidden bg-card">
          <TabsList className="grid w-full max-w-3xl grid-cols-6 mb-8 md:mb-6 gap-1 md:gap-0 h-10 p-1 mt-2">
            <TabsTrigger value="pinned" className="gap-0 md:gap-1.5 text-[11px] md:text-sm h-9 px-1 md:px-3">
              <MapPin size={18} weight="fill" className="md:size-4" />
              <span className="hidden md:inline">Pin</span>
            </TabsTrigger>
            <TabsTrigger value="domains" className="gap-0 md:gap-1.5 text-[11px] md:text-sm h-9 px-1 md:px-3">
              <Monitor size={18} className="md:size-4" />
              <span className="hidden md:inline">Monitoring</span>
            </TabsTrigger>
            <TabsTrigger value="statistics" className="gap-0 md:gap-1.5 text-[11px] md:text-sm h-9 px-1 md:px-3">
              <ChartBar size={18} className="md:size-4" />
              <span className="hidden md:inline">Statistik</span>
            </TabsTrigger>
            <TabsTrigger value="groups" className="gap-0 md:gap-1.5 text-[11px] md:text-sm h-9 px-1 md:px-3">
              <FolderOpen size={18} className="md:size-4" />
              <span className="hidden md:inline">Grup</span>
            </TabsTrigger>
            <TabsTrigger value="tags" className="gap-0 md:gap-1.5 text-[11px] md:text-sm h-9 px-1 md:px-3">
              <Tag size={18} className="md:size-4" />
              <span className="hidden md:inline">Tag</span>
            </TabsTrigger>
            <TabsTrigger value="manage" className="gap-0 md:gap-1.5 text-[11px] md:text-sm h-9 px-1 md:px-3">
              <Toolbox size={18} className="md:size-4" />
              <span className="hidden md:inline">Kelola</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="domains" className="space-y-4 flex-1 flex flex-col overflow-hidden">
            {!autoRefreshEnabled && hasChecked && !isRefreshing && totalCount > 0 && (
              <div className="space-y-3">
                <div className="bg-success/10 border border-success/30 rounded-lg p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-6 h-6 rounded bg-success/20 flex items-center justify-center flex-shrink-0">
                        <CheckSquare size={14} weight="duotone" className="text-success" />
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs flex-1 min-w-0">
                        <span className="font-semibold text-success whitespace-nowrap">Check Selesai!</span>
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
                          <span className="text-muted-foreground">{onlineCount}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          <span className="text-muted-foreground">{dnsOnlyCount}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-destructive"></span>
                          <span className="text-muted-foreground">{offlineCount}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setHasChecked(false)
                          setStatuses({})
                          toast.info('Status domain direset')
                        }}
                        className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
                      >
                        <X size={16} />
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={handleExportCSV}
                        className="h-7 bg-success text-success-foreground hover:bg-success/90 hidden sm:flex"
                      >
                        <DownloadSimple size={14} />
                        <span className="ml-1">Export</span>
                      </Button>
                      <Button
                        variant="default"
                        size="icon"
                        onClick={handleExportCSV}
                        className="h-7 w-7 bg-success text-success-foreground hover:bg-success/90 sm:hidden"
                      >
                        <DownloadSimple size={14} />
                      </Button>
                    </div>
                  </div>
                </div>
                
                {dnsOnlyCount > onlineCount && dnsOnlyCount > 5 && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                        <Info size={18} weight="duotone" className="text-amber-500" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold" style={{ color: 'rgb(245, 158, 11)' }}>Banyak Status DNS Only Terdeteksi</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Jika website sebenarnya bisa diakses normal, kemungkinan masalahnya adalah <span className="font-semibold text-foreground">browser security (CORS)</span> yang memblokir monitoring cross-origin dari aplikasi ini. 
                          Klik icon <Globe size={12} weight="duotone" className="inline" /> untuk verifikasi manual ke website asli.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {viewMode === 'group-detail' && selectedGroup && (
              <div className="flex items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setViewMode('all')
                      setSelectedGroupId(null)
                    }}
                    className="h-7 text-xs"
                  >
                    ← Kembali
                  </Button>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-6 h-6 rounded flex items-center justify-center"
                      style={{ backgroundColor: `${selectedGroup.color}20` }}
                    >
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: selectedGroup.color }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-foreground">{selectedGroup.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({currentViewDomains.length} domain)
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {filteredDomains.length !== currentViewDomains.length && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportFilteredCSV}
                      disabled={filteredDomains.length === 0 || (!autoRefreshEnabled && !hasChecked)}
                      className="h-7 text-xs"
                      title={!autoRefreshEnabled && !hasChecked ? "Check domain terlebih dahulu" : ""}
                    >
                      <DownloadSimple size={14} />
                      Export Terfilter ({filteredDomains.length})
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportGroupCSV(selectedGroup.id)}
                    disabled={currentViewDomains.length === 0 || (!autoRefreshEnabled && !hasChecked)}
                    className="h-7 text-xs"
                    title={!autoRefreshEnabled && !hasChecked ? "Check domain terlebih dahulu" : ""}
                  >
                    <DownloadSimple size={14} />
                    Export Semua
                  </Button>
                </div>
              </div>
            )}

            {totalCount > 0 && (
              <div className="space-y-3">
                {/* Stats Bar - Responsive */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-xs px-1">
                  {/* Left: Status counts */}
                  <div className="flex flex-wrap items-center gap-2 md:gap-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-success shadow-[0_0_8px_rgba(76,175,80,0.6)]" />
                      <span className="text-muted-foreground">Online</span>
                      <span className="font-semibold" style={{ color: 'oklch(0.70 0.22 145)' }}>{onlineCount}</span>
                    </div>
                    {dnsOnlyCount > 0 && (
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                        <span className="text-muted-foreground">DNS Only</span>
                        <span className="font-semibold" style={{ color: 'rgb(245, 158, 11)' }}>{dnsOnlyCount}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-destructive shadow-[0_0_8px_rgba(244,67,54,0.6)]" />
                      <span className="text-muted-foreground">Offline</span>
                      <span className="font-semibold text-destructive">{offlineCount}</span>
                    </div>
                  </div>
                  
                  {/* Right: Mode & Actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-muted-foreground whitespace-nowrap">
                      {autoRefreshEnabled 
                        ? (isPaused ? 'Dijeda' : `Auto • ${Math.floor(countdown / 60)}:${(countdown % 60).toString().padStart(2, '0')}`) 
                        : 'Manual'} • {totalCount}
                    </span>
                    {filteredDomains.length !== totalCount && (
                      <Badge variant="secondary" className="text-[10px] font-mono h-5">
                        {filteredDomains.length} shown
                      </Badge>
                    )}
                    {autoRefreshEnabled && !isPaused && (
                      <Progress 
                        value={(countdown / 300) * 100} 
                        className="w-12 h-1.5 hidden md:block"
                      />
                    )}
                    {viewMode !== 'group-detail' && (filter !== 'all' || searchQuery !== '') && filteredDomains.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportFilteredCSV}
                        disabled={!autoRefreshEnabled && !hasChecked}
                        className="h-7 text-xs hidden md:flex"
                        title={!autoRefreshEnabled && !hasChecked ? "Check domain terlebih dahulu" : ""}
                      >
                        <DownloadSimple size={14} />
                        Export
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">Filter:</span>
                    <div className="flex gap-1.5 flex-1">
                      <Button
                        variant={filter === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter('all')}
                        className="h-8 px-3 text-xs flex-1 lg:flex-none"
                      >
                        Semua
                      </Button>
                      <Button
                        variant={filter === 'online' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter('online')}
                        className="h-8 px-3 text-xs flex-1 lg:flex-none"
                      >
                        Online
                      </Button>
                      {dnsOnlyCount > 0 && (
                        <Button
                          variant={filter === 'dns-only' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setFilter('dns-only')}
                          className="h-8 px-3 text-xs flex-1 lg:flex-none"
                        >
                          DNS Only
                        </Button>
                      )}
                      <Button
                        variant={filter === 'offline' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter('offline')}
                        className="h-8 px-3 text-xs flex-1 lg:flex-none"
                      >
                        Offline
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex-1 lg:flex-none lg:w-40">
                      <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortType)}>
                        <SelectTrigger className="h-9 text-xs w-full">
                          <div className="flex items-center gap-1.5">
                            <SortAscending size={14} />
                            <SelectValue placeholder="Urutkan" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none" className="text-xs">Default</SelectItem>
                          <SelectItem value="name-asc" className="text-xs">Nama A-Z</SelectItem>
                          <SelectItem value="name-desc" className="text-xs">Nama Z-A</SelectItem>
                          <SelectItem value="status-online-first" className="text-xs">Online Pertama</SelectItem>
                          <SelectItem value="status-offline-first" className="text-xs">Offline Pertama</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="relative flex-1">
                      <MagnifyingGlass 
                        size={14} 
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" 
                      />
                      <Input
                        type="text"
                        placeholder="Cari domain..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-9 pl-8 pr-8 text-xs w-full"
                      />
                      {searchQuery && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSearchQuery('')}
                          className="absolute right-0 top-1/2 -translate-y-1/2 h-9 w-9 p-0 hover:bg-transparent"
                        >
                          <X size={14} className="text-muted-foreground hover:text-foreground" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!domains || domains.length === 0 ? (
              <EmptyState />
            ) : !hasChecked && !autoRefreshEnabled ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-6 max-w-md mx-auto">
                  <div className="w-24 h-24 rounded-2xl bg-primary/20 mx-auto flex items-center justify-center">
                    <ArrowClockwise size={48} weight="duotone" className="text-primary" />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-foreground">Mode Manual Check</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Klik tombol di bawah untuk memeriksa status semua domain.<br />
                      Setelah selesai, Anda dapat langsung export hasilnya.
                    </p>
                    <Button
                      onClick={handleManualRefresh}
                      disabled={isRefreshing}
                      size="lg"
                      className="mt-4"
                    >
                      <ArrowClockwise 
                        size={20} 
                        className={isRefreshing ? 'animate-spin mr-2' : 'mr-2'} 
                      />
                      {isRefreshing ? 'Checking...' : `Check All Domains (${totalCount})`}
                    </Button>
                  </div>
                </div>
              </div>
            ) : filteredDomains.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {searchQuery 
                      ? `Tidak ada domain yang cocok dengan "${searchQuery}"` 
                      : viewMode === 'group-detail'
                        ? 'Tidak ada domain dalam grup ini'
                        : 'Tidak ada domain dengan status ini'}
                  </p>
                  <div className="flex gap-2 justify-center">
                    {searchQuery && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSearchQuery('')}
                        className="text-xs"
                      >
                        Hapus Pencarian
                      </Button>
                    )}
                    {filter !== 'all' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFilter('all')}
                        className="text-xs"
                      >
                        Tampilkan Semua
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Last Check Time Info */}
                {lastCheckTime && (
                  <div className="flex items-center justify-center gap-2 py-2 px-4 bg-muted/50 rounded-lg mb-3">
                    <Clock size={14} className="text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      Last checked at: {lastCheckTime.toLocaleTimeString('id-ID', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </span>
                  </div>
                )}
                
                <ScrollArea className="flex-1 min-h-0">
                  <div className="md:pr-4">
                    <OptimizedDomainList
                      domains={sortedDomains}
                      statuses={statuses}
                      groups={groups}
                      tags={tags}
                      onToggleMonitoring={canEdit ? handleToggleDomainMonitoring : undefined}
                      onTogglePin={canEdit ? handleTogglePin : undefined}
                      showCheckbox={false}
                      simpleMode={false}
                    />
                  </div>
                </ScrollArea>
              </>
            )}
          </TabsContent>

          <TabsContent value="manage" className="space-y-4 flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Kelola domain - tambah, hapus, dan edit data domain
              </p>
            </div>

            {canAddDomain && <AddDomainForm onAdd={handleAddDomain} />}

            {globalTotalCount > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex-1 lg:flex-none lg:w-40">
                    <Select value={manageGroupFilter} onValueChange={setManageGroupFilter}>
                      <SelectTrigger className="h-9 py-0 text-xs w-full">
                        <div className="flex items-center gap-1.5">
                          <FolderOpen size={14} />
                          <SelectValue placeholder="Grup" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="text-xs">Semua Grup</SelectItem>
                        <SelectItem value="ungrouped" className="text-xs">Tanpa Grup</SelectItem>
                        {groups && groups.length > 0 && groups.map(group => (
                          <SelectItem key={group.id} value={group.id} className="text-xs">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: group.color }}
                              />
                              {group.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex-1 lg:flex-none lg:w-40">
                    <Select value={manageTagFilter} onValueChange={setManageTagFilter}>
                      <SelectTrigger className="h-9 py-0 text-xs w-full">
                        <div className="flex items-center gap-1.5">
                          <Tag size={14} />
                          <SelectValue placeholder="Tag" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="text-xs">Semua Tag</SelectItem>
                        <SelectItem value="untagged" className="text-xs">Tanpa Tag</SelectItem>
                        {tags && tags.length > 0 && tags.map(tag => (
                          <SelectItem key={tag.id} value={tag.id} className="text-xs">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: tag.color }}
                              />
                              {tag.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex-1 lg:flex-none lg:w-40">
                    <Select value={manageNotificationFilter} onValueChange={setManageNotificationFilter}>
                      <SelectTrigger className="h-9 py-0 text-xs w-full">
                        <div className="flex items-center gap-1.5">
                          <Bell size={14} />
                          <SelectValue placeholder="Notif" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="text-xs">Semua Notif</SelectItem>
                        <SelectItem value="enabled" className="text-xs">Notif Aktif</SelectItem>
                        <SelectItem value="disabled" className="text-xs">Notif Nonaktif</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex-1 lg:flex-none lg:w-40">
                    <Select value={managePinFilter} onValueChange={setManagePinFilter}>
                      <SelectTrigger className="h-9 py-0 text-xs w-full">
                        <div className="flex items-center gap-1.5">
                          <MapPin size={14} />
                          <SelectValue placeholder="Pin" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="text-xs">Semua Domain</SelectItem>
                        <SelectItem value="pinned" className="text-xs">Di-pin</SelectItem>
                        <SelectItem value="unpinned" className="text-xs">Tidak Di-pin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="relative flex-1">
                    <MagnifyingGlass 
                      size={14} 
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" 
                    />
                    <Input
                      type="text"
                      placeholder="Cari domain untuk dihapus..."
                      value={manageSearchQuery}
                      onChange={(e) => setManageSearchQuery(e.target.value)}
                      className="h-9 pl-8 pr-8 text-xs"
                    />
                    {manageSearchQuery && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setManageSearchQuery('')}
                        className="absolute right-0 top-1/2 -translate-y-1/2 h-9 w-9 p-0 hover:bg-transparent"
                      >
                        <X size={14} className="text-muted-foreground hover:text-foreground" />
                      </Button>
                    )}
                  </div>
                  
                  {canEdit && selectedDomains.size > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleBulkDelete}
                      className="h-9"
                    >
                      <Trash size={14} />
                      Hapus {selectedDomains.size} Domain
                    </Button>
                  )}
                </div>

                {selectedDomains.size > 0 && (
                  <div className="bg-primary/10 border border-primary rounded-lg p-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedDomains.size === (() => {
                            const filtered = (domains || []).filter(domain => {
                              const matchesSearch = manageSearchQuery === '' || 
                                domain.url.toLowerCase().includes(manageSearchQuery.toLowerCase())
                              
                              const matchesGroup = manageGroupFilter === 'all' || 
                                (manageGroupFilter === 'ungrouped' && !domain.groupId) ||
                                domain.groupId === manageGroupFilter
                              
                              return matchesSearch && matchesGroup
                            })
                            return filtered.length
                          })()}
                          onCheckedChange={(checked) => {
                            const filtered = (domains || []).filter(domain => {
                              const matchesSearch = manageSearchQuery === '' || 
                                domain.url.toLowerCase().includes(manageSearchQuery.toLowerCase())
                              
                              const matchesGroup = manageGroupFilter === 'all' || 
                                (manageGroupFilter === 'ungrouped' && !domain.groupId) ||
                                domain.groupId === manageGroupFilter
                              
                              return matchesSearch && matchesGroup
                            })
                            if (checked) {
                              setSelectedDomains(new Set(filtered.map(d => d.id)))
                            } else {
                              setSelectedDomains(new Set())
                            }
                          }}
                        />
                        <span className="text-sm font-medium" style={{ color: 'oklch(0.55 0.15 250)' }}>
                          {selectedDomains.size} domain dipilih
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedDomains(new Set())}
                        className="h-8"
                      >
                        Batal
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!domains || domains.length === 0 ? (
              <EmptyState />
            ) : filteredManageDomains.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {manageSearchQuery 
                        ? `Tidak ada domain yang cocok dengan "${manageSearchQuery}"`
                        : 'Tidak ada domain dalam filter ini'}
                    </p>
                    <div className="flex gap-2 justify-center">
                      {manageSearchQuery && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setManageSearchQuery('')}
                          className="text-xs"
                        >
                          Hapus Pencarian
                        </Button>
                      )}
                      {manageGroupFilter !== 'all' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setManageGroupFilter('all')}
                          className="text-xs"
                        >
                          Tampilkan Semua Grup
                        </Button>
                      )}
                      {manageTagFilter !== 'all' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setManageTagFilter('all')}
                          className="text-xs"
                        >
                          Tampilkan Semua Tag
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 flex-1 flex flex-col overflow-hidden">
                  <div className="flex items-center gap-2 px-1">
                    <Checkbox
                      checked={selectedDomains.size === filteredManageDomains.length && filteredManageDomains.length > 0}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedDomains(new Set(filteredManageDomains.map(d => d.id)))
                        } else {
                          setSelectedDomains(new Set())
                        }
                      }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {selectedDomains.size > 0 ? `${selectedDomains.size} terpilih` : 'Pilih semua'}
                    </span>
                  </div>
                  <ScrollArea className="flex-1 min-h-0">
                    <div className="md:pr-4">
                      <OptimizedDomainList
                        domains={filteredManageDomains}
                        statuses={statuses}
                        groups={groups}
                        tags={tags}
                        onDelete={canEdit ? handleDeleteDomain : undefined}
                        onEdit={canEdit ? handleEditDomain : undefined}
                        onToggleMonitoring={canEdit ? handleToggleDomainMonitoring : undefined}
                        onTogglePin={canEdit ? handleTogglePin : undefined}
                        existingUrls={(domains || []).filter(d => !filteredManageDomains.some(fd => fd.id === d.id)).map(d => d.url)}
                        selectedDomains={selectedDomains}
                        onSelect={canEdit ? handleSelectDomain : undefined}
                        showCheckbox={canEdit}
                        simpleMode={true}
                      />
                    </div>
                  </ScrollArea>
                </div>
              )}
          </TabsContent>

          <TabsContent value="pinned" className="space-y-4 flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <MapPin size={20} weight="fill" className="text-primary" />
                  Domain Pinned
                </h2>
                <p className="text-sm text-muted-foreground">
                  Domain favorit dengan visualisasi uptime dan status real-time
                </p>
              </div>
              {domains.filter(d => d.pinned).length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const pinnedDomains = domains.filter(d => d.pinned)
                    if (pinnedDomains.length === 0) return
                    
                    toast.info(`Checking ${pinnedDomains.length} pinned domains...`)
                    
                    // Set checking status
                    const checkingStatuses: Record<string, DomainStatus> = {}
                    pinnedDomains.forEach(domain => {
                      checkingStatuses[domain.id] = { id: domain.id, status: 'checking' }
                    })
                    setStatuses(prev => ({ ...prev, ...checkingStatuses }))
                    
                    // Check domains
                    const results = await Promise.all(
                      pinnedDomains.map(domain => checkDomainStatus(domain.url, domain.id))
                    )
                    
                    const newStatuses: Record<string, DomainStatus> = {}
                    results.forEach(result => {
                      newStatuses[result.id] = result
                    })
                    setStatuses(prev => ({ ...prev, ...newStatuses }))
                    
                    toast.success('Pinned domains updated!')
                  }}
                  className="h-8"
                >
                  <ArrowClockwise size={14} />
                  Refresh Status
                </Button>
              )}
            </div>
            
            <Separator />

            {domains.filter(d => d.pinned).length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-3 max-w-md">
                  <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
                    <MapPin size={32} className="text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold">Belum Ada Domain yang Di-pin</h3>
                  <p className="text-sm text-muted-foreground">
                    Pin domain favorit Anda dari tab Monitoring atau Kelola Data untuk akses cepat dan monitoring visual
                  </p>
                </div>
              </div>
            ) : (
              <ScrollArea className="flex-1 min-h-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20 md:pb-4 pr-4">
                  {domains.filter(d => d.pinned).map(domain => {
                    const domainStatus = statuses[domain.id] || { 
                      id: domain.id, 
                      status: 'checking' as const 
                    }
                    return (
                      <PinnedDomainCard
                        key={domain.id}
                        domain={domain}
                        status={domainStatus}
                        onUnpin={canEdit ? handleTogglePin : undefined}
                      />
                    )
                  })}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="statistics" className="space-y-4 flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">GitHub Actions Monitoring</h2>
                <p className="text-sm text-muted-foreground">
                  Status 24/7 background monitoring
                </p>
              </div>
            </div>
            
            <Separator />

            <StatisticsView
              domains={domains || []}
              statuses={statuses}
              groups={groups || []}
              tags={tags || []}
              hasChecked={hasChecked}
              autoRefreshEnabled={autoRefreshEnabled}
            />
          </TabsContent>

          <TabsContent value="groups" className="space-y-4 flex-1 flex flex-col overflow-hidden">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs px-1">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <Globe size={14} weight="duotone" className="text-muted-foreground" />
                    <span className="text-muted-foreground">Total Domain</span>
                    <span className="font-semibold text-foreground">{globalTotalCount}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FolderOpen size={14} weight="duotone" className="text-muted-foreground" />
                    <span className="text-muted-foreground">Total Grup</span>
                    <span className="font-semibold text-foreground">{groups?.length || 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-success shadow-[0_0_8px_rgba(76,175,80,0.6)]" />
                    <span className="text-muted-foreground">Online</span>
                    <span className="font-semibold" style={{ color: 'oklch(0.70 0.22 145)' }}>{globalOnlineCount}</span>
                  </div>
                  {globalDnsOnlyCount > 0 && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                      <span className="text-muted-foreground">DNS Only</span>
                      <span className="font-semibold" style={{ color: 'rgb(245, 158, 11)' }}>{globalDnsOnlyCount}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-destructive shadow-[0_0_8px_rgba(244,67,54,0.6)]" />
                    <span className="text-muted-foreground">Offline</span>
                    <span className="font-semibold text-destructive">{globalOfflineCount}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Kelola grup domain untuk organisasi yang lebih baik
                </p>
                {canEdit && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAssignDialogOpen(true)}
                      disabled={!domains || domains.length === 0}
                      className="h-8"
                    >
                      <Tag size={14} />
                      Atur Grup
                    </Button>
                    <GroupFormDialog onSave={handleCreateGroup} />
                  </div>
                )}
              </div>
            </div>

            {!groups || groups.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-muted mx-auto flex items-center justify-center">
                    <FolderOpen size={32} weight="duotone" className="text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold mb-1 text-foreground">Belum Ada Grup</h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      Buat grup untuk mengelompokkan domain
                    </p>
                    <GroupFormDialog onSave={handleCreateGroup} />
                  </div>
                </div>
              </div>
            ) : (
              <ScrollArea className="flex-1 min-h-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pr-4">
                  {groups.map(group => {
                    const stats = getGroupStats(group.id)
                    return (
                      <GroupCard
                        key={group.id}
                        group={group}
                        domainCount={stats.count}
                        onlineCount={stats.online}
                        offlineCount={stats.offline}
                        dnsOnlyCount={stats.dnsOnly}
                        onEdit={canEdit ? (g) => setEditingGroup(g) : undefined}
                        onDelete={canEdit ? handleDeleteGroup : undefined}
                        onViewDomains={handleViewGroupDomains}
                        onExport={handleExportGroupCSV}
                        disableExport={!autoRefreshEnabled && !hasChecked}
                      />
                    )
                  })}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="tags" className="space-y-4 flex-1 flex flex-col overflow-hidden">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs px-1">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <Tag size={14} weight="duotone" className="text-muted-foreground" />
                    <span className="text-muted-foreground">Total Tag</span>
                    <span className="font-semibold text-foreground">{tags?.length || 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Globe size={14} weight="duotone" className="text-muted-foreground" />
                    <span className="text-muted-foreground">Total Domain</span>
                    <span className="font-semibold text-foreground">{globalTotalCount}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Kelola tag untuk mengorganisir domain
                </p>
                {canEdit && (
                  <div className="flex gap-2">
                    <AssignTagsDialog
                      domains={domains || []}
                      tags={tags || []}
                      onAssign={handleAssignTags}
                    />
                    <TagFormDialog onSave={handleCreateTag} />
                  </div>
                )}
              </div>
            </div>

            {!tags || tags.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-muted mx-auto flex items-center justify-center">
                    <Tag size={32} weight="duotone" className="text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold mb-1 text-foreground">Belum Ada Tag</h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      Buat tag untuk mengorganisir domain
                    </p>
                    <TagFormDialog onSave={handleCreateTag} />
                  </div>
                </div>
              </div>
            ) : (
              <ScrollArea className="flex-1 min-h-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pr-4">
                  {tags.map(tag => {
                    const domainCount = (domains || []).filter(d => 
                      d.tags && d.tags.includes(tag.id)
                    ).length
                    return (
                      <TagCard
                        key={tag.id}
                        tag={tag}
                        domainCount={domainCount}
                        domains={domains}
                        statuses={statuses}
                        groups={groups}
                        onEdit={canEdit ? (t) => setEditingTag(t) : undefined}
                        onDelete={canEdit ? handleDeleteTag : undefined}
                      />
                    )
                  })}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>

        <AssignDomainsDialog
          open={assignDialogOpen}
          onOpenChange={setAssignDialogOpen}
          domains={domains || []}
          groups={groups || []}
          onAssign={handleAssignDomains}
        />

        {editingGroup && (
          <GroupFormDialog
            group={editingGroup}
            onSave={handleEditGroup}
            open={true}
            onOpenChange={(open) => {
              if (!open) setEditingGroup(null)
            }}
          />
        )}

        {editingTag && (
          <TagFormDialog
            tag={editingTag}
            onSave={handleEditTag}
            open={true}
            onOpenChange={(open) => {
              if (!open) setEditingTag(null)
            }}
          />
        )}

        {/* Login Dialog - only for re-auth scenarios */}
        <LoginDialog 
          open={showLoginDialog && isAuthenticated} 
          onLogin={handleLogin}
        />
        </div>
        )}

        <footer className="bg-card border-t border-border">
          <div className="container mx-auto px-2 md:px-4 py-2 max-w-5xl">
            <div className="flex items-center justify-center gap-1.5 text-[10px] md:text-xs text-center flex-wrap">
              {/* Mobile compact layout */}
              <span className="text-muted-foreground md:hidden">© 2026 Kab Kendal</span>
              
              {/* Desktop full text */}
              <span className="text-muted-foreground hidden md:inline">© 2026 Domain Monitor • Kabupaten Kendal</span>
              
              <span className="text-muted-foreground">•</span>
              
              {/* Terms - "S&K" mobile, full desktop */}
              <div className="md:hidden">
                <TermsOfServiceDialog triggerText="S&K" />
              </div>
              <div className="hidden md:block">
                <TermsOfServiceDialog />
              </div>
              
              <span className="text-muted-foreground">•</span>
              <InfoDialog triggerText="Panduan" asLink={true} />
              
              <span className="text-muted-foreground">•</span>
              <FAQDialog />
              
              <span className="text-muted-foreground">•</span>
              <PrivacyPolicyDialog triggerText="Privacy" />
              
              <span className="text-muted-foreground">•</span>
              <ChangelogDialog triggerText={`v${APP_VERSION}`} showIcon={false} />
            </div>
              
            {process.env.NODE_ENV === 'development' && (
              <div className="text-xs text-muted-foreground bg-yellow-500/10 px-2 py-1 rounded text-center mt-2">
                Firebase: {firebaseOps.reads}R / {firebaseOps.writes}W
              </div>
            )}
          </div>
        </footer>
      </div>
    </TooltipProvider>
  )
}

export default App