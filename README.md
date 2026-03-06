# 📊 Domain Monitor Dashboard - Kabupaten Kendal

Dashboard monitoring availability subdomain dengan Firebase sync, statistik uptime, notifikasi Slack, dan role-based user management.

- Live App: https://kendal-uptime.vercel.app
- Current Version: 3.11.24
- Runtime: React 19 + TypeScript + Vite 7 + Tailwind 4

---

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Build production:

```bash
npm run build
npm run preview
```

---

## ✅ Fitur Utama

### Monitoring
- 3-state status: `online`, `dns-only`, `offline`
- Batch staggered check (B1-B4) di aplikasi
- Auto-refresh + manual check
- Statistik daily/hourly + incident tracking
- Toggle global **Monitoring Cron** (admin) tersinkron ke Firebase + workflow
- Export laporan monitoring **PDF per domain** (periode 1/15/30 hari) — dari pin menu, dialog Statistik, atau halaman Analytics

### User & Permission (MVP)
- Login username + password
- Role: `admin`, `viewer`, `add-only`
- Guard permission pada aksi mutasi (edit/delete/pin/toggle monitoring)
- Manajemen user untuk admin

### Data & Integrasi
- Firebase Firestore sync untuk domain/group/tag
- Notification settings sync ke Firebase
- Slack webhook untuk alert down/recovery/slow
- Import/export CSV

### UI
- Responsive desktop/mobile
- Pin domain untuk prioritas monitoring
- Group & tag management

---

## 🤖 Monitoring 24/7 (GitHub Actions)

- Workflow: `.github/workflows/monitor-domains.yml`
- Schedule: `cron: '0 * * * *'` (setiap 1 jam)
- Script eksekusi: `node scripts/monitor-cron.js`
- Estimasi usage: ~1,728 menit/bulan dari kuota 2,000 menit

---

## 🧩 Struktur Proyek (Ringkas)

```text
src/
  App.tsx
  components/
  hooks/
  lib/
docs/
  NOW.md            # baca ini saja = paham segalanya
  CHANGELOG.md      # detail histori rilis
  GUIDES.md         # panduan penggunaan app
  archive/          # dokumen historis (reference only)
scripts/
  monitor-cron.js
  *.mjs (tools query/debug Firebase)
```

---

## 📚 Dokumentasi

- [docs/NOW.md](docs/NOW.md) — **baca ini saja** (status sistem, versi, roadmap, plan, progress, workflow deploy)
- [docs/CHANGELOG.md](docs/CHANGELOG.md) — detail histori semua rilis
- [docs/GUIDES.md](docs/GUIDES.md) — panduan penggunaan aplikasi

---

## 🛠️ Commands

```bash
# app
npm run dev
npm run build
npm run preview

# monitoring script
npm run monitor
npm run verify:auth-admin -- --email "admin@kendal.local" --password "***"

# firebase rules
npm run firebase:login
npm run firebase:rules:deploy
```

---

## 🔐 Security Notes

- Rules Firestore ada di `firestore.rules`
- Policy repo ada di `SECURITY.md`
- Kredensial workflow disimpan via GitHub Secrets
