import { useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { ManagedUser, ManagedUserRole, UserPermissions } from '@/lib/types'
import { toast } from 'sonner'

interface UserManagementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  users: ManagedUser[]
  currentUserId?: string
  onCreateUser: (payload: { username: string; password: string; role: ManagedUserRole }) => Promise<boolean>
  onToggleUserActive: (userId: string, isActive: boolean) => Promise<boolean>
  onDeleteUser: (userId: string) => Promise<boolean>
}

const roleLabels: Record<ManagedUserRole, string> = {
  admin: 'Admin',
  viewer: 'View Only',
  'add-only': 'Add URL Only',
}

const rolePermissions: Record<ManagedUserRole, UserPermissions> = {
  admin: {
    canView: true,
    canAddDomain: true,
    canEdit: true,
    canManageUsers: true,
  },
  viewer: {
    canView: true,
    canAddDomain: false,
    canEdit: false,
    canManageUsers: false,
  },
  'add-only': {
    canView: true,
    canAddDomain: true,
    canEdit: false,
    canManageUsers: false,
  },
}

export function UserManagementDialog({
  open,
  onOpenChange,
  users,
  currentUserId,
  onCreateUser,
  onToggleUserActive,
  onDeleteUser,
}: UserManagementDialogProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<ManagedUserRole>('viewer')
  const [isCreating, setIsCreating] = useState(false)
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      if (a.role === 'admin' && b.role !== 'admin') return -1
      if (a.role !== 'admin' && b.role === 'admin') return 1
      return a.username.localeCompare(b.username)
    })
  }, [users])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username.trim()) {
      toast.error('Username tidak boleh kosong')
      return
    }

    if (!password.trim() || password.length < 6) {
      toast.error('Password minimal 6 karakter')
      return
    }

    if (users.some(u => u.username.toLowerCase() === username.trim().toLowerCase())) {
      toast.error('Username sudah digunakan')
      return
    }

    setIsCreating(true)
    const success = await onCreateUser({
      username: username.trim(),
      password,
      role,
    })
    setIsCreating(false)

    if (success) {
      setUsername('')
      setPassword('')
      setRole('viewer')
    }
  }

  const handleToggleActive = async (user: ManagedUser) => {
    setUpdatingUserId(user.id)
    await onToggleUserActive(user.id, !user.isActive)
    setUpdatingUserId(null)
  }

  const handleDeleteUser = async (user: ManagedUser) => {
    if (user.role === 'admin') {
      toast.error('User admin tidak bisa dihapus')
      return
    }

    const confirmed = window.confirm(`Hapus user \"${user.username}\"? Aksi ini tidak bisa dibatalkan.`)
    if (!confirmed) {
      return
    }

    setDeletingUserId(user.id)
    await onDeleteUser(user.id)
    setDeletingUserId(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>User Management</DialogTitle>
          <DialogDescription>
            Admin dapat membuat user dengan akses terbatas: View Only atau Add URL Only.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <form onSubmit={handleCreate} className="space-y-4 rounded-lg border border-border bg-muted/20 p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="new-username">Username</Label>
                <Input
                  id="new-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="contoh: operator1"
                  disabled={isCreating}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="minimal 6 karakter"
                  disabled={isCreating}
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={role} onValueChange={(value) => setRole(value as ManagedUserRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">View Only</SelectItem>
                    <SelectItem value="add-only">Add URL Only</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-md border border-border/60 bg-background/60 px-3 py-2 text-xs text-muted-foreground">
              Permission: View {rolePermissions[role].canView ? '✅' : '❌'} • Add URL {rolePermissions[role].canAddDomain ? '✅' : '❌'} • Edit/Delete {rolePermissions[role].canEdit ? '✅' : '❌'}
            </div>

            <div className="flex justify-end pt-1">
              <Button type="submit" disabled={isCreating}>
                {isCreating ? 'Membuat...' : 'Buat User'}
              </Button>
            </div>
          </form>

          <Separator />

          <div className="space-y-3">
            <div className="text-sm font-semibold">Daftar User ({users.length})</div>
            {sortedUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada user terdaftar.</p>
            ) : (
              <div className="space-y-3">
                {sortedUsers.map((user) => {
                  const isCurrentUser = user.id === currentUserId
                  const isAdminUser = user.role === 'admin'
                  return (
                    <div
                      key={user.id}
                      className="flex flex-col gap-3 rounded-md border border-border px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{user.username}</span>
                          <Badge variant="outline" className="text-[10px]">{roleLabels[user.role]}</Badge>
                          {isCurrentUser && (
                            <Badge className="text-[10px]">Current</Badge>
                          )}
                          {!user.isActive && (
                            <Badge variant="destructive" className="text-[10px]">Disabled</Badge>
                          )}
                        </div>
                        {user.email && (
                          <p className="text-xs text-muted-foreground/90">{user.email}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          View {user.permissions.canView ? '✅' : '❌'} • Add URL {user.permissions.canAddDomain ? '✅' : '❌'} • Edit/Delete {user.permissions.canEdit ? '✅' : '❌'}
                        </p>
                      </div>
                      <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:flex-nowrap">
                        <Button
                          variant={user.isActive ? 'outline' : 'default'}
                          size="sm"
                          className="min-w-24"
                          disabled={isCurrentUser || isAdminUser || updatingUserId === user.id || deletingUserId === user.id}
                          onClick={() => handleToggleActive(user)}
                        >
                          {updatingUserId === user.id
                            ? 'Menyimpan...'
                            : user.isActive
                            ? 'Disable'
                            : 'Enable'}
                        </Button>

                        {!isAdminUser && (
                          <Button
                            variant="destructive"
                            size="sm"
                            className="min-w-24"
                            disabled={deletingUserId === user.id || updatingUserId === user.id}
                            onClick={() => handleDeleteUser(user)}
                          >
                            {deletingUserId === user.id ? 'Menghapus...' : 'Delete'}
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
