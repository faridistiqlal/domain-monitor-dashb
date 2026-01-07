# 📂 PROJECT FILE REFERENCE

Complete reference of all important files in the Domain Monitor Dashboard project.

---

## 📄 Root Documentation Files

| File | Purpose | Lines | Status |
|------|---------|-------|--------|
| **PRD.md** | Product Requirements Document - design decisions, feature specs | 179 | ✅ |
| **CHECKPOINT.md** | Complete state documentation - features, implementation, history | 380+ | ✅ |
| **MONITORING-GUIDE.md** | User guide with troubleshooting and best practices | 257 | ✅ |
| **BACKUP-SUMMARY.md** | Backup overview and restore instructions | 250+ | ✅ |
| **FILE-REFERENCE.md** | This file - complete file listing | - | ✅ |
| **README.md** | Project overview and setup instructions | - | ✅ |

---

## 🎨 Configuration Files

| File | Purpose | Status |
|------|---------|--------|
| **index.html** | HTML entry point with Google Fonts | ✅ |
| **package.json** | Dependencies (80+ packages) and scripts | ✅ |
| **package-lock.json** | Locked dependency versions | ✅ |
| **vite.config.ts** | Vite build configuration | ✅ |
| **tailwind.config.js** | Tailwind CSS configuration | ✅ |
| **tsconfig.json** | TypeScript compiler configuration | ✅ |
| **components.json** | shadcn/ui component configuration | ✅ |
| **theme.json** | Theme metadata | ✅ |

---

## 💻 Source Code - Core Files

### Main Application
| File | Purpose | Lines | Key Features |
|------|---------|-------|--------------|
| **src/App.tsx** | Main app component | 1,751 | Tabs, monitoring logic, state management, auth |
| **src/main.tsx** | React entry point | ~20 | App mounting, error boundary |
| **src/ErrorFallback.tsx** | Error boundary component | ~50 | Graceful error handling |

### Styling
| File | Purpose | Lines | Key Features |
|------|---------|-------|--------------|
| **src/index.css** | Main CSS with theme variables | 91 | OKLCH colors, theme mapping |
| **src/main.css** | Structural CSS (do not edit) | 1 | Imports index.css |
| **src/styles/theme.css** | Additional theme styles | - | Extended theming |

---

## 🧩 Components (src/components/)

### Custom Components (21 total)
| File | Purpose | Lines | Key Features |
|------|---------|-------|--------------|
| **AddDomainForm.tsx** | Form to add new domains | ~80 | Validation, duplicate check |
| **AssignDomainsDialog.tsx** | Dialog to assign domains to groups | ~150 | Multi-select, group filter |
| **AssignTagsDialog.tsx** | Dialog to assign tags to domains | ~150 | Multi-select, tag filter |
| **ChangelogDialog.tsx** | Display app changelog | ~80 | Version history, updates |
| **DomainCard.tsx** | Individual domain display card | ~120 | Status, IP, copy, delete |
| **EditDomainDialog.tsx** | Dialog to edit domain URL | ~100 | URL validation, update |
| **EmptyState.tsx** | Empty state when no domains | ~50 | Onboarding message |
| **ExportSuccessDialog.tsx** | Export confirmation dialog | ~60 | Success feedback |
| **GroupCard.tsx** | Group display card | ~100 | Stats, edit, delete, export |
| **GroupFormDialog.tsx** | Create/edit group form | ~120 | Color picker, validation |
| **ImportDialog.tsx** | CSV import dialog | ~200 | File upload, parsing, preview |
| **InfoDialog.tsx** | Help & information dialog | ~150 | Collapsible guide sections |
| **LoginDialog.tsx** | Password authentication dialog | ~90 | Password input, show/hide toggle |
| **PrivacyPolicyDialog.tsx** | Privacy policy display | ~100 | Legal content, scrollable |
| **SettingsDialog.tsx** | Change password dialog | ~170 | Current/new/confirm password |
| **StatisticsView.tsx** | Statistics & analytics view | ~200 | Charts, metrics, insights |
| **StatusIndicator.tsx** | Status dot indicator | ~80 | Three-state colors, tooltip |
| **TagCard.tsx** | Tag display card | ~90 | Color coding, edit, delete |
| **TagFormDialog.tsx** | Create/edit tag form | ~120 | Name, color picker |
| **TermsOfServiceDialog.tsx** | Terms of service display | ~100 | Legal content, scrollable |
| **VirtualizedDomainList.tsx** | Optimized domain list | ~150 | Virtual scrolling, performance |

### UI Components (src/components/ui/)
45+ shadcn/ui v4 components including:
- **button.tsx** - Button component
- **dialog.tsx** - Dialog/modal component
- **input.tsx** - Input field component
- **card.tsx** - Card container component
- **badge.tsx** - Badge/label component
- **tabs.tsx** - Tab navigation component
- **select.tsx** - Dropdown select component
- **checkbox.tsx** - Checkbox input component
- **scroll-area.tsx** - Scrollable area component
- **separator.tsx** - Visual divider component
- **progress.tsx** - Progress bar component
- **tooltip.tsx** - Tooltip component
- *...and 30+ more*

---

## 🪝 Custom Hooks (src/hooks/)

| File | Purpose | Lines | Key Features |
|------|---------|-------|--------------|
| **use-debounce.ts** | Debounce hook for search input | ~15 | 300ms delay, prevents excessive renders |
| **use-filtered-domains.ts** | Domain filtering and sorting logic | ~80 | Memoized, supports all filter/sort types |
| **use-mobile.ts** | Mobile breakpoint detection | ~20 | Responsive design helper |

---

## 📚 Library Files (src/lib/)

| File | Purpose | Lines | Key Features |
|------|---------|-------|--------------|
| **csv-export.ts** | Export domains to CSV | ~120 | Duplicate detection, custom filename |
| **csv-import.ts** | Parse and import CSV files | ~100 | Validation, error handling |
| **monitoring.ts** | Domain status checking logic | ~200 | DNS check, HTTP/HTTPS, error detection |
| **types.ts** | TypeScript type definitions | ~50 | Domain, DomainStatus, DomainGroup types |
| **utils.ts** | Utility functions | ~10 | cn() helper for className merging |

---

## 🎨 Design Assets

### Fonts (Google Fonts CDN)
- **Space Grotesk** - Primary UI font (400, 500, 600, 700)
- **JetBrains Mono** - Monospace font for domains/timestamps (400, 500, 600)

### Icons
- **Phosphor Icons** (@phosphor-icons/react) - Full icon set
- Used icons: Globe, Plus, Trash, ArrowClockwise, MagnifyingGlass, etc.

### Color System (OKLCH)
All colors defined in `src/index.css`:
- Background: `oklch(0.15 0.01 250)` - Dark slate
- Primary: `oklch(0.55 0.15 250)` - Deep blue
- Success: `oklch(0.70 0.22 145)` - Green
- Warning: Amber (for DNS Only)
- Destructive: Red (for Offline)
- Accent: `oklch(0.70 0.18 200)` - Cyan

---

## 📦 Dependencies (Key Packages)

### Framework & Core
- react: ^19.2.0
- react-dom: ^19.2.0
- typescript: ^5.7.3
- vite: ^7.2.6

### UI & Styling
- tailwindcss: ^4.1.17
- @tailwindcss/vite: ^4.1.17
- tw-animate-css: ^1.4.0
- framer-motion: ^12.23.25

### Components
- @radix-ui/* - 25+ Radix UI primitives
- lucide-react: ^0.484.0
- @phosphor-icons/react: ^2.1.10
- sonner: ^2.0.7 (toast notifications)

### Utilities
- clsx: ^2.1.1
- tailwind-merge: ^3.4.0
- date-fns: ^3.6.0
- zod: ^3.25.76
- react-hook-form: ^7.67.0

### Spark SDK
- @github/spark - KV store, LLM API, user API

---

## 🔧 Development Files

| File/Folder | Purpose | Notes |
|-------------|---------|-------|
| **.git/** | Git repository | Version control history |
| **.gitignore** | Git ignore rules | node_modules, dist, etc. |
| **node_modules/** | Installed packages | ~80 packages, 500+ MB |
| **.devcontainer/** | VS Code dev container config | GitHub Spark environment |
| **packages/** | Spark tools package | Internal SDK tools |

---

## 📊 File Statistics

### By Type
- **TypeScript/TSX**: ~20 files, ~4,000 lines
- **CSS**: 3 files, ~100 lines
- **Documentation**: 5 files, ~1,500 lines
- **Configuration**: 7 files, ~300 lines
- **Total Project**: ~30 key files, ~5,900+ lines

### By Category
- **Application Logic**: 40%
- **UI Components**: 30%
- **Documentation**: 20%
- **Configuration**: 10%

---

## 🗂️ Directory Structure

```
/workspaces/spark-template/
├── 📄 Documentation (root)
│   ├── PRD.md
│   ├── CHECKPOINT.md
│   ├── MONITORING-GUIDE.md
│   ├── BACKUP-SUMMARY.md
│   └── FILE-REFERENCE.md
│
├── ⚙️ Configuration (root)
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── index.html
│
└── 📁 src/
    ├── App.tsx
    ├── main.tsx
    ├── index.css
    │
    ├── 📁 components/
    │   ├── Custom components (11 files)
    │   └── 📁 ui/ (45+ shadcn components)
    │
    ├── 📁 hooks/
    │   ├── use-debounce.ts
    │   ├── use-filtered-domains.ts
    │   └── use-mobile.ts
    │
    ├── 📁 lib/
    │   ├── csv-export.ts
    │   ├── csv-import.ts
    │   ├── monitoring.ts
    │   ├── types.ts
    │   └── utils.ts
    │
    └── 📁 styles/
        └── theme.css
```

---

## 🎯 Critical Files (Must Backup)

### Tier 1 - Essential (Cannot function without)
- [x] **src/App.tsx** - Main application logic
- [x] **src/lib/monitoring.ts** - Core monitoring functionality
- [x] **src/lib/types.ts** - Type definitions
- [x] **src/index.css** - Complete theme
- [x] **package.json** - All dependencies

### Tier 2 - Important (Major features)
- [x] All custom components (11 files)
- [x] All lib files (CSV, monitoring, types)
- [x] All custom hooks
- [x] Configuration files

### Tier 3 - Valuable (Documentation)
- [x] PRD.md
- [x] CHECKPOINT.md
- [x] MONITORING-GUIDE.md
- [x] BACKUP-SUMMARY.md

### Tier 4 - Restorable (Can be regenerated)
- [ ] node_modules/ (run npm install)
- [ ] UI components (shadcn regenerate)
- [ ] Build output

---

## 🔍 Quick File Lookup

### Need to modify monitoring logic?
→ **src/lib/monitoring.ts**

### Need to change theme colors?
→ **src/index.css** (lines 25-60)

### Need to add a new feature?
→ **src/App.tsx** + create component in **src/components/**

### Need to fix CSV export?
→ **src/lib/csv-export.ts**

### Need to add a shadcn component?
→ **src/components/ui/** (copy from shadcn docs)

### Need to understand design decisions?
→ **PRD.md**

### Need to understand current state?
→ **CHECKPOINT.md**

### Need user documentation?
→ **MONITORING-GUIDE.md**

### Need to restore from backup?
→ **BACKUP-SUMMARY.md**

---

## ✅ Backup Verification

Files backed up: **ALL ✅**

### Documentation: 5/5 ✅
- [x] PRD.md
- [x] CHECKPOINT.md
- [x] MONITORING-GUIDE.md
- [x] BACKUP-SUMMARY.md
- [x] FILE-REFERENCE.md

### Source Code: 100% ✅
- [x] Main app files
- [x] All components
- [x] All hooks
- [x] All lib files
- [x] All configuration

### Configuration: 100% ✅
- [x] package.json
- [x] All config files
- [x] Theme files

**Backup Status**: ✅ **COMPLETE**

---

*File Reference created as part of Iteration 58 backup*  
*All files documented, organized, and ready for restore*
