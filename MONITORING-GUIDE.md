# Domain Monitoring Dashboard - Kabupaten Kendal

Dashboard monitoring real-time untuk melacak status availability dari multiple website subdomain .kendalkab.go.id. Memberikan visual feedback langsung mengenai website mana yang accessible dan mana yang experiencing downtime.

## Fitur Utama

### 🎯 Enhanced Status Detection
- **Online (Hijau)**: Domain dapat di-resolve DAN web server merespons dengan baik
- **DNS Only (Kuning)**: Domain dapat di-resolve (bisa di-ping) TAPI web server tidak merespons
- **Offline (Merah)**: Domain tidak dapat di-resolve sama sekali (DNS gagal)

### 🔍 Network-Specific Issue Detection

**Problem yang Diselesaikan:**
Terkadang ada kasus dimana:
- Domain bisa di-ping ✓
- Website tidak bisa diakses dari jaringan tertentu ✗
- Website bisa diakses dari jaringan lain ✓

**Solusi:**
Sistem sekarang mendeteksi error yang lebih detail dengan:

1. **Dual Protocol Check**: Mencoba HTTPS terlebih dahulu, jika gagal mencoba HTTP
2. **Enhanced Error Detection**: Menangkap berbagai tipe error:
   - `Connection Timeout`: Request timeout (>15 detik)
   - `Network Unreachable`: Network tidak dapat menjangkau server (ERR_ADDRESS_UNREACHABLE)
   - `Connection Failed`: Koneksi gagal karena alasan lain
3. **Detailed Diagnostics**: Tooltip pada setiap domain menampilkan:
   - Status DNS (Resolvable/Not resolvable)
   - IP Address
   - Status Web Server (Accessible/Not accessible)
   - Protocol yang berhasil (HTTP/HTTPS)
   - Response time
   - Error message spesifik

### 🛠️ Troubleshooting Guide

**Untuk Status "DNS Only" (Domain bisa di-ping tapi web tidak bisa diakses):**

Kemungkinan penyebab:
1. **Web Server Down**: Apache/Nginx tidak berjalan
   - Solusi: Restart web server di cPanel/VM
   - Command: `sudo systemctl restart httpd` atau `sudo systemctl restart nginx`
   
2. **Firewall Blocking**: Port 80/443 diblokir
   - Solusi: Cek konfigurasi firewall (iptables, firewalld, atau cPanel firewall)
   - Command: `sudo firewall-cmd --list-all` atau `sudo iptables -L -n`
   
3. **Network-Specific Restriction**: Website hanya bisa diakses dari IP/network tertentu
   - Solusi: 
     - Cek file `.htaccess` untuk `Allow from` atau `Deny from` directives
     - Cek iptables rules: `sudo iptables -L -n`
     - Cek cPanel IP Blocker di WHM/cPanel interface
     - Gunakan VPN atau jaringan lain untuk testing
   
4. **Virtual Host Misconfiguration**: Domain tidak dikonfigurasi di web server
   - Solusi: Verifikasi virtual host configuration
   - Apache: `/etc/httpd/conf.d/` atau `/usr/local/apache/conf/httpd.conf`
   - Nginx: `/etc/nginx/sites-available/` atau `/etc/nginx/conf.d/`

**Kasus Network-Specific (Bisa di-ping tapi tidak bisa diakses):**

Jika monitoring menunjukkan "DNS Only" dengan error "Network Unreachable" tapi Anda bisa akses dari jaringan lain, ini indikasi strong ada IP restriction:

**Langkah Troubleshooting:**

1. **Cek .htaccess di document root:**
   ```apache
   # Contoh blocking
   Order Deny,Allow
   Deny from all
   Allow from 192.168.1.0/24
   
   # atau
   Require ip 192.168.1.0/24
   ```

2. **Cek iptables firewall:**
   ```bash
   # Lihat semua rules
   sudo iptables -L -n -v
   
   # Cek rules untuk port 80/443
   sudo iptables -L INPUT -n | grep -E '80|443'
   ```

3. **Cek log web server untuk blocked requests:**
   ```bash
   # Apache
   sudo tail -f /var/log/httpd/error_log
   sudo tail -f /var/log/httpd/access_log
   
   # Nginx
   sudo tail -f /var/log/nginx/error.log
   sudo tail -f /var/log/nginx/access.log
   ```

4. **Test dari IP berbeda:**
   ```bash
   # Dari server lain atau VPS
   curl -I https://subdomain.kendalkab.go.id
   
   # Atau gunakan online tools
   # - https://tools.pingdom.com/
   # - https://www.websiteplanet.com/webtools/down-or-not/
   ```

5. **Cek ModSecurity atau Firewall Application (cPanel):**
   - Login ke WHM
   - Cek ConfigServer Security & Firewall (CSF) jika installed
   - Cek ModSecurity rules

### 📊 Monitoring Features

- ✅ Auto-refresh setiap 60 detik
- ✅ Manual refresh button
- ✅ Filter by status (All, Online, DNS Only, Offline)
- ✅ Search domains
- ✅ Sort by name atau status
- ✅ Export/Import CSV
- ✅ Protocol detection (HTTP/HTTPS badge untuk online sites)
- ✅ Response time monitoring
- ✅ IP address display
- ✅ Detailed error messages in tooltips

## Cara Kerja Monitoring

1. **DNS Check**: Sistem me-resolve domain ke IP address menggunakan Google DNS API
2. **HTTPS Check**: Mencoba akses website via HTTPS (15 detik timeout)
3. **HTTP Fallback**: Jika HTTPS gagal, mencoba HTTP (15 detik timeout)
4. **Error Detection**: Menangkap error spesifik:
   - `AbortError` → Connection Timeout
   - `Failed to fetch` / `NetworkError` → Network Unreachable
   - Other errors → Connection Failed
5. **Status Update**: Update UI dengan status, protocol badge, dan detail error

## Status Definitions

### 🟢 Online
Website fully accessible:
- ✓ DNS dapat me-resolve domain ke IP
- ✓ Web server (HTTP/HTTPS) merespons dengan baik
- ✓ Response time < 15 detik
- Badge menunjukkan protokol (HTTPS atau HTTP)

### 🟡 DNS Only  
Server reachable but web service down:
- ✓ DNS dapat me-resolve domain ke IP (bisa di-ping)
- ✗ Web server tidak merespons (HTTP/HTTPS failed)
- Tampilkan warning icon dengan tooltip detail error
- Error bisa: Connection Timeout, Network Unreachable, atau Connection Failed

### 🔴 Offline
Domain completely unreachable:
- ✗ DNS gagal me-resolve domain
- Domain tidak terdaftar, DNS server down, atau DNS record salah
- Error: "DNS tidak dapat di-resolve (Domain tidak terdaftar atau DNS down)"

## UI Features

### Filter & Search
- **Filter buttons**: Semua | Online | DNS Only | Offline
- **Search bar**: Filter domain by name
- **Sort dropdown**: Default | Nama A-Z | Nama Z-A | Online Pertama | Offline Pertama

### Domain Card Information
Setiap domain card menampilkan:
- Status indicator (dot dengan glow effect)
- Domain name (monospace font)
- IP Address (jika tersedia)
- Protocol badge (HTTP/HTTPS) untuk online sites
- Status text dengan color coding
- Warning icon untuk DNS Only status (dengan tooltip)
- Response time atau error message
- Delete button

### Statistics Bar
- Online count dengan indicator hijau
- DNS Only count dengan indicator kuning (jika ada)
- Offline count dengan indicator merah
- Auto-refresh info dan total domain count

## Best Practices

1. **Regular Monitoring**: Cek dashboard secara berkala untuk early detection
2. **Document IP Restrictions**: Catat website mana saja yang punya IP whitelisting/blacklisting
3. **Test Multiple Networks**: Untuk "DNS Only" status, test dari jaringan berbeda untuk confirm network-specific issues
4. **Check Server Logs**: Selalu cek log server untuk detail error dan pattern
5. **Firewall Documentation**: Dokumentasikan rules firewall untuk troubleshooting cepat
6. **Export Regular Reports**: Gunakan fitur export CSV untuk record keeping
7. **Set Alerts**: Monitor sites kritis lebih sering dan setup external alerts jika needed

## Common Issues & Solutions

### Issue: "DNS Only" tapi bisa diakses dari komputer kantor
**Penyebab**: IP whitelisting di firewall atau .htaccess  
**Solusi**: Tambahkan IP monitoring system ke whitelist atau hapus IP restriction

### Issue: Semua domain "Offline" padahal bisa diakses
**Penyebab**: DNS Google blocked atau monitoring system tidak punya internet access  
**Solusi**: Cek koneksi internet monitoring system, cek apakah dns.google.com accessible

### Issue: Response time sangat lambat (>10 detik)
**Penyebab**: Server overload, network latency, atau DDoS  
**Solusi**: Cek server load, network bandwidth, dan web server logs

### Issue: Status berubah-ubah antara Online dan DNS Only
**Penyebab**: Web server unstable atau intermittent connection  
**Solusi**: Cek server resources (CPU, RAM, disk), restart web server, cek error logs

## Technical Stack

- React + TypeScript
- Vite
- Tailwind CSS + Custom Theme (Dark mode dengan blue accent)
- Shadcn UI Components
- Framer Motion (smooth animations)
- Spark KV Store (persistent storage)
- Google DNS API (DNS resolution)
- Fetch API with timeout (HTTP checks)

## Advanced Troubleshooting

### Debug Mode (via Browser Console)

Open browser console untuk melihat detailed logs:
```javascript
// Logs akan muncul saat:
// - IP lookup failed
// - DNS resolution failed
// - HTTP check failed dengan detail error
```

### Manual Testing via Command Line

Test domain manually dari command line:

```bash
# DNS check
nslookup subdomain.kendalkab.go.id
dig subdomain.kendalkab.go.id

# HTTP check
curl -I https://subdomain.kendalkab.go.id
curl -I http://subdomain.kendalkab.go.id

# Check with verbose output
curl -v https://subdomain.kendalkab.go.id

# Test with timeout
curl --max-time 15 https://subdomain.kendalkab.go.id
```

---

**Dibuat untuk Kabupaten Kendal** • Domain Monitoring Dashboard with Enhanced Network Issue Detection
