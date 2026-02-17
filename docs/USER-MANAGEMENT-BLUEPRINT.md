# User Management Blueprint (Execution Baseline)

Status: Active baseline (MVP implemented, hardening in progress)  
Date: 16 Februari 2026  
Owner: Development Team

Execution Checklist: [USER-MANAGEMENT-IMPLEMENTATION-CHECKLIST.md](./USER-MANAGEMENT-IMPLEMENTATION-CHECKLIST.md)

Sinkronisasi kondisi saat ini:
- UI User Management di Settings sudah tersedia (admin only).
- Login berbasis user sudah berjalan dengan role admin/viewer/add-only.
- Guard read-only/add-only pada aksi mutasi sudah diterapkan.
- Alur auth untuk user management sudah diarahkan ke Firebase Auth (lihat dokumen migrasi auth).
- Audit log user-management sudah aktif (create user, toggle active, change password, delete user).
- Revision-aware write + retry/backoff untuk managed users sudah aktif.
- E2E Firebase real environment sudah lulus (7/7), termasuk skenario delete user non-admin.

---

## 1) Tujuan

Membangun fitur User Management di halaman Settings dengan kontrol permission terbatas, sambil menjaga keamanan sinkronisasi Firebase dan memastikan setiap perubahan bisa di-rollback.

Fokus awal (MVP):
- Admin dapat membuat user baru.
- Permission minimal:
  - View Only (hanya lihat)
  - Add URL Only (hanya tambah domain)
- Enforcement permission wajib di UI + Firestore Rules.
- Backup wajib sebelum coding dan sebelum testing.

---

## 2) Scope MVP

### In Scope
- Settings > User Management page.
- CRUD user terbatas: create + list + disable/enable + delete non-admin.
- Permission model granular:
  - canView
  - canAddDomain
- Session login berbasis user aktif.
- Audit log dasar untuk aksi sensitif:
  - create user
  - update permission
  - disable/enable user
   - delete user

### Out of Scope (Phase berikutnya)
- Multi-role kompleks (editor penuh, manager group/tag, dsb).
- SSO/OAuth.
- Password reset by email.
- Multi-tenant lintas organisasi.

---

## 3) Role & Permission Matrix (MVP)

| Role | canView | canAddDomain | Catatan |
|---|---|---|---|
| Admin | ✅ | ✅ | Full control user management |
| Viewer | ✅ | ❌ | Tidak boleh mengubah data |
| Add-Only | ✅ | ✅ | Hanya tambah domain, tanpa edit/delete |

Aturan operasional:
- Semua aksi selain view harus selalu cek permission.
- UI button disembunyikan jika tidak punya akses, tetapi validasi final tetap di backend rules.

---

## 4) Data Model (Draft)

### Collection users/{userId}
- id
- username
- passwordHash
- role
- permissions: { canView, canAddDomain }
- isActive
- createdAt
- createdBy
- updatedAt
- revision

### Collection audit-logs/{logId}
- actorUserId
- actorUsername
- action
- targetType
- targetId
- changes
- timestamp

Catatan:
- Tambahkan field revision untuk hardening konflik write.

---

## 5) Security & Firestore Rules (MVP)

Prinsip wajib:
- Admin-only untuk write ke users.
- Viewer/Add-Only hanya read data monitoring.
- Add-Only hanya boleh create domain baru (tanpa update/delete).
- Semua write penting mencatat audit log.

Checklist rules:
- Validasi request.auth != null.
- Validasi role/permissions dari dokumen user.
- Validasi field-level write untuk Add-Only.

Status implementasi saat ini (16 Feb 2026):
- File rules baseline sudah dibuat di [firestore.rules](../firestore.rules).
- Rule untuk user-management sudah auth-based (`request.auth`) untuk admin/viewer/add-only.
- Hardening rule koleksi monitoring masih bertahap agar tetap kompatibel dengan cron/background flow.

Aksi lanjutan wajib:
- Finalisasi hardening rules lintas koleksi monitoring + uji bypass langsung API.

---

## 6) Hardening Stage 2 (Selaras dengan User Management)

Implementasi setelah identity user stabil:
- Version check per dokumen (revision match).
- Retry dengan exponential backoff + jitter untuk error transient.
- Backup snapshot sebelum write kritikal.
- Conflict handling: jika revision mismatch, reload + merge strategy.

Kenapa penting:
- Mencegah last-write-wins overwrite antar device.
- Menjaga data pin/group/domain tetap konsisten.
- Meningkatkan forensic trace lewat audit + snapshot.

---

## 7) Backup-First SOP (WAJIB)

## A. Backup sebelum coding
1. Buat checkpoint git:
   - branch kerja khusus fitur
   - tag checkpoint awal
2. Simpan patch backup:
   - git diff > backup-pre-coding.patch
3. Simpan ringkasan state runtime:
   - versi aplikasi aktif
   - project Vercel aktif
   - user doc sample (tanpa data sensitif)

## B. Backup sebelum testing
1. Commit semua perubahan lokal ke branch fitur.
2. Buat patch kedua:
   - git diff --staged > backup-pre-testing.patch
3. Snapshot data penting Firebase (minimal users, domains, groups, tags):
   - export JSON via script internal
4. Dokumentasikan langkah rollback cepat.

## C. Rollback jika gagal
1. Rollback code via git revert / reset ke checkpoint.
2. Restore snapshot Firebase sesuai timestamp.
3. Redeploy versi stabil sebelumnya.

---

## 8) Testing Gate (Sebelum Merge)

### Gate 1: Permission
- Viewer tidak bisa add/edit/delete.
- Add-Only bisa add domain, tidak bisa edit/delete.
- Admin bisa create user dan ubah permission.

### Gate 2: Sync & Conflict
- Dua device edit bersamaan tidak menyebabkan data hilang.
- Konflik revision tertangani dengan aman.
- Retry/backoff berjalan saat network error sementara.

### Gate 3: Backup Drill
- Simulasi restore dari patch backup.
- Simulasi restore snapshot Firebase.
- Verifikasi data kembali konsisten.

---

## 9) Delivery Plan (Tahapan)

Phase 0 (Dokumen & Approval)
- Finalisasi blueprint ini.

Phase 1 (Identity & Permission MVP)
- Tambah user model + UI management.
- Enforcement permission di UI dan Firestore Rules.

Phase 2 (Hardening)
- Revision check + retry/backoff + snapshot backup.

Phase 3 (Stabilization)
- UAT, rollback drill, release note, deployment.

---

## 10) Definition of Done

Fitur dianggap selesai jika:
- User management MVP berjalan sesuai matrix permission.
- Tidak ada data pin/group/domain hilang saat multi-device update.
- Backup sebelum coding dan sebelum testing terbukti ada.
- Rollback procedure tervalidasi.
- Changelog dan versi footer sinkron pada saat deploy.

---

## 11) Approval

- Product Owner: Approved (MVP)
- Tech Lead: Approved (MVP)
- Ops/Deployment: Approved with staged hardening

Dokumen ini dipakai sebagai baseline operasional setelah MVP aktif.

---

## 12) Known Deployment Incident (Vercel) & Recovery

Insiden yang terjadi:
- Deploy sempat gagal berulang dengan error `tsc: command not found` di environment build Vercel.
- Penyebab praktis: tool build (`typescript`/`vite`) tidak selalu tersedia konsisten di runtime build server.

Recovery yang sudah terbukti berhasil:
- Gunakan konfigurasi install/build eksplisit di [vercel.json](../vercel.json):
  - `installCommand`: `npm install --include=dev && npm install --no-save typescript vite`
  - `buildCommand`: `npm run build`

Catatan operasional:
- Jika gejala serupa muncul lagi (`tsc` tidak ditemukan), cek dulu apakah `vercel.json` masih sesuai baseline di atas.
- Lakukan `vercel inspect <deployment-url> --logs` untuk konfirmasi akar masalah sebelum ubah script lain.

---

## 13) Next Priority (Post-MVP User Management)

Urutan kerja berikutnya yang direkomendasikan:
1. **Firestore Rules Enforcement (Wajib)**
   - Kunci akses server-side: admin/manage-users, viewer read-only, add-only create domain only.
   - Prasyarat: Firebase Auth aktif agar `request.auth` tersedia.
   - Referensi implementasi: [FIREBASE-AUTH-MIGRATION-MINIMAL.md](./FIREBASE-AUTH-MIGRATION-MINIMAL.md)
2. **Audit Log untuk aksi user management (Enhancement)**
   - Perluasan catatan untuk update role/permission yang lebih granular jika fitur role editor ditambahkan.
3. **Hardening write conflict (Stage 2)**
   - Tambah `revision` check + conflict handling pada write kritikal.
4. **Retry/backoff untuk sync transient error**
   - Exponential backoff + jitter agar tidak gagal diam-diam saat network bermasalah.
5. **Regression + rollback drill**
   - Uji role matrix end-to-end dan validasi restore snapshot sebelum release mayor berikutnya.

---

## 14) Operational Use Case (Wajib Dipatuhi)

1. **Backup file sebelum edit**
   - Simpan patch backup sebelum perubahan besar/kritis.
   - Minimum: `git diff > backup-pre-edit.patch` (atau varian bertimestamp).
2. **Pastikan sesi Vercel CLI aktif**
   - Jalankan `npx vercel login` bila sesi belum valid/expired sebelum aktivitas release/deploy.
3. **Setiap push yang memicu deploy Vercel wajib sinkron versi**
   - Update `docs/CHANGELOG.md`.
   - Update versi aplikasi di `src/lib/version.ts`.
   - Pastikan footer menampilkan versi yang sama dengan changelog setelah deploy.
