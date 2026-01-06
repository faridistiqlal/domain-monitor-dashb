import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Lock, Eye, EyeSlash } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface LoginDialogProps {
  open: boolean
  onLogin: (password: string) => void
}

export function LoginDialog({ open, onLogin }: LoginDialogProps) {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!password.trim()) {
      toast.error('Password tidak boleh kosong')
      return
    }

    setIsLoading(true)
    
    // Simulasi delay untuk keamanan (prevent brute force)
    setTimeout(() => {
      onLogin(password)
      setPassword('')
      setIsLoading(false)
    }, 300)
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" weight="duotone" />
            Login Required
          </DialogTitle>
          <DialogDescription>
            Masukkan password untuk mengakses fitur edit dan delete
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password Anda"
                autoFocus
                disabled={isLoading}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeSlash className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Memverifikasi...' : 'Login'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
