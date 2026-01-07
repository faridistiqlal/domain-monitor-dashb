# Changelog

## Version 2.2.0 - Current
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
- **Vercel Production**: Live di https://kendal-uptime.vercel.app dengan auto-deploy dari Git
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

---

## Roadmap

### 🔮 Fitur Mendatang
- **Historical Data**: Track perubahan status domain dari waktu ke waktu
- **Alert Notifications**: Notifikasi ketika domain down
- **Uptime Percentage**: Hitung persentase uptime per domain
- **Bulk Operations**: Import/export dengan lebih banyak format
- **Advanced Analytics**: Lebih banyak insight dan visualisasi
- **API Integration**: Webhook dan API untuk integrasi external
- **Custom Check Interval**: Atur interval check per domain atau grup
- **SSL Certificate Monitoring**: Check status SSL certificate
- **Multi-User Support**: Kolaborasi team dengan role management
