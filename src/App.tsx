import { useEffect, useState, useMemo } from 'react'
import { Globe, ArrowClockwise, DownloadSimple, MagnifyingGlass, X, SortAscending, Pause, Play, FolderOpen, Tag, ListBullets, Trash, CheckSquare, Toolbox, Info, ChartBar, SignOut, LockKey, Bell } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { AddDomainForm } from '@/components/AddDomainForm'
import { DomainCard } from '@/components/DomainCard'
import { EmptyState } from '@/components/EmptyState'
import { ImportDialog } from '@/components/ImportDialog'
import { InfoDialog } from '@/components/InfoDialog'
import { GroupCard } from '@/components/GroupCard'
import { GroupFormDialog } from '@/components/GroupFormDialog'
import { AssignDomainsDialog } from '@/components/AssignDomainsDialog'
import { TagFormDialog } from '@/components/TagFormDialog'
import { AssignTagsDialog } from '@/components/AssignTagsDialog'
import { TagCard } from '@/components/TagCard'
import { OptimizedDomainList } from '@/components/VirtualizedDomainList'
import { StatisticsView } from '@/components/StatisticsView'
import { ChangelogDialog } from '@/components/ChangelogDialog'
import { PrivacyPolicyDialog } from '@/components/PrivacyPolicyDialog'
import { TermsOfServiceDialog } from '@/components/TermsOfServiceDialog'
import { LoginDialog } from '@/components/LoginDialog'
import { SettingsDialog } from '@/components/SettingsDialog'
import { NotificationSettingsDialog } from '@/components/NotificationSettingsDialog'
import { NotificationHistoryDialog } from '@/components/NotificationHistoryDialog'
import { SettingsMenuDialog } from '@/components/SettingsMenuDialog'
import { Domain, DomainStatus, DomainGroup, DomainTag, NotificationSettings } from '@/lib/types'
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
  subscribeToDomainsUpdates,
  subscribeToGroupsUpdates,
  subscribeToTagsUpdates,
  loadPassword,
  syncPasswordToFirestore
} from '@/lib/firestore-sync'
import { 
  updateDailyStats, 
  createIncident, 
  resolveIncident,
  assignCheckBatch,
  shouldCheckNow
} from '@/lib/check-history'
import { loadLastKnownStatuses } from '@/lib/status-loader'
import { toast } from 'sonner'
import { useDebounce } from '@/hooks/use-debounce'
import { useFilteredDomains } from '@/hooks/use-filtered-domains'

type FilterType = 'all' | 'online' | 'dns-only' | 'offline'
type SortType = 'none' | 'name-asc' | 'name-desc' | 'status-online-first' | 'status-offline-first'
type ViewMode = 'all' | 'groups' | 'group-detail'

function App() {
  // Authentication & Security States
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const auth = localStorage.getItem('app-authenticated')
    return auth === 'true'
  })
  const [showLoginDialog, setShowLoginDialog] = useState(!isAuthenticated)
  const [lastActivityTime, setLastActivityTime] = useState<number>(Date.now())

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
  const [activeTab, setActiveTab] = useState<'domains' | 'groups' | 'manage' | 'tags' | 'statistics'>('domains')
  const [viewMode, setViewMode] = useState<ViewMode>('all')
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<DomainGroup | null>(null)
  const [selectedDomains, setSelectedDomains] = useState<Set<string>>(new Set())
  const [manageSearchQuery, setManageSearchQuery] = useState('')
  const debouncedManageSearchQuery = useDebounce(manageSearchQuery, 300)
  const [manageGroupFilter, setManageGroupFilter] = useState<string>('all')
  const [manageTagFilter, setManageTagFilter] = useState<string>('all')
  const [editingTag, setEditingTag] = useState<DomainTag | null>(null)

  // Notification States
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() => {
    const saved = localStorage.getItem('notification-settings')
    return saved ? JSON.parse(saved) : {
      enabled: false,
      webhookUrl: '',
      notifyOnDown: true,
      notifyOnRecovery: true,
      notifyOnSlow: false,
      slowThreshold: 5,
      cooldownMinutes: 5
    }
  })
  const [notificationService] = useState(() => new NotificationService())
  
  // Track previous statuses for incident detection
  const [previousStatuses, setPreviousStatuses] = useState<Record<string, 'online' | 'offline' | 'dns-only'>>({})
  const [activeIncidents, setActiveIncidents] = useState<Record<string, string>>({}) // domainId -> incidentId

  // Load data from Firebase on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [loadedDomains, loadedGroups, loadedTags, loadedPassword] = await Promise.all([
          loadDomains(),
          loadGroups(),
          loadTags(),
          loadPassword()
        ])
        
        // Assign batch to domains that don't have one (old domains)
        const domainsWithBatch = loadedDomains.map((domain, index) => {
          if (!domain.checkBatch) {
            return {
              ...domain,
              checkBatch: assignCheckBatch(index, loadedDomains.length),
              lastStatusChange: domain.lastStatusChange || Date.now(),
              consecutiveFailures: domain.consecutiveFailures || 0
            }
          }
          return domain
        })
        
        setDomains(domainsWithBatch)
        setGroups(loadedGroups)
        setTags(loadedTags)
        
        // Load last statuses from localStorage for statistics display
        const savedStatuses = localStorage.getItem('domain-last-statuses')
        if (savedStatuses) {
          try {
            const parsed = JSON.parse(savedStatuses)
            setStatuses(parsed)
            // Also set previous statuses for change detection
            const prevStatuses: Record<string, 'online' | 'offline' | 'dns-only'> = {}
            Object.entries(parsed).forEach(([id, status]) => {
              const s = status as DomainStatus
              if (s.status !== 'checking') {
                prevStatuses[id] = s.status as 'online' | 'offline' | 'dns-only'
              }
            })
            setPreviousStatuses(prevStatuses)
          } catch (e) {
            console.error('Failed to parse saved statuses:', e)
          }
        } else if (domainsWithBatch.length > 0) {
          // No localStorage data, try to load from Firebase daily stats
          console.log('Loading last known statuses from Firebase...')
          try {
            const firebaseStatuses = await loadLastKnownStatuses(
              domainsWithBatch.map(d => d.id)
            )
            if (Object.keys(firebaseStatuses).length > 0) {
              setStatuses(firebaseStatuses)
              localStorage.setItem('domain-last-statuses', JSON.stringify(firebaseStatuses))
              console.log(`Loaded ${Object.keys(firebaseStatuses).length} statuses from Firebase`)
            }
          } catch (e) {
            console.error('Failed to load statuses from Firebase:', e)
          }
        }
        
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
      localStorage.setItem('monitoring-domains', JSON.stringify(domains))
      // Debounce Firebase sync to reduce writes
      const timeoutId = setTimeout(() => {
        syncDomainsToFirestore(domains).catch(console.error)
      }, 2000) // Wait 2s before syncing
      return () => clearTimeout(timeoutId)
    }
  }, [domains, isLoadingData])

  useEffect(() => {
    if (!isLoadingData && groups.length >= 0) {
      localStorage.setItem('domain-groups', JSON.stringify(groups))
      const timeoutId = setTimeout(() => {
        syncGroupsToFirestore(groups).catch(console.error)
      }, 2000)
      return () => clearTimeout(timeoutId)
    }
  }, [groups, isLoadingData])

  useEffect(() => {
    if (!isLoadingData && tags.length >= 0) {
      localStorage.setItem('domain-tags', JSON.stringify(tags))
      const timeoutId = setTimeout(() => {
        syncTagsToFirestore(tags).catch(console.error)
      }, 2000)
      return () => clearTimeout(timeoutId)
    }
  }, [tags, isLoadingData])

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
    }
  }, [isAuthenticated])

  // Authentication Handlers
  const handleLogin = (password: string) => {
    const storedPassword = localStorage.getItem('app-password') || 'admin123'
    
    if (password === storedPassword) {
      setIsAuthenticated(true)
      localStorage.setItem('app-authenticated', 'true')
      localStorage.setItem('app-last-activity', Date.now().toString())
      setLastActivityTime(Date.now())
      setShowLoginDialog(false)
      toast.success('Login berhasil! Selamat datang')
    } else {
      toast.error('Password salah! Silakan coba lagi')
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    localStorage.setItem('app-authenticated', 'false')
    localStorage.removeItem('app-last-activity')
    setShowLoginDialog(true)
    toast.info('Anda telah logout')
  }

  const handlePasswordChange = async (oldPassword: string, newPassword: string): Promise<boolean> => {
    const storedPassword = localStorage.getItem('app-password') || 'admin123'
    
    if (oldPassword !== storedPassword) {
      return false
    }
    
    localStorage.setItem('app-password', newPassword)
    await syncPasswordToFirestore(newPassword).catch(console.error)
    return true
  }

  const handleNotificationSettingsSave = (settings: NotificationSettings) => {
    setNotificationSettings(settings)
    localStorage.setItem('notification-settings', JSON.stringify(settings))
    toast.success('Notification settings saved successfully')
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

  // Check if user can edit (authenticated only)
  const canEdit = isAuthenticated

  const checkAllDomains = async (showToast = false, batchCheckOnly = false) => {
    if (!domains || domains.length === 0) return

    // Filter domains to check based on batch schedule (if staggered checking enabled)
    let domainsToCheck = domains
    
    if (batchCheckOnly && autoRefreshEnabled) {
      domainsToCheck = domains.filter(domain => shouldCheckNow(domain))
      
      if (domainsToCheck.length === 0) {
        return // No domains in current batch window
      }
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
      
      // Write to Firebase: Status change OR hourly for continuous uptime tracking
      if (statusChanged || shouldWriteHourly) {
        try {
          await updateDailyStats(result.id, result)
          
          // Update lastStatsWrite timestamp
          setDomains(prevDomains => 
            prevDomains.map(d => 
              d.id === domain.id 
                ? { ...d, lastStatsWrite: Date.now() }
                : d
            )
          )
        } catch (error) {
          console.error(`Failed to update stats for ${domain.url}:`, error)
        }
      }
      
      // Detect status changes (already calculated above for write policy)
      
      if (statusChanged) {
        // Update domain lastStatusChange timestamp
        const updatedDomain = { ...domain, lastStatusChange: Date.now() }
        setDomains(prevDomains => 
          prevDomains.map(d => d.id === domain.id ? updatedDomain : d)
        )
        
        // Handle incidents
        if (newStatus === 'offline' || newStatus === 'dns-only') {
          // Create new incident
          const incidentId = await createIncident(domain, result, oldStatus)
          if (incidentId) {
            setActiveIncidents(prev => ({ ...prev, [domain.id]: incidentId }))
          }
        } else if (newStatus === 'online' && (oldStatus === 'offline' || oldStatus === 'dns-only')) {
          // Resolve incident
          const incidentId = activeIncidents[domain.id]
          if (incidentId) {
            await resolveIncident(domain.id, incidentId)
            setActiveIncidents(prev => {
              const newIncidents = { ...prev }
              delete newIncidents[domain.id]
              return newIncidents
            })
          }
        }
        
        // Send notifications if enabled
        if (notificationSettings.enabled && (domain.notificationsEnabled ?? false)) {
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
      
      // Slow response notification (even without status change)
      if (notificationSettings.enabled && 
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
      // Save to localStorage for persistence across sessions
      localStorage.setItem('domain-last-statuses', JSON.stringify(updated))
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
    if (!canEdit) {
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

    setDomains(current => [...(current || []), newDomain])
    toast.success(`Domain berhasil ditambahkan (Batch ${batch})`)
  }

  const handleDeleteDomain = (id: string) => {
    if (!canEdit) {
      toast.error('Anda tidak memiliki akses untuk menghapus domain')
      return
    }

    setDomains(current => (current || []).filter(d => d.id !== id))
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

    setDomains(current =>
      (current || []).map(d =>
        d.id === id ? { ...d, url: newUrl, notificationsEnabled } : d
      )
    )
    setStatuses(current => {
      const newStatuses = { ...current }
      delete newStatuses[id]
      return newStatuses
    })
    toast.success('Domain berhasil diperbarui')
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
    setCountdown(60)
    if (autoRefreshEnabled) {
      setIsPaused(false)
    }
    await checkAllDomains(true)
    setIsRefreshing(false)
  }

  const handleTogglePause = () => {
    setIsPaused(prev => {
      const newPausedState = !prev
      if (newPausedState) {
        toast.info('Auto-refresh dijeda')
      } else {
        toast.info('Auto-refresh dilanjutkan')
        setCountdown(60)
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
        setCountdown(60)
        if (!hasChecked) {
          checkAllDomains(true)
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

  const handleCreateGroup = (groupData: Omit<DomainGroup, 'id' | 'createdAt'>) => {
    if (!canEdit) {
      toast.error('Anda tidak memiliki akses untuk membuat grup')
      return
    }

    const newGroup: DomainGroup = {
      ...groupData,
      id: `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
    }
    setGroups(current => [...(current || []), newGroup])
    toast.success('Grup berhasil dibuat')
  }

  const handleEditGroup = (groupData: Omit<DomainGroup, 'id' | 'createdAt'>) => {
    if (!editingGroup) return
    
    setGroups(current =>
      (current || []).map(g =>
        g.id === editingGroup.id
          ? { ...g, ...groupData }
          : g
      )
    )
    toast.success('Grup berhasil diperbarui')
    setEditingGroup(null)
  }

  const handleDeleteGroup = (groupId: string) => {
    if (!canEdit) {
      toast.error('Anda tidak memiliki akses untuk menghapus grup')
      return
    }

    setGroups(current => (current || []).filter(g => g.id !== groupId))
    setDomains(current =>
      (current || []).map(d =>
        d.groupId === groupId ? { ...d, groupId: undefined } : d
      )
    )
    toast.success('Grup berhasil dihapus')
  }

  const handleAssignDomains = (domainIds: string[], groupId: string | null) => {
    setDomains(current =>
      (current || []).map(d =>
        domainIds.includes(d.id)
          ? { ...d, groupId: groupId || undefined }
          : d
      )
    )
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
    setTags(current => [...(current || []), newTag])
    toast.success('Tag berhasil dibuat')
  }

  const handleEditTag = (tagData: Omit<DomainTag, 'id' | 'createdAt'>) => {
    if (!editingTag) return
    
    setTags(current =>
      (current || []).map(t =>
        t.id === editingTag.id
          ? { ...t, ...tagData }
          : t
      )
    )
    toast.success('Tag berhasil diperbarui')
    setEditingTag(null)
  }

  const handleDeleteTag = (tagId: string) => {
    if (!canEdit) {
      toast.error('Anda tidak memiliki akses untuk menghapus tag')
      return
    }

    setTags(current => (current || []).filter(t => t.id !== tagId))
    setDomains(current =>
      (current || []).map(d => ({
        ...d,
        tags: d.tags?.filter(t => t !== tagId)
      }))
    )
    toast.success('Tag berhasil dihapus')
  }

  const handleAssignTags = (domainIds: string[], tagIds: string[]) => {
    setDomains(current =>
      (current || []).map(d => {
        if (!domainIds.includes(d.id)) return d
        
        const existingTags = d.tags || []
        const newTags = [...new Set([...existingTags, ...tagIds])]
        return { ...d, tags: newTags }
      })
    )
    toast.success(`Tag berhasil ditambahkan ke ${domainIds.length} domain`)
  }

  useEffect(() => {
    if (!autoRefreshEnabled) return

    checkAllDomains(false, true) // Initial batch check
    setCountdown(60)

    if (isPaused) return

    const interval = setInterval(() => {
      checkAllDomains(false, true) // Use batch checking
      setCountdown(60)
    }, 60000) // Check every minute for batch schedules

    return () => clearInterval(interval)
  }, [domains, isPaused, autoRefreshEnabled])

  useEffect(() => {
    if (!autoRefreshEnabled || isPaused) return

    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) return 60
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(countdownInterval)
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
      
      return matchesSearch && matchesGroup && matchesTag
    }),
    [domains, debouncedManageSearchQuery, manageGroupFilter, manageTagFilter]
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
      <div className="h-screen bg-background overflow-hidden flex flex-col">
        <div className="container mx-auto px-4 py-4 max-w-5xl flex-1 flex flex-col overflow-hidden">
          <header className="mb-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <img 
                  src="/logo.webp" 
                  alt="Logo Kendal"
                  className="w-10 h-10 object-contain"
                />
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    Domain Monitor
                  </h1>
                  <p className="text-xs text-muted-foreground tracking-wide">
                    Kabupaten Kendal
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
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
                  />
                )}

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
            </div>
          </header>

        <Tabs value={activeTab} onValueChange={(val) => {
          setActiveTab(val as 'domains' | 'groups' | 'manage' | 'tags' | 'statistics')
          if (val === 'domains' && viewMode === 'group-detail') {
            setViewMode('all')
            setSelectedGroupId(null)
          }
        }} className="space-y-4 flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full max-w-3xl grid-cols-5">
            <TabsTrigger value="domains" className="gap-1.5">
              <ListBullets size={14} />
              Monitoring
            </TabsTrigger>
            <TabsTrigger value="statistics" className="gap-1.5">
              <ChartBar size={14} />
              Statistik
            </TabsTrigger>
            <TabsTrigger value="groups" className="gap-1.5">
              <FolderOpen size={14} />
              Grup
            </TabsTrigger>
            <TabsTrigger value="tags" className="gap-1.5">
              <Tag size={14} />
              Tag
            </TabsTrigger>
            <TabsTrigger value="manage" className="gap-1.5">
              <Toolbox size={14} />
              Kelola Data
            </TabsTrigger>
          </TabsList>

          <TabsContent value="domains" className="space-y-4 flex-1 flex flex-col overflow-hidden">
            {!autoRefreshEnabled && hasChecked && !isRefreshing && totalCount > 0 && (
              <div className="space-y-3">
                <div className="bg-success/10 border border-success/30 rounded-lg p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-success/20 flex items-center justify-center">
                        <CheckSquare size={18} weight="duotone" className="text-success" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: 'oklch(0.70 0.22 145)' }}>Check Selesai!</p>
                        <p className="text-xs text-muted-foreground">
                          Online: {onlineCount} • DNS Only: {dnsOnlyCount} • Offline: {offlineCount}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setHasChecked(false)
                          setStatuses({})
                          toast.info('Status domain direset')
                        }}
                        className="h-8"
                      >
                        <X size={14} />
                        Reset
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportCSV}
                        className="h-8 bg-success text-success-foreground hover:bg-success/90"
                      >
                        <DownloadSimple size={14} />
                        Export Hasil
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
                <div className="flex items-center justify-between text-xs px-1">
                  <div className="flex items-center gap-3">
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
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">
                      {autoRefreshEnabled 
                        ? (isPaused ? 'Dijeda' : `Refresh dalam ${countdown}s`) 
                        : 'Mode Manual'} • {totalCount} domain
                    </span>
                    {filteredDomains.length !== totalCount && (
                      <Badge variant="secondary" className="text-xs font-mono">
                        {filteredDomains.length} ditampilkan
                      </Badge>
                    )}
                    {autoRefreshEnabled && !isPaused && (
                      <Progress 
                        value={(countdown / 60) * 100} 
                        className="w-16 h-1.5"
                      />
                    )}
                    {viewMode !== 'group-detail' && (filter !== 'all' || searchQuery !== '') && filteredDomains.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportFilteredCSV}
                        disabled={!autoRefreshEnabled && !hasChecked}
                        className="h-7 text-xs ml-2"
                        title={!autoRefreshEnabled && !hasChecked ? "Check domain terlebih dahulu" : ""}
                      >
                        <DownloadSimple size={14} />
                        Export Terfilter
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
                        <SelectTrigger className="h-8 py-0 text-xs w-full">
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
                        className="h-8 pl-8 pr-8 text-xs w-full"
                      />
                      {searchQuery && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSearchQuery('')}
                          className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
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
                  <div className="space-y-3">
                    <h3 className="text-xl font-semibold text-foreground">Mode Manual Check</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Klik tombol <strong className="text-foreground">Check</strong> untuk memeriksa status semua domain.<br />
                      Setelah selesai, Anda dapat langsung export hasilnya.
                    </p>
                  </div>
                  <Button
                    onClick={handleManualRefresh}
                    disabled={isRefreshing}
                    size="lg"
                    className="mt-2"
                  >
                    <ArrowClockwise 
                      size={18} 
                      className={isRefreshing ? 'animate-spin' : ''} 
                    />
                    {isRefreshing ? 'Memeriksa...' : `Check ${totalCount} Domain`}
                  </Button>
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
              <ScrollArea className="flex-1 min-h-0">
                <div className="pr-4">
                  <OptimizedDomainList
                    domains={sortedDomains}
                    statuses={statuses}
                    tags={tags}
                    showCheckbox={false}
                    simpleMode={false}
                  />
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="manage" className="space-y-4 flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Kelola domain - tambah, hapus, dan edit data domain
              </p>
            </div>

            {canEdit && <AddDomainForm onAdd={handleAddDomain} />}

            {globalTotalCount > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1 lg:flex-none lg:w-48">
                    <Select value={manageGroupFilter} onValueChange={setManageGroupFilter}>
                      <SelectTrigger className="h-9 py-0 text-xs w-full">
                        <div className="flex items-center gap-1.5">
                          <FolderOpen size={14} />
                          <SelectValue placeholder="Filter Grup" />
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

                  <div className="flex-1 lg:flex-none lg:w-48">
                    <Select value={manageTagFilter} onValueChange={setManageTagFilter}>
                      <SelectTrigger className="h-9 py-0 text-xs w-full">
                        <div className="flex items-center gap-1.5">
                          <Tag size={14} />
                          <SelectValue placeholder="Filter Tag" />
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
                    <div className="pr-4">
                      <OptimizedDomainList
                        domains={filteredManageDomains}
                        statuses={statuses}
                        groups={groups}
                        tags={tags}
                        onDelete={canEdit ? handleDeleteDomain : undefined}
                        onEdit={canEdit ? handleEditDomain : undefined}
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

          <TabsContent value="statistics" className="space-y-4 flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Statistik & Analisis</h2>
                <p className="text-sm text-muted-foreground">
                  Ringkasan dan analisis performa monitoring domain
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

        {/* Login Dialog */}
        <LoginDialog 
          open={showLoginDialog} 
          onLogin={handleLogin}
        />
      </div>

      <footer className="bg-card mt-auto">
        <div className="container mx-auto px-4 py-3 max-w-5xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <p className="text-xs text-muted-foreground">
                © 2026 Domain Monitor v2.2.0 • Kabupaten Kendal
              </p>
              <span className="text-xs text-muted-foreground">•</span>
              <PrivacyPolicyDialog />
              <span className="text-xs text-muted-foreground">•</span>
              <TermsOfServiceDialog />
              <span className="text-xs text-muted-foreground">•</span>
              <InfoDialog triggerText="Bantuan" asLink={true} />
            </div>
            <ChangelogDialog />
          </div>
        </div>
      </footer>
    </div>
    </TooltipProvider>
  )
}

export default App