# 🔥 Firebase Query Guide - Command Line Tools

Panduan menggunakan utility scripts untuk query data Firebase dari terminal.

**Location:** All scripts are in `scripts/` folder

---

## 📋 Available Scripts

### 1. **list-domains.mjs** - List All Domains
Menampilkan list semua domain dari Firebase dengan informasi dasar.

**Usage:**
```bash
# List all domains (max 50)
node scripts/list-domains.mjs

# Filter by keyword
node scripts/list-domains.mjs "diskominfo"
node scripts/list-domains.mjs "dinas"
```

**Output:**
```
📋 Listing domains dari Firebase... (filter: diskominfo)

✅ Total domains: 312

🔍 Hasil filter "diskominfo": 1 domain

1. ID: domain-abc123
   URL: diskominfo.kendalkab.go.id
   Status: online
   Group: Dinas
   Individual Monitoring: ON ✅
   Last Checked: 09/01/2026 14.30.45
```

---

### 2. **check-firebase-data.mjs** - Get Domain Details
Menampilkan detail lengkap satu domain termasuk check history.

**Usage:**
```bascripts/check-firebase-data.mjs "diskominfo.kendalkab.go.id"
node scripts/ck specific domain by exact URL
node scripts/check-firebase-data.mjs "diskominfo.kendalkab.go.id"
node scripts/check-firebase-data.mjs "https://bapenda.kendalkab.go.id"
```

**Output:**
```
🔍 Checking Firebase data for: diskominfo.kendalkab.go.id

✅ DOMAIN FOUND

📋 Domain Info:
   ID: domain-abc123
   URL: diskominfo.kendalkab.go.id
   Status: online
   IP: 103.123.45.67
   Response Time: 234ms
   Group: Dinas
   Tags: Penting, Layanan Publik
   Individual Monitoring: ON ✅
   Last Checked: 09/01/2026 14.30.45

📊 Recent Check History (last 10):
   1. 09/01/2026 14.30 - online (234ms)
   2. 09/01/2026 14.25 - online (245ms)
   3. 09/01/2026 14.20 - online (223ms)
   ...
```

---

### 3. **check-all-collections.mjs** - List All Collections
Menampilkan semua collections yang ada di Firestore dan jumlah documents.

**Usage:**
```bash
node scripts/check-all-collections.mjs
```

**Output:**
```
📚 Firebase Collections:

✅ domains: 312 documents
✅ domain-stats-daily: 2,184 documents
✅ domain-incidents: 45 documents
✅ groups: 8 documents
✅ tags: 12 documents
✅ notifications: 134 documents

Total: 6 collections
```

---

### 4. **check-timezone.mjs** - Check Timestamp Issues
Debug utility untuk cek timezone dan timestamp consistency.

**Usage:**
```bash
node scripts/check-timezone.mjs
```

**Output:**
```
🕐 Checking timezone & timestamp...

Current Time:
  System: 2026-01-09T14:30:45+07:00 (WIB)
  Firebase Server: 2026-01-09T07:30:45Z (UTC)
  Displayed: 09/01/2026 14.30.45 (WIB)

✅ Timezone handling: OK
```

---

### 5. **find-domain-simple.mjs** - Simple Domain Search
Mencari domain dengan query sederhana (URL matching).

**Usage:**
```bash
# Search by partial URL
node scripts/find-domain-simple.mjs "bapenda"
node scripts/find-domain-simple.mjs "dinas"
```

**Output:**
```
🔍 Searching domains: "bapenda"

Found 3 results:

1. bapenda.kendalkab.go.id (online)
2. bapenda-old.kendalkab.go.id (offline)
3. bapenda2.kendalkab.go.id (dns-only)
```

---

### 6. **find-domain-nested.mjs** - Advanced Search
Mencari domain dengan query lebih kompleks (nested fields).

**Usage:**
```bash
# Search by group
node scripts/find-domain-nested.mjs --group "Dinas"

# Search by status
node scripts/find-domain-nested.mjs --status "offline"

# Search by tag
node scripts/find-domain-nested.mjs --tag "Penting"
```

**Output:**
```
🔍 Advanced search: group="Dinas"

Found 45 domains:

1. diskominfo.kendalkab.go.id (online) - Batch B1
2. disdik.kendalkab.go.id (online) - Batch B2
3. dinkes.kendalkab.go.id (dns-only) - Batch B3
...

Stats:
  Online: 42 (93.3%)
  DNS Only: 2 (4.4%)
  Offline: 1 (2.2%)
```

---

## 🔧 Setup & Requirements

### Prerequisites:
```bash
# Install dependencies (already done jika sudah npm install)
npm install
```

### Firebase Config:
Scripts menggunakan Firebase config yang sama dengan aplikasi (`src/lib/firebase.ts`). Config sudah embedded di masing-masing script.

---

## 📊 Use Cases

### 1. **Debug Domain Issues**
```bash
# Cek kenapa domain tidak muncul di UI
node scripts/list-domains.mjs "problem-domain"

# Lihat detail dan history
node scripts/check-firebase-data.mjs "problem-domain.kendalkab.go.id"
```

### 2. **Verify Data Sync**
```bash
# List semua collections
node scripts/check-all-collections.mjs

# Verify domain count
node scripts/list-domains.mjs | grep "Total domains"
```

### 3. **Find Offline Domains**
```bash
# Search offline domains
node scripts/find-domain-nested.mjs --status "offline"
```

### 4. **Group Management**
```bash
# List domains in specific group
node scripts/find-domain-nested.mjs --group "Dinas"

# Verify group assignment
node scripts/list-domains.mjs | grep "Group:"
```

### 5. **Statistics Data Check**
```bash
# Check if stats are being saved
node scripts/check-all-collections.mjs

# Should see domain-stats-daily with growing document count
# After 24 hours: ~312 docs (1 per domain per day)
# After 7 days: ~2,184 docs (312 × 7)
```

---

## 🚨 Common Issues

### Issue: "No domains found"
**Solution:**
```bash
# Verify Firebase connection
node scripts/check-all-collections.mjs

# Check if domains collection exists
# If empty, data sync might not be working
```

### Issue: "Firebase auth error"
**Solution:**
- Firebase config di script harus sama dengan app
- Check API key validity di Firebase console
- Firestore rules harus allow read access

### Issue: "Timestamp mismatch"
**Solution:**
```bash
# Check timezone handling
node scripts/check-timezone.mjs

# Timestamps di Firebase selalu UTC
# UI should display in WIB (UTC+7)
```

---

## 💡 Tips

1. **Performance**: Scripts dibatasi 50 hasil untuk speed. Edit `limit(50)` jika perlu lebih.

2. **Real-time Data**: Scripts query current data. Refresh dengan run ulang.

3. **Filtering**: Gunakan grep untuk filter lebih lanjut:
   ```bash
   node scripts/list-domains.mjs | grep "online"
   node scripts/list-domains.mjs | grep "Batch B1"
   ```

4. **Output to File**: Save output untuk analysis:
   ```bash
   node scripts/list-domains.mjs > domains.txt
   node scripts/check-all-collections.mjs > collections.txt
   ```

5. **Quick Stats**:
   ```bash
   # Count by status
   node scripts/list-domains.mjs | grep "Status: online" | wc -l
   node scripts/list-domains.mjs | grep "Status: offline" | wc -l
   ```

---

## 🔗 Related Documentation

- [STAGGERED-CHECK-GUIDE.md](STAGGERED-CHECK-GUIDE.md) - Firebase data structure
- [FEATURE-PLAN-INDIVIDUAL-MONITORING.md](FEATURE-PLAN-INDIVIDUAL-MONITORING.md) - Monitoring system
- [GUIDES.md](GUIDES.md) - User guide with Firebase setup

---

**Last Updated:** 9 Januari 2026  
**Version:** 3.5.10
