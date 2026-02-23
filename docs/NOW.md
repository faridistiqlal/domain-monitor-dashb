# 📍 NOW - Single Source of Truth

> **Baca file ini saja = langsung paham keseluruhan sistem.**
> Tidak perlu baca file lain kecuali butuh detail spesifik.

**Last Updated:** 23 Februari 2026  
**Current Version:** 3.11.8 (sumber: `src/lib/version.ts`)  
**Live App:** https://kendal-uptime.vercel.app

---

## 📋 Prompt untuk Chat Session Baru

**Copy-paste prompt di bawah ini ke chat baru agar AI langsung paham konteks penuh:**

> ```
> Baca file docs/NOW.md di workspace ini. File itu adalah single source of truth
> untuk seluruh proyek. Setelah baca, kamu akan paham: apa proyeknya, tech stack,
> versi saat ini, fitur yang sudah jalan, roadmap & progress sampai mana,
> workflow deploy (test → vercel), dan changelog ringkas. Jika butuh detail
> rilis lengkap baca docs/CHANGELOG.md, jika butuh panduan user baca
> docs/GUIDES.md. Jangan buat file .md baru — semua plan & progress ditulis
> di NOW.md bagian Roadmap. Untuk perubahan rule/sistem, ikuti default
> deploy-first (deploy dulu, commit terakhir) dan pilih runbook D3/D4 sesuai
> tabel keputusan di section workflow.
> ```

---

## ⚡ RULES untuk AI / Developer Baru

1. **Plan & Progress di mana?**
   - **Plan baru / fitur baru** → tulis di bagian **§5. Roadmap** di file ini
   - **Progress / sudah sampai mana** → update status di tabel Roadmap (`Planned` → `In Progress` → `Done`)
   - **Selesai & di-release** → pindahkan ke tabel "Done Recently" + catat detail di `CHANGELOG.md`
   - **Catatan teknis harian** → tulis langsung di section Roadmap item terkait

2. **Sebelum coding, baca file ini saja.** Tidak perlu baca file lain.

3. **Setelah coding & sebelum deploy:**
   - Update versi di `src/lib/version.ts` (wajib setiap deploy)
   - Tambah entry di `docs/CHANGELOG.md`
   - Update status roadmap di file ini (§5)
   - Update "Last Updated" di header file ini

4. **Versioning rule (setiap deploy wajib bump versi):**
   - **Perubahan minor** (fix, tweak, style, docs) → bump angka paling kanan: `3.10.2` → `3.10.3`
   - **Perubahan major** (fitur baru, breaking change) → bump angka tengah/kiri: `3.10.x` → `3.11.0`
   - Versi di `src/lib/version.ts` = yang tampil di footer app
   - Setiap bump versi **wajib** tambah entry di `docs/CHANGELOG.md`

5. **Jangan buat file .md baru** kecuali benar-benar perlu. Semua plan/status/progress cukup di file ini.

6. **Git commit per kategori, bukan sekaligus.** Pisahkan commit berdasarkan jenis perubahan:
   - `docs: simplify documentation structure` — perubahan dokumentasi
   - `feat: add user management dialog` — fitur baru
   - `fix: pin sync across devices` — bug fix
   - `refactor: clean firestore sync logic` — refactor kode
   - `chore: remove backup patch files` — cleanup/maintenance
   - `style: fix mobile card overflow` — UI/styling
   
   Format: `kategori: 4-5 kata penjelasan`. Jangan commit semua file sekaligus.

7. **Default eksekusi untuk perubahan rule/sistem: deploy dulu, commit terakhir.**
   - Untuk perubahan yang menyentuh **rules/security/auth/workflow production**, urutan wajib:
     1) implement + test lokal,
     2) deploy (Vercel dan/atau Firebase rules sesuai scope),
     3) verifikasi production,
     4) baru lakukan commit/push final.
   - Commit tetap dipisah per kategori, tetapi dilakukan setelah deploy/verifikasi selesai.

8. **Sebelum commit atau deploy, wajib cek error/warning dulu.**
  - Jalankan pengecekan minimal: diagnostics TypeScript/ESLint + `npm run build`.
  - Jika masih ada error, **dilarang commit/deploy** sampai beres.
  - Warning yang relevan dengan perubahan harus ditangani atau dicatat alasannya.

---

## 1. Apa Ini?

Dashboard monitoring availability subdomain Kabupaten Kendal.  
Fitur inti: cek status domain (online/dns-only/offline), statistik uptime, notifikasi Slack, sinkronisasi Firebase, user management.

### Tech Stack
- Frontend: React 19 + TypeScript + Vite 7 + Tailwind CSS 4
- Data: Firebase Firestore
- Monitoring terjadwal: GitHub Actions (`.github/workflows/monitor-domains.yml`)
- Script cron: `scripts/monitor-cron.js`
- Rules keamanan: `firestore.rules`
- Deploy: Vercel (manual deploy via Vercel CLI)

---

## 2. Status Sistem (Production Ready)

| Aspek | Detail |
|-------|--------|
| Status | ✅ Production Ready |
| Role aktif | `admin`, `viewer`, `add-only` |
| Monitoring cron | GitHub Actions tiap 1 jam (`0 * * * *`) |
| Runtime per run | ~2.4 menit |
| Usage bulanan | ~1,728 menit/bulan (86% kuota 2,000) |
| Deploy target | Vercel production |

### Fitur Implementasi

**Monitoring & Data:**
- 3-state status: `online`, `dns-only`, `offline`
- Batch staggered checking (B1-B4)
- Statistik harian/jam + incident tracking
- Auto-refresh (60 detik) + manual check
- Sinkronisasi domain/group/tag ke Firebase
- Import/export CSV
- Pin domain (sync antar device)

**User & Permission (MVP - v3.10.0):**
- Login username + password (bukan password-only lagi)
- Role enforcement: admin (full), viewer (read-only), add-only (tambah domain saja)
- User Management dialog khusus admin
- Managed users sync ke Firebase (`users/user-directory`)

**Notifications:**
- Slack webhook settings sinkron ke Firebase
- Rule: down / recovery / slow + cooldown
- Per-domain notification toggle tersimpan cloud

**UI/UX (v3.11.0):**
- Dark/Light mode toggle (persisted, tersedia di header + mobile nav + landing page)
- Audit log viewer (timeline UI, admin only, dari Settings menu)
- Landing page login screen dengan loading state + spinner
- FAQ dialog di footer (10 item)
- Uptime bar tooltip redesign (readable, colored dots)
- Dynamic toast colors (richColors)

---

## 3. Struktur Proyek

```text
src/
  App.tsx                     # Entry point aplikasi
  components/                 # React components
  hooks/                      # Custom hooks
  lib/
    version.ts                # APP_VERSION (source of truth versi)
    firestore-sync.ts         # Firebase sync logic
docs/
  NOW.md                      # ← File ini (baca ini saja)
  CHANGELOG.md                # Detail histori semua rilis
  GUIDES.md                   # Panduan penggunaan aplikasi
  archive/                    # Dokumen historis (reference only)
scripts/
  monitor-cron.js             # Script monitoring GitHub Actions
  *.mjs                       # Tools query/debug Firebase
.github/workflows/
  monitor-domains.yml         # Cron job monitoring tiap 1 jam
firestore.rules               # Security rules Firestore
```

---

## 4. Release Terbaru

### v3.11.8 (23 Feb 2026) — **Patch: R-006 Refactor App.tsx (Phase 6)**
- Ekstraksi scheduler auto-refresh dari `App.tsx` ke hook `use-auto-refresh-scheduler`
- Scheduler mencakup initial delay 10 detik, worker lifecycle, dan reset countdown batch
- Perbaikan konflik compile pada hook scheduler (duplikasi implementasi/export) + penyelarasan API `onAutoCheck`
- Tidak ada perubahan behavior fungsional (refactor internal)
- Validasi lokal: diagnostics bersih + `npm run build` PASS

### v3.11.7 (23 Feb 2026) — **Patch: R-006 Refactor App.tsx (Phase 4+5)**
- Ekstraksi tracking Firebase ops ke hook `use-firebase-ops-tracker`
- Ekstraksi kalkulasi seleksi domain tab Kelola ke hook `use-manage-selectable-domains`
- Tidak ada perubahan behavior fungsional (refactor internal)
- Validasi lokal: diagnostics bersih + `npm run build` PASS

### v3.11.6 (23 Feb 2026) — **Patch: R-006 Refactor App.tsx (Phase 3)**
- Ekstraksi manajemen seleksi domain ke hook `use-domain-selection`
- Penyederhanaan handler select domain/select all di `App.tsx`
- Tidak ada perubahan behavior fungsional (refactor internal)
- Validasi lokal: diagnostics bersih + `npm run build` PASS

### v3.11.5 (23 Feb 2026) — **Patch: R-006 Refactor App.tsx (Phase 1)**
- Backup file dibuat sebelum refactor (`backups/App.tsx.backup-...`)
- Ekstraksi logic dari `App.tsx` ke hooks:
  - `use-manual-refresh-cooldown`
  - `use-domain-insights`
  - `use-cross-tab-logout`
- Tidak ada perubahan behavior fungsional (refactor internal)
- Validasi lokal: diagnostics bersih + `npm run build` PASS

### v3.11.4 (23 Feb 2026) — **Patch: Rollback Public Status Route**
- Hapus fitur **public status page** dan route `/status`
- Hapus fallback query `?view=status`
- Konfigurasi `vercel.json` dikembalikan tanpa rewrite khusus route publik
- Validasi lokal: diagnostics bersih + `npm run build` PASS

### v3.11.3 (23 Feb 2026) — **Minor: Public Status MVP + Session Sync**
- Tambah **public status page** read-only (MVP) untuk visualisasi status layanan tanpa login
- Akses mode publik via path `/status` atau query `?view=status`
- Tambah mode **Preview** jika data live belum tersedia
- Tambah sinkronisasi logout antar tab via **BroadcastChannel** + fallback event `storage`
- Validasi lokal: diagnostics bersih + `npm run build` PASS

### v3.11.2 (19 Feb 2026) — **Minor: Loading UX + Optimization + Cleanup**
- Tambah loading skeleton saat initial Firebase data fetch (authenticated state)
- Deduplikasi domain loading flow (initial + version-change) agar konsisten
- Tambah `useCallback` pada handler utama untuk mengurangi re-render
- Cleanup dependency tidak terpakai: `three` dan `@heroicons/react`
- Patch stabilitas runtime: perbaikan inisialisasi `checkAllDomains` untuk mencegah error `Cannot access ... before initialization`
- Hardening login phase: skip bootstrap Firebase sebelum autentikasi agar tidak spam `permission-denied` di console
- Hardening logging: hapus log sensitif yang menampilkan payload notification settings (termasuk webhook URL)
- Mobile settings parity: tambah menu **Management Akun** dan **Log History** di mobile view
- Error boundary per tab/section untuk isolasi error UI agar tidak menjatuhkan seluruh halaman
- Manual refresh cooldown 30 detik untuk menahan spam check beruntun
- Accessibility baseline: tambah ARIA labels pada kontrol utama (tabs/manual refresh/action icons)
- Insight per domain: badge uptime 7d/30d + response-time sparkline (list monitoring & pin card)

### v3.11.1 (19 Feb 2026) — **Minor: Security Hardening + Logging Cleanup**
- Hapus hardcoded default password `admin123` dari source code
- Bootstrap password admin pakai `VITE_DEFAULT_ADMIN_PASSWORD` (opsional) atau localStorage
- Firestore rules diperketat: auth guard untuk `domains/groups/tags`
- Write guard: `domains` hanya admin/add-only, `groups/tags` hanya admin
- Logging `App.tsx` dirouting ke dev-only logger (noise production berkurang)
- Verifikasi backend PASS: unauth read/write ke `domains/groups/tags` ditolak (`403`)
- Verifikasi role matrix PASS: `admin` full write, `add-only` write `domains` saja, `viewer` read-only

### v3.11.0 (18 Feb 2026) — **Major: Dark Mode + Audit Log**
- Dark/Light mode toggle dengan `next-themes` (persist di localStorage)
- Audit log viewer UI (timeline, fetch dari Firestore, admin only)
- Landing page login screen dengan loading/disable state + spinner
- FAQ dialog di footer (10 item accordion)
- Uptime bar tooltip redesign (bg-popover, colored dots)
- Dynamic toast colors (`richColors` Sonner)
- Fix TS errors: GroupCard optional chaining, TagCard status/group props
- Fix audit log dialog scroll issue

### v3.10.2 (16 Feb 2026)
- Firestore Rules deploy finalized
- Script deploy rules disiapkan (`firebase.json` + `package.json`)
- E2E checklist user management selesai (PASS)
- Footer version sinkron changelog

### v3.10.1 (16 Feb 2026)
- Lock aksi mutasi untuk read-only/add-only diperketat
- Pin/monitoring toggle gated by permission

### v3.10.0 (16 Feb 2026) — **Major: User Management MVP**
- Username + password login (bukan password-only)
- Admin: create/enable/disable user
- Role enforcement: viewer, add-only, admin
- Managed users sync ke Firebase

### v3.9.11 (16 Feb 2026)
- Data-loss prevention: skip auto-sync startup, throw on read error

### v3.9.10 (16 Feb 2026)
- Sinkronisasi estimasi runtime GitHub Actions (~2.4 min/run)

### v3.9.9 (1 Feb 2026)
- Schedule diubah dari 20 menit → 1 jam (fix syntax error + quota)

### v3.9.8 (24 Jan 2026)
- 80% reduction workflow time (minimal deps install)

### v3.9.5-3.9.7 (12-19 Jan 2026)
- Groups persistence fix, notification settings Firebase sync, UI fixes

### v3.9.0-3.9.4 (12 Jan 2026)
- Search in assign dialog, tag sync fix, pin sync fix, icon/layout fixes

### Milestone Lama
| Versi | Highlight |
|-------|-----------|
| v3.8.x | UptimeBar fix, GitHub Actions stats, domain persistence, countdown timer |
| v3.7.x | GitHub Actions health monitoring tab |
| v3.6.x | GitHub Actions 24/7 monitoring (FREE tier) |
| v3.5.x | Mobile responsive, unified charts |
| v3.4.x | Individual monitoring, pin tab Firebase sync |
| v3.1.x | Analytics data, individual domain monitoring |
| v2.3.x | Firebase optimization, staggered auto-check |
| v2.2.0 | Slack notifications |
| v2.1.0 | Firebase cloud sync |
| v2.0.0 | Statistics, tags, manual check |
| v1.0.0 | Initial release (2023) |

Detail lengkap setiap versi: [CHANGELOG.md](./CHANGELOG.md)

---

## 5. Roadmap (Pending Work)

#### 🔴 High Priority (Fix / Security)
| ID | Item | Kategori | Effort | Status | Target |
|----|------|----------|--------|--------|--------|
| R-006 | Refactor App.tsx god component (~3600 baris → hooks + sub-components) | fix | large | In Progress (Phase 6 done) | 3.12.x |
| R-007 | Hapus console.log berlebihan (~126 statements di App.tsx) | fix | small | Done | 3.11.x |
| R-008 | Tambah `useCallback` pada handler functions (cegah re-render) | fix | medium | Done | 3.12.x |
| R-004 | Firestore rules: auth guard pada domains/groups/tags collections | fix/security | small | Done | 3.11.x |
| R-009 | Hardcode default password `admin123` di source code | fix/security | small | Done | 3.11.x |

#### 🟡 Medium Priority (Improvement / Feature)
| ID | Item | Kategori | Effort | Status | Target |
|----|------|----------|--------|--------|--------|
| R-010 | Deduplikasi domain loading logic (initial + version-change) | fix | medium | Done | 3.12.x |
| R-011 | Error boundary per section/tab (bukan hanya root) | improvement | small | Done | 3.11.x |
| R-012 | Accessibility: ARIA labels, keyboard nav, color-blind safe indicators | improvement | medium | Done (baseline) | 3.11.x |
| R-013 | Konsistensi bahasa UI (campur ID/EN → pilih satu atau i18n) | improvement | medium | Planned | 3.13.x |
| R-014 | Loading skeleton saat initial Firebase data fetch | improvement | small | Done | 3.11.x |
| R-015 | Public status page (read-only, tanpa auth) | feature | large | Planned | 3.13.x |
| R-016 | Uptime percentage badge per domain (7d/30d) | feature | medium | Done | 3.11.x |
| R-017 | Response time trend sparkline charts per domain | feature | medium | Done | 3.11.x |

#### 🟢 Low Priority (Nice to Have)
| ID | Item | Kategori | Effort | Status | Target |
|----|------|----------|--------|--------|--------|
| R-018 | Keyboard shortcuts (R=refresh, /=search, 1-6=tab, Esc=close) | feature | small | Planned | 3.13.x |
| R-019 | Bulk operations: pin, enable notif, assign tag dari manage tab | improvement | medium | Planned | 3.13.x |
| R-020 | SSL certificate expiry monitoring & warning (30/14/7 hari) | feature | large | Planned | 3.14.x |
| R-021 | Rate limiting pada manual refresh (cooldown 30s) | improvement | small | Done | 3.11.x |
| R-022 | Session management: sync logout antar tab (BroadcastChannel) | improvement | medium | Done | 3.11.x |
| R-023 | Cleanup unused dependencies (three, embla, vaul, heroicons) | fix | small | Done | 3.11.x |
| R-005 | Governance update docs per release | improvement | small | Planned | ongoing |

### Done Recently
| ID | Item | Versi |
|----|------|-------|
| R-006 | Refactor App.tsx phase 6 (auto-refresh scheduler hook) | 3.11.8 |
| R-022 | Sync logout antar tab (BroadcastChannel + storage fallback) | 3.11.3 |
| R-011 | Error boundary per tab/section | 3.11.2 |
| R-012 | Accessibility baseline (ARIA labels kontrol utama) | 3.11.2 |
| R-016 | Uptime badge 7d/30d per domain | 3.11.2 |
| R-017 | Response-time sparkline per domain | 3.11.2 |
| R-021 | Manual refresh cooldown 30 detik | 3.11.2 |
| R-008 | Tambah useCallback pada handler utama | 3.11.2 |
| R-010 | Deduplikasi domain loading flow | 3.11.2 |
| R-014 | Loading skeleton initial Firebase fetch | 3.11.2 |
| R-023 | Cleanup dependency unused (three, heroicons) | 3.11.2 |
| D-008 | Mobile menu settings: Management Akun + Log History | 3.11.2 |
| D-009 | Login-phase hardening + safe logging (no webhook dump) | 3.11.2 |
| R-007 | Hapus console.log berlebihan di App.tsx | 3.11.1 |
| R-004 | Firestore rules auth guard domains/groups/tags | 3.11.1 |
| R-009 | Hapus hardcoded default password source code | 3.11.1 |
| D-004 | Dark/Light mode toggle | 3.11.0 |
| D-005 | Audit log viewer UI | 3.11.0 |
| D-006 | Landing page login + FAQ + tooltip fix | 3.11.0 |
| D-007 | Fix TS errors GroupCard + TagCard | 3.11.0 |
| R-001 | Simplifikasi dokumentasi ke single-entry | 3.10.x |
| R-002 | Split dokumen historis ke `docs/archive/` | 3.10.x |
| R-003 | Sinkronisasi metadata arsip | 3.10.x |
| D-001 | User Management MVP | 3.10.0 |
| D-002 | Read-only/add-only action lock | 3.10.1 |
| D-003 | Firebase rules deploy & E2E | 3.10.2 |

---

## 6. Workflow: Plan → Test → Deploy → Commit

### A. Sebelum coding
1. (Opsional) Backup: `git diff > backup-pre-edit-$(date +%Y%m%d-%H%M%S).patch`
2. Tetapkan scope perubahan + target versi

### B. Implementasi
1. Ubah kode sesuai scope
2. Update versi di `src/lib/version.ts`
3. Catat perubahan di `docs/CHANGELOG.md`

### C. Validasi lokal
```bash
npm run build          # Wajib berhasil
npm run dev            # Opsional: verifikasi manual
```

### D. Deploy ke Vercel
Deploy dilakukan lewat **Vercel CLI** (bukan Git push auto-deploy).

```bash
npx vercel login                                    # Login dulu (session expire di codespace baru)
npx vercel link --project monitoring-domain-bulk --yes  # Link ke project yang benar
npx vercel --prod --yes                              # Deploy ke production
```

**Info deploy:**
- Project: `monitoring-domain-bulk`
- Deployment URL: `monitoring-domain-bulk-*-farid-istiqlals-projects.vercel.app`
- Production Domain: `kendal-uptime.vercel.app`

> **Penting:** Di Codespace/session baru, `npx vercel login` wajib dijalankan ulang karena session CLI tidak persist.

### D2. Deploy Firestore Rules (jika ada perubahan rule/security)
```bash
npm run firebase:login
npx firebase-tools deploy --only firestore:rules --project kendal-monitor
```

### Pilih Runbook (D3 vs D4)
| Kondisi Perubahan | Pakai | Catatan |
|---|---|---|
| Ada perubahan `firestore.rules`, auth, permission, atau security policy | **D3** | Wajib deploy Firestore rules + verifikasi role/access |
| Perubahan UI/docs/refactor internal tanpa perubahan rules/security | **D4** | Cukup deploy Vercel + smoke check |

### D3. Runbook Cepat (Copy-Paste, deploy-first)
```bash
# 1) Validasi lokal
npm run build

# 2) Deploy web app ke production
npx vercel login
npx vercel link --project monitoring-domain-bulk --yes
npx vercel --prod --yes

# 3) Deploy Firestore rules (jalankan jika firestore.rules berubah)
npm run firebase:login
npx firebase-tools deploy --only firestore:rules --project kendal-monitor

# 4) Smoke check production
curl -I https://kendal-uptime.vercel.app | head -n 5

# 5) Commit & push setelah verifikasi
git add -A
git commit -m "fix: ringkas perubahan rilis"
git push origin main
```

### D4. Runbook Singkat (tanpa perubahan rules)
```bash
# 1) Validasi lokal
npm run build

# 2) Deploy web app ke production
npx vercel login
npx vercel link --project monitoring-domain-bulk --yes
npx vercel --prod --yes

# 3) Smoke check production
curl -I https://kendal-uptime.vercel.app | head -n 5

# 4) Commit & push setelah verifikasi
git add -A
git commit -m "chore: ringkas rilis tanpa rules"
git push origin main
```

### E. Post-deploy
1. Cek https://kendal-uptime.vercel.app
2. Verifikasi footer version == changelog terbaru
3. Jika gagal: cek log Vercel → rollback/redeploy

### F. Commit & Push (setelah deploy/verifikasi)
1. `git add` per kategori perubahan
2. Commit terpisah per kategori (`fix: ...`, `docs: ...`, dst)
3. `git push origin main`

### Release Gate Checklist
- [ ] Kode sudah dites lokal (`npm run build` pass)
- [ ] `src/lib/version.ts` sinkron target rilis
- [ ] `docs/CHANGELOG.md` diupdate
- [ ] Sesi `npx vercel login` valid
- [ ] Jika ubah `firestore.rules`: deploy rules ke `kendal-monitor` sukses
- [ ] Deploy sukses, footer versi sesuai
- [ ] Commit/push dilakukan setelah verifikasi production selesai

### Evidence Verifikasi (isi setiap rilis)
- [ ] **Deployment URL (Vercel):** `https://monitoring-domain-bulk-...vercel.app`
- [ ] **Production URL:** `https://kendal-uptime.vercel.app`
- [ ] **Smoke Check:** `curl -I https://kendal-uptime.vercel.app` → `HTTP 200`
- [ ] **Version Check:** footer app = `src/lib/version.ts` = entry rilis di `CHANGELOG.md`
- [ ] **Rules Check (jika ubah rules):** unauth `domains/groups/tags` → `403 PERMISSION_DENIED`
- [ ] **Role Matrix (jika ubah auth/rules):**
  - admin: read/write `domains/groups/tags` ✅
  - add-only: write `domains` ✅, write `groups/tags` ❌ (`403`)
  - viewer: read ✅, write `domains/groups/tags` ❌ (`403`)

#### Contoh Terisi — v3.11.1 (19 Feb 2026)
- [x] **Deployment URL (Vercel):** `https://monitoring-domain-bulk-ip52zj8fe-farid-istiqlals-projects.vercel.app`
- [x] **Production URL:** `https://kendal-uptime.vercel.app`
- [x] **Smoke Check:** `curl -I https://kendal-uptime.vercel.app` → `HTTP 200`
- [x] **Version Check:** bundle production memuat `3.11.1` dan metadata docs sinkron
- [x] **Rules Check:** unauth GET/PATCH `domains/groups/tags` → `403 PERMISSION_DENIED`
- [x] **Role Matrix:**
  - admin (`admin`): read/write `domains/groups/tags` ✅
  - add-only (`budi`): write `domains` ✅, write `groups/tags` ❌ (`403`)

#### Contoh Terisi — v3.11.2 update (23 Feb 2026)
- [x] **Deployment URL (Vercel):** `https://monitoring-domain-bulk-gf713v8fs-farid-istiqlals-projects.vercel.app`
- [x] **Production URL:** `https://kendal-uptime.vercel.app`
- [x] **Smoke Check:** `curl -I https://kendal-uptime.vercel.app` → `HTTP 200`
- [x] **Version Check:** production masih `3.11.2` (sinkron dengan `src/lib/version.ts` dan changelog)
- [x] **Feature Check:** tab-level boundary, cooldown 30s, insight badge/sparkline tampil normal

#### Contoh Terisi — v3.11.3 (23 Feb 2026)
- [x] **Deployment URL (Vercel):** `https://monitoring-domain-bulk-cc44zn4do-farid-istiqlals-projects.vercel.app`
- [x] **Production URL:** `https://kendal-uptime.vercel.app`
- [x] **Smoke Check:** `curl -I https://kendal-uptime.vercel.app`, `curl -I https://kendal-uptime.vercel.app/status`, `curl -I 'https://kendal-uptime.vercel.app/?view=status'` → semuanya `HTTP 200`
- [x] **Version Check:** production memuat `3.11.3` (sinkron dengan `src/lib/version.ts`, NOW, CHANGELOG, GUIDES)
- [x] **Feature Check:** public status page `/status` tampil, logout sync antar tab aktif
  - viewer (`farid`, `eek`): read ✅, write `domains/groups/tags` ❌ (`403`)

#### Contoh Terisi — v3.11.4 (23 Feb 2026)
- [x] **Deployment URL (Vercel):** `https://monitoring-domain-bulk-a9ezpscea-farid-istiqlals-projects.vercel.app`
- [x] **Production URL:** `https://kendal-uptime.vercel.app`
- [x] **Smoke Check:** `curl -I https://kendal-uptime.vercel.app` → `HTTP 200`, `curl -I https://kendal-uptime.vercel.app/status` → `HTTP 404`
- [x] **Version Check:** production memuat `3.11.4` (sinkron dengan `src/lib/version.ts`, NOW, CHANGELOG, GUIDES)
- [x] **Feature Check:** route publik `/status` dinonaktifkan (rollback), dashboard utama tetap normal

#### Contoh Terisi — v3.11.5 (23 Feb 2026)
- [x] **Deployment URL (Vercel):** `https://monitoring-domain-bulk-oa6m97lq6-farid-istiqlals-projects.vercel.app`
- [x] **Production URL:** `https://kendal-uptime.vercel.app`
- [x] **Smoke Check:** `curl -I https://kendal-uptime.vercel.app` → `HTTP 200`, `curl -I https://kendal-uptime.vercel.app/status` → `HTTP 404`
- [x] **Version Check:** production memuat `3.11.5` (sinkron dengan `src/lib/version.ts`, NOW, CHANGELOG, GUIDES)
- [x] **Feature Check:** refactor `App.tsx` phase 1 live, perpindahan tab lebih responsif (query insights tidak ter-trigger berulang)

#### Contoh Terisi — v3.11.6 (23 Feb 2026)
- [x] **Deployment URL (Vercel):** `https://monitoring-domain-bulk-kiy6lr01q-farid-istiqlals-projects.vercel.app`
- [x] **Production URL:** `https://kendal-uptime.vercel.app`
- [x] **Smoke Check:** `curl -I https://kendal-uptime.vercel.app` → `HTTP 200`, `curl -I https://kendal-uptime.vercel.app/status` → `HTTP 404`
- [x] **Version Check:** production memuat `3.11.6` (sinkron dengan `src/lib/version.ts`, NOW, CHANGELOG, GUIDES)
- [x] **Feature Check:** refactor `App.tsx` phase 3 live (state seleksi domain dipindah ke hook `use-domain-selection`)

#### Contoh Terisi — v3.11.7 (23 Feb 2026)
- [x] **Deployment URL (Vercel):** `https://monitoring-domain-bulk-agkxjfrw6-farid-istiqlals-projects.vercel.app`
- [x] **Production URL:** `https://kendal-uptime.vercel.app`
- [x] **Smoke Check:** `curl -I https://kendal-uptime.vercel.app` → `HTTP 200`, `curl -I https://kendal-uptime.vercel.app/status` → `HTTP 404`
- [x] **Version Check:** production memuat `3.11.7` (sinkron dengan `src/lib/version.ts`, NOW, CHANGELOG, GUIDES)
- [x] **Feature Check:** refactor `App.tsx` phase 4+5 live (`use-firebase-ops-tracker`, `use-manage-selectable-domains`)

#### Contoh Terisi — v3.11.8 (23 Feb 2026)
- [x] **Deployment URL (Vercel):** `https://monitoring-domain-bulk-2n0i9mn89-farid-istiqlals-projects.vercel.app`
- [x] **Production URL:** `https://kendal-uptime.vercel.app`
- [x] **Smoke Check:** `curl -I https://kendal-uptime.vercel.app` → `HTTP 200`, `curl -I https://kendal-uptime.vercel.app/status` → `HTTP 404`
- [x] **Version Check:** production memuat `3.11.8` (sinkron dengan `src/lib/version.ts`, NOW, CHANGELOG, GUIDES)
- [x] **Feature Check:** refactor `App.tsx` phase 6 live (`use-auto-refresh-scheduler`)

#### Template Kosong (Copy-Paste per rilis)
```markdown
#### Contoh Terisi — vX.Y.Z (DD Mon YYYY)
- [ ] **Deployment URL (Vercel):** `https://monitoring-domain-bulk-...vercel.app`
- [ ] **Production URL:** `https://kendal-uptime.vercel.app`
- [ ] **Smoke Check:** `curl -I https://kendal-uptime.vercel.app` → `HTTP 200`
- [ ] **Version Check:** footer app = `src/lib/version.ts` = entry rilis di `CHANGELOG.md`
- [ ] **Rules Check (jika ubah rules):** unauth GET/PATCH `domains/groups/tags` → `403 PERMISSION_DENIED`
- [ ] **Role Matrix (jika ubah auth/rules):**
  - admin (`<username-admin>`): read/write `domains/groups/tags` ✅
  - add-only (`<username-add-only>`): write `domains` ✅, write `groups/tags` ❌ (`403`)
  - viewer (`<username-viewer>`): read ✅, write `domains/groups/tags` ❌ (`403`)
```

---

## 7. Commands Reference

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build production
npm run preview          # Preview build

# Monitoring
npm run monitor          # Run monitoring script

# Firebase
npm run firebase:login   # Login Firebase CLI
npm run firebase:rules:deploy  # Deploy Firestore rules

# Deploy
npx vercel login         # Login Vercel CLI
npx vercel --prod        # Manual deploy production
```

---

## 8. File Dokumentasi

| File | Fungsi |
|------|--------|
| [NOW.md](./NOW.md) | ← File ini. Baca ini = tahu segalanya |
| [CHANGELOG.md](./CHANGELOG.md) | Detail lengkap semua rilis (30+ versi) |
| [GUIDES.md](./GUIDES.md) | Panduan penggunaan aplikasi untuk end-user |
| [archive/](./archive/) | Dokumen historis (development plan, blueprint, checklist lama) |

---

*File ini adalah satu-satunya yang perlu dibaca untuk memahami keseluruhan sistem.*
