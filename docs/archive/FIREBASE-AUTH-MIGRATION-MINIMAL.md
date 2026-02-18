# Firebase Auth Migration (Minimal UI Change)

> **Doc Class:** Migration Reference  
> **Trust Level:** Transitional Reference (not primary source of truth)  
> **Last Reviewed:** 18 Februari 2026  
> **Source of Truth:** `PROJECT-STATUS.md` + `USER-MANAGEMENT-BLUEPRINT.md`

Status: Ready for implementation  
Date: 16 Februari 2026  
Owner: Development Team

## Progress Update

- ✅ Phase 1 (core service) sudah dibuat: `src/lib/firebase-auth.ts`
- ✅ Wiring awal di `App.tsx` sudah aktif untuk login/logout/create-user via Firebase Auth
- ✅ Hard switch login ke Firebase Auth sudah aktif (fallback legacy umum dimatikan)
- ✅ Disiapkan one-time bootstrap untuk akun admin lama agar tidak lockout saat transisi
- ✅ Rules user-management sudah auth-based (`request.auth`) di `firestore.rules`
- ⏳ Final hardening rules untuk koleksi monitoring masih bertahap karena cron script saat ini berjalan tanpa Firebase Auth

---

## 1) Objective

Mengaktifkan Firebase Authentication agar Firestore Rules bisa enforce role secara server-side, **tanpa mengubah UX login secara besar** (tetap input username + password).

---

## 2) Current Gap

Kondisi saat ini:
- Login masih custom dari data `users/user-directory`.
- Password user disimpan di dokumen app (plain text), bukan auth provider.
- Firestore rules belum bisa pakai `request.auth` untuk lock role.

Dampak:
- Role enforcement hanya di UI/client.
- User berpotensi bypass jika ada akses langsung ke Firestore API.

---

## 3) Target Architecture (MVP Secure)

### 3.1 Authentication
- Gunakan Firebase Auth provider: Email/Password.
- Login form **tetap** username + password.
- Username dipetakan ke email internal deterministic:
  - contoh: `farid` -> `farid@kendal.local`

### 3.2 User Profile Directory
- `users/user-directory` tetap dipakai untuk metadata manajemen user.
- Struktur user ditambah field:
  - `authUid` (uid dari Firebase Auth)
  - `email` (hasil mapping username)
  - `password` dihapus bertahap setelah migrasi selesai.

### 3.3 Authorization
- Firestore Rules pakai `request.auth.uid`.
- Role di-resolve dari `users/user-directory` berdasarkan `authUid`.
- Enforce:
  - admin: full manage users + write monitor data
  - viewer: read-only
  - add-only: create domain only (no update/delete)

---

## 4) Migration Strategy (Low-Risk)

## Phase 0 — Backup Gate (Wajib)
1. Backup patch code + checkpoint git.
2. Snapshot Firestore: `users`, `domains`, `groups`, `tags`.
3. Catat baseline deploy URL dan versi.

## Phase 1 — Auth Service Layer
Tambah modul baru, misalnya `src/lib/firebase-auth.ts`:
- `usernameToEmail(username)`
- `signInWithUsernamePassword(username, password)`
- `createAuthUser(username, password)` (pakai secondary app/auth agar admin tidak logout saat create user)
- `signOutAuth()`
- `onAuthStateChange()`

Catatan penting:
- Untuk create user via client SDK tanpa backend, gunakan **secondary Firebase app** agar sesi auth utama tidak terganti.

## Phase 2 — App Integration (Minimal UI Change)
- `LoginDialog` tetap sama (username/password).
- `handleLogin` di `App.tsx` pindah ke Firebase Auth sign-in.
- `currentUser` profile di-load dari `user-directory` via `authUid`.
- LocalStorage auth flag lama dipertahankan sementara hanya untuk compatibility, lalu dihapus bertahap.

## Phase 3 — Managed User Creation Flow
- Saat admin create user:
  1. Buat Auth account (secondary auth instance)
  2. Simpan metadata user ke `user-directory` dengan `authUid`
- Jika langkah 2 gagal, lakukan kompensasi (disable/delete auth user jika memungkinkan) dan tampilkan error jelas.

## Phase 4 — Firestore Rules Upgrade
- Ganti rules dari schema-guard only ke auth-based role guard:
  - `request.auth != null`
  - resolve role by uid
  - collection-level permissions sesuai matrix role

## Phase 5 — Cleanup
- Hapus field `password` dari profile user app.
- Hapus fallback login custom lama.
- Update changelog + release notes.

---

## 5) Required Firebase Console Changes

1. Enable Firebase Authentication > Email/Password.
2. Pastikan Firestore Rules deploy dari file repo.
3. (Opsional) tambahkan password policy minimum.

---

## 6) Rollback Plan

Jika fase migration gagal:
1. Revert code ke checkpoint sebelum migration.
2. Restore snapshot Firestore.
3. Redeploy versi stabil terakhir.
4. Jika ada auth user terbuat sebagian, disable sementara di Firebase Auth Console.

---

## 7) Definition of Done

- Login memakai Firebase Auth (username/password UX tetap).
- `currentUser` selalu terkait `request.auth.uid`.
- Firestore Rules enforce role server-side.
- Password tidak lagi disimpan di dokumen app.
- Regression pass untuk admin/viewer/add-only.

---

## 8) Execution Order (Next 3 Tasks)

1. Implement `src/lib/firebase-auth.ts` + wiring login/logout di `App.tsx`.
2. Update create user flow agar membuat Auth account + metadata profile atomik semaksimal mungkin.
3. Upgrade `firestore.rules` ke auth-based role enforcement dan uji 3 role.
