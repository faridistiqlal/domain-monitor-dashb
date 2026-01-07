import { useState } from 'react'
import { Gear, Bell, ClockCounterClockwise, LockKey, SignOut } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { NotificationSettingsDialog } from './NotificationSettingsDialog'
import { NotificationHistoryDialog } from './NotificationHistoryDialog'
import { SettingsDialog } from './SettingsDialog'
import type { NotificationSettings } from '@/lib/types'

interface SettingsMenuDialogProps {
  notificationSettings: NotificationSettings
  onNotificationSettingsSave: (settings: NotificationSettings) => void
  onTestNotification: () => void
  getHistory: () => any[]
  clearHistory: () => void
  onChangePassword: (oldPassword: string, newPassword: string) => Promise<boolean>
  onLogout: () => void
}

export function SettingsMenuDialog({
  notificationSettings,
  onNotificationSettingsSave,
  onTestNotification,
  getHistory,
  clearHistory,
  onChangePassword,
  onLogout,
}: SettingsMenuDialogProps) {
  const [open, setOpen] = useState(false)
  const [showNotificationSettings, setShowNotificationSettings] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)

  const handleLogout = () => {
    setOpen(false)
    onLogout()
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="h-8" title="Settings">
            <Gear size={16} weight="duotone" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gear size={20} weight="duotone" />
              Pengaturan
            </DialogTitle>
            <DialogDescription>
              Kelola notifikasi, riwayat, password, dan akses
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <div className="space-y-2 py-2">
            {/* Notification Settings */}
            <button
              onClick={() => {
                setOpen(false)
                setShowNotificationSettings(true)
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bell size={20} weight="duotone" className="text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Pengaturan Notifikasi</p>
                <p className="text-xs text-muted-foreground">Konfigurasi Slack webhook & rules</p>
              </div>
            </button>

            {/* Notification History */}
            <button
              onClick={() => {
                setOpen(false)
                setShowHistory(true)
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <ClockCounterClockwise size={20} weight="duotone" className="text-accent" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Riwayat Notifikasi</p>
                <p className="text-xs text-muted-foreground">Lihat history notifikasi terkirim</p>
              </div>
            </button>

            <Separator />

            {/* Change Password */}
            <button
              onClick={() => {
                setOpen(false)
                setShowChangePassword(true)
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <LockKey size={20} weight="duotone" className="text-warning" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Ubah Password</p>
                <p className="text-xs text-muted-foreground">Ganti password admin</p>
              </div>
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-destructive/10 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <SignOut size={20} weight="duotone" className="text-destructive" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive">Logout</p>
                <p className="text-xs text-muted-foreground">Keluar dari sesi admin</p>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sub-dialogs */}
      <NotificationSettingsDialog
        open={showNotificationSettings}
        onOpenChange={setShowNotificationSettings}
        settings={notificationSettings}
        onSave={onNotificationSettingsSave}
        onTest={onTestNotification}
      />

      {showHistory && (
        <Dialog open={showHistory} onOpenChange={setShowHistory}>
          <DialogContent className="max-w-3xl max-h-[85vh]">
            <NotificationHistoryDialog
              getHistory={getHistory}
              clearHistory={clearHistory}
            />
          </DialogContent>
        </Dialog>
      )}

      <SettingsDialog
        open={showChangePassword}
        onOpenChange={setShowChangePassword}
        onChangePassword={onChangePassword}
      />
    </>
  )
}
