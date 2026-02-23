# 📖 USER GUIDES - Domain Monitor

**App:** Domain Monitor Dashboard - Kabupaten Kendal  
**URL:** https://kendal-uptime.vercel.app (Live on Vercel)  
**Version:** 3.11.6  
**Deployment:** Vercel Production (Manual deploy via Vercel CLI)

> **Status:** Source of Truth (operasional)

---

## 🚀 Quick Start

### First Time Setup:
1. **Access App** - Buka https://kendal-uptime.vercel.app
2. **Login** - Masukkan username + password yang diberikan admin
3. **Setup Notifications (Optional)** - Klik Bell icon → Setup Slack webhook
4. **Add Domain** - Klik "Tambah Domain", masukkan URL (contoh: `diskominfo.kendalkab.go.id`)
5. **Check Status** - Klik "Check" atau aktifkan Auto-refresh
6. **Enable Notifications** - Edit domain → Toggle "Enable Notifications"

### Daily Usage:
- **Auto-refresh:** Toggle ON untuk monitoring real-time (60 detik)
- **Manual Check:** Toggle OFF dan klik "Check" untuk on-demand (ada cooldown 30 detik antar check)
- **Filter:** Gunakan filter status (Online/DNS Only/Offline)
- **Search:** Ketik nama domain untuk cari cepat
- **Export:** Download CSV untuk reporting
- **Slack Alerts:** Otomatis dapat notifikasi saat domain down/recovery
- **Mobile Settings:** Menu mobile sekarang mendukung Pengaturan Notifikasi, Riwayat Notifikasi, Management Akun, dan Log History (admin).
- **Insights Cepat:** Domain card menampilkan uptime 7d/30d dan sparkline tren response time.

### Role Permissions Summary
- **Admin:** Full access (read/write domains, groups, tags, manage users)
- **Add-only:** Bisa tambah/ubah data domain (write `domains`), tapi tidak bisa write `groups` dan `tags`
- **Viewer:** Read-only (tidak bisa write `domains/groups/tags`)
- Semua role aktif bisa membaca data monitoring sesuai sesi login
- Label di UI untuk `add-only` bisa tampil sebagai **Add URL Only**

---

## 🔔 Slack Notifications Setup (NEW)

### Initial Setup:
1. **Create Slack Webhook:**
   - Buka https://api.slack.com/apps
   - Click "Create New App" → "From scratch"
   - Nama: "Domain Monitor Alerts", pilih workspace
   - Pilih "Incoming Webhooks" → Toggle ON
   - Click "Add New Webhook to Workspace"
   - Pilih channel (misalnya: #monitoring atau #alerts)
   - Copy Webhook URL (format: `https://hooks.slack.com/services/...`)

2. **Configure in App:**
   - Klik icon **Bell (🔔)** di header
   - Paste Webhook URL di field "Slack Webhook URL"
   - Set notification rules:
     - ✅ Notify on Down (domain goes offline)
     - ✅ Notify on Recovery (domain back online)
     - ⬜ Notify on Slow (optional, >5s response)
   - Set cooldown: 5 minutes (default)
   - Click **"Send Test"** untuk test webhook
   - Click **"Save Settings"**
   - ✅ Settings **otomatis tersimpan di Firebase** (sync antar device)

3. **Enable Per-Domain:**
   - Tab "Kelola Data" → Click icon **Pencil (✏️)** di domain
   - Toggle **"Enable Notifications"** → ON (warna biru)
   - Click "Simpan"
   - ✅ Settings domain **otomatis sync ke Firebase**
   - Icon **Bell 🔔** (biru) = notifikasi aktif
   - Icon **BellSlash 🔕** (abu) = notifikasi nonaktif

### Notification Details:
Setiap notifikasi Slack include:
- Domain URL (clickable link)
- Status (DOWN/RECOVERY/SLOW)
- Group name (jika assigned)
- Tags (semua tag domain)
- IP Address
- Protocol (HTTP/HTTPS)
- Response Time (untuk recovery/slow)
- Error Details (untuk down alert)
- Timestamp (WIB timezone)
- Dashboard link

### Tips:
- ✅ **Semua settings tersimpan di Firebase** - aman dan sync antar device
- ✅ Webhook URL dan notification rules sync otomatis ke cloud
- ✅ Per-domain notification settings juga tersimpan di Firebase
- Default semua domain notification OFF - harus manual enable
- Cooldown mencegah spam untuk domain yang sama
- Notifikasi hanya kirim saat **perubahan status**, bukan setiap check
- Test webhook dulu sebelum enable semua domain

---

## 🎯 Features Guide

### 1. Domain Management

#### Add Domain
1. Klik tombol **"Tambah Domain"** di tab Monitoring atau Kelola Data
2. Masukkan URL (support format: `kendalkab.go.id`, `sub.kendalkab.go.id`, `https://domain.kendalkab.go.id`)
3. Sistem validasi: hanya `kendalkab.go.id` atau subdomain-nya diterima
4. Klik "Tambah" - domain langsung masuk list

#### Edit Domain
1. Buka tab **"Kelola Data"**
2. Klik icon **Edit (pensil)** pada domain
3. Ubah URL atau toggle "Enable Notifications"
4. Klik "Simpan"

#### Delete Domain
1. Tab Monitoring: Klik icon **Trash** pada domain card
2. Tab Kelola Data: 
   - Single: Klik icon Trash
   - Bulk: Centang multiple domains → Klik "Hapus Terpilih"

#### Import CSV
1. Klik tombol **"Import CSV"**
2. Upload file CSV dengan format:
   ```csv
   Domain,Grup
   https://domain1.kendalkab.go.id,SKPD A
   https://domain2.kendalkab.go.id,SKPD B
   ```
3. Preview akan muncul
4. Klik "Import" untuk konfirmasi

#### Export CSV
- **Export All:** Klik "Export Semua Domain"
- **Export Filtered:** Filter/search dulu, lalu klik "Export Terfilter"
- **Export by Group:** Buka grup detail, klik "Export Semua"

Format CSV export:
```csv
Domain,Status,IP Address,Response Time,Protocol,Last Checked
https://domain.kendalkab.go.id,online,103.X.X.X,245ms,HTTPS,2026-01-07 10:30:15
```

---

### 2. Monitoring System

#### Status Indicator (3-State)

**🟢 ONLINE** - Domain fully accessible
- ✓ DNS dapat resolve domain ke IP
- ✓ Web server (HTTP/HTTPS) merespons
- ✓ Response time < 15 detik
- Badge: HTTPS atau HTTP

**🟡 DNS ONLY** - Server reachable but web down
- ✓ DNS dapat resolve (bisa di-ping)
- ✗ Web server tidak merespons
- Kemungkinan penyebab:
  - Web server down (Apache/Nginx mati)
  - Port 80/443 diblokir firewall
  - IP restriction (hanya akses dari IP tertentu)
  - Virtual host misconfiguration

**🔴 OFFLINE** - Domain unreachable
- ✗ DNS gagal resolve
- ✗ Domain tidak bisa dijangkau sama sekali
- Kemungkinan penyebab:
  - DNS record tidak ada
  - Server benar-benar mati
  - Network issue total

#### Auto-Refresh Mode
1. Toggle **Auto-refresh** ON (di header)
2. Sistem check semua domain setiap **60 detik**
3. Progress bar & countdown timer ditampilkan
4. Klik **Pause** untuk temporary stop
5. Klik **Play** untuk resume

#### Manual Check Mode
1. Toggle **Auto-refresh** OFF
2. Klik tombol **"Check"** untuk mulai
3. Setelah check, tombol akan cooldown ±30 detik sebelum bisa dipakai lagi
4. Progress indicator muncul
5. Setelah selesai: Summary toast + export button
6. Klik **"Clear"** untuk reset hasil

#### Domain Insights (Baru)
- Setiap domain menampilkan ringkasan uptime **7d** dan **30d** (jika data tersedia).
- Sparkline kecil menampilkan tren response time terbaru untuk baca pola naik/turun secara cepat.
- Insight tampil di list Monitoring dan juga di card pada tab Pin.

---

### 3. Group Management

#### Create Group
1. Buka tab **"Kelola Grup"**
2. Klik **"Buat Grup"**
3. Isi nama grup (contoh: "SKPD Dinas")
4. Pilih warna untuk visual coding
5. (Optional) Tambah deskripsi
6. Klik "Simpan"

#### Assign Domains to Group
1. Di tab Kelola Grup, klik **"Assign Domain"** pada group card
2. Centang domain yang ingin dimasukkan
3. Klik "Simpan"

#### View Group Detail
1. Klik card grup untuk buka detail view
2. Melihat semua domain dalam grup
3. Statistics scoped ke grup tersebut
4. Export hanya domain dalam grup

---

### 4. Tag System

#### Create Tag
1. Buka tab **"Kelola Tag"**
2. Klik **"Buat Tag"**
3. Isi nama tag (contoh: "Critical", "Low Priority")
4. Pilih warna
5. Klik "Simpan"

#### Assign Tags
1. Tab Kelola Tag, klik **"Assign Domain"** pada tag
2. Centang domain (bisa multiple)
3. Satu domain bisa punya banyak tag
4. Klik "Simpan"

#### Filter by Tag
1. Tab Kelola Data
2. Dropdown "Filter Tag"
3. Pilih tag
4. List akan filter otomatis

---

### 5. Pin Domains (Quick Access)

#### Pin a Domain
1. **From Tab Monitoring:**
   - Klik icon **MapPin** (📌) di domain card
   - Domain langsung ter-pin dan tersimpan ke Firebase
   
2. **From Tab Kelola Data:**
   - Klik icon **MapPin** (📌) di action buttons
   - Atau dropdown → "Pin Domain"

#### View Pinned Domains
1. Buka tab **"Pin"**
2. Semua pinned domains tampil dalam grid layout
3. Quick actions: Unpin, Open URL, Copy URL
4. Statistics quick view untuk setiap pinned domain

#### Cross-Device Sync (v3.8.8)
- **Pin di laptop** → Otomatis muncul di PC/tablet lain
- **Pin state tersimpan di Firebase** (cloud sync)
- **Sinkronisasi otomatis** setiap 30 detik (background refresh)
- **100% konsisten** antar semua device yang login

#### Tips:
- Pin domain yang sering Anda monitor
- Maximum recommended: 10-15 pinned domains
- Tab Pin akan auto-check pinned domains saat dibuka

---

### 6. Search & Filter

#### Search
- Ketik nama domain di search box
- Debounced 300ms (instant results)
- Search di semua data, render hanya visible items

#### Filter by Status
- **All** - Tampilkan semua
- **Online** - Hanya yang hijau
- **DNS Only** - Hanya yang kuning
- **Offline** - Hanya yang merah

#### Sort
- **Default** - Urutan input
- **Name A-Z** - Alfabetis ascending
- **Name Z-A** - Alfabetis descending
- **Online First** - Hijau di atas
- **Offline First** - Merah di atas

---

### 7. Statistics View

Buka tab **"Statistik"** untuk melihat:
- Total domains
- Online/DNS Only/Offline count
- Charts & visualizations
- Average response time
- Trends over time

---

### 8. Authentication & Security

#### Login
1. Saat buka app, dialog login muncul
2. Masukkan username + password akun Anda
3. Klik "Login"
4. Setelah login, semua fitur aktif

#### Change Password
1. Setelah login, klik icon **Kunci** di header
2. Masukkan password saat ini
3. Masukkan password baru (min 6 karakter)
4. Konfirmasi password baru
5. Klik "Simpan"
6. Password auto-sync ke Firebase cloud

#### Auto-Logout
- Session otomatis berakhir setelah **30 menit** tidak ada aktivitas
- Aktivitas: mouse click, keyboard, scroll, touch
- Warning muncul **2 menit** sebelum logout
- Countdown toast: "Session akan berakhir dalam X menit"

#### Logout Manual
- Klik tombol **"Logout"** di header
- Session langsung berakhir
- Kembali ke login screen

#### Sinkron Logout Antar Tab (Baru)
- Jika logout di satu tab, tab lain akan ikut logout otomatis.
- Mekanisme ini menjaga konsistensi sesi dan mengurangi risiko sesi tertinggal aktif.

---

## 🔧 Troubleshooting

### Problem: Banyak Domain Berstatus "DNS Only"

**Possible Causes:**

#### 1. Web Server Down
**Gejala:** Server bisa di-ping, tapi HTTP/HTTPS tidak bisa diakses  
**Solusi:**
```bash
# Restart Apache
sudo systemctl restart httpd

# Restart Nginx
sudo systemctl restart nginx

# Check status
sudo systemctl status httpd
sudo systemctl status nginx
```

#### 2. Firewall Blocking Port 80/443
**Gejala:** DNS resolve, tapi koneksi timeout  
**Solusi:**
```bash
# Check firewall rules
sudo firewall-cmd --list-all
sudo iptables -L -n

# Allow HTTP/HTTPS
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

#### 3. IP Restriction (Network-Specific)
**Gejala:** Bisa diakses dari jaringan tertentu, tidak bisa dari lain  
**Solusi:**
```bash
# Check .htaccess di document root
cat /path/to/public_html/.htaccess

# Contoh blocking:
# Order Deny,Allow
# Deny from all
# Allow from 192.168.1.0/24

# Check iptables untuk IP blocking
sudo iptables -L INPUT -n | grep -E '80|443'

# Check web server logs
sudo tail -f /var/log/httpd/error_log
sudo tail -f /var/log/nginx/error.log
```

**Test dari IP berbeda:**
```bash
# Gunakan curl dari server lain
curl -I https://domain.kendalkab.go.id

# Atau online tools:
# - https://tools.pingdom.com/
# - https://www.websiteplanet.com/webtools/down-or-not/
```

#### 4. Virtual Host Misconfiguration
**Gejala:** Domain tidak configured di web server  
**Solusi:**
```bash
# Apache - check virtual host config
ls -la /etc/httpd/conf.d/
cat /usr/local/apache/conf/httpd.conf

# Nginx - check sites config
ls -la /etc/nginx/sites-available/
cat /etc/nginx/nginx.conf

# Test configuration
sudo apachectl configtest  # Apache
sudo nginx -t              # Nginx

# Reload after fix
sudo systemctl reload httpd
sudo systemctl reload nginx
```

---

### Problem: Domain Status Tidak Update

**Solusi:**
1. **Manual Check:** Toggle off auto-refresh, klik "Check" manual
2. **Clear Cache:** Hard refresh browser (Ctrl+Shift+R)
3. **Check Firebase:** Lihat Firebase Console untuk data sync
4. **Logout/Login:** Kadang session perlu di-reset

---

### Problem: Export CSV Tidak Download

**Solusi:**
1. **Check Permission:** Pastikan sudah login dengan role aktif (`admin`, `add-only`, atau `viewer`)
2. **Check Status:** Pastikan sudah check domain dulu (manual mode)
3. **Browser:** Coba browser berbeda (Chrome, Firefox, Edge)
4. **Pop-up Blocker:** Allow pop-ups dari domain app

---

### Problem: Import CSV Gagal

**Solusi:**
1. **Check Format:** Pastikan format CSV benar:
   ```csv
   Domain,Grup
   https://domain1.kendalkab.go.id,Nama Grup
   ```
2. **Check Encoding:** Save CSV sebagai UTF-8
3. **No Extra Columns:** Hanya 2 kolom (Domain, Grup)
4. **Valid URLs:** Semua URL harus valid dan .kendalkab.go.id

---

### Problem: Auto-Logout Terlalu Cepat

**Penjelasan:** Auto-logout designed 30 menit tanpa aktivitas

**Solusi:**
- Gerakkan mouse atau klik sesekali
- Tidak ada setting untuk disable (by design, security)
- Warning 2 menit sebelum logout untuk reminder

---

### Problem: CORS Error di Console

**Penjelasan:** Browser security limitation saat check domain dari client-side

**Expected Behavior:**
- DNS check: Work (via Google DNS API)
- HTTP/HTTPS check: Might fail due to CORS
- Result: Kadang status "DNS Only" walaupun web accessible

**Ini Normal:** Bukan bug, tapi limitasi browser. Domain tetap bisa accessible via browser langsung.

---

### Problem: Firebase Not Syncing

**Solusi:**
1. **Check Internet:** Pastikan koneksi stabil
2. **Check Firebase Console:** Verifikasi data di Firestore
3. **Fallback:** App pakai localStorage jika Firebase gagal
4. **Re-sync:** Logout → Login untuk force sync

---

## 💡 Tips & Best Practices

### Organization:
- **Grup by Department:** Buat grup per SKPD/OPD
- **Tags for Priority:** Tag "Critical" untuk domain penting
- **Regular Cleanup:** Hapus domain yang sudah tidak terpakai

### Monitoring:
- **Auto-refresh ON:** Untuk monitoring real-time sepanjang hari
- **Manual Mode:** Untuk check sekali waktu atau troubleshooting
- **Export Regular:** Download CSV setiap minggu untuk archive

### Security:
- **Change Password:** Ganti password akun secara berkala
- **Strong Password:** Min 8 karakter, mix upper/lower/number
- **Don't Share:** Jangan share password ke banyak orang

### Performance:
- **Limit Domains:** Max 500 domain untuk performa optimal
- **Use Groups:** Organize untuk easier navigation
- **Close Tabs:** Tutup tab yang tidak dipakai

---

## 🆘 Need More Help?

1. **Check Documentation:**
   - [NOW.md](./NOW.md) - Status sistem, versi, roadmap, workflow
   - [CHANGELOG.md](./CHANGELOG.md) - Detail histori rilis
   - [GUIDES.md](./GUIDES.md) - File ini

2. **Check Console:**
   - Press F12 di browser
   - Tab "Console" untuk error messages
   - Screenshot untuk reporting

3. **Check Firebase:**
   - Login ke Firebase Console
   - Project: kendal-monitor
   - Check Firestore data

4. **Test Different Network:**
   - Try dari jaringan berbeda
   - Use VPN untuk test IP restriction
   - Compare hasil

---

**Last Updated:** 23 Februari 2026  
**App Version:** 3.11.6  
**Guide Status:** ✅ Complete & Up-to-date
