# 🎯 Feature Plan: Individual Domain Monitoring (v3.1.0)

> **Doc Class:** Historical Feature Plan  
> **Trust Level:** Archive Reference (not source of truth)  
> **Last Reviewed:** 18 Februari 2026  
> **Source of Truth:** `PROJECT-STATUS.md` + `CHANGELOG.md`

**Created:** 7 Januari 2026  
**Status:** In Development  
**Priority:** High

---

## 📋 Overview

Menambahkan kemampuan monitoring individual per domain dengan tombol Play/Pause dan akses chart statistics, terinspirasi dari Uptime Kuma. Fitur ini memungkinkan user untuk:

1. **Monitor domain tertentu secara on-demand** (tidak bergantung auto-check global)
2. **Pause domain yang tidak perlu dimonitor** (hemat Firebase quota)
3. **Lihat chart statistics detail per domain** (uptime 30 hari, response time, incidents)

---

## 🎯 Goals

### Primary Goals
- ✅ Tambah tombol **Play/Pause** per domain untuk individual monitoring
- ✅ Tombol **Play** = Check domain sekarang + save to Firebase
- ✅ Tombol **Pause** = Tandai domain tidak aktif dimonitor
- ✅ Tambah tombol **Statistics** per domain untuk lihat chart detail
- ✅ Chart statistics bisa diakses dari 2 tempat (Tab Domains & Tab Statistics)

### Secondary Goals
- ✅ Hemat Firebase quota (domain paused tidak dicek)
- ✅ Maintain backward compatibility (domain existing default enabled)
- ✅ UI/UX yang intuitive dan konsisten

---

## 🏗️ Architecture

### System Design

```
┌─────────────────────────────────────────────────────────┐
│                    Global Auto-Check                    │
│  (Background monitoring untuk alerting massa)           │
│  - Cek semua domain setiap batch (staggered)           │
│  - Write to Firebase otomatis                          │
│  - Untuk monitoring rutin                              │
└─────────────────────────────────────────────────────────┘
                            ↕️
┌─────────────────────────────────────────────────────────┐
│              Individual Domain Monitoring               │
│  (On-demand monitoring untuk troubleshooting)          │
│  - User klik Play → Check + Save to Firebase           │
│  - User klik Pause → Tandai tidak aktif                │
│  - User klik Stats → Lihat chart 30 hari               │
└─────────────────────────────────────────────────────────┘
```

**Key Concept:**
- **Play/Pause TIDAK mengontrol auto-check global**
- Play/Pause untuk **individual monitoring on-demand**
- Auto-check global tetap jalan terpisah

---

## 📊 Features Detail

### 1. Play/Pause Button (Individual Check)

**Visual:**
```
[Domain Card]
  [▶️] domain.go.id  [📊] [✏️] [🗑️]
  Status: Online | 234ms
```

**Behavior:**
- **Play (▶️):**
  - Check domain sekarang juga
  - Write result to Firebase (masuk statistik)
  - Update UI real-time
  - Toast: "domain.go.id checked successfully"
  
- **Pause (⏸️):**
  - Tandai domain.enabled = false
  - Domain tidak aktif di-monitor individual
  - Data historis tetap ada (bisa lihat chart lama)
  - Toast: "domain.go.id paused"

**Default State:**
- Domain baru: `enabled: true` (langsung bisa dimonitor)
- Domain existing: `enabled: true` (backward compatibility)

---

### 2. Statistics Button (Chart Detail)

**Visual:**
```
Klik [📊] → Muncul Dialog:

╔═══════════════════════════════════════════╗
║  📊 Statistics: domain.go.id              ║
╠═══════════════════════════════════════════╣
║                                           ║
║  ⏱️ Period: [7 Days] [30 Days]           ║
║                                           ║
║  📈 Uptime Trend (Line Chart)            ║
║  ┌─────────────────────────────────────┐ ║
║  │     99.5%  ╱╲                        │ ║
║  │          ╱    ╲   ╱╲                 │ ║
║  │  97.2% ╱      ╲ ╱  ╲                │ ║
║  └─────────────────────────────────────┘ ║
║                                           ║
║  ⚡ Response Time (Line Chart)           ║
║  ┌─────────────────────────────────────┐ ║
║  │  250ms ____╱‾‾‾╲____                │ ║
║  │  200ms ‾‾‾‾      ‾‾‾‾╲___           │ ║
║  └─────────────────────────────────────┘ ║
║                                           ║
║  📊 Summary                               ║
║  • Total Uptime: 98.7%                   ║
║  • Avg Response: 234ms                   ║
║  • Total Checks: 2,160                   ║
║  • Incidents: 3                          ║
║                                           ║
║  🔴 Recent Incidents                      ║
║  • Jan 6, 14:30 - Down (5 min)          ║
║  • Jan 5, 08:15 - Slow (>2s)            ║
║  • Jan 3, 22:00 - DNS Error (2 min)     ║
║                                           ║
║              [Close]                      ║
╚═══════════════════════════════════════════╝
```

**Data Source:**
- Load dari Firebase collection `domain-stats-daily`
- Query by domainId + date range (7 atau 30 hari)
- Aggregate data di client-side
- Cache di localStorage untuk performa

---

### 3. Dual Access Point

#### **A. Tab Domains (Quick Access)**
```
Tab [Domains] → Domain Card → [📊] button
→ Quick access untuk troubleshooting
→ User flow: "Saya lagi lihat domain ini, mau lihat chartnya"
```

#### **B. Tab Statistics (Full Analytics)**
```
Tab [Statistics] → Domain List dengan summary → [View Details]
→ Analytics & comparison semua domain
→ User flow: "Mau review performa semua domain, analisa yang bermasalah"
```

**Component Reuse:**
- Kedua tempat pakai component yang sama: `<DomainStatisticsDialog />`
- Props: `domainId`, `open`, `onOpenChange`

---

## 🛠️ Implementation Tasks

### Phase 1: Data Structure (30 min)

**File:** `src/lib/types.ts`

```typescript
export interface Domain {
  id: string
  url: string
  groupId?: string
  tags: string[]
  checkBatch?: number
  notificationEnabled?: boolean
  enabled?: boolean  // ← NEW: Individual monitoring status
  createdAt: number
  updatedAt: number
}
```

**Migration:**
- Domain existing: default `enabled: true`
- Tidak perlu version bump localStorage (optional field)

---

### Phase 2: UI Components (2-3 hours)

#### **2.1. Create DomainStatisticsDialog.tsx**

**File:** `src/components/DomainStatisticsDialog.tsx`

**Features:**
- Load data from Firebase by domainId
- Period selector (7 days / 30 days)
- Uptime chart (Recharts LineChart)
- Response time chart (Recharts LineChart)
- Summary metrics
- Incidents list
- Loading state & error handling

**Props:**
```typescript
interface DomainStatisticsDialogProps {
  domainId: string
  domainUrl: string
  open: boolean
  onOpenChange: (open: boolean) => void
}
```

---

#### **2.2. Update DomainCard.tsx**

**File:** `src/components/DomainCard.tsx`

**Changes:**
- Add Play/Pause button (toggle `enabled` field)
- Add Statistics button (open DomainStatisticsDialog)
- Visual indicator untuk domain paused (Badge "Paused")
- Icon: Play = `<Play />`, Pause = `<Pause />`, Stats = `<ChartLine />`

**Layout:**
```tsx
<div className="flex gap-1">
  {/* Play/Pause Button */}
  <Button 
    size="sm" 
    variant="ghost"
    onClick={handleToggle}
    title={enabled ? "Pause individual monitoring" : "Play & check now"}
  >
    {enabled ? <Pause /> : <Play />}
  </Button>
  
  {/* Statistics Button */}
  <Button
    size="sm"
    variant="ghost"
    onClick={() => setShowStats(true)}
    title="View statistics"
  >
    <ChartLine />
  </Button>
  
  {/* Edit & Delete (existing) */}
  {isAuthenticated && (
    <>
      <Button onClick={handleEdit}><PencilSimple /></Button>
      <Button onClick={handleDelete}><Trash /></Button>
    </>
  )}
</div>
```

---

#### **2.3. Update StatisticsView.tsx**

**File:** `src/components/StatisticsView.tsx`

**Add new section:** "Domain Analytics"

```tsx
<div className="space-y-4">
  <h3>📊 Domain Analytics</h3>
  
  {/* Filter & Sort */}
  <div className="flex gap-2">
    <Select value={sortBy} onValueChange={setSortBy}>
      <SelectItem value="uptime-asc">Uptime (Low to High)</SelectItem>
      <SelectItem value="uptime-desc">Uptime (High to Low)</SelectItem>
      <SelectItem value="response-asc">Response (Fast to Slow)</SelectItem>
    </Select>
  </div>
  
  {/* Domain List with Summary */}
  <div className="space-y-2">
    {domains.map(domain => (
      <div className="flex items-center justify-between border rounded p-3">
        <div>
          <span>{domain.url}</span>
          <div className="text-sm text-muted">
            Uptime: {getUptime(domain.id)}% | Avg: {getAvgResponse(domain.id)}ms
          </div>
        </div>
        <Button onClick={() => openStats(domain.id)}>
          View Details
        </Button>
      </div>
    ))}
  </div>
</div>
```

---

### Phase 3: Business Logic (2 hours)

#### **3.1. Update App.tsx**

**File:** `src/App.tsx`

**Add function: Toggle Play/Pause**
```typescript
const handleToggleDomainMonitoring = async (domainId: string) => {
  const domain = domains.find(d => d.id === domainId)
  if (!domain) return
  
  const newEnabledState = !domain.enabled
  
  if (newEnabledState) {
    // PLAY: Check immediately + enable monitoring
    toast.info(`Checking ${domain.url}...`)
    
    try {
      // 1. Update domain enabled state
      const updatedDomain = { ...domain, enabled: true }
      setDomains(prev => prev.map(d => 
        d.id === domainId ? updatedDomain : d
      ))
      
      // 2. Check domain immediately
      setStatuses(prev => ({
        ...prev,
        [domainId]: { ...prev[domainId], status: 'checking' }
      }))
      
      const result = await checkDomainStatus(domain.url, domainId)
      
      // 3. Write to Firebase
      if (autoRefreshEnabled) {
        await writeDomainCheckToFirebase(updatedDomain, result)
      }
      
      // 4. Update UI
      setStatuses(prev => ({ ...prev, [domainId]: result }))
      
      toast.success(`${domain.url} checked successfully`)
    } catch (error) {
      toast.error(`Failed to check ${domain.url}`)
      console.error(error)
    }
    
  } else {
    // PAUSE: Disable monitoring
    setDomains(prev => prev.map(d => 
      d.id === domainId ? { ...d, enabled: false } : d
    ))
    
    toast.info(`${domain.url} paused from individual monitoring`)
  }
}
```

**Add function: Check Single Domain (Manual)**
```typescript
const handleCheckSingleDomain = async (domainId: string) => {
  const domain = domains.find(d => d.id === domainId)
  if (!domain) return
  
  toast.info(`Checking ${domain.url}...`)
  
  try {
    // Set checking state
    setStatuses(prev => ({
      ...prev,
      [domainId]: { ...prev[domainId], status: 'checking' }
    }))
    
    // Check domain
    const result = await checkDomainStatus(domain.url, domainId)
    
    // Write to Firebase if auto-refresh enabled
    if (autoRefreshEnabled) {
      await writeDomainCheckToFirebase(domain, result)
    }
    
    // Update UI
    setStatuses(prev => ({ ...prev, [domainId]: result }))
    
    toast.success(`${domain.url} checked successfully`)
  } catch (error) {
    toast.error(`Failed to check ${domain.url}`)
    console.error(error)
  }
}
```

**Pass functions to DomainCard:**
```tsx
<DomainCard
  domain={domain}
  status={statuses[domain.id]}
  onToggleMonitoring={handleToggleDomainMonitoring}
  onCheckNow={handleCheckSingleDomain}
  // ... other props
/>
```

---

#### **3.2. Firebase Data Loading**

**File:** `src/lib/check-history.ts`

**Add function: Load domain statistics**
```typescript
export async function loadDomainStatistics(
  domainId: string, 
  days: number = 30
): Promise<DomainStats[]> {
  try {
    const db = getFirestore()
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    const startDateStr = startDate.toISOString().split('T')[0]
    const endDateStr = endDate.toISOString().split('T')[0]
    
    const q = query(
      collection(db, 'domain-stats-daily'),
      where('domainId', '==', domainId),
      where('date', '>=', startDateStr),
      where('date', '<=', endDateStr),
      orderBy('date', 'asc')
    )
    
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => doc.data() as DomainStats)
  } catch (error) {
    console.error('Error loading domain statistics:', error)
    return []
  }
}
```

---

### Phase 4: Version & Documentation (30 min)

#### **4.1. Update Version**

**File:** `src/lib/version.ts`

```typescript
export const APP_VERSION = '3.1.0' // Individual Domain Monitoring: Play/Pause + Statistics
```

#### **4.2. Update ChangelogDialog**

**File:** `src/components/ChangelogDialog.tsx`

Add new version entry:

```tsx
<div className="space-y-4">
  <div>
    <h3>Version 3.1.0</h3>
    <p>8 Januari 2026</p>
  </div>
  
  <div>
    <h4>🎯 Fitur Baru</h4>
    <ul>
      <li>Individual Domain Monitoring dengan tombol Play/Pause</li>
      <li>Statistics per domain dengan chart 30 hari</li>
      <li>Quick access chart dari Domain Card</li>
      <li>Full analytics view di Tab Statistics</li>
    </ul>
  </div>
  
  <div>
    <h4>⚡ Peningkatan</h4>
    <ul>
      <li>Hemat Firebase quota dengan pause domain</li>
      <li>On-demand checking untuk troubleshooting</li>
      <li>Deep dive analytics per domain</li>
    </ul>
  </div>
</div>
```

---

## 📊 Use Cases

### Use Case 1: Troubleshooting Domain Down
```
Problem: Domain X sering down

Steps:
1. Buka Tab Domains
2. Cari domain X
3. Klik [📊] → Lihat chart: "Memang sering down sejak 3 hari lalu"
4. Klik [▶️ Play] → Check sekarang
5. Tunggu 10 menit → Klik [▶️ Play] lagi
6. Monitor beberapa kali sampai issue resolved
7. Klik [⏸️ Pause] setelah selesai
```

### Use Case 2: Domain Maintenance
```
Situation: Server maintenance 2 minggu

Steps:
1. Klik [⏸️ Pause] domain yang maintenance
2. Domain tidak dicek selama 2 minggu (hemat quota)
3. Chart 30 hari tetap bisa dilihat
4. Maintenance selesai → Klik [▶️ Play]
5. Check apakah sudah UP
```

### Use Case 3: Weekly Analytics Review
```
Goal: Review performa semua domain minggu ini

Steps:
1. Buka Tab Statistics
2. Lihat "Domain Analytics" section
3. Sort by "Uptime (Low to High)"
4. Klik "View Details" domain dengan uptime rendah
5. Analisa chart dan incidents
6. Take action (maintenance, optimization, dll)
```

---

## ⚠️ Technical Considerations

### Firebase Quota Impact

**Current:**
- 400 domains × 1.5 writes/day = ~600 writes/day

**With Individual Monitoring:**
- Auto-check tetap sama (tidak berubah)
- Individual check = on-demand (user controlled)
- Domain paused = hemat quota

**Estimation:**
- Paused 50 domains → save ~75 writes/day
- Individual check 10x/day → +30 writes
- **Net impact: -45 writes/day (LEBIH EFISIEN)**

### Performance

**Chart Loading:**
- 30 days × 24 hours = 720 data points
- Recharts handles well up to 1000 points
- Lazy load only when dialog opened
- Cache in localStorage (1 hour TTL)

**UI Responsiveness:**
- Debounce Play button (prevent spam click)
- Optimistic UI update
- Background Firebase write

---

## 🧪 Testing Checklist

### Functional Tests
- [ ] Play button → check domain + save to Firebase
- [ ] Pause button → disable monitoring + visual indicator
- [ ] Statistics dialog → load data 7 days
- [ ] Statistics dialog → load data 30 days
- [ ] Chart render correctly (uptime, response time)
- [ ] Incidents list populated
- [ ] Quick access from Domain Card works
- [ ] Full access from Statistics tab works

### Edge Cases
- [ ] Domain paused → chart shows old data
- [ ] No data available → show empty state
- [ ] Firebase error → fallback gracefully
- [ ] Spam click Play → debounced properly
- [ ] Domain deleted → stats dialog close

### Cross-Browser
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Mobile responsive

---

## 🚀 Deployment

### Steps
1. Commit all changes
2. Update version to 3.1.0
3. Test locally: `npm run dev`
4. Push to GitHub: `git push`
5. Vercel auto-deploy (1-2 minutes)
6. Verify production: Check footer version

### Rollback Plan
If critical bug:
1. Revert commit
2. Push to GitHub
3. Vercel auto-deploy previous version

---

## 📈 Success Metrics

### KPIs
- [ ] User can monitor individual domain on-demand
- [ ] Firebase quota usage stable or reduced
- [ ] Chart loading time < 2 seconds
- [ ] No critical bugs in production
- [ ] User feedback positive

### Analytics to Track
- How many domains paused on average?
- How often individual check used?
- Statistics dialog open rate
- Chart load performance

---

## 🔮 Future Enhancements

### Phase 2 (v3.2.0)
- Custom check interval per domain
- Maintenance window (schedule pause)
- Alert threshold per domain

### Phase 3 (v3.3.0)
- Group statistics (aggregate chart per group)
- Export statistics to PDF
- Compare multiple domains side-by-side

---

**Plan Created:** 7 Januari 2026  
**Estimated Completion:** 8 Januari 2026  
**Developer:** GitHub Copilot + Farid
