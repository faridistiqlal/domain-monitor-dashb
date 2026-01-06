# Fitur Keamanan - Domain Monitor

## 📋 Overview
Aplikasi Domain Monitor sekarang dilengkapi dengan sistem keamanan berlapis untuk melindungi data dan membatasi akses edit/delete.

## 🔐 Fitur yang Diimplementasikan

### 1. **Password Authentication**
- User harus login dengan password sebelum bisa mengakses fitur edit/delete
- Password default: `admin123`
- Password disimpan di localStorage dan bisa diubah
- Status login disimpan di localStorage (`app-authenticated`)
- Tombol logout tersedia di header untuk keluar dari sistem

#### Cara Menggunakan:
1. Saat pertama kali membuka aplikasi, dialog login akan muncul
2. Masukkan password (default: `admin123`)
3. Klik "Login" untuk masuk
4. Setelah login, semua fitur edit/delete akan aktif

#### Mengubah Password:
1. Setelah login, klik tombol ikon kunci (🔑) di header
2. Masukkan password saat ini
3. Masukkan password baru (minimal 6 karakter)
4. Konfirmasi password baru
5. Klik "Simpan"

### 2. **Read-Only Mode**
- Mode untuk view-only tanpa kemampuan edit/delete
- Bisa diaktifkan/dinonaktifkan dengan toggle switch di header
- Berguna untuk share aplikasi ke orang yang hanya butuh melihat status domain
- Status mode disimpan di localStorage (`app-readonly-mode`)

#### Cara Menggunakan:
1. Login terlebih dahulu
2. Di header, cari toggle "Edit Mode" / "View Only"
3. Toggle OFF = Read-Only Mode (View Only)
4. Toggle ON = Edit Mode (Full Access)

#### Fitur yang Disembunyikan di Read-Only Mode:
- ❌ Tombol "Tambah Domain"
- ❌ Form AddDomain
- ❌ Tombol Import CSV
- ❌ Tombol Edit Domain
- ❌ Tombol Delete Domain
- ❌ Checkbox untuk bulk selection
- ❌ Tombol Bulk Delete
- ❌ Tombol Create/Edit/Delete Grup
- ❌ Tombol Create/Edit/Delete Tag
- ❌ Tombol Assign Grup
- ❌ Tombol Assign Tag
- ✅ Export CSV tetap tersedia (hanya baca data)
- ✅ Monitoring dan statistik tetap bisa diakses

## 🎯 Use Cases

### Use Case 1: Admin Full Access
**Situasi:** User yang mengelola domain dan perlu melakukan perubahan
1. Login dengan password
2. Aktifkan "Edit Mode"
3. Bisa menambah, edit, delete domain, grup, dan tag

### Use Case 2: Team View-Only
**Situasi:** Share ke team untuk monitoring saja tanpa risiko perubahan data
1. Login dengan password
2. Aktifkan "View Only" mode
3. Team bisa melihat status semua domain tapi tidak bisa edit/delete
4. Data aman dari perubahan tidak sengaja

### Use Case 3: Public Display
**Situasi:** Tampilkan status domain di layar monitoring tanpa akses edit
1. Jangan login / tetap di login screen
2. Atau login dan aktifkan "View Only"
3. Tampilan bersih tanpa tombol edit/delete

## 🔧 Technical Details

### State Management
```typescript
// Authentication State
const [isAuthenticated, setIsAuthenticated] = useState(false)
const [showLoginDialog, setShowLoginDialog] = useState(!isAuthenticated)

// Read-Only Mode State
const [isReadOnlyMode, setIsReadOnlyMode] = useState(false)

// Combined Check
const canEdit = isAuthenticated && !isReadOnlyMode
```

### LocalStorage Keys
- `app-authenticated`: Status login (true/false)
- `app-password`: Password yang tersimpan (default: admin123)
- `app-readonly-mode`: Status read-only mode (true/false)

### Protection Layers
1. **UI Layer**: Tombol dan form disembunyikan jika `!canEdit`
2. **Handler Layer**: Setiap handler check `canEdit` sebelum eksekusi
3. **Toast Notification**: User mendapat feedback jika tidak punya akses

## ⚠️ Security Notes

### Password Storage
- Password disimpan di localStorage (plaintext)
- **BUKAN** untuk production dengan data sensitif
- Cocok untuk internal tools atau personal use
- Untuk production: gunakan backend authentication yang proper

### Recommendations
1. Ubah password default segera setelah deploy
2. Gunakan password yang kuat (minimal 8 karakter, kombinasi huruf, angka, simbol)
3. Jangan share password di chat atau email yang tidak terenkripsi
4. Aktifkan Read-Only mode saat sharing link ke orang lain
5. Logout setelah selesai jika di komputer shared/public

## 🚀 Future Enhancements (Optional)
- [ ] Multi-user dengan role-based access (Admin, Editor, Viewer)
- [ ] Session timeout (auto logout setelah X menit)
- [ ] Password hashing dengan bcrypt
- [ ] Backend API untuk authentication yang lebih aman
- [ ] 2FA (Two-Factor Authentication)
- [ ] Audit log untuk tracking perubahan data

## 📱 UI Components Added

### New Components:
1. **LoginDialog.tsx** - Dialog untuk input password
2. **SettingsDialog.tsx** - Dialog untuk ubah password

### Updated Components:
1. **App.tsx** - Integrasi authentication dan read-only mode
2. **DomainCard.tsx** - Conditional rendering untuk edit/delete buttons
3. **GroupCard.tsx** - Optional onEdit/onDelete props
4. **TagCard.tsx** - Optional onEdit/onDelete props
5. **VirtualizedDomainList.tsx** - Support untuk hide edit/delete

## 🎨 UI Indicators

### Header Controls:
```
[View Only / Edit Mode] [🔒] [🚪] | [Import] [Export] | [Auto/Manual] [Refresh]
     Toggle Switch      Change  Logout  (only if authenticated)
                       Password
```

### Visual Feedback:
- ✅ **Green Toggle**: Edit Mode Active
- 👁️ **Eye Icon**: View Only Mode Active
- 🔒 **Lock Icon**: Change Password
- 🚪 **Sign Out Icon**: Logout
- 📢 **Toast Notifications**: Feedback untuk setiap action

---

**Developed for:** Kabupaten Kendal Domain Monitor  
**Date:** January 2026  
**Version:** 2.0 (with Security Features)
