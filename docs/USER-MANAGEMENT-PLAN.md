# Plan: Multi-User Management System

**Status:** Ready to Implement  
**Created:** January 6, 2026  
**Target:** Domain Monitor - Kabupaten Kendal

---

## 🎯 Overview

Sistem user management dengan 5 user maximum, MD5 password encryption, role-based permissions (Edit, Delete, Import), admin-only password management, auto-logout 30 menit, dan verbose activity logging dengan per-user history.

---

## 📋 Requirements Finalized

1. ✅ **Custom MD5 Encryption** - No external library
2. ✅ **Admin Protected** - Default admin tidak bisa dihapus
3. ✅ **Tab Terpisah** untuk admin kelola user
4. ✅ **Label User-Friendly** - "Dapat Mengedit", "Dapat Menghapus", "Dapat Import"
5. ✅ **Auto-Logout** - 30 menit tanpa warning
6. ✅ **Badges Warna Berbeda** - Blue (Edit), Red (Delete), Green (Import)
7. ✅ **Verbose Logging** - Detail lengkap setiap action
8. ✅ **Username Permanent** - Tidak bisa diubah setelah dibuat
9. ✅ **Admin-Only Password Reset** - User biasa tidak bisa ubah password
10. ✅ **Export Bebas** - Semua user bisa export tanpa permission check
11. ✅ **Online Badge** - Show user yang sedang login
12. ✅ **Per-User Activity** - Filter activity log by user
13. ✅ **Manual Permissions** - Checkbox manual (tidak pakai template preset)
14. ✅ **Max 5 Users** - Limit dengan counter display

---

## 🏗️ Implementation Steps

### **Step 1: Create MD5 Encryption & User Types**

**File: `src/lib/types.ts`**

Tambah interfaces:

```typescript
export interface UserPermissions {
  canEdit: boolean
  canDelete: boolean
  canImport: boolean
}

export interface User {
  id: string
  username: string
  passwordHash: string
  permissions: UserPermissions
  createdAt: number
  isDefaultAdmin: boolean
}

export interface ActivityLog {
  id: string
  userId: string
  username: string
  action: string
  target: string
  detail: string
  timestamp: number
}
```

**File: `src/lib/utils.ts`**

Tambah functions:

```typescript
// MD5 Implementation (full algorithm ~200 lines)
export function md5(str: string): string { ... }

// Password helpers
export function hashPassword(password: string): string {
  return md5(password + 'spark-monitor-salt')
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash
}

// Initialize users
export function initializeUsers(): User[] {
  const stored = localStorage.getItem('app-users')
  if (stored) return JSON.parse(stored)
  
  const defaultAdmin: User = {
    id: 'admin-default',
    username: 'admin',
    passwordHash: hashPassword('admin123'),
    permissions: { canEdit: true, canDelete: true, canImport: true },
    createdAt: Date.now(),
    isDefaultAdmin: true,
  }
  
  localStorage.setItem('app-users', JSON.stringify([defaultAdmin]))
  return [defaultAdmin]
}
```

---

### **Step 2: Update Authentication & Auto-Logout**

**File: `src/components/LoginDialog.tsx`**

Changes:
- Tambah `username` Input field di atas password
- Update validation: check username exists + verify password
- Remove hint default password (karena user-based)

```typescript
interface LoginDialogProps {
  open: boolean
  onLogin: (username: string, password: string) => void
}

// In form:
<Input id="username" value={username} ... />
<Input id="password" type="password" value={password} ... />

// On submit:
onLogin(username, password)
```

**File: `src/App.tsx`**

State changes:
```typescript
// REMOVE:
const [isAuthenticated, setIsAuthenticated] = useState(...)
const [showLoginDialog, setShowLoginDialog] = useState(...)
const [isReadOnlyMode, setIsReadOnlyMode] = useState(...)

// ADD:
const [currentUser, setCurrentUser] = useState<User | null>(null)
const [users, setUsers] = useState<User[]>(() => initializeUsers())
const [lastActivityTime, setLastActivityTime] = useState(Date.now())
const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
```

Authentication handlers:
```typescript
const handleLogin = (username: string, password: string) => {
  const user = users.find(u => u.username === username)
  if (!user) {
    toast.error('Username tidak ditemukan')
    return
  }
  
  if (!verifyPassword(password, user.passwordHash)) {
    toast.error('Password salah')
    return
  }
  
  setCurrentUser(user)
  setLastActivityTime(Date.now())
  localStorage.setItem('app-current-user-id', user.id)
  localStorage.setItem('app-last-activity', Date.now().toString())
  toast.success(`Selamat datang, ${user.username}!`)
}

const handleLogout = () => {
  setCurrentUser(null)
  localStorage.removeItem('app-current-user-id')
  localStorage.removeItem('app-last-activity')
  toast.info('Anda telah logout')
}
```

Auto-logout system:
```typescript
// Track activity
useEffect(() => {
  const handleActivity = () => {
    setLastActivityTime(Date.now())
    localStorage.setItem('app-last-activity', Date.now().toString())
  }
  
  window.addEventListener('mousemove', handleActivity)
  window.addEventListener('keydown', handleActivity)
  window.addEventListener('click', handleActivity)
  
  return () => {
    window.removeEventListener('mousemove', handleActivity)
    window.removeEventListener('keydown', handleActivity)
    window.removeEventListener('click', handleActivity)
  }
}, [])

// Check session timeout
useEffect(() => {
  if (!currentUser) return
  
  const interval = setInterval(() => {
    const now = Date.now()
    const diff = now - lastActivityTime
    const thirtyMinutes = 30 * 60 * 1000
    
    if (diff > thirtyMinutes) {
      handleLogout()
      toast.warning('Sesi berakhir karena tidak aktif selama 30 menit')
    }
  }, 60000) // Check every minute
  
  return () => clearInterval(interval)
}, [currentUser, lastActivityTime])
```

---

### **Step 3: Build User Management Tab UI**

**File: `src/App.tsx`**

Add new tab:
```typescript
// In TabsList - add after "Kelola Data":
<TabsTrigger 
  value="users" 
  className="gap-1.5"
  disabled={!currentUser?.isDefaultAdmin}
  style={{ display: currentUser?.isDefaultAdmin ? 'flex' : 'none' }}
>
  <Users size={14} />
  Kelola User ({users.length}/5)
</TabsTrigger>
```

TabsContent layout:
```typescript
<TabsContent value="users" className="space-y-4 flex-1 flex flex-col overflow-hidden">
  <div className="flex items-center justify-between">
    <div>
      <h2 className="text-lg font-semibold">Manajemen Pengguna</h2>
      <p className="text-sm text-muted-foreground">
        Kelola pengguna dan hak akses mereka
      </p>
    </div>
    <Badge variant="outline">
      Pengguna Aktif: {users.length}/5
    </Badge>
  </div>
  
  <Separator />
  
  <div className="flex-1 flex gap-4 overflow-hidden">
    {/* Left: User List (60%) */}
    <div className="flex-1 space-y-3 overflow-hidden">
      <ScrollArea className="h-full">
        <div className="space-y-2 pr-4">
          {users.map(user => (
            <UserCard 
              key={user.id}
              user={user}
              isCurrentUser={user.id === currentUser?.id}
              onEdit={handleEditUser}
              onResetPassword={handleResetPassword}
              onDelete={handleDeleteUser}
              onViewActivity={() => setSelectedUserForActivity(user.id)}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
    
    {/* Right: Create/Edit Form (40%) */}
    <div className="w-96 space-y-4">
      <Card className="p-4">
        <UserForm
          users={users}
          onCreateUser={handleCreateUser}
          editingUser={editingUser}
          onUpdateUser={handleUpdateUser}
          onCancelEdit={() => setEditingUser(null)}
        />
      </Card>
    </div>
  </div>
  
  {/* Activity Log Section */}
  <div className="border-t pt-4">
    <ActivityLogSection 
      logs={activityLogs}
      selectedUserId={selectedUserForActivity}
      onClearFilter={() => setSelectedUserForActivity(null)}
    />
  </div>
</TabsContent>
```

User Card Component (inline):
```typescript
function UserCard({ user, isCurrentUser, onEdit, onResetPassword, onDelete, onViewActivity }) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold">{user.username}</h3>
            {isCurrentUser && (
              <Badge className="bg-green-500">Online</Badge>
            )}
            {user.isDefaultAdmin && (
              <Badge className="bg-purple-500">Admin Utama</Badge>
            )}
          </div>
          
          <div className="flex flex-wrap gap-1.5 mb-3">
            {user.permissions.canEdit && (
              <Badge variant="outline" className="text-blue-600 border-blue-600">
                Dapat Mengedit
              </Badge>
            )}
            {user.permissions.canDelete && (
              <Badge variant="outline" className="text-red-600 border-red-600">
                Dapat Menghapus
              </Badge>
            )}
            {user.permissions.canImport && (
              <Badge variant="outline" className="text-green-600 border-green-600">
                Dapat Import
              </Badge>
            )}
          </div>
          
          <p className="text-xs text-muted-foreground">
            Dibuat: {new Date(user.createdAt).toLocaleDateString('id-ID')}
          </p>
        </div>
        
        <div className="flex gap-1">
          <Button size="sm" variant="outline" onClick={() => onEdit(user)}>
            <PencilSimple size={14} />
          </Button>
          <Button size="sm" variant="outline" onClick={() => onResetPassword(user)}>
            <LockKey size={14} />
          </Button>
          <Button size="sm" variant="outline" onClick={() => onViewActivity(user.id)}>
            <ClockClockwise size={14} />
          </Button>
          {!user.isDefaultAdmin && user.id !== currentUser?.id && (
            <Button 
              size="sm" 
              variant="ghost" 
              className="text-destructive"
              onClick={() => onDelete(user)}
            >
              <Trash size={14} />
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
```

User Form Component (inline):
```typescript
function UserForm({ users, onCreateUser, editingUser, onUpdateUser, onCancelEdit }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [permissions, setPermissions] = useState({
    canEdit: false,
    canDelete: false,
    canImport: false,
  })
  
  // Load editingUser data when in edit mode
  useEffect(() => {
    if (editingUser) {
      setUsername(editingUser.username)
      setPermissions(editingUser.permissions)
    } else {
      // Reset form
      setUsername('')
      setPassword('')
      setConfirmPassword('')
      setPermissions({ canEdit: false, canDelete: false, canImport: false })
    }
  }, [editingUser])
  
  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Validations
    if (!editingUser && !username) {
      toast.error('Username wajib diisi')
      return
    }
    
    if (!editingUser && users.length >= 5) {
      toast.error('Maksimal 5 pengguna')
      return
    }
    
    if (!editingUser && users.some(u => u.username === username)) {
      toast.error('Username sudah digunakan')
      return
    }
    
    if (!editingUser && password.length < 6) {
      toast.error('Password minimal 6 karakter')
      return
    }
    
    if (!editingUser && password !== confirmPassword) {
      toast.error('Password tidak cocok')
      return
    }
    
    if (editingUser) {
      onUpdateUser(editingUser.id, permissions)
    } else {
      onCreateUser(username, password, permissions)
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h3 className="font-semibold mb-3">
          {editingUser ? 'Edit Pengguna' : 'Buat Pengguna Baru'}
        </h3>
      </div>
      
      <div className="space-y-2">
        <Label>Username</Label>
        <Input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={!!editingUser}
          placeholder="Masukkan username"
        />
        {editingUser && (
          <p className="text-xs text-muted-foreground">
            Username tidak dapat diubah
          </p>
        )}
      </div>
      
      {!editingUser && (
        <>
          <div className="space-y-2">
            <Label>Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Konfirmasi Password</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ketik ulang password"
            />
          </div>
        </>
      )}
      
      <Separator />
      
      <div className="space-y-3">
        <Label>Hak Akses</Label>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-sm">Dapat Mengedit Domain</span>
          </div>
          <Switch
            checked={permissions.canEdit}
            onCheckedChange={(checked) => 
              setPermissions(p => ({ ...p, canEdit: checked }))
            }
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-sm">Dapat Menghapus Domain</span>
          </div>
          <Switch
            checked={permissions.canDelete}
            onCheckedChange={(checked) => 
              setPermissions(p => ({ ...p, canDelete: checked }))
            }
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-sm">Dapat Import CSV</span>
          </div>
          <Switch
            checked={permissions.canImport}
            onCheckedChange={(checked) => 
              setPermissions(p => ({ ...p, canImport: checked }))
            }
          />
        </div>
      </div>
      
      <div className="flex gap-2 pt-2">
        {editingUser && (
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onCancelEdit}
          >
            Batal
          </Button>
        )}
        <Button type="submit" className="flex-1">
          {editingUser ? 'Simpan Perubahan' : 'Buat Pengguna'}
        </Button>
      </div>
    </form>
  )
}
```

---

### **Step 4: Implement User CRUD Operations**

**File: `src/App.tsx`**

```typescript
const handleCreateUser = (username: string, password: string, permissions: UserPermissions) => {
  const newUser: User = {
    id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    username,
    passwordHash: hashPassword(password),
    permissions,
    createdAt: Date.now(),
    isDefaultAdmin: false,
  }
  
  const updatedUsers = [...users, newUser]
  setUsers(updatedUsers)
  localStorage.setItem('app-users', JSON.stringify(updatedUsers))
  
  logActivity('user-create', 'Pengguna', `membuat user '${username}' dengan izin: ${getPermissionLabel(permissions)}`)
  toast.success(`Pengguna ${username} berhasil dibuat`)
}

const handleUpdateUser = (userId: string, permissions: UserPermissions) => {
  const updatedUsers = users.map(u => 
    u.id === userId ? { ...u, permissions } : u
  )
  setUsers(updatedUsers)
  localStorage.setItem('app-users', JSON.stringify(updatedUsers))
  
  const user = users.find(u => u.id === userId)
  logActivity('user-update', 'Pengguna', `mengubah izin user '${user?.username}' menjadi: ${getPermissionLabel(permissions)}`)
  toast.success('Hak akses berhasil diperbarui')
  setEditingUser(null)
}

const handleResetPassword = (user: User) => {
  // Show dialog to input new password
  const newPassword = prompt(`Reset password untuk ${user.username}:`)
  if (!newPassword) return
  
  if (newPassword.length < 6) {
    toast.error('Password minimal 6 karakter')
    return
  }
  
  const updatedUsers = users.map(u =>
    u.id === user.id ? { ...u, passwordHash: hashPassword(newPassword) } : u
  )
  setUsers(updatedUsers)
  localStorage.setItem('app-users', JSON.stringify(updatedUsers))
  
  logActivity('user-password-reset', 'Pengguna', `mereset password user '${user.username}'`)
  toast.success(`Password ${user.username} berhasil direset`)
}

const handleDeleteUser = (user: User) => {
  // Show confirmation dialog
  if (!confirm(`Yakin ingin menghapus user ${user.username}?`)) return
  
  const updatedUsers = users.filter(u => u.id !== user.id)
  setUsers(updatedUsers)
  localStorage.setItem('app-users', JSON.stringify(updatedUsers))
  
  logActivity('user-delete', 'Pengguna', `menghapus user '${user.username}'`)
  toast.success(`Pengguna ${user.username} berhasil dihapus`)
}

function getPermissionLabel(permissions: UserPermissions): string {
  const labels = []
  if (permissions.canEdit) labels.push('Edit')
  if (permissions.canDelete) labels.push('Hapus')
  if (permissions.canImport) labels.push('Import')
  return labels.join(', ') || 'Tidak ada izin'
}
```

---

### **Step 5: Apply Permission Checks & Remove Old Code**

**File: `src/App.tsx`**

Replace all permission checks:

```typescript
// REMOVE:
const canEdit = isAuthenticated && !isReadOnlyMode
const [isReadOnlyMode, setIsReadOnlyMode] = useState(...)
const handleToggleReadOnly = () => { ... }

// UPDATE ALL CHECKS TO:
currentUser?.permissions.canEdit     // for edit operations
currentUser?.permissions.canDelete   // for delete operations
currentUser?.permissions.canImport   // for import button
// Export always available for all authenticated users
```

Update handlers with permission checks:

```typescript
const handleAddDomain = (url: string) => {
  if (!currentUser?.permissions.canEdit) {
    toast.error('Anda tidak memiliki izin untuk menambah domain')
    return
  }
  // ... rest of code
  logActivity('domain-add', 'Domain', `menambahkan domain ${url}`)
}

const handleEditDomain = (id: string, newUrl: string) => {
  if (!currentUser?.permissions.canEdit) {
    toast.error('Anda tidak memiliki izin untuk mengedit domain')
    return
  }
  const oldUrl = domains.find(d => d.id === id)?.url
  // ... rest of code
  logActivity('domain-edit', 'Domain', `mengedit domain ${oldUrl} → ${newUrl}`)
}

const handleDeleteDomain = (id: string) => {
  if (!currentUser?.permissions.canDelete) {
    toast.error('Anda tidak memiliki izin untuk menghapus domain')
    return
  }
  const domain = domains.find(d => d.id === id)
  // ... rest of code
  logActivity('domain-delete', 'Domain', `menghapus domain ${domain?.url}`)
}

const handleBulkDelete = () => {
  if (!currentUser?.permissions.canDelete) {
    toast.error('Anda tidak memiliki izin untuk menghapus domain')
    return
  }
  const count = selectedDomains.size
  // ... rest of code
  logActivity('domain-bulk-delete', 'Domain', `menghapus ${count} domain sekaligus`)
}

const handleImportDomains = (domains: Domain[]) => {
  if (!currentUser?.permissions.canImport) {
    toast.error('Anda tidak memiliki izin untuk import CSV')
    return
  }
  // ... rest of code
  logActivity('domain-import', 'Domain', `mengimport ${domains.length} domain dari CSV`)
}

// Similar for groups and tags
const handleCreateGroup = (...) => {
  if (!currentUser?.permissions.canEdit) {
    toast.error('Anda tidak memiliki izin untuk membuat grup')
    return
  }
  // ...
  logActivity('group-create', 'Grup', `membuat grup '${groupData.name}'`)
}

const handleDeleteGroup = (groupId: string) => {
  if (!currentUser?.permissions.canDelete) {
    toast.error('Anda tidak memiliki izin untuk menghapus grup')
    return
  }
  const group = groups.find(g => g.id === groupId)
  // ...
  logActivity('group-delete', 'Grup', `menghapus grup '${group?.name}'`)
}

// etc...
```

Update component renders:

```typescript
// Header - Remove ReadOnly toggle, add user info
<div className="flex items-center gap-2">
  {currentUser && (
    <Badge variant="outline" className="gap-2">
      <User size={14} />
      {currentUser.username}
    </Badge>
  )}
  
  {currentUser?.permissions.canImport && (
    <ImportDialog ... />
  )}
  
  <Button ... onClick={handleExportCSV}>Export</Button>
  
  {/* Remove Settings button - password reset only by admin */}
  
  <Button ... onClick={handleLogout}>
    <SignOut size={14} />
  </Button>
</div>

// Tab Kelola Data
{currentUser?.permissions.canEdit && <AddDomainForm onAdd={handleAddDomain} />}

// Domain Cards
<OptimizedDomainList
  ...
  onDelete={currentUser?.permissions.canDelete ? handleDeleteDomain : undefined}
  onEdit={currentUser?.permissions.canEdit ? handleEditDomain : undefined}
  showCheckbox={currentUser?.permissions.canDelete}
/>

// Groups
<GroupCard
  ...
  onEdit={currentUser?.permissions.canEdit ? ... : undefined}
  onDelete={currentUser?.permissions.canDelete ? ... : undefined}
/>

// Tags - same pattern
```

---

### **Step 6: Implement Activity Logging System**

**File: `src/App.tsx`**

```typescript
const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
  const stored = localStorage.getItem('app-activity-log')
  if (!stored) return []
  
  const logs = JSON.parse(stored)
  // Auto-cleanup logs older than 30 days
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
  return logs.filter(log => log.timestamp > thirtyDaysAgo)
})

const logActivity = (action: string, target: string, detail: string) => {
  if (!currentUser) return
  
  const log: ActivityLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId: currentUser.id,
    username: currentUser.username,
    action,
    target,
    detail,
    timestamp: Date.now(),
  }
  
  const updatedLogs = [log, ...activityLogs].slice(0, 100) // Keep max 100
  setActivityLogs(updatedLogs)
  localStorage.setItem('app-activity-log', JSON.stringify(updatedLogs))
}

// Activity Log Section Component
function ActivityLogSection({ logs, selectedUserId, onClearFilter }) {
  const filteredLogs = selectedUserId
    ? logs.filter(log => log.userId === selectedUserId)
    : logs
  
  const getActionColor = (action: string) => {
    if (action.includes('add') || action.includes('create')) return 'text-green-600'
    if (action.includes('edit') || action.includes('update')) return 'text-blue-600'
    if (action.includes('delete')) return 'text-red-600'
    if (action.includes('user')) return 'text-purple-600'
    return 'text-gray-600'
  }
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Log Aktivitas</h3>
        {selectedUserId && (
          <Button size="sm" variant="outline" onClick={onClearFilter}>
            <X size={14} className="mr-1" />
            Clear Filter
          </Button>
        )}
      </div>
      
      <ScrollArea className="h-64 border rounded-lg p-3">
        <div className="space-y-2">
          {filteredLogs.slice(0, 50).map(log => (
            <div key={log.id} className="flex gap-3 text-sm">
              <Badge variant="outline" className="shrink-0 text-xs">
                {new Date(log.timestamp).toLocaleString('id-ID', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Badge>
              
              <Badge variant="secondary" className="shrink-0">
                {log.username}
              </Badge>
              
              <span className={cn("font-medium", getActionColor(log.action))}>
                {log.target}:
              </span>
              
              <span className="text-muted-foreground">
                {log.detail}
              </span>
            </div>
          ))}
          
          {filteredLogs.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              Belum ada aktivitas
            </p>
          )}
        </div>
      </ScrollArea>
      
      <p className="text-xs text-muted-foreground">
        Menampilkan {Math.min(50, filteredLogs.length)} dari {filteredLogs.length} aktivitas
      </p>
    </div>
  )
}
```

---

## 🔧 Files to Modify

### New Files:
- None (all inline components)

### Modified Files:
1. `src/lib/types.ts` - Add User, UserPermissions, ActivityLog interfaces
2. `src/lib/utils.ts` - Add MD5, password helpers, initializeUsers()
3. `src/components/LoginDialog.tsx` - Add username field, update validation
4. `src/App.tsx` - Major updates:
   - Replace auth state
   - Add user management tab
   - Add inline components (UserCard, UserForm, ActivityLogSection)
   - Update all permission checks
   - Add CRUD handlers
   - Add activity logging
   - Add auto-logout
5. `src/components/SettingsDialog.tsx` - Remove (not needed)

---

## 📦 LocalStorage Keys

```
app-users                -> User[]
app-current-user-id      -> string
app-last-activity        -> string (timestamp)
app-activity-log         -> ActivityLog[]

REMOVED:
app-password
app-authenticated
app-readonly-mode
```

---

## 🎨 UI/UX Details

### Colors:
- **Blue (#3B82F6)** - Edit permission
- **Red (#EF4444)** - Delete permission
- **Green (#10B981)** - Import permission
- **Purple (#A855F7)** - Admin badge
- **Green (#22C55E)** - Online badge

### Layout:
- User list: 60% width
- Create form: 40% width
- Activity log: Full width below

### Badges:
- "Online" - hijau untuk current user
- "Admin Utama" - purple untuk default admin
- Permission badges - colored outline style

---

## ✅ Testing Checklist

### Authentication:
- [ ] Login dengan admin/admin123 berhasil
- [ ] Login dengan username salah gagal
- [ ] Login dengan password salah gagal
- [ ] Auto-logout setelah 30 menit
- [ ] Activity tracking reset timeout

### User Management:
- [ ] Create user max 5
- [ ] Username unik validation
- [ ] Password min 6 char
- [ ] Permission checkboxes work
- [ ] Edit user permissions
- [ ] Username tidak bisa diubah
- [ ] Reset password by admin
- [ ] Delete user (not admin, not self)
- [ ] Default admin tidak bisa dihapus

### Permissions:
- [ ] canEdit: show/hide add domain form
- [ ] canEdit: show/hide edit buttons
- [ ] canEdit: block edit handlers
- [ ] canDelete: show/hide delete buttons
- [ ] canDelete: show/hide bulk delete
- [ ] canDelete: block delete handlers
- [ ] canImport: show/hide import button
- [ ] canImport: block import handler
- [ ] Export selalu available

### Activity Log:
- [ ] Log semua actions
- [ ] Verbose detail lengkap
- [ ] Filter by user work
- [ ] Max 100 entries
- [ ] Auto-cleanup 30 hari
- [ ] Color coding correct

### UI:
- [ ] Tab "Kelola User" hanya untuk admin
- [ ] User counter (X/5) update
- [ ] Online badge untuk current user
- [ ] Permission badges warna correct
- [ ] Per-user activity filter work

---

## 🚀 Migration Steps

### Before Implementation:
1. Backup current localStorage data
2. Note existing users with current password

### During Implementation:
1. Implement Step 1-6 in order
2. Test each step before moving to next
3. Clear localStorage for clean start

### After Implementation:
1. First launch will create default admin
2. Login dengan admin/admin123
3. Create users untuk existing team members
4. Test all permissions

---

## 📝 Notes

- MD5 dengan salt 'spark-monitor-salt'
- Session timeout 30 menit tanpa warning
- Max 5 users (hard limit)
- Max 100 activity logs
- Auto-cleanup logs > 30 hari
- Username permanent (tidak bisa edit)
- Export bebas untuk semua user
- Admin-only password reset

---

## 🔮 Future Enhancements (Post-MVP)

1. Session warning 1 menit sebelum logout
2. Bulk user operations
3. Export activity log to CSV
4. Password strength meter
5. User profile avatars
6. More granular permissions (per group, per tag)
7. Activity log search/filter by date range
8. Email notifications (requires backend)

---

**Status:** ✅ READY TO IMPLEMENT  
**Complexity:** Medium  
**Estimated Time:** 3-4 hours  
**Priority:** High
