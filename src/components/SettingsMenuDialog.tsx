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
import { UserManagementDialog } from './UserManagementDialog'
import type { NotificationSettings, ManagedUser, ManagedUserRole } from '@/lib/types'

interface SettingsMenuDialogProps {
  notificationSettings: NotificationSettings
  onNotificationSettingsSave: (settings: NotificationSettings) => void
  onTestNotification: () => void
  getHistory: () => any[]
  clearHistory: () => void
  onChangePassword: (oldPassword: string, newPassword: string) => Promise<boolean>
  onLogout: () => void
  canManageUsers: boolean
  managedUsers: ManagedUser[]
  currentUserId?: string
  onCreateUser: (payload: { username: string; password: string; role: ManagedUserRole }) => Promise<boolean>
  onToggleUserActive: (userId: string, isActive: boolean) => Promise<boolean>
  onDeleteUser: (userId: string) => Promise<boolean>
}

export function SettingsMenuDialog({
  notificationSettings,
  onNotificationSettingsSave,
  onTestNotification,
  getHistory,
  clearHistory,
  onChangePassword,
  onLogout,
  canManageUsers,
  managedUsers,
  currentUserId,
  onCreateUser,
  onToggleUserActive,
  onDeleteUser,
}: SettingsMenuDialogProps) {
  const [open, setOpen] = useState(false)
  const [showNotificationSettings, setShowNotificationSettings] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [showUserManagement, setShowUserManagement] = useState(false)

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
              Kelola password dan akses
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <div className="space-y-2 py-2">
            {canManageUsers && (
              <>
                {/* Notification Settings */}
                <button
                  onClick={() => {
                    setOpen(false)
                    setShowNotificationSettings(true)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-lg hover:bg-primary/10 hover:border-primary/20 border border-transparent transition-all text-left group"
                >
                  <div className="w-11 h-11 rounded-lg bg-primary/15 group-hover:bg-primary/25 flex items-center justify-center transition-colors">
                    <Bell size={22} weight="fill" className="text-primary group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">Pengaturan Notifikasi</p>
                    <p className="text-xs text-muted-foreground group-hover:text-foreground/70 transition-colors">Konfigurasi Slack webhook & rules</p>
                  </div>
                </button>

                {/* Notification History */}
                <button
                  onClick={() => {
                    setOpen(false)
                    setShowHistory(true)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-lg hover:bg-accent/10 hover:border-accent/20 border border-transparent transition-all text-left group"
                >
                  <div className="w-11 h-11 rounded-lg bg-accent/15 group-hover:bg-accent/25 flex items-center justify-center transition-colors">
                    <ClockCounterClockwise size={22} weight="fill" className="text-accent group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors">Riwayat Notifikasi</p>
                    <p className="text-xs text-muted-foreground group-hover:text-foreground/70 transition-colors">Lihat history notifikasi terkirim</p>
                  </div>
                </button>

                <Separator />
              </>
            )}

            {canManageUsers && (
              <>
                <button
                  onClick={() => {
                    setOpen(false)
                    setShowUserManagement(true)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-lg hover:bg-primary/10 hover:border-primary/20 border border-transparent transition-all text-left group"
                >
                  <div className="w-11 h-11 rounded-lg bg-primary/15 group-hover:bg-primary/25 flex items-center justify-center transition-colors">
                    <Gear size={22} weight="fill" className="text-primary group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">Manajemen User</p>
                    <p className="text-xs text-muted-foreground group-hover:text-foreground/70 transition-colors">Buat user & atur akses terbatas</p>
                  </div>
                </button>
                <Separator />
              </>
            )}

            {/* Change Password */}
            <button
              onClick={() => {
                setOpen(false)
                setShowChangePassword(true)
              }}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-lg hover:bg-warning/10 hover:border-warning/20 border border-transparent transition-all text-left group"
            >
              <div className="w-11 h-11 rounded-lg bg-warning/15 group-hover:bg-warning/25 flex items-center justify-center transition-colors">
                <LockKey size={22} weight="fill" className="text-warning group-hover:scale-110 transition-transform" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground group-hover:text-warning transition-colors">Ubah Password</p>
                <p className="text-xs text-muted-foreground group-hover:text-foreground/70 transition-colors">Ganti password admin</p>
              </div>
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-lg hover:bg-destructive/10 hover:border-destructive/20 border border-transparent transition-all text-left group"
            >
              <div className="w-11 h-11 rounded-lg bg-destructive/15 group-hover:bg-destructive/25 flex items-center justify-center transition-colors">
                <SignOut size={22} weight="fill" className="text-destructive group-hover:scale-110 transition-transform" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-destructive group-hover:text-destructive/90 transition-colors">Logout</p>
                <p className="text-xs text-muted-foreground group-hover:text-foreground/70 transition-colors">Keluar dari sesi admin</p>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sub-dialogs */}
      {canManageUsers && (
        <NotificationSettingsDialog
          open={showNotificationSettings}
          onOpenChange={setShowNotificationSettings}
          settings={notificationSettings}
          onSave={onNotificationSettingsSave}
          onTest={onTestNotification}
        />
      )}

      {canManageUsers && showHistory && (
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

      <UserManagementDialog
        open={showUserManagement}
        onOpenChange={setShowUserManagement}
        users={managedUsers}
        currentUserId={currentUserId}
        onCreateUser={onCreateUser}
        onToggleUserActive={onToggleUserActive}
        onDeleteUser={onDeleteUser}
      />
    </>
  )
}
