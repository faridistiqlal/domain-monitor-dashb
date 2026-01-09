# 📊 Domain Monitor Dashboard - Kabupaten Kendal

Real-time monitoring dashboard untuk track availability status dari multiple subdomain kendalkab.go.id. **Fully mobile responsive!**

🌐 **Live App:** https://kendal-uptime.vercel.app  
📱 **Mobile Ready:** Optimized untuk smartphone & tablet  
📚 **Dokumentasi:** [docs/](./docs/)  
🔥 **Firebase:** kendal-monitor project  
🔧 **Current Version:** 3.5.10

---

## 📖 PENTING - Baca Ini Dulu Setiap Sesi Baru!

### 🎯 Quick Context untuk AI Assistant

**Proyek ini adalah:** Monitoring dashboard untuk 300+ subdomain Kendal dengan Firebase sync, Slack notifications, mobile responsive design.

**Tech Stack:**
- React 19 + TypeScript + Vite 7 + Tailwind 4
- Firebase Firestore (kendal-monitor project)
- Deployed di Vercel: https://kendal-uptime.vercel.app
- 7,500+ lines of code, 22 custom components, 45+ UI components

**Struktur Data Firebase:**
- `domains` - Domain list dengan batch assignment (B1-B4)
- `domain-stats-daily` - Daily stats dengan hourly aggregates (30-day retention)
- `domain-incidents` - Down/recovery tracking
- `groups` - Domain groups
- `tags` - Domain tags
- `notifications` - Slack notification history

**Cara Query Firebase dari Terminal:**
- `node scripts/list-domains.mjs` - List semua domain
- `node scripts/check-firebase-data.mjs "domain.kendalkab.go.id"` - Detail domain
- `node scripts/check-all-collections.mjs` - List collections
- Lihat [docs/FIREBASE-QUERY-GUIDE.md](docs/FIREBASE-QUERY-GUIDE.md) untuk lengkapnya

**File-file Penting:**
- `src/App.tsx` (1,751 lines) - Main app logic
- `src/lib/version.ts` - Version number (UPDATE SETIAP DEPLOY!)
- `src/lib/firebase.ts` - Firebase config
- `src/lib/monitoring.ts` - Domain checking logic
- `src/components/` - 22 custom components
- `docs/` - 14 documentation files

**Dokumentasi Lengkap:**
- [docs/PROJECT-STATUS.md](docs/PROJECT-STATUS.md) - Current state & metrics
- [docs/CHECKPOINT.md](docs/CHECKPOINT.md) - Complete implementation history
- [docs/CHANGELOG.md](docs/CHANGELOG.md) - Version history (NOW: v3.5.10)
- [docs/GUIDES.md](docs/GUIDES.md) - User guide
- [docs/FIREBASE-QUERY-GUIDE.md](docs/FIREBASE-QUERY-GUIDE.md) - Query tools

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

**Default Password:** `admin123` (change after first login)

---

## 🎯 Key Features Implemented

### **Core Monitoring (v2.x)**
- ✅ **3-State System**: Online (Green) / DNS-Only (Amber) / Offline (Red)
- ✅ **Staggered Auto-Check**: 4 batches (B1-B4), 20-min intervals, 600 writes/day
- ✅ **Firebase Cloud Sync**: Real-time sync antar device
- ✅ **Check History**: 30-day retention, hourly aggregates
- ✅ **Dual Mode**: Auto-refresh (60s) & Manual check

### **Individual Monitoring (v3.1.x)**
- ✅ **Play/Pause per Domain**: On-demand monitoring individual domain
- ✅ **Statistics Dialog**: 3-tab (Daily/Hourly/Response Time) charts per domain
- ✅ **Uptime Tracking**: 90-day uptime bar, visual statistics
- ✅ **Pin Domains**: Quick access untuk domain penting

### **Mobile Responsive (v3.5.x)**
- ✅ **Hamburger Menu**: Sheet drawer navigation
- ✅ **Responsive Tabs**: 3-column grid mobile, 6-column desktop
- ✅ **Touch Targets**: 40px minimum (iOS standard)
- ✅ **Dropdown Actions**: Three-dot menu di mobile
- ✅ **Compact UI**: Space-optimized layouts
- ✅ **Full-width Charts**: UptimeBar dengan flex-1 distribution

### **Notifications (v2.2.x)**
- ✅ **Slack Webhook**: Real-time alerts ke Slack channel
- ✅ **Per-Domain Control**: Toggle notifikasi per domain
- ✅ **Smart Alerts**: Down, Recovery, Slow response
- ✅ **Cooldown System**: Anti-spam 5 menit
- ✅ **Notification History**: View past alerts

### **Data Management**
- ✅ **Group Management**: Create, edit, assign domains ke groups
- ✅ **Tag System**: Multiple tags per domain
- ✅ **CSV Import/Export**: Bulk operations
- ✅ **Search & Filter**: Real-time search dengan debouncing
- ✅ **Virtual Scrolling**: Handle 300+ domains smooth
- ✅ **Bulk Operations**: Multi-select delete/assign

### **Security & Auth**
- ✅ **Password Authentication**: Default `admin123`
- ✅ **Auto-Logout**: 30 min inactivity dengan 2-min warning
- ✅ **Change Password**: Dialog dengan validasi
- ✅ **Session Management**: localStorage + Firebase sync

---

## ✨ Features

### **Core Features**
- ✅ **Individual Domain Monitoring** - Per-domain continuous monitoring dengan Play/Pause (setiap 5 menit)
- ✅ **Domain Statistics Dialog** - Charts per domain: uptime %, response time, incidents
- ✅ Real-time monitoring (3-state: Online/DNS-Only/Offline)
- ✅ Firebase cloud sync antar device
- ✅ Password authentication + auto-logout (30 min)
- ✅ Group & tag management
- ✅ CSV import/export
- ✅ Virtual scrolling (300+ domains)
- ✅ Statistics & analytics
- ✅ Dual mode: Auto-refresh & Manual

### **Mobile Features (v3.5.0+)** 📱
- ✅ **Hamburger Menu** - Sheet drawer navigation dengan touch-friendly spacing
- ✅ **Responsive Tabs** - 3-column mobile grid layout (Monitoring, Pin, Statistik / Grup, Tag, Kelola)
- ✅ **Touch Targets** - 40px minimum untuk iOS/Android compliance
- ✅ **Dropdown Actions** - Three-dot menu untuk Copy, Open, Pin, Stats, Delete
- ✅ **Compact UI** - Optimized space usage, minimalist design
- ✅ **Globe & Copy Icons** - Quick access di setiap domain card
- ✅ **2-Row Layout** - Tab Kelola dengan action icons visible di mobile

---

## � Deployment Workflow (IMPORTANT!)

### 📝 Setiap Kali Ada Perubahan Code:

**1. Update Version Number**
```bash
# Edit src/lib/version.ts
# Increment version: 3.5.10 → 3.5.11 (patch)
#                    3.5.11 → 3.6.0 (minor)
#                    3.6.0 → 4.0.0 (major)

# Version ditampilkan di footer app
```

**Version Naming Convention:**
- `3.5.X` - Bug fixes, small tweaks (patch)
- `3.X.0` - New features, enhancements (minor)
- `X.0.0` - Breaking changes, major rewrites (major)

**2. Update Documentation**
```bash
# Update docs/CHANGELOG.md dengan changes
# Update docs/PROJECT-STATUS.md jika ada perubahan besar
# Update README.md jika ada workflow baru
```

**3. Commit & Push ke Git**
```bash
# Stage changes
git add .

# Commit dengan pesan jelas
git commit -m "feat(feature): Description (vX.X.X)"
# atau
git commit -m "fix(component): Bug fix description (vX.X.X)"

# Push ke remote
git push origin mobile-responsive-v1
# atau ke branch lain: git push origin main
```

**4. Deploy ke Vercel**

**Option A: Quick Deploy Script (Easiest!) 🚀**
```bash
# Gunakan deploy script (all-in-one automation)
bash scripts/deploy.sh

# Script akan:
# 1. Prompt new version (e.g., 3.5.11)
# 2. Prompt commit message
# 3. Auto-update src/lib/version.ts
# 4. Auto-commit dengan version
# 5. Auto-push ke GitHub
# 6. Vercel auto-deploy

# Example output:
# Current version: 3.5.10
# Enter new version: 3.5.11
# Enter commit message: feat: add new feature
# ✓ Version updated
# ✓ Committed
# ✓ Pushed to GitHub
# ✅ Deployment initiated!
```

**Option B: Auto-Deploy Manual (Recommended) ⭐**
```bash
# Jika sudah setup Vercel Git Integration:
# Push ke branch main → auto-deploy ke production
git push origin main

# Push ke branch lain → auto-deploy ke preview URL
git push origin feature-branch

# Vercel akan otomatis:
# 1. Detect git push
# 2. Run npm run build
# 3. Deploy ke production/preview
# 4. Comment di commit dengan deployment URL
```

**Option C: Manual Deploy via CLI**
```bash
# 1. Login dulu (one-time setup)
vercel login
# Masukkan email → check inbox → klik verification link

# 2. Build locally (optional, Vercel akan build otomatis)
npm run build

# 3a. Deploy ke PRODUCTION
vercel --prod
# Output: ✅ Production: https://kendal-uptime.vercel.app

# 3b. Deploy ke PREVIEW (untuk testing)
vercel
# Output: ✅ Preview: https://kendal-uptime-xyz123.vercel.app

# 4. Monitor deployment
# Buka: https://vercel.com/dashboard
# Lihat: Build logs, deployment status, analytics
```

**Option D: Deploy via Vercel Dashboard (UI)**
```bash
# 1. Buka https://vercel.com/dashboard
# 2. Pilih project "kendal-uptime"
# 3. Tab "Deployments" → klik "Redeploy"
# 4. Atau tab "Git" → "Deploy latest commit"
```

**First Time Setup (if not configured yet):**
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Link project (di root folder)
vercel link
# Pilih:
# - Account: your-account
# - Project: kendal-uptime
# - Link to existing project: Yes

# Deploy
vercel --prod
```

**5. Verify Deployment**
```bash
# Buka browser, cek:
# https://kendal-uptime.vercel.app

# Pastikan:
# ✅ Version number di footer sudah update
# ✅ Changes terlihat di production
# ✅ No errors di console
```

### 🚨 Checklist Before Deploy:

- [ ] Version number updated di `src/lib/version.ts`
- [ ] CHANGELOG.md updated dengan changes
- [ ] Code tested locally (`npm run dev`)
- [ ] Build success (`npm run build`)
- [ ] No TypeScript errors (`npm run build`)
- [ ] Git committed dengan message yang jelas
- [ ] Pushed to remote repository
- [ ] Deployed to Vercel (auto atau manual)
- [ ] Verified di production URL

### 📍 Version Locations:

**Where version is stored:**
1. `src/lib/version.ts` - Source of truth
   ```typescript
   export const APP_VERSION = '3.5.10'
   ```

2. Footer di App.tsx - Auto-displays version
   ```tsx
   <ChangelogDialog triggerText={`v${APP_VERSION}`} showIcon={false} />
   ```

3. README.md - Manual update (line 7)
   ```markdown
   🔧 **Current Version:** 3.5.10
   ```

**ALWAYS update `src/lib/version.ts` first!** Footer akan otomatis update.

---

## 🛠️ Development Workflow

### Making Changes:

```bash
# 1. Create/switch branch (optional)
git checkout -b feature/new-feature

# 2. Make changes
# Edit files...

# 3. Test locally
npm run dev

# 4. Check for errors
npm run build

# 5. Update version di src/lib/version.ts
# 6. Update docs/CHANGELOG.md
# 7. Commit & push (see Deployment Workflow above)
```

### Common Commands:

```bash
# Development
npm run dev              # Start dev server (localhost:5173)
npm run build            # Build for production
npm run preview          # Preview production build

# Firebase Query (from terminal)
node scripts/list-domains.mjs                           # List all domains
node scripts/check-firebase-data.mjs "domain.go.id"     # Check specific domain
node scripts/check-all-collections.mjs                  # List collections
node scripts/find-domain-simple.mjs "keyword"           # Search domains

# Git
git status               # Check status
git add .                # Stage all changes
git commit -m "message"  # Commit with message
git push origin main     # Push to main branch
git log --oneline -10    # View recent commits

# Vercel
vercel                   # Deploy preview
vercel --prod            # Deploy production
vercel login             # Login to Vercel account
vercel env ls            # List environment variables
```

---

## 📚 Documentation

### **Start Here:**
1. **[PROJECT-STATUS.md](./docs/PROJECT-STATUS.md)** - Current state & metrics
2. **[CHECKPOINT.md](./docs/CHECKPOINT.md)** - Complete implementation history  
3. **[CHANGELOG.md](./docs/CHANGELOG.md)** - Version history (NOW: v3.5.10)
4. **[GUIDES.md](./docs/GUIDES.md)** - User guide & troubleshooting

### **Development Reference:**
- [DEVELOPMENT-PLAN.md](./docs/DEVELOPMENT-PLAN.md) - Features & roadmap
- [DEVELOPMENT-WORKFLOW.md](./docs/DEVELOPMENT-WORKFLOW.md) - Git workflow & best practices
- [FILE-REFERENCE.md](./docs/FILE-REFERENCE.md) - Code structure
- [FIREBASE-QUERY-GUIDE.md](./docs/FIREBASE-QUERY-GUIDE.md) - Terminal query tools
- [OPTIMIZATION-SUMMARY.md](./docs/OPTIMIZATION-SUMMARY.md) - Performance optimizations
- [STAGGERED-CHECK-GUIDE.md](./docs/STAGGERED-CHECK-GUIDE.md) - Batch checking system

### **Feature Docs:**
- [FEATURE-PLAN-INDIVIDUAL-MONITORING.md](./docs/FEATURE-PLAN-INDIVIDUAL-MONITORING.md) - Per-domain monitoring
- [QUICK-REFERENCE.md](./docs/QUICK-REFERENCE.md) - Quick command reference

### **Legal:**
- [SECURITY.md](./docs/SECURITY.md) - Security policy
- [SETUP-GITHUB.md](./docs/SETUP-GITHUB.md) - GitHub & Vercel setup

---

## 🛠️ Tech Stack

- React 19 + TypeScript 5.7
- Vite 7.2 + Tailwind CSS 4.1
- Firebase Firestore
- shadcn/ui v4 + Phosphor Icons
- Vercel (deployment)
- **Responsive Design:** Mobile-first breakpoints (sm:640px, md:768px, lg:1024px)

---

## 📊 Current Status

**Version:** 3.5.10 (Update di `src/lib/version.ts` setiap deploy!)  
**Status:** ✅ Production Ready + Mobile Optimized  
**Deployed:** https://kendal-uptime.vercel.app  
**Documentation:** 98% accurate  
**Components:** 22 custom + 45+ UI  
**Lines of Code:** ~7,500+  
**Mobile Support:** ✅ Fully responsive (iPhone, Android, Tablet)  
**Firebase:** kendal-monitor project (300+ domains, 30-day retention)

---

## 🔧 Project Structure

```bash
/workspaces/spark-template/
├── src/
│   ├── App.tsx (1,751 lines)           # Main app component
│   ├── components/                      # 22 custom components
│   │   ├── AddDomainForm.tsx
│   │   ├── DomainCard.tsx
│   │   ├── DomainStatisticsDialog.tsx  # 3-tab charts
│   │   ├── EditDomainDialog.tsx
│   │   ├── GroupCard.tsx
│   │   ├── MobileNav.tsx               # Hamburger menu
│   │   ├── NotificationSettingsDialog.tsx
│   │   ├── PinnedDomainCard.tsx
│   │   ├── StatisticsView.tsx
│   │   ├── UptimeBar.tsx               # Full-width uptime bars
│   │   ├── VirtualizedDomainList.tsx
│   │   └── ui/                         # 45+ shadcn components
│   ├── hooks/
│   │   ├── use-debounce.ts
│   │   ├── use-filtered-domains.ts
│   │   └── use-mobile.ts
│   ├── lib/
│   │   ├── firebase.ts                 # Firebase config
│   │   ├── firestore-sync.ts           # Cloud sync
│   │   ├── monitoring.ts               # Domain checking
│   │   ├── check-history.ts            # History storage
│   │   ├── notifications.ts            # Slack integration
│   │   ├── types.ts                    # TypeScript types
│   │   └── version.ts                  # ⚠️ VERSION NUMBER HERE!
│   └── styles/
│       └── theme.css
├── docs/                                # 14 documentation files
│   ├── CHANGELOG.md                    # ⚠️ Update setiap deploy!
│   ├── CHECKPOINT.md
│   ├── FIREBASE-QUERY-GUIDE.md
│   ├── PROJECT-STATUS.md
│   └── ...
├── scripts/                            # Scripts & tools
│   ├── deploy.sh                   # Quick deploy script (all-in-one)
│   ├── list-domains.mjs            # List all domains from Firebase
│   ├── check-firebase-data.mjs     # Check specific domain details
│   ├── check-all-collections.mjs   # List Firebase collections
│   ├── check-timezone.mjs          # Check timezone handling
│   ├── find-domain-simple.mjs      # Simple domain search
│   └── find-domain-nested.mjs      # Advanced domain search
├── package.json                        # Dependencies
├── vite.config.ts                      # Vite config
├── tailwind.config.js                  # Tailwind config
└── vercel.json                         # Vercel deploy config
```

**Key Files to Update Setiap Deploy:**
1. `src/lib/version.ts` - Increment version number
2. `docs/CHANGELOG.md` - Add change description
3. `README.md` line 7 - Update version manually

---

---

## 🚀 Vercel Deployment - Complete Guide

> **Current Status:** ✅ Vercel sudah di-setup dengan Git integration  
> **Production URL:** https://kendal-uptime.vercel.app  
> **Auto-Deploy:** Push ke `main` branch → auto-deploy ke production

### 📦 Deployment Options

**🌟 Option 1: Auto-Deploy (Recommended - Already Setup!)**
```bash
# Cukup push ke branch main
git add .
git commit -m "feat: new feature (v3.5.11)"
git push origin main

# Vercel otomatis:
# ✅ Detect push
# ✅ Run npm install
# ✅ Run npm run build
# ✅ Deploy ke production
# ✅ Update https://kendal-uptime.vercel.app
# ✅ Comment di commit dengan deployment URL

# Preview deployment (branch lain)
git push origin feature-branch
# → Deploy ke preview URL: kendal-uptime-xyz.vercel.app
```

**🔧 Option 2: Manual Deploy via CLI**
```bash
# Install Vercel CLI (one-time)
npm install -g vercel

# Login to Vercel (one-time)
vercel login
# 1. Masukkan email
# 2. Check inbox
# 3. Klik verification link
# 4. Success!

# Deploy ke PRODUCTION
vercel --prod
# Output: ✅ Production: https://kendal-uptime.vercel.app (xyz.ms)

# Deploy ke PREVIEW (testing)
vercel
# Output: ✅ Preview: https://kendal-uptime-abc123.vercel.app

# Link project (jika belum)
vercel link
# Pilih: your-account → kendal-uptime → Yes
```

**🖥️ Option 3: Deploy via Vercel Dashboard**
```bash
# 1. Buka: https://vercel.com/dashboard
# 2. Pilih project: "kendal-uptime"
# 3. Tab "Deployments"
# 4. Klik "Redeploy" pada deployment terakhir
# 5. Atau: "Deploy" → select branch → "Deploy"
```

### 🔍 Monitoring Deployment

**Via CLI:**
```bash
# Check deployment status
vercel ls

# View deployment details
vercel inspect [deployment-url]

# View logs
vercel logs [deployment-url]
```

**Via Dashboard:**
```bash
# 1. Buka: https://vercel.com/dashboard
# 2. Pilih "kendal-uptime"
# 3. Tab "Deployments" - lihat history
# 4. Klik deployment → view:
#    - Build logs
#    - Runtime logs
#    - Source code
#    - Preview URL
```

### ⚙️ Vercel Configuration

**File: `vercel.json`**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

**Git Integration Settings:**
- **Production Branch:** `main` → https://kendal-uptime.vercel.app
- **Preview Branches:** All other branches → preview URLs
- **Auto-Deploy:** ✅ Enabled
- **Build & Development Settings:**
  - Framework Preset: Vite
  - Build Command: `npm run build`
  - Output Directory: `dist`
  - Install Command: `npm install`

### 🔐 Environment Variables (if needed)

```bash
# Add environment variable
vercel env add VITE_FIREBASE_API_KEY
# Select: Production, Preview, Development

# List environment variables
vercel env ls

# Pull to local .env file
vercel env pull

# Remove environment variable
vercel env rm VITE_FIREBASE_API_KEY
```

### 🚨 Troubleshooting Deployment

**Build Failed?**
```bash
# 1. Check build locally first
npm run build

# 2. Check Vercel build logs
# Dashboard → Deployments → Failed deployment → Build logs

# 3. Common issues:
# - TypeScript errors → fix di code
# - Missing dependencies → check package.json
# - Environment variables → add di Vercel dashboard
```

**Deployment Success tapi App Error?**
```bash
# 1. Check runtime logs
vercel logs [deployment-url]

# 2. Check browser console
# Open https://kendal-uptime.vercel.app
# F12 → Console tab

# 3. Common issues:
# - Firebase config error → check src/lib/firebase.ts
# - Missing environment variables
# - CORS issues → check API endpoints
```

**Old Version Still Showing?**
```bash
# 1. Clear browser cache
# Chrome: Ctrl+Shift+R (hard reload)

# 2. Check version di Vercel dashboard
# Verify src/lib/version.ts was updated

# 3. Force redeploy
vercel --prod --force
```

### 📊 Deployment Analytics

**Via Vercel Dashboard:**
- **Analytics Tab:** Page views, visitors, performance
- **Speed Insights:** Core Web Vitals, LCP, FID, CLS
- **Deployment History:** All deployments with status
- **Build Time:** Track build performance

### ✅ Post-Deployment Checklist

```bash
# Setelah deploy, verify:
- [ ] Open https://kendal-uptime.vercel.app
- [ ] Check version number di footer (harus update)
- [ ] Login dengan password default (admin123)
- [ ] Test add domain
- [ ] Test check domain
- [ ] Check Firebase sync (data masuk?)
- [ ] Test notifications (jika enabled)
- [ ] Check mobile responsive
- [ ] Open browser console → no errors
- [ ] Test di Chrome, Firefox, Safari
```

---

## 🚀 Vercel Deployment (Quick Reference)

**Sudah Setup! Tinggal Pakai:**

```bash
# Auto-Deploy (Recommended)
git push origin main           # → Auto-deploy production

# Manual Deploy
vercel --prod                  # → Deploy production
vercel                         # → Deploy preview

# Management
vercel login                   # Login account
vercel ls                      # List deployments
vercel logs [url]              # View logs
vercel env ls                  # List env vars
```

**URLs:**
- Production: https://kendal-uptime.vercel.app
- Dashboard: https://vercel.com/dashboard

**Lihat detail lengkap di section "Vercel Deployment - Complete Guide" di atas.**

---

## 📝 Contributing Guidelines

1. **Read docs first:** [DEVELOPMENT-PLAN.md](./docs/DEVELOPMENT-PLAN.md)
2. **Make changes:** Edit code, test locally
3. **Update version:** Edit `src/lib/version.ts`
4. **Update docs:** [CHANGELOG.md](./docs/CHANGELOG.md) & [PROJECT-STATUS.md](./docs/PROJECT-STATUS.md)
5. **Commit & push:** Follow deployment workflow above
6. **Verify:** Check production URL after deploy

---

## � Troubleshooting

### Version Not Updating in Footer?
```bash
# 1. Check src/lib/version.ts
cat src/lib/version.ts

# 2. Clear browser cache + hard reload
# Chrome/Edge: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

# 3. Verify build output
npm run build

# 4. Check deployed version di Vercel dashboard
```

### Firebase Connection Issues?
```bash
# Test Firebase connection
node scripts/check-all-collections.mjs

# Should show collections with document counts
# If error: Check Firebase config di src/lib/firebase.ts
```

### Build Errors?
```bash
# Clear node_modules and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Git Push Rejected?
```bash
# Pull latest changes first
git pull origin main

# Resolve conflicts if any
# Then push again
git push origin main
```

### Vercel Deploy Failed?
```bash
# Check build locally first
npm run build

# If success locally but fails on Vercel:
# 1. Check Vercel build logs
# 2. Verify vercel.json config
# 3. Check environment variables
```

---

## 📞 Support & Resources

### Documentation
- **Main Docs:** [docs/](./docs/) folder
- **User Guide:** [docs/GUIDES.md](./docs/GUIDES.md)
- **Technical:** [docs/FILE-REFERENCE.md](./docs/FILE-REFERENCE.md)
- **Firebase Queries:** [docs/FIREBASE-QUERY-GUIDE.md](./docs/FIREBASE-QUERY-GUIDE.md)

### External Links
- **Live App:** https://kendal-uptime.vercel.app
- **Firebase Console:** https://console.firebase.google.com/project/kendal-monitor
- **Vercel Dashboard:** https://vercel.com/dashboard
- **GitHub Repo:** (your repo URL)

### Quick Tips
- Default password: `admin123`
- Update version setiap deploy: `src/lib/version.ts`
- Firebase query tools: `node scripts/list-domains.mjs`
- Quick deploy: `bash scripts/deploy.sh` (all-in-one)
- Auto-deploy: Push to `main` branch
- Manual deploy: `vercel --prod`

---

**Last Updated:** 9 Januari 2026  
**Current Version:** 3.5.10  
**Documentation Accuracy:** 98% ✅  
**Production Status:** Live & Stable 🚀

---

## 📋 Quick Command Cheatsheet

```bash
# Development
npm install                    # Install dependencies
npm run dev                    # Start dev server
npm run build                  # Build for production
npm run preview                # Preview build

# Quick Deploy (All-in-One)
bash scripts/deploy.sh         # Auto: version update → commit → push

# Firebase Query
node scripts/list-domains.mjs                           # List all domains
node scripts/check-firebase-data.mjs "domain.go.id"     # Domain details
node scripts/check-all-collections.mjs                  # List collections

# Git
git status                     # Check status
git add .                      # Stage changes
git commit -m "msg (vX.X.X)"  # Commit with version
git push origin main           # Push to main
git log --oneline -10          # Recent commits

# Vercel
vercel login                   # Login
vercel                         # Deploy preview
vercel --prod                  # Deploy production
vercel env ls                  # List env vars

# Version Update
# 1. Edit src/lib/version.ts → increment number
# 2. Update docs/CHANGELOG.md → add changes
# 3. Update README.md line 7 → new version
# 4. Commit + Push + Deploy
```

**Remember:** Always update version number before deploying! 🎯
