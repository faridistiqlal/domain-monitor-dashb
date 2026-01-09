# 📊 Domain Monitor Dashboard - Kabupaten Kendal

Real-time monitoring dashboard untuk track availability status dari multiple subdomain kendalkab.go.id. **Fully mobile responsive!**

🌐 **Live App:** https://kendal-uptime.vercel.app  
📱 **Mobile Ready:** Optimized untuk smartphone & tablet  
📚 **Dokumentasi:** [docs/](./docs/)  
🔥 **Firebase:** kendal-monitor project

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

## 📚 Documentation

### **Start Here:**
1. **[PROJECT-STATUS.md](./docs/PROJECT-STATUS.md)** - Current state & metrics
2. **[DEVELOPMENT-PLAN.md](./docs/DEVELOPMENT-PLAN.md)** - Features & roadmap
3. **[GUIDES.md](./docs/GUIDES.md)** - User guide & troubleshooting
4. **[CHANGELOG.md](./docs/CHANGELOG.md)** - Version history (see v3.5.0 for mobile features)

### **Reference:**
- [FILE-REFERENCE.md](./docs/FILE-REFERENCE.md) - Code structure
- [OPTIMIZATION-SUMMARY.md](./docs/OPTIMIZATION-SUMMARY.md) - Performance optimizations

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

**Version:** 3.5.1  
**Status:** ✅ Production Ready + Mobile Optimized  
**Accuracy:** 98% documented  
**Components:** 22 custom + 45+ UI  
**Lines of Code:** ~7,500+  
**Mobile Support:** ✅ Fully responsive (iPhone, Android, Tablet)

---

## 🔧 Development

```bash
# Code structure
src/
├── App.tsx (1,751 lines)
├── components/ (21 custom)
├── hooks/ (3 custom hooks)
├── lib/ (utilities & Firebase)
└── styles/ (theme & CSS)

# Key files
- src/lib/firebase.ts - Firebase config
- src/lib/firestore-sync.ts - Cloud sync
- src/lib/monitoring.ts - Domain checking
- src/lib/types.ts - TypeScript types
```

---

## � Vercel Deployment

### First Time Setup

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to your Vercel account
vercel login

# Follow the prompts:
# 1. Enter your email
# 2. Check your email for verification link
# 3. Click the link to complete authentication
```

### Deploy to Production

```bash
# Build the application first
npm run build

# Deploy to production
vercel deploy --prod

# The CLI will:
# 1. Upload your build files
# 2. Build on Vercel servers
# 3. Deploy to production URL
# 4. Show you the live URL
```

### Deploy to Preview (Development)

```bash
# Deploy without --prod flag for preview URL
vercel deploy

# This creates a preview deployment
# Useful for testing before production
```

### Project Configuration

The `vercel.json` file contains deployment settings:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

### Environment Variables

If you need to set Firebase or other secrets:

```bash
# Set environment variable
vercel env add VITE_FIREBASE_API_KEY

# Pull environment variables locally
vercel env pull
```

### Continuous Deployment

- Push to `main` branch → Auto-deploys to production
- Push to other branches → Auto-creates preview deployments
- Configure in Vercel dashboard: Settings → Git

---

## �📝 Contributing

1. Read [DEVELOPMENT-PLAN.md](./docs/DEVELOPMENT-PLAN.md) for specs
2. Make changes
3. Test thoroughly
4. Update [CHANGELOG.md](./docs/CHANGELOG.md)
5. Update [PROJECT-STATUS.md](./docs/PROJECT-STATUS.md)
6. Push to main (auto-deploys to Vercel)

---

## 📞 Support

- **User Guide:** [GUIDES.md](./docs/GUIDES.md)
- **Technical:** [FILE-REFERENCE.md](./docs/FILE-REFERENCE.md)
- **Status:** [PROJECT-STATUS.md](./docs/PROJECT-STATUS.md)

---

**Last Updated:** 8 Januari 2026  
**Documentation:** 98% Accurate ✅
