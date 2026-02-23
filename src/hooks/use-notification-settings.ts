import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { NotificationSettings } from '@/lib/types'
import { NotificationService, NotificationDetails } from '@/lib/notifications'
import { loadNotificationSettings, syncNotificationSettingsToFirestore } from '@/lib/firestore-sync'

interface NotificationLogger {
  log: (...args: unknown[]) => void
  error: (...args: unknown[]) => void
}

interface UseNotificationSettingsParams {
  isLoadingData: boolean
  logger?: NotificationLogger
}

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: false,
  webhookUrl: '',
  notifyOnDown: true,
  notifyOnRecovery: true,
  notifyOnSlow: false,
  slowThreshold: 5,
  cooldownMinutes: 5,
}

export function useNotificationSettings({
  isLoadingData,
  logger,
}: UseNotificationSettingsParams) {
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS)
  const [notificationService] = useState(() => new NotificationService())

  const loggerRef = useRef<NotificationLogger>({
    log: globalThis.console.log.bind(globalThis.console),
    error: globalThis.console.error.bind(globalThis.console),
  })

  useEffect(() => {
    if (logger) {
      loggerRef.current = logger
    }
  }, [logger])

  useEffect(() => {
    const loadNotificationSettingsFromFirebase = async () => {
      loggerRef.current.log('[Notification Settings] Starting separate load...')
      try {
        const loadedNotificationSettings = await loadNotificationSettings()
        loggerRef.current.log('[Notification Settings] Result:', loadedNotificationSettings)
        if (loadedNotificationSettings) {
          setNotificationSettings(loadedNotificationSettings)
          loggerRef.current.log('[Notification Settings] ✅ Loaded from Firebase:', loadedNotificationSettings)
        } else {
          loggerRef.current.log('[Notification Settings] ⚠️ No settings found, using default')
        }
      } catch (error) {
        loggerRef.current.error('[Notification Settings] ❌ Error loading:', error)
      }
    }

    if (!isLoadingData) {
      loadNotificationSettingsFromFirebase()
    }
  }, [isLoadingData])

  useEffect(() => {
    loggerRef.current.log('[notificationSettings State Changed]', notificationSettings)
  }, [notificationSettings])

  const handleNotificationSettingsSave = useCallback(async (settings: NotificationSettings) => {
    loggerRef.current.log('[Save Notification Settings] Saving settings update')
    setNotificationSettings(settings)
    localStorage.setItem('notification-settings', JSON.stringify(settings))
    loggerRef.current.log('[Save Notification Settings] ✅ Saved to localStorage')

    const synced = await syncNotificationSettingsToFirestore(settings)
    loggerRef.current.log('[Save Notification Settings] Firebase sync result:', synced)
    if (synced) {
      toast.success('Notification settings saved successfully')
    } else {
      toast.warning('Settings saved locally, but failed to sync to Firebase')
    }
  }, [])

  const handleTestNotification = useCallback(async () => {
    if (!notificationSettings.webhookUrl) {
      toast.error('Please enter a webhook URL first')
      return
    }

    notificationService.clearCooldown('example.com')

    const testSettings: NotificationSettings = {
      ...notificationSettings,
      enabled: true,
      notifyOnDown: true,
    }

    const testDetails: NotificationDetails = {
      domain: 'example.com',
      status: 'down',
      error: 'This is a test notification from Domain Monitor Dashboard',
      groupName: 'Test Group',
      tags: ['test', 'demo'],
      ipAddress: '93.184.216.34',
      protocol: 'https',
    }

    const success = await notificationService.sendSlackNotification(testSettings, testDetails)

    if (success) {
      toast.success('Test notification sent! Check your Slack channel.')
    } else {
      toast.error('Failed to send test notification. Please check your webhook URL.')
    }
  }, [notificationService, notificationSettings])

  return {
    notificationSettings,
    notificationService,
    handleNotificationSettingsSave,
    handleTestNotification,
  }
}