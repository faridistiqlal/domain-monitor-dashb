# 🗺️ DEVELOPMENT PLAN - Domain Monitor

**Project:** Domain Monitor Dashboard - Kabupaten Kendal  
**Version:** 2.1.0 (Current)  
**Target:** v3.0.0 (Multi-User System)

---

## 📋 Product Vision

Simple, real-time monitoring dashboard untuk track availability status dari multiple kendalkab.go.id subdomain websites dengan immediate visual feedback.

**Experience Goals:**
1. **Clarity** - Instant status recognition dengan color coding
2. **Efficiency** - Quick scanning tanpa scrolling fatigue
3. **Reliability** - Real-time monitoring yang trustworthy

**Complexity:** Light Application (multiple features with basic state)

---

## ✅ Current Features (v2.1.0)

### Domain Management
- Add, edit, delete domains (.kendalkab.go.id validation)
- Bulk operations (multi-select delete)
- Import from CSV (with group assignment)
- Export to CSV (all, filtered, per group)
- Virtual scrolling (50 items progressive load)
- Duplicate detection & prevention

### Monitoring System
- **3-State Status:**
  - 🟢 Online: DNS + HTTP/HTTPS accessible
  - 🟡 DNS Only: DNS resolves tapi HTTP down
  - 🔴 Offline: DNS gagal total
- **Dual Mode:**
  - Auto-refresh: Check setiap 60 detik
  - Manual: On-demand dengan progress indicator
- Protocol detection (HTTP/HTTPS badge)
- Response time tracking
- IP address display
- Error message capture
- Last check timestamp

### Organization
- **Groups:** Create, edit, delete, assign domains
- **Tags:** Multiple tags per domain, color coding
- Filter by group, tag, status
- Sort: name, status (online/offline first)
- Real-time search (300ms debounce)

### Security (v2.1.0)
- Password authentication (default: admin123)
- Auto-logout setelah 30 menit inactivity
- Warning toast 2 minutes before logout
- Activity tracking (mouse, keyboard, scroll, touch, click)
- Change password dialog
- Session management (localStorage)

### Data Persistence
- Firebase Firestore cloud sync
- Real-time sync antar device
- Hybrid storage (Firebase + localStorage fallback)
- Auto-sync on every change
- Password sync to cloud

### UI/UX
- 5 tabs: Domains, Groups, Manage, Tags, Statistics
- Dark mode dengan OKLCH colors
- Virtual scrolling untuk performa
- Statistics view dengan charts
- Legal dialogs (Privacy, ToS, Changelog)
- Empty states & onboarding
- Responsive design

---

## 🎨 Design System

### Colors (OKLCH)
```css
Primary: oklch(0.35 0.08 250)      /* Deep Blue */
Success: oklch(0.65 0.20 145)      /* Green - Online */
Warning: oklch(0.70 0.18 60)       /* Amber - DNS Only */
Destructive: oklch(0.55 0.22 25)   /* Red - Offline */
Accent: oklch(0.75 0.15 200)       /* Cyan - Interactive */
Background: oklch(0.15 0.01 250)   /* Dark Slate */
```

### Typography
- **Primary:** JetBrains Mono (domain names, timestamps)
- **Secondary:** Space Grotesk (headings, labels)
- **H1:** Space Grotesk Bold/32px
- **Body:** Space Grotesk Regular/14px
- **Code:** JetBrains Mono Regular/16px

### Spacing & Layout
- Grid: 1-2 columns (responsive)
- Gap: 12-16px
- Card padding: 16-24px
- Border radius: 8-12px

---

## 🚀 Future Features (v3.0.0 - Multi-User)

### Status: **PLANNED - Not Started**

### User Management System

#### Requirements:
- Max **5 users** total (including default admin)
- MD5 password encryption (custom implementation, no library)
- Default admin cannot be deleted
- Username permanent (tidak bisa diubah setelah dibuat)
- Admin-only password management

#### Permissions (Role-based):
- ✅ **Can Edit** - Create/edit domains, groups, tags
- ✅ **Can Delete** - Delete domains, groups, tags
- ✅ **Can Import** - Import domains from CSV
- ℹ️ **Export** - Always available (no permission check)

#### Features:
1. **User CRUD** (Admin only)
   - Create user: username + password + permissions (manual checkbox)
   - Edit user: change password + toggle permissions
   - Delete user: tidak bisa delete default admin
   - List users: tabel dengan username, permissions badges, online status

2. **Activity Logging**
   - Log semua action: add, edit, delete domain/group/tag, import, export
   - Per-user history filter
   - Timestamp, username, action, target, detail
   - Verbose logging (detail lengkap)
   - Display in modal or dedicated tab

3. **Auth & Session**
   - Login dengan username + password (bukan password saja)
   - Auto-logout tetap 30 menit
   - Online badge untuk user yang sedang login
   - Session management per user

4. **UI Changes**
   - New tab: "Kelola User" (admin only)
   - Login dialog: add username field
   - User table: columns (username, permissions badges, online, actions)
   - Permission badges: Blue (Edit), Red (Delete), Green (Import)
   - Counter: "X/5 Users" displayed prominently

#### Technical Implementation:

**New Types:**
```typescript
interface UserPermissions {
  canEdit: boolean
  canDelete: boolean
  canImport: boolean
}

interface User {
  id: string
  username: string
  passwordHash: string
  permissions: UserPermissions
  createdAt: number
  isDefaultAdmin: boolean
}

interface ActivityLog {
  id: string
  userId: string
  username: string
  action: string
  target: string
  detail: string
  timestamp: number
}
```

**MD5 Implementation:**
```typescript
// Custom MD5 function (~200 lines)
function md5(str: string): string { ... }

function hashPassword(password: string): string {
  return md5(password + 'spark-monitor-salt')
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash
}
```

**State Changes:**
```typescript
// Remove simple auth
// const [isAuthenticated, setIsAuthenticated] = useState(false)

// Add user-based auth
const [currentUser, setCurrentUser] = useState<User | null>(null)
const [users, setUsers] = useState<User[]>([])
const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])

// Permission checks
const canEdit = currentUser?.permissions.canEdit || false
const canDelete = currentUser?.permissions.canDelete || false
const canImport = currentUser?.permissions.canImport || false
const isAdmin = currentUser?.isDefaultAdmin || false
```

**New Components:**
- UserManagementTab.tsx - Tab kelola user
- UserFormDialog.tsx - Create/edit user
- UserTable.tsx - Display users
- ActivityLogDialog.tsx - Display logs
- LoginWithUsername.tsx - Updated login

**Firebase Collections:**
```
/users/{userId}
  - username
  - passwordHash
  - permissions
  - createdAt
  - isDefaultAdmin

/activity-logs/{logId}
  - userId
  - username
  - action
  - target
  - detail
  - timestamp
```

#### Estimation:
- **Time:** 2-3 days full implementation
- **Complexity:** Medium
- **Priority:** Medium (nice to have)
- **Dependencies:** None (can start anytime)

---

## 🔄 Edge Cases Handled

### Current System:
- ✅ Empty state dengan onboarding message
- ✅ All domains down - summary count displayed
- ✅ DNS resolves but HTTP fails - amber warning
- ✅ Network-specific issues - detailed error capture
- ✅ Invalid domain format - inline validation
- ✅ Slow network - 15 second timeout per domain
- ✅ CORS issues - graceful error messaging
- ✅ Duplicate domains - prevention with validation
- ✅ Manual mode without check - clear CTA
- ✅ Export without check - disabled until checked

### Multi-User System (Future):
- Username already exists - prevent duplicate
- Max 5 users reached - disable create button
- Delete default admin - show error toast
- Change own permissions - only admin can
- User already logged in elsewhere - allow (no single session lock)
- Activity log too large - pagination or limit to last 1000

---

## 📊 Performance Targets

### Current (Achieved):
- ✅ 300+ domains: Zero lag, smooth scrolling
- ✅ Search/filter: <300ms response
- ✅ Domain check: <15s per domain
- ✅ Initial render: <50 items (progressive load)
- ✅ Auto-refresh: 60s interval

### Future (Multi-User):
- Users list: <100ms render (max 5, trivial)
- Activity logs: Pagination (50 per page)
- Login: <500ms with MD5 hash verify

---

## 🛠️ Development Guidelines

### Code Quality:
- TypeScript strict mode
- ESLint + Prettier
- Proper error handling
- Loading states everywhere
- Toast notifications for feedback

### Component Structure:
- Small, focused components
- Reusable UI components (shadcn)
- Custom hooks for logic
- Proper TypeScript types

### State Management:
- useState for local state
- useEffect for side effects
- Custom hooks for complex logic
- No Redux (keep simple)

### Data Flow:
- Firebase for cloud storage
- localStorage for offline fallback
- Real-time sync with listeners
- Optimistic UI updates

---

## 📝 Testing Checklist (Before Deploy)

### Functionality:
- [ ] All tabs navigate correctly
- [ ] Add/edit/delete domain works
- [ ] Group assignment works
- [ ] Tag assignment works
- [ ] CSV import/export works
- [ ] Search & filter work
- [ ] Auto-refresh works
- [ ] Manual check works
- [ ] Statistics display correctly

### Auth & Security:
- [ ] Login works
- [ ] Logout works
- [ ] Change password works
- [ ] Auto-logout triggers after 30min
- [ ] Warning shows 2min before logout
- [ ] Activity tracking resets timer

### Data:
- [ ] Firebase sync works
- [ ] localStorage fallback works
- [ ] Real-time updates work
- [ ] No data loss on refresh
- [ ] Password syncs to cloud

### UI/UX:
- [ ] Responsive on mobile
- [ ] No layout shifts
- [ ] Loading states display
- [ ] Error messages clear
- [ ] Empty states helpful
- [ ] Tooltips informative

### Performance:
- [ ] 300+ domains smooth
- [ ] Search <300ms
- [ ] No memory leaks
- [ ] Virtual scrolling works
- [ ] Progressive loading works

---

## 🚀 Deployment Process

### Current (Automated):
```bash
# 1. Commit changes
git add .
git commit -m "feat: description"

# 2. Push to main (auto-deploys to Vercel)
git push origin main

# 3. Verify deployment
# Visit: https://kendal-uptime.vercel.app
```

### Manual Deploy (if needed):
```bash
# Build locally
npm run build

# Preview build
npm run preview

# Deploy via Vercel CLI
vercel --prod
```

---

## 📚 Documentation Maintenance

### Update These When:
1. **PROJECT-STATUS.md** - After every feature/version
2. **CHANGELOG.md** - After every deploy
3. **DEVELOPMENT-PLAN.md** - When planning new features
4. **GUIDES.md** - When adding new features that need explanation
5. **FILE-REFERENCE.md** - When adding new files/components

### Don't Update:
- CHECKPOINT.md (archived)
- BACKUP-SUMMARY.md (archived)
- Old verification reports

---

## 🎯 Success Metrics

### Current Success:
- ✅ App is live and accessible
- ✅ No critical bugs
- ✅ Handles 300+ domains smoothly
- ✅ Cross-device sync works
- ✅ Authentication secure
- ✅ Documentation accurate (98%)

### Future Success (v3.0):
- [ ] 5 users can login simultaneously
- [ ] Activity logs track all changes
- [ ] Role-based permissions working
- [ ] Admin can manage users easily
- [ ] No performance degradation
- [ ] Documentation updated

---

**Planning Status:**  
✅ Current features fully specified  
✅ Multi-user system planned (ready to implement)  
✅ Technical details documented  
⏳ Waiting for go-ahead to start v3.0

**Next Steps:** Decide if/when to implement multi-user system
