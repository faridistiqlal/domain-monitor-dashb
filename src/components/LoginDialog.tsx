import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Lock, Eye, EyeSlash } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface LoginFormProps {
  onLogin: (username: string, password: string) => Promise<void> | void
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!username.trim()) {
      toast.error('Username tidak boleh kosong')
      return
    }

    if (!password.trim()) {
      toast.error('Password tidak boleh kosong')
      return
    }

    setIsLoading(true)
    
    try {
      await onLogin(username.trim(), password)
    } catch {
      // error handled by parent
    } finally {
      setPassword('')
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <fieldset disabled={isLoading} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="login-username">Username</Label>
          <Input
            id="login-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Masukkan username"
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="login-password">Password</Label>
          <div className="relative">
            <Input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password Anda"
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
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
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Memverifikasi...
            </span>
          ) : 'Login'}
        </Button>
      </fieldset>
    </form>
  )
}

interface LoginDialogProps {
  open: boolean
  onLogin: (username: string, password: string) => void
}

export function LoginDialog({ open, onLogin }: LoginDialogProps) {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" weight="duotone" />
            Login Required
          </DialogTitle>
          <DialogDescription>
            Login dengan akun Anda untuk mengakses dashboard
          </DialogDescription>
        </DialogHeader>
        
        <LoginForm onLogin={onLogin} />
      </DialogContent>
    </Dialog>
  )
}
