import { useState } from 'react'
import { useTheme } from 'next-themes'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { List, Bell, SignOut, LockKey, ClockCounterClockwise, Moon, Sun } from '@phosphor-icons/react'
import { Separator } from '@/components/ui/separator'
import { NotificationSettingsDialog } from './NotificationSettingsDialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NotificationHistoryDialog } from './NotificationHistoryDialog'
import type { NotificationSettings } from '@/lib/types'

interface MobileNavProps {
  onImport: () => void
  onExport: () => void
  notificationSettings: NotificationSettings
  onNotificationSettingsSave: (settings: NotificationSettings) => void
  onTestNotification: () => void
  getHistory: () => any[]
  clearHistory: () => void
  onChangePassword: (oldPassword: string, newPassword: string) => Promise<boolean>
  onLogout: () => void
  isAutoRefresh: boolean
  onToggleAutoRefresh: () => void
  canManageUsers: boolean
}

export function MobileNav({
  onImport,
  onExport,
  notificationSettings,
  onNotificationSettingsSave,
  onTestNotification,
  getHistory,
  clearHistory,
  onChangePassword,
  onLogout,
  isAutoRefresh,
  onToggleAutoRefresh,
  canManageUsers,
}: MobileNavProps) {
  const [open, setOpen] = useState(false)
  const [showNotificationSettings, setShowNotificationSettings] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const { theme, setTheme } = useTheme()

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      alert('Password baru tidak cocok')
      return
    }
    
    if (newPassword.length < 6) {
      alert('Password minimal 6 karakter')
      return
    }

    setIsChangingPassword(true)
    const success = await onChangePassword(oldPassword, newPassword)
    setIsChangingPassword(false)

    if (success) {
      alert('Password berhasil diubah')
      setShowChangePassword(false)
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } else {
      alert('Password lama salah')
    }
  }

  const handleLogout = () => {
    setOpen(false)
    onLogout()
  }
  return (
    <>
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="h-10 w-10 md:hidden"
        >
          <List size={24} weight="bold" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] sm:w-[320px] px-6">
        <SheetHeader className="mb-2">
          <SheetTitle className="text-xl">Menu</SheetTitle>
        </SheetHeader>
        
        <div className="mt-8 space-y-6">
          {/* Auto-refresh Toggle */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">Monitoring Mode</p>
            <Button
              onClick={onToggleAutoRefresh}
              variant={isAutoRefresh ? 'default' : 'outline'}
              className="w-full justify-start h-12 text-base"
              size="lg"
            >
              {isAutoRefresh ? 'Auto-refresh ON' : 'Manual Mode'}
            </Button>
          </div>
          
          <Separator className="my-4" />
          
          {/* Import/Export */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">Data</p>
            <div className="space-y-2">
              <Button
                onClick={onImport}
                variant="outline"
                className="w-full justify-start h-12 text-base"
                size="lg"
              >
                Import CSV
              </Button>
              <Button
                onClick={onExport}
                variant="outline"
                className="w-full justify-start h-12 text-base"
                size="lg"
              >
                Export CSV
              </Button>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          {/* Settings */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">Pengaturan</p>
            <div className="space-y-2">
              {canManageUsers && (
                <>
                  <Button
                    onClick={() => {
                      setOpen(false)
                      setShowNotificationSettings(true)
                    }}
                    variant="ghost"
                    className="w-full justify-start h-12 text-base"
                    size="lg"
                  >
                    <Bell size={22} className="mr-3" weight={notificationSettings.enabled ? 'fill' : 'regular'} />
                    Pengaturan Notifikasi
                  </Button>
                  <Button
                    onClick={() => {
                      setOpen(false)
                      setShowHistory(true)
                    }}
                    variant="ghost"
                    className="w-full justify-start h-12 text-base"
                    size="lg"
                  >
                    <ClockCounterClockwise size={22} className="mr-3" />
                    Riwayat Notifikasi
                  </Button>
                </>
              )}
              <Button
                onClick={() => {
                  setOpen(false)
                  setShowChangePassword(true)
                }}
                variant="ghost"
                className="w-full justify-start h-12 text-base"
                size="lg"
              >
                <LockKey size={22} className="mr-3" />
                Ubah Password
              </Button>
            </div>
          </div>
          
          <Separator className="my-4" />

          {/* Theme Toggle */}
          <Button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            variant="outline"
            className="w-full justify-start h-12 text-base"
            size="lg"
          >
            {theme === 'dark' ? (
              <Sun size={22} className="mr-3" />
            ) : (
              <Moon size={22} className="mr-3" />
            )}
            {theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
          </Button>
          
          {/* Logout */}
          <Button
            onClick={handleLogout}
            variant="destructive"
            className="w-full justify-start h-12 text-base"
            size="lg"
          >
            <SignOut size={22} className="mr-3" />
            Logout
          </Button>
        </div>
      </SheetContent>
    </Sheet>

    {/* Dialogs */}
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

      <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ubah Password</DialogTitle>
            <DialogDescription>Masukkan password lama dan password baru Anda</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="old-password">Password Lama</Label>
              <Input
                id="old-password"
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Masukkan password lama"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Password Baru</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Masukkan password baru"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Konfirmasi Password Baru</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Konfirmasi password baru"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowChangePassword(false)}
            >
              Batal
            </Button>
            <Button
              onClick={handlePasswordChange}
              disabled={isChangingPassword || !oldPassword || !newPassword || !confirmPassword}
            >
              {isChangingPassword ? 'Mengubah...' : 'Ubah Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
