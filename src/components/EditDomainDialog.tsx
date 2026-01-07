import { useState } from 'react'
import { PencilSimple } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Domain } from '@/lib/types'
import { toast } from 'sonner'

interface EditDomainDialogProps {
  domain: Domain
  onEdit: (id: string, newUrl: string, notificationsEnabled?: boolean) => void
  existingUrls: string[]
}

export function EditDomainDialog({ domain, onEdit, existingUrls }: EditDomainDialogProps) {
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState(domain.url)
  const [notificationsEnabled, setNotificationsEnabled] = useState(domain.notificationsEnabled ?? true)
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const trimmedUrl = url.trim()
    
    if (!trimmedUrl) {
      setError('Domain tidak boleh kosong')
      return
    }

    if (trimmedUrl === domain.url && notificationsEnabled === (domain.notificationsEnabled ?? true)) {
      setOpen(false)
      return
    }

    if (trimmedUrl !== domain.url && existingUrls.includes(trimmedUrl)) {
      setError('Domain sudah ada dalam daftar')
      return
    }

    onEdit(domain.id, trimmedUrl, notificationsEnabled)
    setOpen(false)
    setUrl(trimmedUrl)
    setError('')
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setUrl(domain.url)
      setNotificationsEnabled(domain.notificationsEnabled ?? true)
      setError('')
    }
    setOpen(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
        >
          <PencilSimple size={16} />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Domain</DialogTitle>
            <DialogDescription>
              Ubah URL domain dan pengaturan notifikasi
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="domain-url">Domain URL</Label>
              <Input
                id="domain-url"
                type="text"
                placeholder="example.com"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value)
                  setError('')
                }}
                className={error ? 'border-destructive' : ''}
              />
              {error && (
                <p className="text-xs text-destructive">{error}</p>
              )}
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notifications">Enable Notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Kirim notifikasi Slack saat status domain berubah
                </p>
              </div>
              <Switch
                id="notifications"
                checked={notificationsEnabled}
                onCheckedChange={setNotificationsEnabled}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Batal
            </Button>
            <Button type="submit">
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
