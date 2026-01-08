import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { List, Bell, SignOut, Info, ChartBar, LockKey } from '@phosphor-icons/react'
import { Separator } from '@/components/ui/separator'

interface MobileNavProps {
  onImport: () => void
  onExport: () => void
  onNotificationSettings: () => void
  onSettings: () => void
  onInfo: () => void
  onChangePassword: () => void
  onLogout: () => void
  isAutoRefresh: boolean
  onToggleAutoRefresh: () => void
  notificationEnabled: boolean
}

export function MobileNav({
  onImport,
  onExport,
  onNotificationSettings,
  onSettings,
  onInfo,
  onChangePassword,
  onLogout,
  isAutoRefresh,
  onToggleAutoRefresh,
  notificationEnabled
}: MobileNavProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="h-10 w-10 md:hidden"
        >
          <List size={24} weight="bold" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] sm:w-[320px]">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-4">
          {/* Auto-refresh Toggle */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Monitoring Mode</p>
            <Button
              onClick={onToggleAutoRefresh}
              variant={isAutoRefresh ? 'default' : 'outline'}
              className="w-full justify-start"
              size="lg"
            >
              {isAutoRefresh ? 'Auto-refresh ON' : 'Manual Mode'}
            </Button>
          </div>
          
          <Separator />
          
          {/* Import/Export */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Data</p>
            <Button
              onClick={onImport}
              variant="outline"
              className="w-full justify-start"
              size="lg"
            >
              Import CSV
            </Button>
            <Button
              onClick={onExport}
              variant="outline"
              className="w-full justify-start"
              size="lg"
            >
              Export CSV
            </Button>
          </div>
          
          <Separator />
          
          {/* Settings */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Settings</p>
            <Button
              onClick={onNotificationSettings}
              variant="ghost"
              className="w-full justify-start"
              size="lg"
            >
              <Bell size={20} className="mr-2" weight={notificationEnabled ? 'fill' : 'regular'} />
              Notifications
            </Button>
            <Button
              onClick={onSettings}
              variant="ghost"
              className="w-full justify-start"
              size="lg"
            >
              <ChartBar size={20} className="mr-2" />
              Statistics
            </Button>
            <Button
              onClick={onChangePassword}
              variant="ghost"
              className="w-full justify-start"
              size="lg"
            >
              <LockKey size={20} className="mr-2" />
              Change Password
            </Button>
            <Button
              onClick={onInfo}
              variant="ghost"
              className="w-full justify-start"
              size="lg"
            >
              <Info size={20} className="mr-2" />
              Help & Info
            </Button>
          </div>
          
          <Separator />
          
          {/* Logout */}
          <Button
            onClick={onLogout}
            variant="destructive"
            className="w-full justify-start"
            size="lg"
          >
            <SignOut size={20} className="mr-2" />
            Logout
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
