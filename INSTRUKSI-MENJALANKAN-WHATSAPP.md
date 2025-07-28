# INSTRUKSI LENGKAP MENJALANKAN WHATSAPP CRM

## ⚠️ ERROR YANG ANDA ALAMI:
- Backend server tidak jalan (port 5000)
- WAHA WhatsApp API tidak jalan (port 3001)
- Endpoint QR code salah

## ✅ SOLUSI STEP-BY-STEP:

### STEP 1: Check Status Services
```
Double-click: CHECK-SERVICES.bat
```
Ini akan menunjukkan service mana yang belum jalan.

### STEP 2: Start All Services
```
Double-click: START-ALL-COMPLETE.bat
```

Script ini akan:
1. Check prerequisites (Node.js, Docker, PostgreSQL)
2. Install dependencies
3. Start WAHA container
4. Start Backend server
5. Start Frontend server
6. Open browser otomatis

### STEP 3: Tunggu Initialization
- Tunggu 10-15 detik untuk semua services ready
- Jika ada error, baca pesan error di console

### STEP 4: Connect WhatsApp
1. Browser akan terbuka di: http://localhost:8080/crm-no-login.html
2. Click tombol "Connect to WhatsApp"
3. QR code akan muncul
4. Scan dengan WhatsApp di HP:
   - Buka WhatsApp
   - Settings → Linked Devices → Link a Device
   - Scan QR code

## 🔧 TROUBLESHOOTING:

### Jika Docker Error:
1. Pastikan Docker Desktop running
2. Restart Docker Desktop
3. Run as Administrator

### Jika Backend Error:
1. Check file `backend/.env` sudah benar
2. Check PostgreSQL database exists:
   ```sql
   CREATE DATABASE vauza_tamma_db;
   ```

### Jika WAHA Error:
1. Check port 3001 tidak dipakai:
   ```
   netstat -ano | findstr :3001
   ```
2. Restart WAHA:
   ```
   docker restart waha-umroh
   ```

### Jika QR Code Tidak Muncul:
1. Check WAHA logs:
   ```
   docker logs -f waha-umroh
   ```
2. Try manual QR:
   - Buka: http://localhost:3001/dashboard
   - Login dengan API key: your-secret-api-key

## 📁 FILE-FILE HELPER:

1. **START-ALL-COMPLETE.bat** - Start semua services dengan checking
2. **STOP-ALL.bat** - Stop semua services
3. **CHECK-SERVICES.bat** - Check status semua services
4. **QUICK-FIX-WHATSAPP.bat** - Quick fix untuk WhatsApp saja

## 🎯 QUICK START (CARA TERCEPAT):

```
1. Run: CHECK-SERVICES.bat (lihat apa yang belum jalan)
2. Run: START-ALL-COMPLETE.bat (tunggu sampai selesai)
3. Browser akan terbuka otomatis
4. Click "Connect to WhatsApp" 
5. Scan QR code
```

## 📞 MANUAL COMMANDS (Jika Batch Files Gagal):

### Terminal 1 - PostgreSQL:
```bash
# Check if running
pg_isready

# If not, start PostgreSQL service (Windows)
net start postgresql-x64-15
```

### Terminal 2 - WAHA:
```bash
docker run -d --name waha-umroh -p 3001:3000 \
  -e WHATSAPP_API_KEY=your-secret-api-key \
  devlikeapro/waha
```

### Terminal 3 - Backend:
```bash
cd backend
npm install
npm start
```

### Terminal 4 - Frontend:
```bash
cd frontend
python -m http.server 8080
# Or use any other static server
```

## ✅ INDICATORS SEMUA BERJALAN BAIK:

1. CHECK-SERVICES.bat shows all [RUNNING]
2. No error messages in console
3. Browser opens automatically
4. QR code appears when clicking Connect
5. After scanning, status changes to "Connected"

---

**IMPORTANT**: Pastikan Docker Desktop running sebelum menjalankan scripts!