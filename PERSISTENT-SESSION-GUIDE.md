# WhatsApp Persistent Session Guide

## 🎯 Tujuan
Agar tidak perlu scan QR code ulang setiap restart Docker atau sistem.

## 🛠️ Solusi yang Dibuat

### 1. **Docker Persistent Volume** 
File: `restart-waha-with-session.bat`
- Membuat Docker volume bernama `waha-sessions`
- Menyimpan data session WAHA secara permanen
- Session tidak hilang saat Docker restart

### 2. **Session Backup Service**
File: `/backend/whatsapp/src/services/SessionManager.js`
- Backup session setiap 5 menit otomatis
- Restore session saat aplikasi start
- Menyimpan backup di folder `session-backup/`

### 3. **Auto-Restore saat Start Backend**
File: `/backend/whatsapp/server.js` (updated)
- Otomatis coba restore session saat backend start
- Tidak perlu manual restore

### 4. **Manual Management Tool**
File: `manage-session.bat`
- Tools untuk kelola session manual
- Cek status, restore, lihat backup, dll

## 📋 Cara Menggunakan

### **Metode 1: Restart WAHA dengan Persistent Volume**
```bash
# Jalankan script ini
restart-waha-with-session.bat

# WAHA akan restart dengan persistent storage
# Session tersimpan di Docker volume
```

### **Metode 2: Menggunakan Session Manager**
```bash
# Buka tool management
manage-session.bat

# Pilih opsi yang diinginkan:
# 1. Cek status session
# 2. Restore session
# 3. Lihat backup
# 4. Restart WAHA
```

### **Metode 3: Via API**
```bash
# Restore session via API
curl -X POST http://localhost:3001/api/sessions/restore \
  -H "Content-Type: application/json" \
  -d '{"sessionName":"default"}'

# Lihat backup yang tersedia
curl http://localhost:3001/api/sessions/backups
```

## 🔄 Alur Kerja Baru

### **Sebelum (Harus QR Scan)**
1. Restart Docker → Session hilang
2. Buka WAHA dashboard → Scan QR
3. Login WhatsApp → Baru bisa pakai

### **Sesudah (Otomatis Restore)**
1. Restart Docker → Session tetap tersimpan
2. Backend auto-restore → Login otomatis
3. Langsung bisa pakai → Tidak perlu QR

## 📁 File yang Dibuat/Diubah

### **File Baru:**
- `restart-waha-with-session.bat` - Script restart WAHA with volume
- `manage-session.bat` - Session management tool
- `src/services/SessionManager.js` - Service untuk backup/restore
- `PERSISTENT-SESSION-GUIDE.md` - Dokumentasi ini

### **File Diubah:**
- `server.js` - Tambah auto-restore saat start
- `src/routes/api.js` - Tambah endpoint session management

## ⚙️ Konfigurasi

### **Environment Variables (Opsional)**
```env
# Di .env file
WAHA_URL=http://localhost:3000
WEBHOOK_URL=http://host.docker.internal:3001/api/webhooks/waha
```

### **Docker Volume**
```bash
# Volume name: waha-sessions
# Location: Docker internal storage
# Persistent: Ya, tidak hilang saat restart
```

## 🚨 Troubleshooting

### **Jika Session Masih Hilang:**
1. Pastikan Docker volume dibuat:
   ```bash
   docker volume ls | findstr waha-sessions
   ```

2. Cek apakah backup tersimpan:
   ```bash
   # Via API
   curl http://localhost:3001/api/sessions/backups
   ```

3. Manual restore:
   ```bash
   # Via management tool
   manage-session.bat
   # Pilih option 2
   ```

### **Jika Restore Gagal:**
1. Cek log backend untuk error
2. Verifikasi WAHA running: `curl http://localhost:3000/api/version`
3. Restart semua service dan coba lagi

## 📊 Status Check

### **Via Browser:**
- WAHA Dashboard: http://localhost:3000/dashboard
- Backend Health: http://localhost:3001/api/health
- Session Status: http://localhost:3001/api/sessions/default/status

### **Via Command:**
```bash
# Cek semua service
manage-session.bat
# Pilih option 1
```

## 🎉 Hasil

Setelah implementasi ini:
- ✅ Tidak perlu scan QR setiap restart
- ✅ Session tersimpan otomatis
- ✅ Backup berjalan setiap 5 menit
- ✅ Auto-restore saat backend start
- ✅ Manual control tersedia
- ✅ Docker volume persistent

**Login WhatsApp sekali, pakai selamanya (sampai logout manual)!**