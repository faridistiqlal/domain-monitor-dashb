# 🚀 Development Workflow Guide

**Project:** Domain Monitor - Kabupaten Kendal  
**Last Updated:** 7 Januari 2026  
**Status:** Production Ready with Auto-Deploy

---

## 📋 **WORKFLOW RULES**

### **SETIAP ADA PERUBAHAN CODE:**

1. ✅ **Edit code** - Buat perubahan yang diperlukan
2. ✅ **Update versi** - Increment version number di `src/lib/version.ts`
3. ✅ **Test locally** - `npm run dev` untuk test perubahan
4. ✅ **Commit & push** - Git commit dengan message yang jelas
5. ✅ **Auto-deploy** - Vercel otomatis deploy dari GitHub push

**Kenapa update versi penting?**
- Footer menampilkan versi → Anda tahu deployment terbaru berhasil
- localStorage migration berjalan otomatis
- User tahu mereka dapat update terbaru

---

## 🔢 **VERSION NUMBERING**

Format: `MAJOR.MINOR.PATCH`

**Examples:**
- `3.0.0` → `3.0.1` (Bug fix, small change)
- `3.0.1` → `3.1.0` (New feature)
- `3.1.0` → `4.0.0` (Breaking change, major update)

**Current Version:** 3.0.0

---

## ⚡ **QUICK COMMANDS**

### **Development:**
```bash
# Start dev server
npm run dev

# Build untuk test
npm run build

# Preview build
npm run preview
```

### **Deploy Workflow:**
```bash
# 1. Edit version
vim src/lib/version.ts
# Change: export const APP_VERSION = '3.0.1'

# 2. Test locally
npm run dev

# 3. Commit & push (replace dengan pesan Anda)
git add .
git commit -m "feat: add new feature"
git push

# 4. Auto-deploy via GitHub → Vercel (1-2 menit)
# Cek: https://kendal-uptime.vercel.app
```

---

## 🎯 **STEP-BY-STEP GUIDE**

### **Scenario: Menambah Fitur Baru**

```bash
# 1. Edit code (contoh: tambah fitur di App.tsx)
vim src/App.tsx

# 2. Update version di src/lib/version.ts
# Ubah dari 3.0.0 → 3.1.0 (new feature)
echo "export const APP_VERSION = '3.1.0' // New feature: [nama fitur]" > src/lib/version.ts
sed -i '1i/**\n * Application Version\n * Increment this version number with every deployment to Vercel\n * This ensures localStorage migration runs and users get the latest updates\n */' src/lib/version.ts

# 3. Test locally
npm run dev
# Buka http://localhost:5173
# Cek footer: harus muncul v3.1.0

# 4. Commit dengan message yang jelas
git add .
git commit -m "feat: add [nama fitur]"

# 5. Push ke GitHub
git push

# 6. Tunggu auto-deploy (1-2 menit)
# Vercel otomatis detect push → build → deploy

# 7. Verify deployment
# Buka: https://kendal-uptime.vercel.app
# Cek footer: harus muncul v3.1.0 ✅
```

---

## 🐛 **Scenario: Bug Fix**

```bash
# 1. Fix bug
vim src/components/SomeComponent.tsx

# 2. Update version (patch increment)
# 3.0.0 → 3.0.1
vim src/lib/version.ts

# 3. Commit
git add .
git commit -m "fix: resolve [deskripsi bug]"

# 4. Push
git push

# 5. Auto-deploy & verify
# Footer harus berubah ke v3.0.1
```

---

## 📝 **COMMIT MESSAGE CONVENTIONS**

Gunakan format yang jelas:

```
feat: add new feature
fix: resolve bug in component X
docs: update documentation
style: improve UI/UX
perf: optimize performance
refactor: restructure code
```

**Examples:**
```bash
git commit -m "feat: add domain batch checking system"
git commit -m "fix: resolve Firebase quota exceeded error"
git commit -m "docs: update README with new features"
git commit -m "style: improve statistics chart colors"
git commit -m "perf: optimize domain list rendering"
```

---

## 🔄 **AUTO-DEPLOY VERIFICATION**

### **Cek Status Deploy:**

1. **GitHub Actions** (jika setup):
   - https://github.com/faridistiqlal/kendal-domain-monitor/actions

2. **Vercel Dashboard**:
   - https://vercel.com/farid-istiqlals-projects/monitoring-domain-bulk

3. **Production URL**:
   - https://kendal-uptime.vercel.app

### **Cara Verify Deployment Berhasil:**

```bash
# Method 1: Check footer version
# Buka: https://kendal-uptime.vercel.app
# Footer harus menampilkan versi terbaru

# Method 2: Check Vercel dashboard
# Lihat deployment status: Building → Ready

# Method 3: Check via API
curl -s https://kendal-uptime.vercel.app | grep -o 'v[0-9]\+\.[0-9]\+\.[0-9]\+'
```

---

## ⚠️ **TROUBLESHOOTING**

### **Problem: Auto-deploy tidak jalan setelah git push**

**Solution:**
1. Cek Vercel dashboard: https://vercel.com/farid-istiqlals-projects/monitoring-domain-bulk
2. Pastikan Git repository connected
3. Check deployment logs untuk error
4. Jika belum connected, connect manual:
   - Settings → Git → Connect Repository → kendal-domain-monitor

### **Problem: Build failed di Vercel**

**Solution:**
1. Check build logs di Vercel dashboard
2. Test build locally: `npm run build`
3. Fix error yang muncul
4. Commit & push lagi

### **Problem: Footer tidak update ke versi baru**

**Solution:**
1. Hard refresh browser: `Ctrl + Shift + R`
2. Clear browser cache
3. Check deployment di Vercel (pastikan status "Ready")
4. Verify version di `src/lib/version.ts` sudah benar

---

## 🎯 **BEST PRACTICES**

### **DO's:**
✅ Selalu update versi setiap deploy  
✅ Test locally sebelum push  
✅ Gunakan commit message yang jelas  
✅ Verify deployment di footer setelah push  
✅ Keep version incremental (3.0.0 → 3.0.1 → 3.0.2)

### **DON'Ts:**
❌ Jangan skip version update  
❌ Jangan push code yang belum di-test  
❌ Jangan gunakan commit message tidak jelas ("update", "fix")  
❌ Jangan deploy langsung tanpa verify locally  

---

## 📊 **VERSION HISTORY TRACKING**

**Untuk track version history:**

```bash
# Lihat commit history dengan version
git log --oneline --grep="version"

# Lihat perubahan version file
git log -p src/lib/version.ts

# Lihat version saat ini
cat src/lib/version.ts | grep APP_VERSION
```

---

## 🚀 **DEPLOYMENT TIMELINE**

**Normal deployment flow:**

```
Git Push
  ↓ (instant)
GitHub Repository Updated
  ↓ (5-10 seconds)
Vercel Webhook Triggered
  ↓ (10-20 seconds)
Build Started
  ↓ (60-90 seconds)
Build Complete
  ↓ (5-10 seconds)
Deploy to Production
  ↓ (instant)
✅ LIVE! (https://kendal-uptime.vercel.app)

Total time: ~1-2 minutes
```

---

## 📞 **QUICK REFERENCE**

### **Current Setup:**
- **Repository:** https://github.com/faridistiqlal/kendal-domain-monitor
- **Production:** https://kendal-uptime.vercel.app
- **Vercel Project:** monitoring-domain-bulk
- **Current Version:** 3.0.0

### **Key Files:**
- **Version:** `src/lib/version.ts`
- **Footer:** `src/App.tsx` (line ~2104)
- **Changelog:** `src/components/ChangelogDialog.tsx`

### **Commands:**
```bash
# Update version
vim src/lib/version.ts

# Commit & push
git add . && git commit -m "feat: ..." && git push

# Check deployment
curl -s https://kendal-uptime.vercel.app | grep -o 'v[0-9]\+\.[0-9]\+\.[0-9]\+'
```

---

**Last Updated:** 7 Januari 2026  
**Maintained By:** Development Team  
**Status:** ✅ Active & Auto-Deploying
