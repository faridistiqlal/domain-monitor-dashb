# Changelog

## Version 2.0.0 - Current
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
