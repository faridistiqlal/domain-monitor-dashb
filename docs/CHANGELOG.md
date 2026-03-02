# Changelog

## Version 3.11.22 - Export PDF di Analytics (DomainCharts)
**Tanggal Rilis:** 2 Maret 2026

### 🆕 PDF Export di Halaman Analytics
- Menambahkan tombol **PDF** di header halaman Statistik → Analytics → domain detail.
- Dropdown periode: 1 hari, 15 hari, 30 hari.
- Reuse report generator yang sama dari semua entry point.
- Tombol disabled saat loading/data kosong, spinner saat proses export.

## Version 3.11.21 - Export PDF dari Dialog Statistik
**Tanggal Rilis:** 2 Maret 2026

### 🆕 PDF Export Button di Statistics Dialog
- Menambahkan tombol **Export PDF** (dropdown) di header dialog Statistik domain.
- Pilihan periode export: 1 hari, 15 hari, 30 hari — memanggil report generator yang sudah ada.
- Tombol otomatis disabled saat data belum dimuat atau kosong.
- Spinner ditampilkan selama proses export berlangsung.

## Version 3.11.20 - Fix Title & Chart Spacing Overlap
**Tanggal Rilis:** 2 Maret 2026

### 🔧 Layout Spacing Fix
- Memindahkan label nilai maks/min chart ke dalam area chart (tidak lagi di luar yang menabrak elemen lain).
- Memperbesar jarak vertikal antar chart uptime–response dari 29mm → 33mm.
- Memperbesar gap chart → legend → Executive Interpretation → recommendation.
- Mengurangi tinggi chart 21mm → 19mm agar ruang halaman lebih lega.
- Memperkecil font label chart dari 8pt → 7pt untuk meminimalkan tabrakan teks.

## Version 3.11.19 - Compact Page-1 PDF Layout
**Tanggal Rilis:** 2 Maret 2026

### ✍️ Compact Information Layout
- Merapikan kepadatan teks pada halaman 1 laporan PDF agar lebih ringkas dan mudah dipindai.
- Menyederhanakan copy/hint pada kartu KPI serta legend grafik.
- Mengurangi tinggi beberapa blok (KPI cards, SLA indicator, legend, recommendation text) agar ruang halaman lebih efisien.

### 🧱 Spacing & Overflow Guard
- Menambah penyelarasan jarak antar section untuk mencegah area judul dan chart saling mepet.
- Menambahkan guard tinggi panel rekomendasi agar tidak menabrak footer pada data/teks panjang.

### ✅ Validation
- TypeScript diagnostics file yang diubah: **no errors**.
- Local build pass (`npm run build`).

**Status:** ✅ Ready for deploy

## Version 3.11.18 - PDF Spacing Polish & Uptime Bar Chart
**Tanggal Rilis:** 2 Maret 2026

### 🎯 Visual Alignment Refinement
- Menambahkan ruang vertikal pada section yang sebelumnya terlalu rapat: Ringkasan Laporan, Executive KPI Dashboard, Performance Trend, Response Time Trend, Executive Interpretation, dan Catatan Eksekutif.
- Menyelaraskan jarak title-chart agar judul tidak bertabrakan dengan elemen grafik.
- Menjaga panel rekomendasi tetap responsif terhadap teks multi-baris.

### 📊 Chart Improvement
- Mengubah visual **Uptime Trend Harian** dari line/area menjadi **bar chart** agar pola availability harian lebih mudah dibaca cepat.

### ✅ Validation
- TypeScript diagnostics file yang diubah: **no errors**.
- Local build pass (`npm run build`).

**Status:** ✅ Ready for deploy

## Version 3.11.17 - PDF Report Layout Alignment Fix
**Tanggal Rilis:** 2 Maret 2026

### 🧩 Layout Stabilization
- Menyelesaikan issue overlap elemen pada halaman 1 laporan PDF premium (khususnya area trend, executive interpretation, dan recommendation panel).
- Menyesuaikan tinggi grafik + spacing section agar alur vertikal halaman tetap rapi pada variasi data.
- Mengubah panel rekomendasi ke wrapping dinamis multi-line untuk mencegah teks terpotong atau menabrak footer.

### ✅ Validation
- TypeScript diagnostics file yang diubah: **no errors**.
- Local build pass (`npm run build`).

**Status:** ✅ Ready for deploy

## Version 3.11.16 - Premium PDF Report Polish
**Tanggal Rilis:** 2 Maret 2026

### 🎨 Report Design Improvement
- Menyempurnakan tampilan laporan PDF monitoring agar lebih formal dan rapi untuk kebutuhan pelaporan manajemen.
- Menambahkan branding header laporan (identitas instansi + klasifikasi report) dengan struktur section yang lebih konsisten.
- Menambahkan legend grafik dan section divider agar alur baca laporan lebih jelas.

### 📊 Detail Informasi Tambahan
- Menambah metrik detail pada executive summary:
  - `P95 response time`,
  - `longest incident`,
  - hari yang memenuhi SLA,
  - hari dengan uptime terburuk.
- Menambahkan panel rekomendasi otomatis berbasis data (SLA, downtime, incident, latency) untuk tindak lanjut operasional.
- Menata ulang tabel performa harian dan timeline incident agar lebih mudah dipindai.

### ✅ Validation
- TypeScript diagnostics file yang diubah: **no errors**.
- Local build pass (`npm run build`).

**Status:** ✅ Ready for deploy

## Version 3.11.15 - Monitoring PDF Report Export (Pin Menu)
**Tanggal Rilis:** 2 Maret 2026

### ✨ Fitur Baru
- Menambahkan menu **Export laporan PDF** di aksi titik-tiga pada `PinnedDomainCard`.
- Menyediakan pilihan periode laporan: **1 hari**, **15 hari**, **30 hari**.
- Menambahkan generator laporan di `src/lib/monitoring-report-pdf.ts` dengan isi:
  - summary KPI uptime/check/response/incident,
  - grafik uptime harian,
  - grafik response time harian,
  - ringkasan reliabilitas (total downtime + MTTR),
  - timeline incident (ringkas).

### 🛡️ Stabilitas & UX
- Proses export diberi guard/loading state agar tidak terjadi double-trigger saat klik berulang.
- Error handling export menampilkan toast error yang lebih jelas jika data/statistik periode belum tersedia.

### ✅ Validation
- TypeScript diagnostics file yang diubah: **no errors**.
- Local build pass (`npm run build`).

**Status:** ✅ Ready for deploy

## Version 3.11.14 - Firestore Efficiency Stabilization (R-024 Phase 2)
**Tanggal Rilis:** 23 Februari 2026

### ⚡ Analytics Read Bounding
- Melanjutkan optimasi batas 20k/month dengan read-bounded strategy pada jalur analytics yang mahal:
  - `use-domain-insights`: query dibatasi `orderBy('date', 'desc')` + `limit(3000)`.
  - `UptimeBar`: bounded query per domain (`orderBy('date', 'desc')` + `limit(days)`) dengan fallback aman.
  - `DomainStatisticsDialog`: bounded query stats/incidents (`orderBy + limit`) dengan fallback aman.
- Pendekatan fallback menjaga kompatibilitas saat index belum siap, sehingga fitur tetap berjalan tanpa hard failure.

### 🧪 Validation & Release
- Backup file sebelum implementasi: `backups/*backup-20k-phase2-*`.
- TypeScript diagnostics file yang diubah: **no errors**.
- Local build pass (`npm run build`).

**Status:** ✅ Deployed ke `kendal-uptime.vercel.app`

## Version 3.11.13 - Firestore Efficiency Stabilization (R-024 Phase 1.5)
**Tanggal Rilis:** 23 Februari 2026

### ⚡ Firebase Efficiency (Safe Pass)
- Monitoring cron dioptimalkan agar lebih hemat write tanpa mengubah alur monitoring user-facing:
  - update status domain dikonsolidasikan menjadi satu write per run,
  - write stats di-gate berdasarkan status change / heartbeat periodik (`STATS_HEARTBEAT_HOURS`, default `12`).
- Menambahkan cache TTL untuk jalur read analytics yang mahal:
  - `use-domain-insights` (5 menit),
  - `UptimeBar` (10 menit),
  - `DomainStatisticsDialog` (5 menit).
- Menambahkan metadata budget harian pada tracker Firebase ops (`dailyBudget`, `totalOps`, `remainingOps`, `usagePercent`, `isOverBudget`).

### 🔐 Cron Toggle Hardening + Rules Sync
- Menambahkan validasi sesi auth aktif pada handler toggle Monitoring Cron di `App.tsx` (`authUid` wajib ada).
- Error Firestore saat save toggle dipetakan ke pesan spesifik (`permission-denied`, `unauthenticated`) agar troubleshooting lebih cepat.
- `syncMonitoringControlToFirestore` kini mengembalikan structured result (`ok`, `code`, `message`) untuk handling error yang lebih presisi.
- Rules Firestore untuk dokumen `users/{userId}` disinkronkan agar menerima field `monitoringControl` dengan skema aman.
- Verifikasi auth/admin ditambahkan lewat script `scripts/verify-admin-auth.mjs` + command `npm run verify:auth-admin`.

### 📊 GitHub Statistics Sync
- Kartu status GitHub Actions sekarang menerima state `monitoringEnabled` dari root app.
- Saat toggle Monitoring Cron OFF, indikator status berganti ke mode disabled (bukan “Running normally”), termasuk copy/status badge yang konsisten.

### ✅ Validation
- TypeScript diagnostics file yang diubah: **no errors**.
- Local build pass (`npm run build`).
- Verifikasi admin auth & write-path `monitoringControl`: **PASS**.

**Status:** ✅ Deployed ke `kendal-uptime.vercel.app`

## Version 3.11.12 - App.tsx Refactor (R-006 Phase 10)
**Tanggal Rilis:** 23 Februari 2026

### ♻️ Refactor Internal
- Melanjutkan pemecahan `App.tsx` tanpa perubahan behavior fungsional.
- Menambahkan hook `use-domain-export` untuk memisahkan logika export CSV:
  - export semua domain,
  - export domain terfilter,
  - export domain per grup.
- Menjaga validasi export existing tetap sama (guard status check, duplicate handling, dan toast result).

### ✅ Validation
- TypeScript diagnostics file yang diubah: **no errors**.
- Local build pass (`npm run build`) sebelum deploy.

**Status:** ✅ Deployed ke `kendal-uptime.vercel.app`

## Version 3.11.11 - App.tsx Refactor (R-006 Phase 9)
**Tanggal Rilis:** 23 Februari 2026

### ♻️ Refactor Internal
- Melanjutkan pemecahan `App.tsx` tanpa perubahan behavior fungsional.
- Menambahkan hook `use-tab-auto-checks` untuk memisahkan logika:
  - auto-check domain saat tab Monitoring dibuka pertama kali (manual mode),
  - auto-check pinned domains saat tab Pin dibuka.
- Menjaga wiring existing tetap kompatibel melalui callback `onManualRefresh` dan updater `setStatuses`.

### ✅ Validation
- TypeScript diagnostics file yang diubah: **no errors**.
- Local build pass (`npm run build`) sebelum deploy.

**Status:** ✅ Deployed ke `kendal-uptime.vercel.app`

## Version 3.11.10 - App.tsx Refactor (R-006 Phase 8)
**Tanggal Rilis:** 23 Februari 2026

### ♻️ Refactor Internal
- Melanjutkan pemecahan `App.tsx` tanpa perubahan behavior fungsional.
- Menambahkan hook `use-notification-settings` untuk memisahkan logika:
  - state `notificationSettings` + instance `NotificationService`,
  - load settings dari Firebase setelah initial data load,
  - handler save settings + test notification.
- Menjaga wiring notifikasi existing tetap kompatibel di `App.tsx` melalui API hook.

### ✅ Validation
- TypeScript diagnostics file yang diubah: **no errors**.
- Local build pass (`npm run build`) sebelum deploy.

**Status:** ✅ Deployed ke `kendal-uptime.vercel.app`

## Version 3.11.9 - App.tsx Refactor (R-006 Phase 7)
**Tanggal Rilis:** 23 Februari 2026

### ♻️ Refactor Internal
- Melanjutkan pemecahan `App.tsx` tanpa perubahan behavior fungsional.
- Menambahkan hook `use-session-timeout` untuk memisahkan logika:
  - deteksi inactivity session,
  - warning auto-logout,
  - cleanup listener/interval terkait session timeout.
- Menjaga wiring timeout logout tetap kompatibel melalui callback `onTimeout`.

### ✅ Validation
- TypeScript diagnostics file yang diubah: **no errors**.
- Local build pass (`npm run build`) sebelum deploy.

**Status:** ✅ Deployed ke `kendal-uptime.vercel.app`

## Version 3.11.8 - App.tsx Refactor (R-006 Phase 6)
**Tanggal Rilis:** 23 Februari 2026

### ♻️ Refactor Internal
- Melanjutkan pemecahan `App.tsx` tanpa perubahan behavior fungsional.
- Menambahkan hook `use-auto-refresh-scheduler` untuk memisahkan:
  - initial delay auto-check,
  - lifecycle Web Worker auto-refresh,
  - countdown reset ke batch berikutnya.
- Menjaga wiring handler auto-refresh/manual-refresh agar tetap kompatibel melalui API `onAutoCheck`.

### 🛠️ Stabilization
- Membersihkan konflik implementasi duplikat pada hook scheduler yang sempat memicu error compile.
- Menyelaraskan kontrak parameter hook agar konsisten dengan penggunaan di `App.tsx`.

### ✅ Validation
- TypeScript diagnostics file yang diubah: **no errors**.
- Local build pass (`npm run build`) sebelum deploy.

**Status:** ✅ Deployed ke `kendal-uptime.vercel.app`

## Version 3.11.7 - App.tsx Refactor (R-006 Phase 4+5)
**Tanggal Rilis:** 23 Februari 2026

### ♻️ Refactor Internal
- Melanjutkan pemecahan `App.tsx` tanpa perubahan behavior fungsional.
- Menambahkan `use-firebase-ops-tracker` untuk memisahkan tracking Firebase reads/writes.
- Menambahkan `use-manage-selectable-domains` untuk menyederhanakan kalkulasi seleksi domain pada tab Kelola.

### ✅ Validation
- TypeScript diagnostics file yang diubah: **no errors**.
- Local build pass (`npm run build`) sebelum deploy.

**Status:** ✅ Deployed ke `kendal-uptime.vercel.app`

## Version 3.11.6 - App.tsx Refactor (R-006 Phase 3)
**Tanggal Rilis:** 23 Februari 2026

### ♻️ Refactor Internal
- Melanjutkan pemecahan `App.tsx` tanpa mengubah behavior fitur.
- Menambahkan hook baru `use-domain-selection` untuk manajemen state seleksi domain.
- Menyederhanakan handler seleksi di `App.tsx` agar lebih terstruktur dan mudah dirawat.

### ✅ Validation
- TypeScript diagnostics pada file yang diubah: **no errors**.
- Local build pass (`npm run build`) sebelum deploy.

**Status:** ✅ Deployed ke `kendal-uptime.vercel.app`

## Version 3.11.5 - App.tsx Refactor (R-006 Phase 1)
**Tanggal Rilis:** 23 Februari 2026

### ♻️ Refactor Internal
- Memecah sebagian logic dari `App.tsx` ke custom hooks tanpa mengubah perilaku fitur:
  - `use-manual-refresh-cooldown`
  - `use-domain-insights`
  - `use-cross-tab-logout`
- Menjaga fungsi existing tetap berjalan sama (non-functional refactor).

### ✅ Validation
- Build lokal PASS (`npm run build`) sebelum deploy.

**Status:** ✅ Deployed ke `kendal-uptime.vercel.app`

## Version 3.11.4 - Rollback Public Status Route
**Tanggal Rilis:** 23 Februari 2026

### 🩹 Rollback
- Menghapus fitur **Public Status Page** beserta route publik `/status`.
- Menghapus fallback akses `?view=status` pada mode aplikasi.
- Mengembalikan konfigurasi Vercel ke mode sebelumnya (tanpa rewrite khusus route publik).

### 🔧 Stability
- Menghapus komponen `PublicStatusPage` dan wiring di `App.tsx`.
- Build lokal tervalidasi PASS setelah rollback.

**Status:** ✅ Deployed ke `kendal-uptime.vercel.app`

## Version 3.11.3 - Public Status MVP & Session Sync
**Tanggal Rilis:** 23 Februari 2026

### ✨ Fitur Baru
- Menambahkan **Public Status Page (MVP)** read-only untuk visualisasi status layanan tanpa login.
- Mode publik bisa diakses via path **`/status`** atau query **`?view=status`**.
- Menambahkan mode **Preview** otomatis saat data live belum tersedia.

### 🔐 Session Management
- Menambahkan sinkronisasi logout antar tab browser menggunakan **BroadcastChannel**.
- Menambahkan fallback sinkronisasi via event `storage` agar tetap kompatibel jika channel tidak tersedia.

### ✅ Validation
- TypeScript diagnostics file yang diubah: **no errors**.
- Local build pass (`npm run build`) sebelum deploy.

**Status:** ✅ Deployed ke `kendal-uptime.vercel.app`

## Version 3.11.2 - Loading UX, Handler Optimization & Cleanup
**Tanggal Rilis:** 19 Februari 2026

### 🩹 Patch Update (Post-deploy, 19 Februari 2026)
- Fix runtime initialization order untuk mencegah error `Cannot access ... before initialization` pada `checkAllDomains`.
- Hardening fase pre-login: bootstrap Firebase ditunda sampai autentikasi valid, sehingga noise `permission-denied` berkurang.
- Hardening logging: menghapus log detail notification settings yang dapat mengekspos webhook URL di console.
- Mobile settings parity: menambahkan menu `Management Akun` dan `Log History` pada mobile navigation.

### 🩹 Patch Update (Post-deploy, 23 Februari 2026)
- Menambahkan **error boundary per tab/section** untuk isolasi error agar kegagalan satu panel tidak menjatuhkan seluruh dashboard.
- Menambahkan **manual refresh cooldown 30 detik** untuk menahan spam check manual beruntun.
- Menambahkan **accessibility baseline**: ARIA labels pada tabs, tombol manual check, dan action icon penting.
- Menambahkan **domain insights** di UI: badge uptime **7d/30d** dan **response-time sparkline** pada list monitoring dan pin cards.
- Perbaikan wiring mobile/desktop agar action yang sama tetap konsisten setelah penambahan insight + cooldown state.

### ⚡ Performance & Architecture
- Deduplikasi logic loading domain Firebase (initial load + version-change reload) agar alur konsisten dan lebih mudah dipelihara.
- Penambahan `useCallback` pada handler utama untuk menekan re-render yang tidak perlu.

### 🎨 UX Improvement
- Menambahkan loading skeleton saat initial data fetch Firebase pada state authenticated.

### 🧹 Dependency Cleanup
- Menghapus dependency yang tidak terpakai: `three` dan `@heroicons/react`.
- Dependency `embla-carousel-react` dan `vaul` dipertahankan karena masih dipakai komponen UI.

### ✅ Validation
- Local build pass (`npm run build`) setelah perubahan.
- TypeScript diagnostics untuk file yang diubah: **no errors**.

**Status:** ✅ Deployed ke `kendal-uptime.vercel.app`

## Version 3.11.1 - Security Hardening & Logging Cleanup
**Tanggal Rilis:** 19 Februari 2026

### 🔐 Security Hardening
- Menghapus hardcoded default password `admin123` dari source code.
- Bootstrap password admin sekarang memakai `VITE_DEFAULT_ADMIN_PASSWORD` (opsional) atau nilai yang sudah tersimpan di localStorage.
- Fallback loader password di Firebase sync diubah agar tidak lagi memakai default statis.

### 🛡️ Firestore Rules Tightening
- Menambahkan auth guard untuk koleksi `domains`, `groups`, dan `tags`.
- `domains` write dibatasi ke role `admin` atau `add-only`.
- `groups` dan `tags` write dibatasi ke role `admin`.
- Semua read untuk tiga koleksi tersebut sekarang mensyaratkan user aktif terautentikasi.

### 🧹 Logging Cleanup
- Logging di `App.tsx` dirouting ke logger scoped dev-only untuk menekan noise log di production.
- Error/warn tetap dipertahankan untuk observability saat troubleshooting.

### ✅ Verifikasi Production (Post-Deploy)
- Uji tanpa autentikasi ke `domains/default-user`, `groups/default-user`, `tags/default-user` menghasilkan `403 PERMISSION_DENIED` (read dan write).
- Uji role `admin`: read/write `domains/groups/tags` berhasil (`200`).
- Uji role `add-only`: read `domains/groups/tags` berhasil; write hanya `domains` (`200`), `groups/tags` ditolak (`403`).
- Uji role `viewer`: read `domains/groups/tags` berhasil; write `domains/groups/tags` ditolak (`403`).

**Status:** ✅ Deployed ke `kendal-uptime.vercel.app`

## Version 3.11.0 - Dark Mode, Audit Log & UI Polish
**Tanggal Rilis:** 18 Februari 2026

### 🌓 Dark/Light Mode Toggle
- Implementasi `next-themes` ThemeProvider dengan `attribute="class"` dan `storageKey: kendal-theme`
- Light theme CSS variables di `:root`, dark di `.dark` class
- `ThemeToggle` component (animated sun/moon icon) tersedia di: desktop header, mobile nav, landing page
- FOUC prevention script di `index.html`
- Sonner toaster auto-sync tema via `@/components/ui/sonner`

### 📋 Audit Log Viewer
- `fetchAuditLogs()` function dengan Firestore `orderBy` + `limit`
- `AuditLogDialog` component: timeline UI, relative timestamps (Bahasa Indonesia), action badges
- Aksesibel dari Settings menu (admin only)
- Fix scroll issue (ganti ScrollArea → `overflow-y-auto`)

### 🎨 Landing Page & UI Improvements
- Landing page login screen (conditional render saat belum autentikasi)
- Login form loading/disable state dengan spinner (async `onLogin`, `fieldset disabled`)
- FAQ dialog di footer (10 item accordion, antara Panduan dan Privacy)
- Uptime bar tooltip redesign: `bg-popover`, colored dot indicators, border separator
- Dynamic toast colors (`richColors` Sonner, gantikan `theme="dark"`)

### 🔧 TypeScript Fixes
- GroupCard: optional chaining `onDelete?.(group.id)` (fix TS2722)
- TagCard: tambah `statuses` + `groups` props, fix `domain.status` → `statuses[domain.id]?.status`
- TagCard: fix `domain.group` → `domain.groupId` (fix TS2551)
- firestore-sync: `Record<string, unknown>` → `UserPermissions` type fix

**Status:** ✅ Deployed ke `kendal-uptime.vercel.app`

---

## Version 3.10.2 - Firebase Rules Deploy & E2E Readiness
**Tanggal Rilis:** 16 Februari 2026

### 🔐 Firebase Security & Release Sync

**Changes:**
1. **Firestore Rules deployment finalized**
  - Rules dari `firestore.rules` sudah dideploy ke project Firebase `kendal-monitor`.
  - Perbaikan warning rules (`exists`) sudah diterapkan dan deploy ulang berhasil tanpa warning compile.

2. **Deployment workflow readiness (Firebase/Vercel)**
  - Menambahkan `firebase.json` sebagai mapping source rules.
  - Menambahkan script deploy rules berbasis `firebase-tools` di `package.json`.

3. **E2E execution checklist prepared**
  - Menambahkan dokumen `docs/USER-MANAGEMENT-E2E-CHECKLIST.md` untuk uji real Firebase (admin/viewer/add-only, audit-log, toggle active, change password).

4. **Footer + changelog version sync**
  - `APP_VERSION` diperbarui ke `3.10.2` agar footer menampilkan versi yang sama dengan changelog.

**Status:** ✅ Ready for Vercel deployment

---

## Version 3.10.1 - Read-Only Action Lock Fix
**Tanggal Rilis:** 16 Februari 2026

### 🛡️ Permission Enforcement Fix

**Issue fixed:**
- User read-only/add-only masih melihat/menjalankan beberapa aksi mutasi di tab Kelola (pin, monitoring toggle, delete/edit visibility mismatch).

**Changes:**
1. **Action callbacks gated by permission**
  - `onTogglePin` dan `onToggleMonitoring` hanya dipass saat user memiliki `canEdit`.

2. **Delete button visibility fixed**
  - Tombol delete di card hanya render jika callback delete tersedia.

3. **No-op fallback removed**
  - `onDelete` fallback kosong di list dihapus agar UI tidak menampilkan aksi palsu.

4. **Double guard in handlers**
  - Handler pin/monitoring juga validasi permission untuk mencegah bypass.

**Status:** ✅ Ready for deployment

---

## Version 3.10.0 - User Management MVP
**Tanggal Rilis:** 16 Februari 2026

### ✨ New Features

1. **Username + Password Login**
  - Login tidak lagi password-only.
  - Mendukung akun user terkelola (managed users).

2. **User Management di Settings (Admin Only)**
  - Admin dapat membuat user baru.
  - Admin dapat enable/disable user.
  - Daftar user menampilkan role dan permission ringkas.

3. **Permission MVP Implemented**
  - **Viewer**: hanya lihat.
  - **Add URL Only**: bisa tambah domain, tidak bisa edit/delete.
  - **Admin**: full access + manage users.

### 🔧 Sync & Data Handling

- Menambahkan sinkronisasi `managed users` ke Firebase (`users/user-directory`).
- Menjaga data monitoring (`domains/groups/tags`) tetap shared agar konsisten untuk seluruh user operasional.

**Status:** ✅ Ready for production deployment

---

## Version 3.9.11 - Pin/Group Sync Data-Loss Prevention
**Tanggal Rilis:** 16 Februari 2026

### 🛡️ Critical Sync Safeguards

**Root cause addressed:**
- Saat pembacaan Firestore error (quota/network/permission), sebelumnya fungsi read mengembalikan `[]`.
- State kosong ini bisa langsung ter-sync balik saat startup dan menimpa data Firebase (pin/group terlihat hilang).

**Fix implemented:**
1. **Do not treat read errors as empty data**
  - Firestore read helpers sekarang melempar error (throw), bukan return empty array.
  - Load flow bisa membedakan "data kosong valid" vs "gagal baca".

2. **Skip first auto-sync after initial load**
  - Auto-sync startup untuk domains/groups/tags dilewati sekali.
  - Mencegah overwrite data cloud oleh state awal yang belum stabil.

**Impact:**
- ✅ Mengurangi risiko hilangnya pin/group karena startup race + read failure.
- ✅ Sinkronisasi tetap jalan normal untuk perubahan user setelah app loaded.

---

## Version 3.9.10 - Statistics & Usage Sync Alignment
**Tanggal Rilis:** 16 Februari 2026

### 🔧 Fixes & Consistency Update

**Updated to match actual production behavior:**
1. **GitHub Actions Monthly Usage calculation in Statistics tab:**
  - ❌ Sebelumnya: estimasi `1.5 min/run` → `36 min/day`
  - ✅ Sekarang: estimasi `2.4 min/run` → `57.6 min/day`
  - ✅ Proyeksi bulanan sinkron: `~1,728 min/month` (86% dari quota 2,000)

2. **Workflow documentation comment sync:**
  - ✅ Comment di workflow `.github/workflows/monitor-domains.yml` disesuaikan dengan runtime aktual
  - ✅ Keterangan quota kini konsisten dengan schedule `cron: '0 * * * *'` (setiap 1 jam)

3. **Footer & Changelog version sync:**
  - ✅ `APP_VERSION` di-update ke `3.9.10`
  - ✅ Footer `v3.9.10` otomatis sinkron melalui `ChangelogDialog triggerText`

**Status:** ✅ Ready for Vercel deployment

---

## Version 3.9.9 - GitHub Actions Schedule Adjustment
**Tanggal Rilis:** 1 Februari 2026

### 🔧 Critical Fixes & Schedule Optimization

**Issues Fixed:**
1. **Syntax Error in monitor-cron.js:**
   - ❌ Line 396: `offline: 0 with concurrency limit` caused script to fail
   - ✅ Fixed: Proper object closing and loop structure
   - ✅ Script now runs successfully

2. **Quota Management:**
   - **Actual duration per run:** 2.4 minutes (not 40 seconds as expected)
   - **Problem:** With 20-min interval = 5,190 min/month (259% over quota!)
   - **Solution:** Changed interval from **20 minutes → 1 hour**

**Schedule Changes:**
```yaml
# BEFORE:
- cron: '*/20 * * * *'  # Every 20 minutes
# 72 runs/day × 2.4 min = 173 min/day = 5,190 min/month ❌

# AFTER:
- cron: '0 * * * *'     # Every hour (at minute 0)
# 24 runs/day × 2.4 min = 57.6 min/day = 1,728 min/month ✅
```

**New Quota Usage:**
- Per run: ~2.4 minutes
- Per day: 24 runs = 57.6 minutes/day
- Per month: 1,728 minutes/month
- **Quota usage: 86%** (safe with 272 min buffer)
- Schedule: Runs at 00:00, 01:00, 02:00, ... 23:00 daily

**Status:** ✅ Schedule enabled and running within quota limits

---

## Version 3.9.8 - GitHub Actions Optimization
**Tanggal Rilis:** 24 Januari 2026

### 🚀 Performance Optimization: 80% Reduction in Workflow Time

**Problem Identified:**
- ❌ GitHub Actions using 2,000 minutes in <1 month (exceeded quota)
- ❌ Each run taking 2-3 minutes (mostly npm install time)
- ❌ Installing 80+ dependencies every 20 minutes
- ❌ Projected: 6,048 min/month (3x over limit)

**Root Cause:**
```
npm install: ~2-3 minutes (80+ packages)
Domain check: ~30-60 seconds
Total: 3-4 minutes per run ❌

72 runs/day × 3.5 minutes = 252 min/day
30 days × 252 min = 7,560 minutes/month ❌❌❌
```

**Solutions Implemented:**

1. **Minimal Dependencies Install:**
   - BEFORE: `npm install` (80+ packages, 2-3 minutes)
   - AFTER: `npm install --no-save firebase node-fetch` (2 packages, ~15 seconds)
   - ✅ 90% reduction in install time

2. **Reduced Timeouts:**
   - DNS lookup: 5 seconds (was unlimited)
   - HTTP/HTTPS fetch: 5 seconds each (was 10 seconds)
   - Job timeout: 5 minutes max
   - ✅ Faster fail for unresponsive domains

3. **Concurrency Control:**
   - Check 10 domains at a time (was unlimited parallel)
   - Prevents overwhelming Firebase and GitHub Actions
   - ✅ More stable execution

4. **Direct Script Execution:**
   - Run `node scripts/monitor-cron.js` directly
   - No need for `npm run monitor` wrapper
   - ✅ Eliminates overhead

**Results:**
```
Duration per run: ~30-45 seconds ✅
72 runs/day × 40 seconds = 48 min/day
30 days × 48 min = 1,440 minutes/month ✅

Usage: 72% of quota (was 300%+)
Buffer: 560 minutes remaining ✅
```

**Impact:**
- ✅ **80% reduction** in workflow execution time
- ✅ **Can sustain 24/7 monitoring** within free tier
- ✅ **28% buffer** for growth or manual triggers
- ✅ **Faster feedback** on domain status

**Technical Changes:**
- Updated `.github/workflows/monitor-domains.yml`
- Optimized `scripts/monitor-cron.js` with timeouts
- Added concurrency limit (10 domains parallel)
- Reduced all network timeouts to 5 seconds

---

## Version 3.9.7 - Hourly Breakdown Text Overflow Fix
**Tanggal Rilis:** 19 Januari 2026

### 🐛 Bug Fix: Text Overflow di Hourly Breakdown

**Problem:**
- ❌ Text description di hourly breakdown terlalu panjang
- ❌ Text overflow pada mobile devices
- ❌ Penjelasan tidak responsive

**Solution:**
- ✅ Text dipendekkan dari "Each bar represents 1 hour with checks • Green = 100% success, Yellow = partial, Red = all failed" 
- ✅ Menjadi: "1 bar = 1 hour • Green = 100%, Yellow = partial, Red = failed"
- ✅ Added color highlighting untuk status (text-success, text-warning, text-destructive)
- ✅ Added horizontal padding (px-2) untuk breathing room
- ✅ More mobile-friendly dan concise

**Impact:**
- ✅ No more text overflow di mobile
- ✅ Lebih mudah dibaca dan dipahami
- ✅ Visual clarity dengan color-coded status

---

## Version 3.9.6 - Notification Settings Firebase Sync
**Tanggal Rilis:** 13 Januari 2026

### ✨ New Features: Cloud-Synced Notification Settings

**Problem Solved:**
- ❌ Notification settings (webhook URL, rules) hanya tersimpan di localStorage
- ❌ Settings hilang saat clear cache atau buka di device/browser lain
- ❌ Tidak sync antar device

**Solution Implemented:**

1. **Firebase Sync for Notification Settings:**
   - ✅ Webhook URL tersimpan di Firebase (collection: `users/{userId}`)
   - ✅ Notification rules (notifyOnDown, notifyOnRecovery, notifyOnSlow) sync ke cloud
   - ✅ Cooldown settings dan slow threshold juga tersimpan
   - ✅ Auto-load dari Firebase saat app init

2. **New Functions in firestore-sync.ts:**
   ```typescript
   - syncNotificationSettingsToFirestore() // Save settings to Firebase
   - getNotificationSettingsFromFirestore() // Get settings from Firebase
   - loadNotificationSettings() // Load with Firebase priority, localStorage fallback
   ```

3. **Enhanced User Experience:**
   - ✅ Settings sync instantly ke Firebase setelah save
   - ✅ Toast notification: "Notification settings saved successfully"
   - ✅ Warning toast jika sync gagal: "Settings saved locally, but failed to sync to Firebase"
   - ✅ Settings tetap tersedia di semua device yang login

4. **Data Flow:**
   ```
   Save Settings → localStorage + Firebase
   Load Settings → Firebase (priority) → localStorage (fallback)
   ```

**Note:**
- Per-domain `notificationsEnabled` sudah sync ke Firebase sejak awal (via domains collection)
- Update ini melengkapi sync untuk global notification settings (webhook + rules)

---

## Version 3.9.5 - Groups Persistence Final Fix
**Tanggal Rilis:** 12 Januari 2026

### 🐛 Critical Bug Fix: Groups Finally Work!

**Root Cause Identified:**
- Firebase error: `"Unsupported field value: undefined"`
- Optional field `description?` was being sent as `undefined` to Firebase
- Firebase CANNOT accept undefined values, causing **silent save failures**
- Groups appeared to save but actually **never reached Firebase**

**Fixes Applied:**

1. **Clean Undefined Fields:**
   - ✅ Remove undefined fields before saving to Firebase
   - ✅ Only include `description` if it has a value
   - ✅ Apply to all group operations (create/edit/delete)

2. **Immediate Firebase Sync:**
   - ✅ Groups sync instantly on create/edit/delete (no useEffect delay)
   - ✅ Domain assignments sync instantly to Firebase
   - ✅ No more 2-second delay causing data loss on quick refresh

3. **Cache Optimization:**
   - ✅ Firebase data loads immediately after cache (removed 30s setTimeout)
   - ✅ Groups always load from Firebase (never cached)
   - ✅ Domains merge with Firebase as source of truth for groupId

4. **Auto-check on Tab Open:**
   - ✅ Monitoring tab auto-checks all domains on first open
   - ✅ No more empty screen waiting for user action
   - ✅ Works on page load and tab switch

5. **Last Check Time Display:**
   - ✅ Added timestamp at top of monitoring tab
   - ✅ Format: "Last checked at: HH:MM:SS"
   - ✅ Updates after each check

6. **UI Fixes:**
   - ✅ Fixed extra margin in DomainCard (mt-2 removed)
   - ✅ Action buttons back on same row as IP address
   - ✅ Clock icon import added

**Testing:**
- ✅ Create group → Save successful (no Firebase error)
- ✅ Assign domains to group → Instantly synced
- ✅ Refresh page → Groups persist correctly
- ✅ Domain assignments persist correctly

**Migration Notes:**
- Groups created before v3.9.5 may have failed to save
- Recommend re-creating groups and re-assigning domains
- Check console for `[Groups] Loaded from Firebase: X groups` to verify

---

## Version 3.9.4 - Icon Corrections & Layout
**Tanggal Rilis:** 12 Januari 2026

### 🎨 UI Improvement: Better Sticky Bar Design

**What's Fixed:**
- ✅ Background diubah dari bg-background/95 → bg-card (lebih terang)
- ✅ Counters sekarang selalu visible (tidak perlu check dulu)
- ✅ Border pada badge untuk clarity
- ✅ Shadow untuk depth
- ✅ Padding lebih compact (py-2.5)

**Why:**
- 🎯 Tidak lagi "hitam dan aneh"
- 📊 User langsung lihat counter meski belum check
- 💎 Lebih sesuai dengan design system

---

## Legacy Note - Sticky Bar & Last Checked Timestamp
**Tanggal Rilis:** 12 Januari 2026

### ✨ New Features: Enhanced Tab Monitoring

**1. Sticky Bar dengan Live Counters:**
- ✅ Check All button selalu accessible (sticky position)
- ✅ Live counters: Online 🟢, DNS Only 🟡, Offline 🔴
- ✅ Persentase online ditampilkan
- ✅ Last sync indicator
- ✅ Backdrop blur dengan z-index 10
- ✅ Mobile responsive

**2. Last Checked Timestamp per Domain:**
- ✅ Menampilkan "Last checked: X ago" di setiap card
- ✅ Format: just now, Xm ago, Xh ago, Xd ago
- ✅ Icon Clock untuk visual clarity
- ✅ Hanya muncul jika sudah pernah di-check

**Why:**
- 🎯 Tab monitoring tidak lagi terasa kosong saat initial load
- 📊 User langsung dapat overview status domain
- 🕐 Transparansi data freshness per domain
- ⚡ Quick action selalu accessible

**Reference:**
- Implementasi dari UI-IMPROVEMENT-PLAN.md
- Inspired by Uptime Kuma dan monitoring tools modern

---

## Legacy Note - Icon & Layout Fix
**Tanggal Rilis:** 12 Januari 2026

### 🎨 UI Improvement: Correct Icons & Better Layout

**What's Fixed:**
- ✅ Group icon diubah dari Tag → Folder (sesuai semantik)
- ✅ Tags sekarang ada icon Tag (sebelumnya tidak ada icon)
- ✅ Group dan Tags sekarang dalam satu baris (di samping URL)
- ✅ Konsisten antara simple mode dan normal mode

**Visual:**
- Group: 📁 Folder icon + nama
- Tags: 🏷️ Tag icon + nama
- Semua badge dengan icon + warna yang konsisten

---

## Version 3.9.3 - Groups Bug Fix
**Tanggal Rilis:** 12 Januari 2026

### 🐛 Bug Fix: Groups Persistence & Display

**Problems Fixed:**
- ❌ Domain group assignments hilang setelah refresh
- ❌ Groups tidak muncul di card list tab monitoring

**Solutions:**
- ✅ Groups sekarang load langsung dari Firebase (seperti tags)
- ✅ Tidak lagi bergantung pada localStorage cache
- ✅ Groups prop ditambahkan ke OptimizedDomainList di tab monitoring
- ✅ Group badge sekarang muncul di semua domain yang ter-assign

**Why:**
- 🎯 Data kecil & kritis harus selalu fresh dari Firebase
- 💾 Cache hanya untuk backup, bukan primary source
- 🔄 Konsisten dengan strategi tags loading

---

## Version 3.9.2 - Dropdown Menu for Tag Cards
**Tanggal Rilis:** 12 Januari 2026

### 🎨 UI Improvement: Dropdown Menu di Tag Card

**What's Changed:**
- ✅ Tombol Edit dan Hapus di TagCard sekarang dalam dropdown menu (...)
- ✅ Konsisten dengan UI GroupCard dan PinnedDomainCard
- ✅ Menghapus AlertDialog, langsung hapus dari dropdown
- ✅ Lebih rapi dan efisien

**Why:**
- 🎯 Konsistensi UI pattern di semua card types
- 👍 UX lebih streamlined

---

## Version 3.9.1 - UI Consistency for Pinned Cards
**Tanggal Rilis:** 12 Januari 2026

### 🎨 UI Improvement: Dropdown Menu di Pinned Domain Card

**What's Changed:**
- ✅ Tombol edit dan hapus sekarang di dalam dropdown menu (...)
- ✅ Konsisten dengan UI GroupCard
- ✅ Lebih rapi dan hemat space
- ✅ Menu: "Buka di tab baru" dan "Unpin domain"

**Why:**
- 🎯 Konsistensi UI pattern di semua card
- 👍 UX lebih clean dan organized

---

## Version 3.9.0 - Search in Assign Domains Dialog
**Tanggal Rilis:** 12 Januari 2026

### ✨ New Feature: Pencarian Domain

**What's New:**
- ✅ Search box di dialog atur grup domain
- ✅ Real-time filtering saat mengetik
- ✅ Counter update sesuai hasil filter
- ✅ "Pilih Semua" bekerja dengan filtered domains
- ✅ Empty state: "Tidak ada domain yang cocok"

**Why:**
- 🎯 Mengelola 300+ domain jadi lebih mudah
- ⚡ Cepat menemukan domain spesifik
- 👍 UX lebih baik untuk assignment

---

## Version 3.8.9 - Tag Sync Bug Fix
**Tanggal Rilis:** 12 Januari 2026

### 🐛 Critical Bug Fix: Tag Hilang Setelah Refresh

**Problem:**
- ❌ User tambah tag baru → tag hilang setelah refresh page
- ❌ Tag hanya bertahan kalau user tidak refresh selama 30 detik
- ❌ User kehilangan data yang baru dibuat

**Root Cause:**
```javascript
// localStorage key mismatch:
// SAVE (useEffect tags):
localStorage.setItem('domain-tags', JSON.stringify(tags)) // ❌ Gunakan key ini

// LOAD (initial load):
const cachedTags = localStorage.getItem('tags-cache') // ❌ Tapi load dari key ini!
```

**Analisis:**
1. User tambah tag → `setTags()` dipanggil
2. useEffect sync ke Firebase (2s delay) ✅
3. useEffect save ke localStorage `domain-tags` ✅
4. User refresh page → App load dari `tags-cache` (EMPTY!) ❌
5. Background refresh (30s) baru update `tags-cache` → Terlambat!

**Fixes Applied:**
```javascript
// AFTER (Fixed - Update both keys):
useEffect(() => {
  if (!isLoadingData) {
    localStorage.setItem('domain-tags', JSON.stringify(tags))
    localStorage.setItem('tags-cache', JSON.stringify(tags)) // ✅ Update both!
    
    setTimeout(() => {
      syncTagsToFirestore(tags) // Sync to Firebase
    }, 2000)
  }
}, [tags, isLoadingData])
```

**Changes:**
- ✅ Update both `domain-tags` dan `tags-cache` saat tags berubah
- ✅ Background refresh juga update both keys (consistency)
- ✅ Console.log added untuk debug tracking
- ✅ Test script created: `scripts/test-tag-sync.mjs`

**Impact:**
- ✅ Tag baru langsung persist setelah 2 detik
- ✅ Refresh page → Tag masih ada (loaded dari cache)
- ✅ No data loss untuk user

**Testing:**
- Created `test-tag-sync.mjs` untuk verify Firebase sync
- Tested manual: Add tag → Wait 2s → Refresh → Tag persist ✅

---

## Version 3.8.8 - Pin Sync Fix Across Devices
**Tanggal Rilis:** 12 Januari 2026

### 🐛 Critical Bug Fix: Pin State Tidak Sync Antar Device

**Problem:**
- ❌ User pin 4 domain di laptop, tapi di PC lain pinnya hilang/berbeda
- ❌ Pin state diambil dari localStorage (local only), bukan dari Firebase
- ❌ Setiap device punya pin state sendiri-sendiri (tidak sinkron)

**Root Cause:**
```javascript
// BEFORE (Bug di line 215 App.tsx):
if (localDomain) {
  return {
    ...domainWithBatch,
    pinned: localDomain.pinned, // ❌ Ambil dari localStorage!
    enabled: false
  }
}
```

**Analisis:**
- `handleTogglePin()` sudah benar: sync ke Firebase ✅
- Background refresh: ambil pin dari localStorage ❌ (harusnya dari Firebase)
- Setiap device load data dari Firebase, tapi pin state di-override dengan localStorage

**Fixes Applied:**
```javascript
// AFTER (Fixed):
if (localDomain) {
  return {
    ...domainWithBatch,
    pinned: firebaseDomain.pinned || false, // ✅ Firebase = source of truth
    enabled: false
  }
}
```

**Changes:**
- ✅ Pin state sekarang **selalu diambil dari Firebase** (source of truth)
- ✅ Background refresh menggunakan `firebaseDomain.pinned`, bukan `localDomain.pinned`
- ✅ localStorage cache di-update dengan pin state dari Firebase
- ✅ Console log updated: "pinned from Firebase" untuk clarity

**Impact:**
- ✅ Pin 4 domain di laptop A → Terlihat di PC B, tablet, semua device
- ✅ Unpin di device manapun → Semua device tersinkronisasi otomatis
- ✅ Cross-device sync berfungsi sempurna (30 detik background refresh)

**Testing:**
- Pin domain di device A, buka di device B → Sync ✅
- Unpin di device B, refresh di device A → Sync ✅
- Multiple devices simultaneous → All synced ✅

---

## Version 3.8.7 - UptimeBar Display Fix for 0% Uptime
**Tanggal Rilis:** 11 Januari 2026

### 🐛 Bug Fixes: UptimeBar Visual Display

**Problem:**
- ❌ Bar dengan 0% uptime (offline) di-render sebagai grey (no data) padahal seharusnya red
- ❌ Bar dengan 0% uptime tingginya terlalu kecil sehingga tidak terlihat
- ❌ User melihat hanya 3 bars padahal data ada 4

**Root Cause:**
```javascript
// BEFORE (Bug):
if (uptime > 0) return 'bg-destructive'  // 0% masuk else = grey
return 'bg-gray-700'

const minHeight = isCompact ? 3 : 4  // Terlalu kecil
return Math.max(minHeight, (uptime / 100) * maxHeight)  // 0% = 4px
```

**Fixes Applied:**
- ✅ **Color logic fixed**: `uptime >= 0` untuk include 0% sebagai red
- ✅ **Min height increased**: 4:6 (compact:normal) untuk visibility lebih baik
- ✅ **Explicit 0% handling**: `if (uptime === 0) return minHeight`
- ✅ **Stats text improved**: "X days of data" lebih clear daripada "last X days"

**After:**
```javascript
// Color logic:
if (uptime >= 0) return 'bg-destructive'  // ✅ 0% = red

// Height logic:
const minHeight = isCompact ? 4 : 6  // ✅ Increased
if (uptime === 0) return minHeight  // ✅ Ensure visible
```

**Impact:**
- ✅ Bars dengan 0% uptime sekarang tampil **merah** dan **terlihat jelas**
- ✅ Users dapat membedakan "no data" (grey) vs "offline" (red)
- ✅ Visual consistency dengan status indicators lainnya

**Testing:**
- Verified dengan kendalkab.go.id (0% uptime pada 11 Jan - HTTP 500 error)
- Verified dengan ppid.kendalkab.go.id (50% uptime pada 11 Jan)
- Both domains sekarang menampilkan 4 colored bars dengan benar

---

## Version 3.8.6 - GitHub Actions Stats Writing & Daily/Hourly Toggle
**Tanggal Rilis:** 11 Januari 2026

### 🎯 Major Fix: GitHub Actions Monitoring Data Persistence

**Critical Fix:**
- ✅ **GitHub Actions sekarang menulis ke `domain-stats-daily`** - sebelumnya hanya menulis logs
- ✅ **Uptime chart akan auto-update** setiap 20 menit (24/7 monitoring)
- ✅ **Update domain status** di Firebase setiap check
- ✅ **Data persistence** tanpa butuh browser terbuka

**Technical Changes:**
```javascript
// monitor-cron.js sekarang:
- getOrCreateDailyStats(domainId)
- updateDailyStats(domainId, checkResult)
- updateDomainStatus(domainId, checkResult, allDomains)
- Writes to: domain-stats-daily, domains collection, github-actions-logs
```

### 📊 New Feature: Daily/Hourly Toggle di Statistics View

**Fitur Baru:**
- ✅ **Daily View**: 90 hari (1 bar = 1 hari) - konsisten dengan Pin tab
- ✅ **Hourly View**: 7 hari detail (1 bar = 1 jam)
- ✅ Toggle button untuk switch between views
- ✅ Auto-load 90 hari data untuk daily view

**Benefits:**
- Konsistensi data antara Pin tab dan Statistics tab
- Flexibility: quick overview (daily) vs detailed analysis (hourly)
- Better user experience dengan multi-view options

### 🔧 Impact:

**Before:**
- GitHub Actions run setiap 20 menit tapi TIDAK simpan stats ❌
- Uptime chart hanya update kalau browser terbuka ❌
- Data hilang untuk hari tanpa browser monitoring ❌

**After:**
- GitHub Actions run DAN simpan stats setiap 20 menit ✅
- Uptime chart auto-update 24/7 tanpa browser ✅
- Historical data lengkap untuk analisis ✅

---

## Version 3.8.5 - Domain Persistence Fix
**Tanggal Rilis:** 10 Januari 2026

### 🔧 Bug Fix: Add/Delete Domain Persistence

**Fixed:**
- ✅ Immediate localStorage updates saat add domain
- ✅ Immediate localStorage updates saat delete domain
- ✅ Store ke both `monitoring-domains` dan `domains-cache` keys
- ✅ Prevent data loss ketika user refresh setelah add/delete domain
- ✅ Ensure domain changes persist across page reloads

**Technical Changes:**
```typescript
// handleAddDomain & handleDeleteDomain now:
- localStorage.setItem('monitoring-domains', ...)
- localStorage.setItem('domains-cache', ...)
- Immediate write, no waiting for next sync
```

**Benefits:**
- No more lost domains after refresh
- Better data persistence reliability
- Improved user experience

---

## Version 3.7.3 - Next Run Countdown Timer
**Tanggal Rilis:** 10 Januari 2026

### ⏰ GitHub Actions Countdown Enhancement

**Fitur Baru:**
- ✅ **Next Run Countdown Timer** di GitHub Actions Status Card
- ✅ Live countdown yang update setiap detik
- ✅ Format: "Next check in: 15:32"
- ✅ Auto-calculate berdasarkan cron schedule (setiap 20 menit)
- ✅ Visual indicator kapan monitoring berikutnya

**Benefits:**
- User tahu kapan GitHub Actions akan check berikutnya
- Transparansi monitoring schedule
- Better UX dengan real-time information

---

## Version 3.7.2 - Firebase Query Fix
**Tanggal Rilis:** 10 Januari 2026

### 🔧 Bug Fix: Firebase Query

**Fixed:**
- ✅ Correct Firebase query untuk get domains array
- ✅ Proper data fetching dari Firestore
- ✅ Ensure monitoring script dapat access domain list

---

## Version 3.7.1 - GitHub Actions Tab Organization
**Tanggal Rilis:** 10 Januari 2026

### 📊 UI/UX Enhancement

**Changes:**
- ✅ **GitHub Actions as 3rd Sub-Tab** di Statistics Tab
- ✅ Separate dedicated tab untuk GitHub Actions monitoring
- ✅ Better organization: Daily / Hourly / GitHub Actions
- ✅ Cleaner navigation structure
- ✅ Fix missing ChartLine icon import

**Tab Structure:**
```
Statistics Tab
├── Daily Overview (90-day uptime)
├── Hourly Detail (7-day hourly)
└── GitHub Actions (monitoring health) ← NEW POSITION
```

---

## Version 3.7.0 - GitHub Actions Health Monitoring
**Tanggal Rilis:** 10 Januari 2026

### 🤖 Major Feature: GitHub Actions Health Dashboard

**New Component: GitHubActionsStatusCard**
- ✅ **Real-time health monitoring** GitHub Actions workflow
- ✅ **Last run information**: Time, duration, batch, status
- ✅ **Success rate tracking**: Overall percentage
- ✅ **Run history visualization**: Last 10 runs dengan status
- ✅ **Color coding**: Green (success), Red (failed), Gray (pending)

**Features:**
```typescript
// Dashboard menampilkan:
- Last Run: "2 minutes ago"
- Duration: "34 seconds"
- Batch: "B1" (currently checking)
- Status: "Success" / "Failed"
- Success Rate: "95.5%" (last 30 days)
- Run History: Bar chart 10 runs terakhir
```

**Integration:**
- Displayed di Statistics View
- Auto-refresh data dari Firebase
- Phosphor icons untuk visual consistency
- Mobile responsive layout

---

## Version 3.6.1 - GitHub Actions 24/7 Monitoring (FREE!)
**Tanggal Rilis:** 9 Januari 2026

### 🤖 Major Feature: Automated Background Monitoring

**Switch to GitHub Actions Cron (100% FREE!)**
- ✅ **Auto-runs every 20 minutes** - 24/7 tanpa browser terbuka
- ✅ **4 Batch System** - B1, B2, B3, B4 staggered checking
- ✅ **Firebase Direct Query** - Script query Firestore langsung
- ✅ **Slack Notifications** - Summary results (optional)
- ✅ **No Cost** - 2000 min/month GitHub Actions (private repo)
- ✅ **Smart Duration** - ~34 seconds per run, ~1,231 min/month

**Technical Implementation:**
```yaml
# .github/workflows/monitor-cron.yml
schedule:
  - cron: '*/20 * * * *'  # Every 20 minutes

# Runs: scripts/monitor-cron.js
# Queries: Firebase domains collection
# Writes: Firebase stats & incidents
# Notifies: Slack webhook (optional)
```

**Cron Schedule:**
- Batch 1: Menit 0, 20, 40
- Batch 2: Menit 5, 25, 45
- Batch 3: Menit 10, 30, 50
- Batch 4: Menit 15, 35, 55

**Benefits:**
- ✅ True 24/7 monitoring tanpa user intervention
- ✅ No laptop/browser perlu nyala
- ✅ Consistent checking schedule
- ✅ 100% free dengan private repo
- ✅ Automated incident detection
- ✅ Scalable to 300+ domains

**Documentation:**
- Added comprehensive docs untuk GitHub Actions setup
- Monitor script: `scripts/monitor-cron.js`
- Workflow config: `.github/workflows/monitor-cron.yml`
- Firebase service account integration

---

## Version 3.6.0 - Render.com Cron Job (Deprecated)
**Tanggal Rilis:** 9 Januari 2026

### 🔧 Experimental: Render.com Cron Service

**Features:**
- ✅ Render.com cron job untuk background monitoring
- ✅ render.yaml configuration
- ✅ Scheduled checks setiap 20 menit

**Status:** ⚠️ **DEPRECATED**
- Switched to GitHub Actions di v3.6.1
- Render.com memerlukan credit card
- GitHub Actions lebih cost-effective
- Configuration removed from repo

---

## Version 3.5.2 - Unified Chart Visualization
**Tanggal Rilis:** 9 Januari 2026

### 📊 Chart Consistency & UX Improvements

#### **Problem Solved:**
User confusion antara chart di Pin Tab vs Statistics Dialog:
- Pin Tab: 1 bar = 1 hari (90 hari)
- Statistics: 1 bar = 1 jam (~96 bars dari 4 hari)
- Tidak ada visual consistency

#### **Solution: 3-Tab Statistics Dialog**

**Tab 1: Daily Overview**
- ✅ **SAMA seperti Pin Tab** - Visual consistency
- 90-day uptime bar (1 bar = 1 day)
- Uptime trend line chart
- Label: "Same as Pin Tab" untuk clarity

**Tab 2: Hourly Detail** (NEW!)
- Hourly breakdown last 7 days
- 1 bar = 1 jam dengan checks
- Max 168 bars (7 × 24 jam)
- Color coding:
  - Green = 100% success
  - Yellow = partial success
  - Red = all failed
- Tooltip: Date, hour, success rate

**Tab 3: Response Time**
- Line chart response time
- Same as before (unchanged)

#### **Pin Tab Enhancement:**
- Added label: "90-day uptime • Daily view"
- Added link: "View detailed →" to open Statistics
- Clear mental model: Pin = preview, Statistics = detailed

### 🎯 Benefits

1. **Visual Consistency** ✅
   - Daily overview di Statistics = sama dengan Pin
   - User langsung paham: "Oh ini continuation!"

2. **Progressive Disclosure** ✅
   - Tab 1: Quick overview (daily)
   - Tab 2: Deep dive (hourly)
   - Tab 3: Performance metrics

3. **Better UX** ✅
   - No confusion
   - Follow mental model: overview → detail
   - Easy to compare domains

4. **Flexibility** ✅
   - User bisa pilih view sesuai kebutuhan
   - Daily = long-term trend
   - Hourly = troubleshooting

### 🔧 Technical Changes

```tsx
// DomainStatisticsDialog.tsx
- Import UptimeBar component
- Add getHourlyBarsData() function
- Change to 3 tabs: overview/hourly/response
- Tab 1: UptimeBar component (reuse dari Pin)
- Tab 2: Custom hourly bars dengan tooltip

// PinnedDomainCard.tsx
- Add DomainStatisticsDialog state
- Add label & link untuk clarity
- Integrate statistics dialog

// version.ts
- Bump to 3.5.2
```

### 📊 Chart Comparison

| View | Bar Unit | Count | Use Case |
|------|----------|-------|----------|
| **Pin Tab** | 1 day | 90 | Quick glance |
| **Statistics Tab 1** | 1 day | 90 | Same as Pin |
| **Statistics Tab 2** | 1 hour | 168 (7 days) | Troubleshooting |
| **Statistics Tab 3** | Line chart | 7-30 days | Performance |

### ✅ Impact
- Reduced user confusion about "why charts look different"
- Better mental model: Pin = mini, Statistics = full
- Consistent visualization across all views
- Easy comparison between domains

---

## Version 3.5.1 - Mobile UX Refinements
**Tanggal Rilis:** 8 Januari 2026

### 📱 Mobile UI/UX Improvements - Final Polish

#### 1. **Check Selesai Box - Compact & Minimalist**
- **Before**: Large box dengan padding besar, vertical layout
- **After**: Super compact single-row layout
  - Padding: `p-3` → `p-2.5` (space saving 40%)
  - Icon: 8x8 → 6x6 (lebih kecil)
  - Stats: Hapus label text, hanya angka + dot warna
  - Buttons: h-9 → h-7 (lebih pendek)
  - Reset: Icon-only X button
  - Export: Full desktop, icon-only mobile

#### 2. **Stats Bar - Responsive Layout**
- **Mobile**: 2-row layout dengan flex-wrap
  - Row 1: Status counts (Online, DNS, Offline)
  - Row 2: Mode info + badges (compact text)
- **Desktop**: Single row horizontal
- **Text simplification**:
  - "Mode Manual • 312" (lebih pendek)
  - "265 shown" badge (compact)
  - Timer: "5:32" format (bukan "5m 32s")
  - Progress bar hidden di mobile

#### 3. **Domain Card - Clean Layout**
- **Mobile**: Globe & Copy icons restored
- **Layout**: Simplified metadata display
  - IP + Response time di bawah
  - URL full width (tidak terpotong)
  - Flex-wrap untuk info

#### 4. **Footer - Center Alignment**
- **All text centered** untuk visual balance
- **Version number removed** (ada di Changelog button)
- **Single line**: "© 2026 Domain Monitor • Kabupaten Kendal"

#### 5. **Tab Kelola - Action Icons Visible**
- **Problem**: Icons terpotong/tidak terlihat di mobile
- **Solution**: 2-row responsive layout
  - Row 1: Checkbox + URL + Badges
  - Row 2: Bell + Action buttons (Play, Edit, Pin, Delete)
  - Icons align right, jelas terlihat
  - Touch target: 36px (h-9 w-9)
  - No dropdown menu, semua visible

### 🎯 Technical Changes
```typescript
// Compact Check Selesai box
<div className="p-2.5"> // was p-3/p-4
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <CheckSquare size={14} /> // was 18
      <span>Check Selesai!</span>
      <span>265</span> <span>44</span> <span>1</span>
    </div>
    <Button className="h-7 w-7"> // was h-9
      <X size={16} />
    </Button>
  </div>
</div>

// Kelola 2-row layout
<div className="flex flex-col md:flex-row gap-2">
  <div className="flex-1">URL + Badges</div>
  <div className="flex gap-1 justify-end">
    {/* All action icons visible */}
  </div>
</div>
```

### 📊 Impact
- ✅ 40% space saving di "Check Selesai" box
- ✅ All action icons visible di tab Kelola
- ✅ Mobile responsive lebih clean
- ✅ Better touch targets (36px minimum)
- ✅ Consistent layout across all screens

---

## Version 3.5.0 - Mobile Responsive Implementation
**Tanggal Rilis:** 8 Januari 2026

### 📱 Major Feature: Complete Mobile Responsive Design

#### 1. **Mobile Header with Hamburger Menu**
- **Hamburger drawer navigation** (Sheet component)
- **Responsive header elements**:
  - Logo & title stack vertical on mobile
  - Settings/Import/Export hidden, moved to menu
  - Refresh button always visible
- **Touch-friendly menu sections**:
  - Monitoring mode toggle
  - Import/Export functions  
  - Settings & notifications
  - Logout button
- **Spacing**: h-12 buttons, size-22 icons, px-6 padding

#### 2. **Responsive Tabs Navigation**
- **Mobile**: 3-column grid layout
  - Monitoring, Pin, Statistik (row 1)
  - Grup, Tag, Kelola (row 2)
  - Height: h-11, text: text-[11px]
  - Gap: gap-1 untuk compact spacing
- **Desktop**: 6-column single row
  - Height: h-9/h-10
  - Text: text-sm
- **Icon size**: 16px untuk better visibility

#### 3. **DomainCard Mobile Optimization**
- **Touch targets**: 40px minimum (iOS standard)
  - Checkbox: h-5 w-5 mobile, h-4 w-4 desktop
  - Action buttons: h-10 w-10 mobile, h-7/h-8 desktop
  - Icons: 18px mobile, 16px desktop
- **Layout responsive**:
  - Card padding: p-3.5 sama di mobile & desktop
  - Text: text-base mobile, text-sm desktop
  - Metadata: flex-col sm:flex-row (vertical stack mobile)
- **Three-dot dropdown menu** (mobile):
  - Play/Pause monitoring
  - Pin/Unpin domain
  - Copy URL & Open browser
  - Statistik
  - Delete
- **Desktop**: Icon buttons inline (tetap sama)

#### 4. **Info Hasil - Better Mobile Layout**
- **Color-coded dots** untuk setiap status
  - Green dot: Online
  - Orange dot: DNS Only
  - Red dot: Offline
- **Vertical layout mobile**:
  - Each status own line
  - Font-semibold numbers
- **Desktop**: Horizontal with bullets

#### 5. **Footer Responsive**
- **Mobile**: flex-col, multi-line layout
  - Copyright & location separate lines
  - Links wrapped with spacing
  - All center-aligned
- **Desktop**: flex-row, single line

### 🎯 Technical Implementation
```typescript
// Mobile header with hamburger
<div className="md:hidden">
  <MobileNav /> // Sheet drawer
</div>
<div className="hidden md:flex">
  {/* Desktop buttons */}
</div>

// Responsive tabs
<TabsList className="grid grid-cols-3 md:grid-cols-6 gap-1">
  <TabsTrigger className="h-11 md:h-9 text-[11px] md:text-sm">

// Touch targets
<Button className="h-10 w-10 md:h-7 md:w-7">
  <Icon size={18} className="md:hidden" />
  <Icon size={16} className="hidden md:block" />
</Button>
```

### 📊 Mobile Breakpoints
- **sm**: 640px
- **md**: 768px (main mobile/desktop split)
- **lg**: 1024px

### ✅ Testing Results
- ✅ Deployed to production: https://kendal-uptime.vercel.app
- ✅ User tested on real mobile device
- ✅ All UI elements accessible
- ✅ Touch targets meet iOS/Android guidelines
- ✅ No horizontal scroll
- ✅ Responsive at all breakpoints

---

## Version 3.4.3 - Cache Reset for Individual Monitoring
**Tanggal Rilis:** 8 Januari 2026

### 🔧 Bug Fix: Icon Pause Masih Muncul Setelah Refresh (Cache Issue)
- **FIXED: localStorage cache masih punya `enabled: true`**
  - User pause domain → Firebase tersimpan `enabled: false` ✅
  - Refresh page → Load dari localStorage cache yang masih `enabled: true` ❌
  - Icon tampil Pause (||) padahal seharusnya Play (▶️)
  - v3.4.2 hanya reset dari Firebase, tidak reset dari cache
  
### ✅ Solusi Implementasi
- **Reset `enabled` field saat load dari localStorage cache**
- **Reset di 3 tempat:**
  1. Load from cache (instant load)
  2. Load from Firebase (no cache scenario)
  3. Background refresh dari Firebase (30s interval)

### 🎯 Technical Details
```typescript
// BEFORE (Bug - cache tidak direset):
const parsedDomains = JSON.parse(cachedDomains)
setDomains(parsedDomains) // ❌ enabled: true masih ada

// AFTER (Fix - reset cache):
const parsedDomains = JSON.parse(cachedDomains)
const domainsWithResetEnabled = parsedDomains.map(domain => ({
  ...domain,
  enabled: false // ✅ Reset saat load dari cache
}))
setDomains(domainsWithResetEnabled)
```

### 📊 Impact
- ✅ Icon selalu akurat setelah refresh (Play untuk semua domain)
- ✅ Tidak ada state yang tersisa di cache
- ✅ Consistent behavior di semua load scenario

---

## Version 3.4.2 - Individual Monitoring Reset on Refresh
**Tanggal Rilis:** 8 Januari 2026

### 🔧 Bug Fix: Individual Monitoring Tidak Reset Setelah Refresh
- **FIXED: Icon Pause (||) masih tampil padahal sudah refresh**
  - Field `enabled: true` tersimpan di Firebase (persistent)
  - Saat refresh, domain di-load dengan `enabled: true` dari Firebase
  - Icon menampilkan Pause (||) tapi interval monitoring tidak berjalan
  - User expect: refresh = reset semua monitoring ke state awal
  
### ✅ Solusi Implementasi
- **Auto-reset `enabled` field ke `false` saat page load**
- **Individual monitoring bersifat temporary** - tidak persistent antar refresh
- **User harus klik Play lagi** setelah refresh untuk start monitoring
- **Konsisten dengan UX expectation** - refresh = bersih/reset state

### 🎯 Technical Details
```typescript
// BEFORE (Bug - enabled field persistent):
const domainsWithBatch = loadedDomains.map((domain) => {
  return {
    ...domain,
    enabled: domain.enabled // ❌ Preserve dari Firebase
  }
})

// AFTER (Fix - reset on load):
const domainsWithBatch = loadedDomains.map((domain) => {
  return {
    ...domain,
    enabled: false // ✅ Reset saat page load
  }
})
```

### 📊 Impact
- ✅ Icon Play/Pause sekarang akurat reflect monitoring state
- ✅ Refresh page akan reset semua individual monitoring
- ✅ User harus eksplisit start monitoring (lebih predictable)
- ✅ Tidak ada phantom monitoring state

### 💡 Design Decision
Individual monitoring adalah fitur **on-demand** untuk troubleshooting, bukan persistent monitoring. User yang butuh persistent monitoring sebaiknya pakai Auto-Check global atau enable auto-refresh.

---

## Version 3.4.1 - Pin Tab Firebase Sync Fix
**Tanggal Rilis:** 8 Januari 2026

### 🔧 Bug Fix: Pin Tab Tidak Sinkron Antar Device
- **FIXED: Pin status tidak tersimpan di Firebase**
  - Tombol pin/unpin hanya update state lokal, tidak sync ke Firebase
  - User report: "domain di-pin di device A, tapi tidak muncul di device B"
  - Group, Tag, dan Domain list bisa sync karena ada auto-sync useEffect
  
### ✅ Solusi Implementasi
- **Immediate Firebase sync saat pin/unpin** - Direct call `syncDomainsToFirestore()` 
- **Explicit logging** - Console.log untuk confirm sync berhasil
- **Updated toast messages** - Tampilkan "disinkronkan" untuk transparansi
- **Async/await pattern** - Ensure sync completes before showing success

### 🎯 Technical Details
```typescript
// BEFORE (Tidak sync ke Firebase):
const handleTogglePin = (id: string) => {
  setDomains(current =>
    (current || []).map(d =>
      d.id === id ? { ...d, pinned: !d.pinned } : d
    )
  )
  toast.success('Domain di-pin') // ❌ Hanya lokal
}

// AFTER (Sync ke Firebase):
const handleTogglePin = async (id: string) => {
  const updatedDomains = domains.map(d =>
    d.id === id ? { ...d, pinned: !domain?.pinned } : d
  )
  setDomains(updatedDomains)
  
  await syncDomainsToFirestore(updatedDomains) // ✅ Sync
  toast.success('Domain di-pin dan disinkronkan')
}
```

### 📊 Impact
- ✅ Pin status sekarang tersimpan di Firebase
- ✅ Pin/unpin domain di device A langsung sync ke device B
- ✅ Konsisten dengan Group & Tag yang sudah sync
- ✅ Explicit logging untuk troubleshooting

---

## Version 3.1.3 - Analytics Data Read Fix
**Tanggal Rilis:** 8 Januari 2026

### 🔧 Bug Fix: Analytics Tab Tidak Bisa Baca Data Firebase
- **FIXED: Firebase Composite Index Error** 
  - Query menggunakan `where + orderBy` memerlukan composite index
  - Firebase melempar error silent, return array kosong
  - User report: "data 20K+ di Firebase tapi chart kosong"
  
### ✅ Solusi Implementasi
- **Remove orderBy dari Firebase query** - Sort in-memory instead (lebih murah)
- **Tambah extensive logging** - Console.log untuk debug query Firebase
- **Improved error messages** - Tampilkan debug info jika data kosong
- **Better empty state** - Tampilkan Domain ID, collection name, query details

### 🎯 Technical Details
```typescript
// BEFORE (Error - butuh composite index):
const q = query(
  collection(db, DAILY_STATS_COLLECTION),
  where('domainId', '==', domainId),
  where('date', '>=', cutoffString),
  orderBy('date', 'desc')  // ❌ Composite index required
)

// AFTER (Fix - sort in-memory):
const q = query(
  collection(db, DAILY_STATS_COLLECTION),
  where('domainId', '==', domainId),
  where('date', '>=', cutoffString)  // ✅ No orderBy
)
// Sort in JavaScript after fetch
results.sort((a, b) => b.date.localeCompare(a.date))
```

### 📊 Impact
- ✅ Analytics tab sekarang bisa baca data dari Firebase
- ✅ Chart akan tampil jika data ada di `domain-stats-daily` collection
- ✅ Detailed logging untuk troubleshooting
- ✅ Clear error messages untuk user

### ⚠️ Note
Jika masih kosong setelah fix ini, berarti **data memang belum ada** di Firebase. Perlu enable auto-check untuk mulai collect data.

---

## Version 3.1.2 - Individual Domain Monitoring
**Tanggal Rilis:** 7 Januari 2026

### ⭐ Fitur Baru: Individual Domain Monitoring
- **Play/Pause Button per Domain**: Control monitoring individual untuk setiap domain
  - Play button: Start continuous monitoring setiap 5 menit
  - Pause button: Stop monitoring dan clear interval
  - Default state: Disabled (icon Play visible)
  - Independen dari global Auto/Manual mode
- **Smart Interval**: 288 checks per day per domain (optimal untuk grafik 24 jam)
- **Auto Firebase Sync**: Data otomatis masuk Firebase `domain-stats-daily` collection
- **Domain Statistics Dialog**: Klik icon chart untuk lihat:
  - Uptime percentage chart (7-day & 30-day)
  - Response time trends
  - Total incidents dan avg response time

### 🐛 Bug Fixes
- Fixed Firebase undefined values error saat sync domains
- Fixed individual monitoring interval closure staleness
- Fixed background refresh overwrite enabled field
- Fixed enabled field persistence saat page refresh
- Fixed Firebase listener preserve local state

### 🔧 Improvements
- Individual monitoring interval: 2 menit → 5 menit (4x lebih efisien)
- Improved console logging untuk debugging
- Better state management untuk enabled field

---

## Version 2.3.1 - Firebase Optimization & Charts
**Tanggal Rilis:** 7 Januari 2026

### 🎯 Optimasi Utama
- **Hourly Write Policy**: Kurangi Firebase operations 23% (14.4K → 11K ops/day)
- **Smart Conditional Writes**: Write hanya saat status berubah ATAU 1 jam berlalu
- **Field Baru**: `Domain.lastStatsWrite` untuk track Firebase sync timestamp
- **Quota Safety**: 45% margin di bawah limit 20K/day free tier

### 📊 Implementasi Charts
- **Komponen Baru**: `DomainCharts.tsx` untuk statistik detail per domain
- **Daily Uptime Chart**: Bar chart visual showing uptime % per hari
- **Response Time Trend**: Line chart response time rata-rata dengan min/max
- **Incident Timeline**: History lengkap downtime events dengan durasi
- **Multi-Timeframe**: Toggle antara 7-hari dan 30-hari view
- **Per-Domain Analytics**: Klik domain di Statistics tab untuk lihat charts

### 🎨 UI Enhancements
- **Statistics Tab**: Section baru "Statistik Detail Per Domain"
- **Domain Selector**: Grid view dengan status indicators
- **Color-Coded Charts**: Bar berwarna berdasarkan uptime/response time
- **Loading States**: Smooth transitions dan spinners
- **Responsive Design**: Works di semua ukuran layar

### 📁 Files Modified
- `src/lib/types.ts`: Tambah field `lastStatsWrite`
- `src/App.tsx`: Implement hourly write policy
- `src/components/DomainCharts.tsx`: NEW (364 lines)
- `src/components/StatisticsView.tsx`: Tambah domain selector
- `docs/OPTIMIZATION-SUMMARY.md`: NEW dokumentasi lengkap

### 📈 Metrics
- Firebase ops: 14,400 → 11,080/day (-23%)
- Monitoring frequency: Unchanged (20-min intervals)
- Chart accuracy: 100% (24 hourly data points)
- Scalability: Support 600 domains safely

---

## Version 2.3.0 - Current
**Tanggal Rilis:** 7 Januari 2026

### ✨ Fitur Baru
- **Staggered Auto-Check System**: Sistem cek otomatis dengan 4 batch untuk skalabilitas 300-400 domain
- **Smart Check History Storage**: Penyimpanan history dengan hourly aggregation untuk efisiensi Firebase quota
- **Incident Tracking**: Pelacakan otomatis insiden down/recovery dengan timestamp dan durasi
- **Batch Assignment**: Distribusi domain ke 4 batch secara round-robin untuk load balancing
- **Check Schedule Optimization**: Setiap batch cek setiap 20 menit (3x per jam) = ~72 checks/hari per domain

### 🎨 Peningkatan UI/UX
- **Batch Indicator Badge**: Badge "B1", "B2", "B3", "B4" pada DomainCard untuk identifikasi batch
- **Batch Tooltip**: Informasi schedule check per batch di tooltip
- **Auto-Check Toast**: Toast notification hanya menampilkan jumlah domain yang dicek per batch

### 🚀 Peningkatan Performa & Skalabilitas
- **Firebase Write Optimization**: ~600 writes/day untuk 400 domain (vs 115K naive approach)
- **Hourly Aggregation**: 24 hourly records per domain per day instead of raw check results
- **Incident-Based Storage**: Hanya simpan status changes, bukan setiap check
- **30-Day Retention**: Auto-cleanup data lebih dari 30 hari
- **Batch Window System**: Cek hanya domain dalam window saat ini, bukan semua domain

### 🗄️ Data Structure
- **domain-stats-daily**: Collection untuk daily statistics dengan hourly aggregates
- **domain-incidents**: Collection untuk tracking down/recovery incidents
- **DomainDailyStats Interface**: Stats dengan totalChecks, successChecks, uptimePercent, avgResponseTime, hourly[]
- **DomainIncident Interface**: Incident dengan startTime, endTime, duration, status, resolved flag
- **HourlyAggregate**: Struktur data per jam dengan checks, successChecks, avgResponseTime, status

### 🔧 Technical Implementation
- **check-history.ts**: Firebase integration module dengan 10+ functions
- **updateDailyStats()**: Update hourly aggregates after each check
- **createIncident()**: Create incident saat domain down/dns-only
- **resolveIncident()**: Mark incident resolved saat domain recovery
- **getDomainIncidents()**: Query incidents untuk date range (7/30 days)
- **getDomainStats()**: Get aggregated stats untuk charts
- **assignCheckBatch()**: Round-robin batch assignment algorithm
- **shouldCheckNow()**: Determine if domain should be checked based on batch schedule
- **getNextCheckTime()**: Calculate next check time for batch

### 📊 Data Capacity
- **Storage**: ~24MB untuk 400 domains × 30 days (dengan hourly aggregation)
- **Reads**: ~14,400/day (400 domains × 36 reads) - well under 50K limit
- **Writes**: ~600/day (400 domains × 1.5 writes) - well under 20K limit
- **Scale**: Dapat handle sampai 1000+ domains dengan adjustment

### 🔒 Preparation for Charts (Phase 2)
- Data structure siap untuk:
  - Uptime bar chart (7/30 days view)
  - Status timeline (24h incident view)
  - Response time line chart (trend analysis)
  - Downtime heatmap calendar
- Data collection dimulai otomatis setelah deployment
- Charts akan diimplementasikan setelah 24-48 jam data tersedia

### 🐛 Bug Fixes
- Fixed: Type error pada hourly.status dengan 'checking' status
- Fixed: Auto-refresh mencheck semua domain sekaligus (now batch-aware)
- Fixed: New domain tidak memiliki checkBatch assignment

---

## Version 2.2.0
**Tanggal Rilis:** 7 Januari 2026

### ✨ Fitur Baru
- **Slack Webhook Notifications**: Integrasi notifikasi real-time ke Slack untuk alert domain down/recovery
- **Per-Domain Notification Control**: Toggle enable/disable notifikasi untuk setiap domain secara individual
- **Enhanced Notification Details**: Notifikasi include info lengkap (group, tags, IP address, protocol, error details)
- **Notification Settings Dialog**: UI untuk konfigurasi webhook URL, notification rules, dan cooldown period
- **Notification Indicator**: Icon Bell di management list untuk menunjukkan status notifikasi per domain
- **Test Notification**: Fitur test webhook untuk verifikasi konfigurasi sebelum aktif monitoring
- **Cooldown System**: Anti-spam dengan cooldown 5 menit antar notifikasi untuk domain yang sama
- **Flexible Domain Validation**: Accept root domain (kendalkab.go.id) dan semua subdomain (*.kendalkab.go.id)

### 🎨 Peningkatan UI/UX
- **Bell Icon Button**: Icon Bell di header untuk akses cepat notification settings
- **Notification Status Visual**: Bell (blue filled) untuk enabled, BellSlash (gray) untuk disabled
- **Tooltip Notification Status**: Hover icon untuk lihat status tanpa perlu edit domain
- **Edit Domain Dialog Enhancement**: Tambah toggle "Enable Notifications" di dialog edit domain

### 🚀 Peningkatan Performa
- **No-CORS Mode**: Bypass CORS issue saat kirim webhook dari browser
- **Notification Service Class**: Dedicated service untuk handle webhook logic dan cooldown management
- **Smart Status Detection**: Deteksi perubahan status (Online→Offline, Offline→Online) untuk trigger notifikasi

### 🔒 Deployment & Infrastructure
- **Vercel Production**: Live di https://kendal-uptime.vercel.app (deployment saat ini via Vercel CLI)
- **Slack Integration**: Support Incoming Webhook dari Slack API untuk team notifications
- **Default Notification OFF**: Per-domain notifications default disabled untuk kontrol spam

### 🔧 Technical Implementation
- **NotificationService**: Class dengan methods sendSlackNotification, shouldNotify, clearCooldown, getRemainingCooldown
- **NotificationDetails Interface**: Structured data untuk webhook payload dengan group, tags, IP, protocol
- **Slack Block Kit**: Rich message format dengan header, fields, context, dan colored attachments
- **TypeScript**: Full typed notification system dengan NotificationSettings interface
- **localStorage Persistence**: Notification settings tersimpan lokal per browser

### 🐛 Bug Fixes
- Fixed: Domain validation reject root domain "kendalkab.go.id"
- Fixed: CORS error saat kirim Slack webhook dari browser
- Fixed: Test notification blocked oleh cooldown system
- Fixed: EditDomainDialog syntax error (DialogDescription typo)

---

## Version 2.1.0
**Tanggal Rilis:** 6 Januari 2026

### ✨ Fitur Baru
- **Firebase Cloud Sync**: Data domain, grup, dan tag otomatis tersimpan di cloud Firebase Firestore
- **Cross-Device Support**: Buka aplikasi di PC, data yang sama muncul di tablet/HP secara real-time
- **Hybrid Storage**: Kombinasi Firebase (cloud) + localStorage (offline) untuk reliability maksimal
- **Password Authentication**: Login dengan password untuk membatasi akses edit dan delete
- **Auto-Logout Timer**: Sistem otomatis logout setelah 30 menit tidak ada aktivitas (klik, ketik, scroll)
- **Change Password Dialog**: Dialog untuk mengganti password admin dari aplikasi
- **Activity Tracking**: Deteksi aktivitas user (mousedown, keydown, scroll, touchstart) untuk reset timer logout

### 🎨 Peningkatan UI/UX
- **Logo Optimasi**: Logo dikonversi dari PNG (105KB) ke WebP (26KB) - hemat 75% ukuran file
- **Favicon Transparent**: Favicon PNG 32x32 dengan background transparan dan aspect ratio benar
- **Loading State**: Indikator loading saat data sedang dimuat dari Firebase
- **Login Dialog**: Modal login dengan password input (show/hide toggle) dan validasi
- **Settings Dialog**: Modal untuk ubah password (current, new, confirm) dengan validasi minimal 6 karakter

### 🚀 Peningkatan Performa
- **Firestore Real-time Sync**: Perubahan data di satu device langsung ter-update di device lain tanpa refresh
- **Automatic Sync**: Data otomatis di-sync ke Firebase setiap kali ada perubahan (add, edit, delete)
- **Fallback Mechanism**: Jika Firebase error, aplikasi fallback ke localStorage tanpa data hilang
- **Efficient Loading**: Load data dari Firebase hanya sekali saat aplikasi pertama kali dibuka

### 🔒 Keamanan & Deployment
- **Password Protection**: Fitur edit dan delete hanya bisa diakses setelah login
- **Session Management**: Session login dengan auto-expire 30 menit inactivity
- **Firestore Security Rules**: Data per-user dengan rules `allow read, write: if true` di Firebase Console
- **Vercel Deployment**: Deploy otomatis ke Vercel production (https://kendal-uptime.vercel.app)
- **Firebase Project**: Integrated dengan project "kendal-monitor" di Firebase Console
- **Environment Config**: Firebase config tersimpan di `src/lib/firebase.ts` dengan production credentials

### 🔧 Technical Implementation
- **Firebase SDK**: Menggunakan `firebase/app` dan `firebase/firestore` versi terbaru
- **Firestore Collections**: 3 collection (domains, groups, tags) dengan userId sebagai document ID
- **Sync Functions**: `syncDomainsToFirestore()`, `getDomainsFromFirestore()`, `loadDomains()` dengan error handling
- **Real-time Listener**: `subscribeToDomainsUpdates()` untuk listen perubahan data secara real-time
- **localStorage Backup**: Data tetap tersimpan di localStorage sebagai backup lokal
- **TypeScript**: Full TypeScript dengan proper typing untuk Firebase operations

### 🐛 Bug Fixes
- Fixed: Data tidak sync antar device (sebelumnya hanya localStorage)
- Fixed: Logo dan favicon tidak muncul (URL external blocked)
- Fixed: Favicon stretched karena aspect ratio salah
- Fixed: Read-only mode toggle dihapus (simplified untuk single admin use case)

---

## Version 2.0.0
**Tanggal Rilis:** 2024

### ✨ Fitur Baru
- **Tab Statistik**: Visualisasi data monitoring dengan chart dan analisis mendalam
- **Sistem Tag**: Organisir domain dengan multiple tags per domain
- **Mode Manual Check**: Opsi untuk check domain sekali klik tanpa auto-refresh
- **Export Terfilter**: Export domain berdasarkan filter dan grup aktif
- **Multi-Select Delete**: Hapus banyak domain sekaligus di tab Kelola Data
- **Edit Domain**: Edit URL domain langsung dari tab Kelola Data
- **Filter by Group & Tag**: Filter domain berdasarkan grup atau tag di tab Kelola Data

### 🎨 Peningkatan UI/UX
- **Virtualized List**: Optimasi performa rendering untuk ratusan domain
- **Scroll Area Fixed**: Header tetap di atas saat scroll list domain
- **Copy URL**: Klik URL domain untuk langsung copy ke clipboard
- **Status Indicators**: Glow effect pada status online/offline/DNS only
- **Responsive Layout**: Tampilan lebih baik di berbagai ukuran layar
- **Clear Status Button**: Reset hasil check manual dengan mudah

### 🚀 Peningkatan Performa
- **Debounced Search**: Search lebih smooth dengan delay 300ms
- **Lazy Loading**: Render domain secara bertahap untuk performa optimal
- **Optimized Filtering**: Filter dan sort lebih cepat dengan memoization

### 🐛 Bug Fixes
- Fixed: Export CSV tidak terdownload di browser
- Fixed: Font color hitam setelah publish
- Fixed: CSS tidak terbaca di production
- Fixed: Checkbox outline terpotong di Kelola Data
- Fixed: Padding dan alignment di card domain
- Fixed: Filter dan search mengalami lag dengan 300+ domain

### 📊 Data & Export
- Export semua domain ke CSV
- Export domain per grup ke CSV
- Export domain terfilter ke CSV
- Import domain dari CSV dengan grup assignment
- Status monitoring: Online, DNS Only, Offline
- Response time tracking per domain

### 🔧 Fitur Teknis
- Auto-refresh setiap 60 detik (bisa di-pause)
- Manual check on-demand
- Persistent data dengan KV storage
- Real-time status updates
- Domain validation dan duplicate checking

---

## Version 1.0.0 - Initial Release
**Tanggal Rilis:** 2023

### ✨ Fitur Awal
- Domain monitoring dasar dengan status online/offline
- Auto-refresh monitoring
- Import/Export CSV
- Sistem grup domain
- Filter dan search domain
- Dashboard monitoring real-time

### 🎨 Design
- Dark theme dengan Space Grotesk & JetBrains Mono
- Shadcn UI components
- Phosphor icons
- Tailwind CSS styling
