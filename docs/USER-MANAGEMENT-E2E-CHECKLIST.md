# User Management E2E Checklist (Firebase Real Environment)

Status: Completed (PASS)  
Date: 16 Februari 2026  
Project: kendal-monitor

---

## Tujuan

Memverifikasi alur end-to-end user management pada environment Firebase nyata:
- Auth login berjalan
- Role enforcement berjalan di UI + Firestore Rules
- Audit log tercatat untuk aksi sensitif

---

## Prasyarat

- [x] Firebase Authentication aktif (Email/Password)
- [x] Firestore Rules terdeploy dari [firestore.rules](../firestore.rules)
- [x] Project ID terkonfirmasi: `kendal-monitor`
- [x] Data awal user-directory tersedia (minimal 1 admin aktif)

---

## Cara Isi Checklist

- Tandai [x] jika sesuai expected result.
- Jika gagal, isi kolom Catatan (error, screenshot, timestamp).
- Simpan bukti dari Firebase Console (users + audit-logs) setelah test selesai.

---

## Skenario E2E Inti

### 1) Admin Login dan Akses User Management

| No | Langkah | Expected Result | Status | Catatan |
|---|---|---|---|---|
| 1.1 | Login sebagai admin | Login berhasil, masuk dashboard | [x] | Lulus |
| 1.2 | Buka Settings > User Management | Menu tampil untuk admin | [x] | Lulus |
| 1.3 | Verifikasi daftar user | Daftar user terlihat tanpa error | [x] | Lulus |

### 2) Admin Create User Viewer

| No | Langkah | Expected Result | Status | Catatan |
|---|---|---|---|---|
| 2.1 | Buat user baru role Viewer | User berhasil dibuat | [x] | Lulus |
| 2.2 | Cek dokumen users/user-directory | User baru muncul (role viewer, isActive true) | [x] | Lulus |
| 2.3 | Cek users/{authUid} | Profile akses user tersimpan | [x] | Lulus |
| 2.4 | Cek audit-logs | Ada event create-user | [x] | Lulus |

### 3) Viewer Permission Enforcement

| No | Langkah | Expected Result | Status | Catatan |
|---|---|---|---|---|
| 3.1 | Login sebagai viewer | Login berhasil | [x] | Lulus |
| 3.2 | Coba add domain | Ditolak (no permission) | [x] | Lulus |
| 3.3 | Coba edit/delete domain | Ditolak (no permission) | [x] | Lulus |
| 3.4 | Coba akses menu User Management | Tidak tampil | [x] | Lulus |

### 4) Add-Only Permission Enforcement

| No | Langkah | Expected Result | Status | Catatan |
|---|---|---|---|---|
| 4.1 | Buat user add-only (oleh admin) | User add-only berhasil dibuat | [x] | Lulus |
| 4.2 | Login sebagai add-only | Login berhasil | [x] | Lulus |
| 4.3 | Tambah domain baru | Berhasil | [x] | Lulus |
| 4.4 | Edit/delete domain | Ditolak (no permission) | [x] | Lulus |
| 4.5 | Cek menu User Management | Tidak tampil | [x] | Lulus |

### 5) Toggle User Active + Audit

| No | Langkah | Expected Result | Status | Catatan |
|---|---|---|---|---|
| 5.1 | Admin disable user viewer/add-only | Status user berubah isActive false | [x] | Lulus |
| 5.2 | Login user nonaktif | Ditolak (akun nonaktif) | [x] | Lulus |
| 5.3 | Cek audit-logs | Ada event toggle-user-active | [x] | Lulus |

### 6) Change Password + Audit

| No | Langkah | Expected Result | Status | Catatan |
|---|---|---|---|---|
| 6.1 | Login user aktif | Login berhasil | [x] | Lulus |
| 6.2 | Ganti password dari UI | Berhasil | [x] | Lulus |
| 6.3 | Login ulang dengan password baru | Berhasil | [x] | Lulus |
| 6.4 | Cek audit-logs | Ada event change-password | [x] | Lulus |

### 7) Delete User Non-Admin + Audit

| No | Langkah | Expected Result | Status | Catatan |
|---|---|---|---|---|
| 7.1 | Admin klik Delete pada user non-admin | User terhapus dari user-directory | [x] | Lulus |
| 7.2 | Cek users/{authUid} target | Profile akses direvoke (isActive false / permission false) | [x] | Lulus |
| 7.3 | Coba login user yang dihapus | Ditolak akses | [x] | Lulus |
| 7.4 | Cek audit-logs | Ada event delete-user | [x] | Lulus |

---

## Kriteria Lulus E2E

- [x] Seluruh skenario 1 sampai 7 lulus tanpa bypass permission
- [x] Tidak ada error rules permission-denied yang tidak sesuai role
- [x] Event audit log tercatat untuk aksi sensitif
- [x] User nonaktif tidak bisa login

---

## Bukti yang Wajib Disimpan

- [x] Screenshot users/user-directory setelah create + disable/enable
- [x] Screenshot users/{authUid} untuk minimal 1 viewer dan 1 add-only
- [x] Screenshot audit-logs berisi create-user, toggle-user-active, change-password, delete-user
- [x] Timestamp test run dan nama tester

---

## Ringkasan Hasil Test

- Tanggal test: 16 Februari 2026
- Tester: User (manual E2E)
- Total skenario pass: 7 / 7
- Kesimpulan: [x] LULUS  [ ] PERLU PERBAIKAN
- Catatan isu utama: Tidak ada blocker tersisa, seluruh flow user management lulus.
