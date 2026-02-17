# 🔍 Monitoring Rules & Use Cases Guide

**Version:** 3.8.5  
**Last Updated:** 10 Januari 2026

## 📋 Overview

Aplikasi Domain Monitor memiliki **5 metode monitoring** yang berbeda dengan rules dan use cases masing-masing. Dokumen ini menjelaskan kapan dan bagaimana setiap metode digunakan.

---

## 🎯 5 Metode Monitoring

```
┌─────────────────────────────────────────────────────────────┐
│                  1. AUTO-CHECK (BROWSER)                    │
│  Web Worker → Check batch domains setiap 60 detik           │
│  💾 Firebase Write: ✅ YES                                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              2. MANUAL CHECK ALL (BROWSER)                  │
│  User klik Manual Check → Check semua domain                │
│  💾 Firebase Write: ❌ NO (local only)                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│            3. CHECK INDIVIDUAL DOMAIN (BROWSER)             │
│  User klik domain card → Check 1 domain                     │
│  💾 Firebase Write: ❌ NO (on-demand troubleshooting)        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│           4. GITHUB ACTIONS CRON (SERVER-SIDE)              │
│  GitHub Actions → Check per batch setiap 1 jam              │
│  💾 Firebase Write: ✅ YES (+ Slack notification)            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              5. PINNED DOMAIN AUTO-CHECK (BROWSER)          │
│  Tab Pin dibuka → Auto-check pinned domains                 │
│  💾 Firebase Write: Conditional (tergantung auto-refresh)   │
└─────────────────────────────────────────────────────────────┘
```

---

## 1️⃣ AUTO-CHECK (Browser Background)

### 📖 Deskripsi
Sistem monitoring otomatis yang berjalan di browser menggunakan **Web Worker**. Check domain secara batch setiap 60 detik dengan **4-batch staggered system**.

### 🎛️ Cara Mengaktifkan
1. Toggle **"Auto-refresh"** ON di header
2. Klik **Play button** (bukan pause)
3. Browser tab harus tetap terbuka

### ⚙️ Rules
- **Batch System:** Domain dibagi 4 batch (B1, B2, B3, B4)
  - Batch 1: Check menit 0, 20, 40
  - Batch 2: Check menit 5, 25, 45
  - Batch 3: Check menit 10, 30, 50
  - Batch 4: Check menit 15, 35, 55
- **Interval:** 60 detik per cycle
- **Firebase Write:** ✅ YES - Every check saved to Firebase
- **Only Check Current Batch:** Misal jam 14:07 → hanya Batch 2 dicek
- **Initial Delay:** 10 detik setelah auto-refresh diaktifkan
- **Auto-Assignment:** Domain baru otomatis dapat batch (round-robin)

### ✅ Use Cases

#### ✓ Real-time Monitoring Dashboard
```
Scenario: Operator sedang monitor dashboard
Action: Enable auto-refresh, biarkan tab terbuka
Result: Domain dicek otomatis per batch setiap menit
Benefit: Live updates tanpa manual refresh
```

#### ✓ Long-term Monitoring Session
```
Scenario: Monitor domain 1-2 jam terus menerus
Action: Auto-refresh ON, Pause jika perlu istirahat
Result: Data terus diupdate ke Firebase untuk history
Benefit: History lengkap untuk analisis uptime
```

#### ✓ Collaborative Monitoring
```
Scenario: Multiple operators monitor bersama
Action: Semua enable auto-refresh di browser masing-masing
Result: Data disync via Firebase, semua lihat update sama
Benefit: Team awareness, koordinasi lebih baik
```

### ❌ Tidak Cocok Untuk

❌ **Browser ditutup** - Auto-check akan berhenti (gunakan GitHub Actions)  
❌ **Quick one-time check** - Terlalu lambat, gunakan Manual Check  
❌ **Troubleshoot 1 domain** - Overkill, gunakan Check Individual  

### 🔧 Technical Details
```typescript
// Web Worker mengirim CHECK signal setiap 5 menit
worker.postMessage({ type: 'START' })

// Main thread menerima signal dan trigger batch check
worker.onmessage = (e) => {
  if (e.data.type === 'CHECK') {
    checkAllDomains(false, true, true) // batchCheckOnly, isAutoCheck
  }
}
```

### 📊 Firebase Impact
```
400 domains ÷ 4 batches = 100 domains per batch
100 domains × 3 checks/hour × 24 hours = 7,200 writes/day
ONLY for the browser that is actively monitoring
```

---

## 2️⃣ MANUAL CHECK ALL (Browser)

### 📖 Deskripsi
One-time manual check untuk **semua domain** tanpa Firebase write. Hanya update UI lokal.

### 🎛️ Cara Menggunakan
1. Pastikan auto-refresh **OFF** (atau tidak masalah jika ON)
2. Klik tombol **"Check All Domains"** di header
3. Tunggu progress bar selesai

### ⚙️ Rules
- **Check Scope:** ALL domains (tidak batch-based)
- **Firebase Write:** ❌ NO - Hanya update UI lokal
- **Parallel Checking:** Promise.all untuk speed
- **Progress Bar:** Real-time progress indicator
- **Toast Notification:** "Memeriksa X domain..."

### ✅ Use Cases

#### ✓ Quick Status Overview
```
Scenario: User buka app pertama kali pagi ini
Action: Klik "Check All Domains"
Result: Lihat status real-time semua domain dalam 30-60 detik
Benefit: Quick snapshot tanpa write ke Firebase
```

#### ✓ Verify After Maintenance
```
Scenario: Selesai maintenance server, mau verifikasi
Action: Manual check → Lihat berapa domain affected
Result: Instant feedback tanpa menunggu batch schedule
Benefit: Immediate confirmation
```

#### ✓ Demo / Presentation
```
Scenario: Presentasi ke stakeholder
Action: Manual check untuk show real-time capability
Result: Impress stakeholder dengan speed checking
Benefit: Clean demo tanpa auto-refresh noise
```

#### ✓ Troubleshooting Batch Issue
```
Scenario: Curiga batch check tidak jalan
Action: Manual check all → Bandingkan dengan batch results
Result: Verify apakah batch logic benar
Benefit: Debugging tool
```

### ❌ Tidak Cocok Untuk

❌ **Long-term monitoring** - No Firebase write, data hilang setelah refresh  
❌ **Background monitoring** - User harus aktif klik, tidak otomatis  
❌ **Team collaboration** - Data tidak disync, hanya lokal  

### 🔧 Technical Details
```typescript
// Manual check: batchCheckOnly = false, isAutoCheck = false
const handleManualRefresh = async () => {
  await checkAllDomains(true, false, false) // showToast, no batch, no Firebase
}
```

---

## 3️⃣ CHECK INDIVIDUAL DOMAIN (Browser)

### 📖 Deskripsi
Check **1 domain spesifik** on-demand untuk troubleshooting. Triggered by clicking domain card.

### 🎛️ Cara Menggunakan
1. Klik **domain card** di list
2. Domain akan dicek ulang instant
3. Status update di card tersebut

### ⚙️ Rules
- **Check Scope:** 1 domain saja
- **Firebase Write:** ❌ NO - Troubleshooting only
- **Instant Check:** Tidak tunggu batch schedule
- **Status Update:** Update hanya card yang diklik
- **No Toast:** Silent update (UX consideration)

### ✅ Use Cases

#### ✓ Troubleshooting Specific Domain
```
Scenario: 1 domain showing offline, mau verify
Action: Klik domain card → Check ulang
Result: Confirm apakah memang down atau false positive
Benefit: Quick verification tanpa check all
```

#### ✓ Verify DNS Propagation
```
Scenario: Baru update DNS, mau verify sudah propagate
Action: Klik domain card beberapa kali
Result: Lihat apakah IP address berubah
Benefit: Real-time DNS checking
```

#### ✓ Test After Domain Fix
```
Scenario: Baru fix SSL certificate, mau test
Action: Klik domain → Lihat status berubah dari "SSL Error" ke "Online"
Result: Immediate feedback
Benefit: Verify fix tanpa tunggu batch
```

#### ✓ Compare Response Time
```
Scenario: Curiga domain lambat
Action: Klik domain beberapa kali → Lihat response time
Result: Get sense of performance issues
Benefit: Performance troubleshooting
```

### ❌ Tidak Cocok Untuk

❌ **Mass checking** - Terlalu lambat, gunakan Manual Check All  
❌ **Historical data** - No Firebase write, tidak ada history  
❌ **Automated monitoring** - Requires manual click  

### 🔧 Technical Details
```typescript
// Check triggered by onClick handler di DomainCard
<DomainCard 
  onClick={() => handleCheckDomain(domain.id)}
/>

const handleCheckDomain = async (domainId) => {
  const result = await checkDomainStatus(domain.url, domainId)
  setStatuses(prev => ({ ...prev, [domainId]: result }))
  // No Firebase write - local only
}
```

---

## 4️⃣ GITHUB ACTIONS CRON (Server-side)

### 📖 Deskripsi
**24/7 automated monitoring** yang berjalan di GitHub Actions server. Check domain by batch setiap 1 jam, **tidak butuh browser terbuka**.

### 🎛️ Cara Kerja
- **Automatic:** Runs every 1 hour via cron schedule
- **Manual Trigger:** Bisa trigger manual dari GitHub Actions UI
- **Completely Independent:** Tidak tergantung browser/user

### ⚙️ Rules
- **Schedule:** `0 * * * *` (setiap 1 jam)
- **Check Scope:** Batch-based (1 batch per run, rotates B1→B2→B3→B4)
- **Firebase Write:** ✅ YES - Writes to `domain-stats-daily`, `domains`, and `github-actions-logs`
- **Slack Notification:** ✅ YES - Summary results per batch
- **4 Batch System:** Hourly rotation (B1: 00,04,08,12,16,20 / B2: 01,05,09,13,17,21 / B3: 02,06,10,14,18,22 / B4: 03,07,11,15,19,23)
- **Duration:** ~2.4 minutes per run
- **Free Tier:** 2000 minutes/month (≈1,728 min/month used)
- **Data Written:**
  - Daily stats dengan hourly breakdown
  - Domain status updates (last checked, response time, IP)
  - Execution logs untuk monitoring health

### ✅ Use Cases

#### ✓ 24/7 Monitoring (Primary Use Case)
```
Scenario: Butuh monitoring kontinyu tanpa manpower
Action: Setup once, forget it
Result: Domain dicek setiap ~4 jam per domain (rotasi 4 batch)
Benefit: True 24/7 monitoring, FREE
```

#### ✓ After-hours Monitoring
```
Scenario: Kantor tutup jam 5 sore, tapi domain harus dimonitor
Action: GitHub Actions tetap jalan
Result: Downtime terdeteksi malam hari, Slack notification sent
Benefit: No human intervention needed
```

#### ✓ Weekend Monitoring
```
Scenario: Weekend tidak ada operator
Action: GitHub Actions jalan terus
Result: Domain issues terdeteksi, team notified via Slack
Benefit: Peace of mind
```

#### ✓ Baseline Data Collection
```
Scenario: Butuh data uptime 30 hari untuk report
Action: GitHub Actions collect data konsisten
Result: Historical data lengkap di Firebase
Benefit: Reliable metrics untuk stakeholder
```

### ❌ Tidak Cocok Untuk

❌ **Instant feedback** - Delay up to 1 hour untuk batch berikutnya  
❌ **On-demand checks** - Schedule fixed, tidak bisa dipercepat  
❌ **Real-time troubleshooting** - Terlalu lambat untuk debugging  

### 🔧 Technical Details
```yaml
# .github/workflows/monitor-domains.yml
on:
  schedule:
    - cron: '0 * * * *'
  workflow_dispatch:

jobs:
  monitor:
    runs-on: ubuntu-latest
    steps:
      - name: Run domain monitoring
        run: npm run monitor  # Runs scripts/monitor-cron.js
```

**Script Flow (monitor-cron.js):**
1. Load domains from Firebase
2. Determine current batch (1-4) based on time
3. Check all domains in that batch
4. For each domain:
   - Get/create daily stats
   - Update stats with check result
   - Update domain status
5. Write execution log
6. Send Slack summary

**Firebase Collections Updated:**
- `domain-stats-daily/{domainId}-{date}` - Daily aggregates + hourly breakdown
- `domains/default-user` - Domain status updates
- `github-actions-logs` - Execution logs dengan batch info

### 📊 GitHub Actions Health Dashboard
Aplikasi memiliki **dedicated tab** untuk monitor health GitHub Actions:
- **Last Run Time:** Kapan terakhir check
- **Duration:** Berapa lama execution
- **Current Batch:** Batch mana yang sedang dicek
- **Success Rate:** Percentage keberhasilan (30 hari)
- **Run History:** Bar chart 10 runs terakhir
- **Next Run Countdown:** Live timer kapan check berikutnya

### 🔍 Monitoring the Monitor
```
Statistics Tab → GitHub Actions Sub-Tab
- Live status apakah monitoring berjalan normal
- Alert jika success rate < 90%
- Troubleshoot jika runs failed
```

---

## 5️⃣ PINNED DOMAIN AUTO-CHECK (Browser)

### 📖 Deskripsi
Auto-check khusus untuk **pinned domains** saat user membuka **Pin tab**. Designed untuk VIP domains yang perlu extra attention.

### 🎛️ Cara Menggunakan
1. **Pin domain** yang penting (klik ⭐ icon)
2. Buka **Pin tab** di navigation
3. Pinned domains akan auto-check (jika belum pernah dicek)

### ⚙️ Rules
- **Trigger:** Opening Pin tab
- **Check Scope:** Only pinned domains (bukan semua)
- **Condition:** Only check if domain belum pernah dicek (lastChecked === null)
- **Firebase Write:** Conditional
  - ✅ YES jika auto-refresh enabled
  - ❌ NO jika auto-refresh disabled
- **One-time:** Tidak repeat, hanya sekali saat tab dibuka

### ✅ Use Cases

#### ✓ VIP Domain Monitoring
```
Scenario: Ada 10 domain critical (portal, layanan utama)
Action: Pin ke-10 domain → Buka Pin tab
Result: Quick view status all critical domains
Benefit: Prioritized monitoring
```

#### ✓ Incident Response Dashboard
```
Scenario: Ada insiden, perlu monitor affected domains
Action: Pin affected domains → Monitor via Pin tab
Result: Focused view tanpa distraksi domain lain
Benefit: Faster incident response
```

#### ✓ Executive Dashboard
```
Scenario: Direktur mau lihat status layanan utama
Action: Setup pinned dashboard → Share link dengan filter Pin tab
Result: Clean executive view
Benefit: Stakeholder visibility
```

#### ✓ Custom Monitoring Group
```
Scenario: Monitor domain per kategori (e.g., "E-Government Apps")
Action: Pin semua domain kategori tersebut
Result: Custom monitoring group diluar official groups
Benefit: Flexible grouping
```

### ❌ Tidak Cocok Untuk

❌ **Mass monitoring** - Pin banyak domain = seperti check all  
❌ **Automated monitoring** - Requires tab switch manual  
❌ **Long-term tracking** - Check hanya sekali per tab open  

### 🔧 Technical Details
```typescript
// Auto-check when Pin tab opened
useEffect(() => {
  if (activeTab === 'pinned' && !isLoadingData) {
    const pinnedDomains = domains.filter(d => d.pinned)
    const uncheckedDomains = pinnedDomains.filter(d => {
      const status = statuses[d.id]
      return !status || status.lastChecked === null
    })
    
    if (uncheckedDomains.length > 0) {
      // Check pinned domains
      checkDomains(uncheckedDomains)
    }
  }
}, [activeTab, isLoadingData])
```

---

## 🔄 Comparison Matrix

| Feature | Auto-Check | Manual Check All | Check Individual | GitHub Actions | Pinned Auto-Check |
|---------|-----------|------------------|------------------|----------------|-------------------|
| **Browser Required** | ✅ YES | ✅ YES | ✅ YES | ❌ NO | ✅ YES |
| **Firebase Write** | ✅ YES | ❌ NO | ❌ NO | ✅ YES | Conditional |
| **Check Scope** | Batch | All | 1 Domain | All | Pinned Only |
| **Interval** | 60s | Manual | Manual | 1 hour (batch rotation) | On Tab Open |
| **Best For** | Live Dashboard | Quick Check | Troubleshooting | 24/7 Monitoring | VIP Domains |
| **Data History** | ✅ YES | ❌ NO | ❌ NO | ✅ YES | Conditional |
| **Slack Notify** | ❌ NO | ❌ NO | ❌ NO | ✅ YES | ❌ NO |
| **Cost** | Free | Free | Free | Free | Free |

---

## 🎯 Recommended Workflow

### Setup Phase
1. ✅ **Deploy GitHub Actions** → 24/7 baseline monitoring
2. ✅ **Pin critical domains** → Quick access
3. ✅ **Configure Slack webhook** → Get notifications

### Daily Operations
```
Morning:
├── Open app → Manual Check All (quick overview)
├── Check Pin tab → Verify critical domains
└── Enable Auto-refresh → Real-time monitoring

Troubleshooting:
├── Click individual domain → Verify issue
├── Check GitHub Actions tab → See if issue detected by cron
└── Export filtered domains → Share with team

End of Day:
└── Close browser → GitHub Actions continue monitoring
```

### Incident Response
```
Alert received:
├── Open Pin tab → Quick status critical domains
├── Manual Check All → Full system status
├── Click affected domains → Troubleshoot individually
├── Check GitHub Actions history → See when issue started
└── Export incident report → Documentation
```

---

## 📊 Firebase Write Optimization

### Write Calculation
```
Scenario: 400 domains, Auto-refresh ON (browser), GitHub Actions ON

Browser Auto-Check:
- 400 domains ÷ 4 batches = 100 domains/batch
- 100 domains × 3 checks/hour × 24 hours = 7,200 writes/day
- Only from 1 active browser

GitHub Actions:
- 400 domains × 3 checks/hour × 24 hours = 28,800 writes/day
- Always running

Total: ~36,000 writes/day
Firebase Free Tier: 20,000 writes/day ❌ OVER LIMIT

Solution:
- Use ONLY GitHub Actions (24/7 coverage)
- Manual Check for troubleshooting (no Firebase write)
- Auto-refresh only saat actively monitoring (close browser saat tidak)
```

### Best Practice
```
✅ GitHub Actions: Always ON (baseline 24/7)
✅ Manual Check: Quick verification (no cost)
✅ Individual Check: Troubleshooting (no cost)
✅ Auto-refresh: Only when actively monitoring (1-2 hours)
❌ Auto-refresh: Jangan dibiarkan ON 24/7 (waste Firebase quota)
```

---

## 🔔 Notification Strategy

### Slack Notifications (GitHub Actions Only)
```javascript
// Only GitHub Actions send Slack notifications
if (SLACK_WEBHOOK_URL) {
  const downDomains = results.filter(r => r.status === 'offline')
  if (downDomains.length > 0) {
    sendSlackNotification({
      text: `⚠️ ${downDomains.length} domains are DOWN`,
      domains: downDomains
    })
  }
}
```

### In-App Toasts
- ✅ Auto-check: "Memeriksa X domain..." (batch info)
- ✅ Manual check: "Memeriksa X domain..." (full count)
- ✅ Individual check: Silent (no toast, UX consideration)
- ✅ Pinned check: Silent (auto-triggered)

---

## 🚨 Common Mistakes & Solutions

### ❌ Mistake 1: Auto-refresh ON 24/7
```
Problem: Firebase quota exceeded
Solution: Gunakan GitHub Actions untuk 24/7, auto-refresh hanya saat monitoring
```

### ❌ Mistake 2: Manual Check untuk History
```
Problem: Data tidak tersimpan, hilang setelah refresh
Solution: Enable auto-refresh atau rely on GitHub Actions history
```

### ❌ Mistake 3: Check Individual untuk Mass Verification
```
Problem: Terlalu lambat, banyak klik
Solution: Gunakan Manual Check All atau tunggu batch auto-check
```

### ❌ Mistake 4: Pin terlalu banyak domain
```
Problem: Pin tab seperti All Domains
Solution: Pin hanya 5-20 domain paling critical
```

---

## 📚 Related Documentation

- [STAGGERED-CHECK-GUIDE.md](./STAGGERED-CHECK-GUIDE.md) - Batch system technical details
- [FIREBASE-QUERY-GUIDE.md](./FIREBASE-QUERY-GUIDE.md) - Query history data
- [FEATURE-PLAN-INDIVIDUAL-MONITORING.md](./FEATURE-PLAN-INDIVIDUAL-MONITORING.md) - Individual monitoring architecture
- [CHANGELOG.md](./CHANGELOG.md) - Version history & features

---

**Version:** 3.8.5  
**Author:** Domain Monitor Team  
**Last Updated:** 10 Januari 2026
