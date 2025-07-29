# WhatsApp CRM Troubleshooting Guide

## Error: Failed to connect (500 Internal Server Error)

### Penyebab:
Port mismatch antara frontend dan backend

### Solusi:
1. Pastikan backend WhatsApp berjalan di port 3001:
   - Cek file `backend/whatsapp/.env`
   - Pastikan `PORT=3001`

2. Pastikan WAHA berjalan di port 3000:
   - Cek `WAHA_URL=http://localhost:3000` di `.env`

3. Restart semua services:
   ```bash
   # Stop all services (Ctrl+C di semua terminal)
   
   # 1. Start WAHA
   docker run -it --rm -p 3000:3000/tcp --name waha devlikeapro/waha
   
   # 2. Start Backend (terminal baru)
   cd backend/whatsapp
   npm start
   
   # 3. Buka browser
   http://localhost:8080/conversations-beautiful.html
   ```

## Port Configuration

| Service | Port | URL |
|---------|------|-----|
| WAHA API | 3000 | http://localhost:3000 |
| WhatsApp Backend | 3001 | http://localhost:3001 |
| Frontend Server | 8080 | http://localhost:8080 |

## Common Issues

### 1. WAHA Docker not starting
- Pastikan Docker Desktop running
- Port 3000 tidak digunakan aplikasi lain

### 2. Backend error on start
- Run `npm install` di folder `backend/whatsapp`
- Cek `.env` file exists

### 3. Cannot connect WhatsApp
- WAHA harus running terlebih dahulu
- Backend harus running
- Scan QR code yang muncul

### 4. Messages not showing
- Refresh halaman
- Cek console browser untuk error
- Pastikan session WhatsApp connected