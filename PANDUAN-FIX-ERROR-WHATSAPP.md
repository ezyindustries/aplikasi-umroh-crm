# PANDUAN FIX ERROR WHATSAPP CONNECTION

## Error yang Terjadi:
1. **Backend server tidak jalan** (port 5000: ERR_CONNECTION_REFUSED)
2. **WAHA API tidak jalan** (port 3001: 404 Not Found)
3. **Configuration mismatch** antara frontend dan backend

## Solusi Cepat:

### 1. Jalankan QUICK-FIX-WHATSAPP.bat
Double-click file `QUICK-FIX-WHATSAPP.bat` yang sudah saya buat. File ini akan:
- Check Docker installation
- Start WAHA WhatsApp API container
- Start Backend server
- Test connections

### 2. Manual Fix (jika batch file tidak bekerja):

#### Step 1: Start WAHA WhatsApp API
```bash
# Buka Command Prompt/Terminal
docker run -d \
  --name waha-umroh \
  -p 3001:3000 \
  -e WHATSAPP_HOOK_URL=http://host.docker.internal:5000/api/crm/webhook \
  -e WHATSAPP_HOOK_EVENTS=* \
  -e WHATSAPP_API_KEY=your-secret-api-key \
  -e WHATSAPP_SESSIONS_ENABLED=true \
  -v waha-data:/app/data \
  devlikeapro/waha
```

#### Step 2: Start Backend Server
```bash
# Di folder aplikasi umroh
cd backend
npm start
```

#### Step 3: Test Connections
- Backend: http://localhost:5000/health
- WAHA: http://localhost:3001/api/version
- CRM: http://localhost:8080/crm-no-login.html

## Troubleshooting:

### Error: Docker is not installed
- Download & install Docker Desktop: https://www.docker.com/products/docker-desktop/
- Make sure Docker Desktop is running

### Error: Port already in use
```bash
# Check what's using port 3001
netstat -ano | findstr :3001

# Kill the process (replace PID with actual process ID)
taskkill /PID [PID] /F
```

### Error: Database connection failed
1. Check PostgreSQL is running
2. Check .env file has correct DB credentials:
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=vauza_tamma_db
   DB_USER=postgres
   DB_PASSWORD=password
   ```

### Error: CORS blocked
Backend .env sudah diupdate dengan:
```
CORS_ORIGIN=http://localhost:8080,http://localhost:3000,http://localhost:3001
```

## Cara Connect WhatsApp:

1. Pastikan semua services running (lihat di atas)
2. Buka http://localhost:8080/crm-no-login.html
3. Click "Connect to WhatsApp" button
4. QR code akan muncul
5. Buka WhatsApp di HP
6. Settings > Linked Devices > Link a Device
7. Scan QR code
8. Status akan berubah menjadi "Connected"

## Services yang Harus Running:

| Service | Port | Check URL | Status |
|---------|------|-----------|---------|
| Backend API | 5000 | http://localhost:5000/health | Required |
| WAHA API | 3001 | http://localhost:3001/api/version | Required |
| PostgreSQL | 5432 | - | Required |
| Frontend | 8080 | http://localhost:8080 | Optional (bisa buka file langsung) |

## File-file Penting:

1. **Backend Configuration**: `backend/.env`
2. **WhatsApp Handler**: `frontend/js/whatsapp-connection.js`
3. **CRM Routes**: `backend/routes/crm.js`
4. **Bot Service**: `backend/services/whatsappBot.js`

## Quick Commands:

```bash
# Check all services
curl http://localhost:5000/health
curl http://localhost:3001/api/version

# Restart WAHA
docker restart waha-umroh

# View WAHA logs
docker logs -f waha-umroh

# Stop all
docker stop waha-umroh
# Then Ctrl+C on backend terminal
```

---

**Note**: Jika masih ada error setelah mengikuti panduan ini, check:
1. Windows Firewall (allow ports 3001, 5000)
2. Antivirus blocking
3. Docker Desktop settings (WSL2 integration)