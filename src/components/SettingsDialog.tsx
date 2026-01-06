import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeSlash } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPasswordChange: (newPassword: string) => void
}

export function SettingsDialog({ open, onOpenChange, onPasswordChange }: SettingsDialogProps) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Semua field harus diisi')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('Password baru tidak cocok')
      return
    }

    if (newPassword.length < 6) {
      toast.error('Password minimal 6 karakter')
      return
    }

    setIsLoading(true)
    
    setTimeout(() => {
      const storedPassword = localStorage.getItem('app-password') || 'admin123'
      
      if (currentPassword !== storedPassword) {
        toast.error('Password saat ini salah')
        setIsLoading(false)
        return
      }

      onPasswordChange(newPassword)
      toast.success('Password berhasil diubah')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setIsLoading(false)
      onOpenChange(false)
    }, 300)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ubah Password</DialogTitle>
          <DialogDescription>
            Ganti password untuk meningkatkan keamanan aplikasi
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Password Saat Ini</Label>
            <div className="relative">
              <Input
                id="current-password"
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Masukkan password saat ini"
                disabled={isLoading}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowCurrent(!showCurrent)}
                disabled={isLoading}
              >
                {showCurrent ? <EyeSlash className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password">Password Baru</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                disabled={isLoading}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowNew(!showNew)}
                disabled={isLoading}
              >
                {showNew ? <EyeSlash className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Konfirmasi Password Baru</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ketik ulang password baru"
                disabled={isLoading}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirm(!showConfirm)}
                disabled={isLoading}
              >
                {showConfirm ? <EyeSlash className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
