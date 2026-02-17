# User Management Implementation Checklist (Execution Plan)

Status: In progress (MVP + E2E PASS, closing operational gates)  
Date: 16 Februari 2026  
Reference: USER-MANAGEMENT-BLUEPRINT.md

E2E (real Firebase) checklist: [USER-MANAGEMENT-E2E-CHECKLIST.md](./USER-MANAGEMENT-E2E-CHECKLIST.md)

---

## 0) Pre-Flight (Wajib sebelum coding)

### 0.1 Buat branch kerja
- [ ] `git checkout -b feature/user-management-mvp`

### 0.2 Backup code sebelum edit/coding
- [ ] `git status`
- [ ] `git add -A && git commit -m "chore: checkpoint before user-management"`
- [ ] `git tag backup-pre-user-management-$(date +%Y%m%d-%H%M)`
- [ ] `git diff > backup-pre-coding.patch`
- [ ] (Opsional kuat) `git diff > backup-pre-edit-$(date +%Y%m%d-%H%M).patch`

### 0.3 Backup data Firebase (snapshot manual/script)
- [ ] Export collection `users`
- [ ] Export collection `domains`
- [ ] Export collection `groups`
- [ ] Export collection `tags`
- [ ] Simpan dengan timestamp yang sama

---

## 1) Data Model & Type Layer

### File target
- `src/lib/types.ts`

### Checklist
- [ ] Tambah interface `UserPermissions`
- [ ] Tambah interface `AppUser`
- [ ] Tambah interface `AuditLog`
- [ ] Tambah tipe role: `admin | viewer | add-only`
- [ ] Tambah field metadata: `revision`, `createdAt`, `updatedAt`, `isActive`

Acceptance:
- [ ] TypeScript tidak error
- [ ] Semua field wajib/opsional jelas

---

## 2) Identity & Session Source of Truth

### File target
- `src/lib/firestore-sync.ts`
- `src/App.tsx`

### Checklist
- [ ] Ganti fallback user global agar tidak ambigu antar device
- [ ] Simpan user aktif saat login (`app-current-user-id`)
- [ ] Buat helper `getCurrentUserId()` yang konsisten
- [ ] Validasi jika user tidak aktif → auto-logout

Acceptance:
- [ ] User A dan User B membaca dokumen user masing-masing
- [ ] Tidak ada fallback yang menyebabkan cross-user overwrite

---

## 3) User Management Storage API

### File target
- `src/lib/firestore-sync.ts`

### Checklist
- [ ] Tambah `createUserInFirestore()`
- [ ] Tambah `getUsersFromFirestore()`
- [ ] Tambah `updateUserPermissionsInFirestore()`
- [ ] Tambah `setUserActiveStateInFirestore()`
- [ ] Tambah `writeAuditLog()`

Acceptance:
- [ ] Semua fungsi mengembalikan status sukses/gagal yang eksplisit
- [ ] Error handling tidak mengubah data menjadi empty state

---

## 4) Permission Guard di App Actions

### File target
- `src/App.tsx`

### Checklist
- [x] Buat helper `canView`, `canAddDomain`, `canManageUsers`
- [x] Guard pada add domain (`handleAddDomain`)
- [x] Guard pada action selain scope Add-Only (edit/delete/group/tag)
- [x] Toast pesan akses ditolak yang konsisten

Acceptance:
- [x] Viewer tidak bisa mutate data
- [x] Add-Only hanya bisa tambah domain
- [x] Admin punya akses manajemen user

---

## 5) UI Settings: User Management Page

### File target (baru/disesuaikan)
- `src/components/UserManagementDialog.tsx` (new)
- `src/components/SettingsMenuDialog.tsx`
- `src/components/LoginDialog.tsx`

### Checklist
- [x] Tambah menu "User Management" di Settings (admin only)
- [x] Tabel user: username, role, active status
- [x] Form create user: username, password, role/permission
- [x] Action enable/disable user
- [x] Integrasi dengan audit log write
- [x] Action delete user non-admin

Acceptance:
- [x] Admin bisa create user baru
- [x] UI viewer/add-only tidak melihat menu user management

---

## 6) Security Rules Firebase (Wajib)

Referensi migrasi auth:
- [FIREBASE-AUTH-MIGRATION-MINIMAL.md](./FIREBASE-AUTH-MIGRATION-MINIMAL.md)

### File target
- `firestore.rules` (atau dokumen rules deployment yang dipakai)

### Checklist
- [x] Buat baseline rules file: [firestore.rules](../firestore.rules)
- [x] Terapkan deny-by-default untuk collection di luar scope app
- [x] Tambah schema guard untuk `domains/groups/tags/users/domain-stats-daily/domain-incidents/github-actions-logs`
- [x] Rule read/write berdasarkan role user (scope user-management)
- [x] Hanya admin boleh write ke `users` (scope user-management)
- [x] Add-Only hanya boleh create domain baru (scope user-management)
- [x] Viewer hanya read (scope user-management)
- [x] Validasi field yang boleh ditulis (scope user-management + audit-log)

Catatan penting:
- Enforcement role server-side tetap membutuhkan `request.auth`.
- Login/auth untuk user management sudah dipindah ke Firebase Auth (minimal UX change).
- Rule auth-based untuk user-management sudah berjalan; hardening koleksi monitoring masih bertahap.
- Eksekusi teknis hardening lanjutan mengikuti dokumen referensi migrasi auth.

Acceptance:
- [x] Bypass via client-side disabled button tidak bisa lolos
- [x] Rule tested dengan akun role berbeda

---

## 7) Hardening Stage 2 Integration

### File target
- `src/lib/firestore-sync.ts`
- `src/App.tsx`

### Checklist
- [x] Tambah `revision` check pada write kritikal
- [x] Implement retry dengan exponential backoff + jitter
- [ ] Simpan backup snapshot sebelum overwrite dokumen penting
- [x] Conflict path: reload + merge minimal

Acceptance:
- [x] Dua device write bersamaan tidak menyebabkan hilang data diam-diam (guard revision + conflict response)
- [x] Conflict tercatat di log (via audit log untuk aksi user management)
- [x] Verifikasi end-to-end di environment Firebase real

---

## 8) Pre-Testing Backup Gate (Wajib)

### 8.1 Backup code sebelum testing
- [ ] `git add -A && git commit -m "feat: user-management mvp pre-test checkpoint"`
- [ ] `git diff --staged > backup-pre-testing.patch`

### 8.2 Backup data sebelum testing
- [ ] Snapshot ulang `users/domains/groups/tags`
- [ ] Simpan file snapshot dengan label `pre-testing`

---

## 9) Test Plan (Minimum)

### 9.1 Permission tests
- [x] Admin: create user berhasil
- [x] Viewer: add/edit/delete domain ditolak
- [x] Add-Only: add domain berhasil, edit/delete ditolak

### 9.2 Sync tests
- [ ] Login user berbeda di 2 browser/device
- [ ] Pin/group update tetap konsisten
- [ ] Simulasi network error: retry berjalan

### 9.3 Regression tests
- [ ] Domain import/export tetap berfungsi
- [ ] Notification settings tetap sync
- [ ] Statistics tab tetap normal

---

## 10) Rollback Runbook (Jika gagal)

### Code rollback
- [ ] `git reset --hard <checkpoint-commit>` atau `git revert <commit>`
- [ ] Redeploy versi stabil

### Data rollback
- [ ] Restore snapshot Firebase terbaru yang sehat
- [ ] Verifikasi collection `users/domains/groups/tags`

### Validation
- [ ] Login admin berhasil
- [ ] Data pin/group kembali sesuai baseline

---

## 11) Release Checklist

- [ ] Validasi backup file sebelum release (`backup-pre-edit*.patch` / `backup-pre-testing.patch`)
- [ ] Login Vercel CLI: `npx vercel login` (jika sesi belum aktif)
- [ ] Bump version di `src/lib/version.ts`
- [ ] Update `docs/CHANGELOG.md`
- [ ] Update release section di `src/components/ChangelogDialog.tsx`
- [ ] Deploy ke project Vercel yang benar (`monitoring-domain-bulk`)
- [ ] Verifikasi bundle production memuat versi terbaru
- [ ] Verifikasi footer app menampilkan versi yang sama dengan changelog
- [ ] Jika build gagal, cek log: `npx vercel inspect <deployment-url> --logs`
- [ ] Validasi baseline [vercel.json](../vercel.json):
	- [ ] `installCommand` = `npm install --include=dev && npm install --no-save typescript vite`
	- [ ] `buildCommand` = `npm run build`

### 11.0 Release Gate (Wajib per push/deploy Vercel)
- [ ] Setiap push yang menargetkan deploy: changelog + version footer harus sinkron
- [ ] Jika tidak sinkron, tahan push sampai versi disejajarkan

### 11.1 Incident Recovery (tsc not found)
- [ ] Gejala terdeteksi: `Command "npm run build" exited with 127` + `tsc: command not found`
- [ ] Jangan langsung ubah banyak script; lakukan diagnosis log dulu
- [ ] Pastikan konfigurasi install/build Vercel sama dengan baseline di atas
- [ ] Redeploy ulang setelah konfigurasi tervalidasi
- [ ] Simpan URL deploy gagal + deploy sukses ke catatan rilis internal

---

## 12) Owner Assignment (Opsional)

- Backend Rules: ____
- Frontend UI: ____
- Sync/Hardening: ____
- QA/Testing: ____
- Release/Deploy: ____

---

## 13) Completion Criteria

- [x] User Management MVP aktif di Settings
- [x] Permission enforcement valid di UI + Firestore Rules
- [ ] Backup sebelum coding & testing terdokumentasi
- [ ] Rollback drill pernah diuji minimal 1x
- [ ] Tidak ada regresi data hilang pada pin/group

---

## 14) Catatan Sinkronisasi (16 Feb 2026)

- [x] E2E Firebase real environment lulus 7/7 (lihat [USER-MANAGEMENT-E2E-CHECKLIST.md](./USER-MANAGEMENT-E2E-CHECKLIST.md))
- [x] Aksi `delete-user` sudah diimplementasikan (khusus non-admin) + audit log
- [ ] Gate operasional tersisa: backup evidence, rollback drill, dan regression lintas fitur
