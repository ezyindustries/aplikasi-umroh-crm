# Quick Guide: Scan QR Code untuk WAHA Plus

## Option 1: Via WAHA Dashboard (RECOMMENDED)

1. **Buka WAHA Dashboard**
   ```
   http://localhost:3000
   ```

2. **Login dengan API Key**
   - Masukkan API key yang Anda set saat start container
   - Default: `your-api-key`

3. **Go to Sessions**
   - Click "Sessions" menu
   - Click "Start" atau "+" untuk create new session
   - Beri nama: `default`

4. **Scan QR Code**
   - QR code akan muncul
   - Buka WhatsApp di HP
   - Settings → Linked Devices → Link a Device
   - Scan QR code

5. **Wait for Connected**
   - Status akan berubah jadi "WORKING"
   - Sekarang WhatsApp sudah connected!

## Option 2: Direct API (Advanced)

```bash
# Start session
curl -X POST http://localhost:3000/api/sessions/start \
  -H "X-Api-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"name": "default"}'

# Get QR 
curl http://localhost:3000/api/sessions/default/qr \
  -H "X-Api-Key: your-api-key"
```

## Option 3: Fix Frontend Connection

Jika ingin fix di frontend, pastikan:

1. Edit `conversations-beautiful.html`
2. Update `API_CONFIG.apiKey` dengan API key yang benar
3. Refresh browser
4. Click "Connect WhatsApp"

## Quick Test After Connected

1. Check status di test page:
   ```
   http://localhost:8080/test-image-upload.html
   ```

2. Atau check via API:
   ```bash
   curl http://localhost:3000/api/sessions \
     -H "X-Api-Key: your-api-key"
   ```

## Common Issues

- **401 Unauthorized**: API key tidak match
- **Session not found**: Belum start session
- **QR expired**: Generate QR baru
- **Not connected**: Belum scan QR

## IMPORTANT

Tanpa scan QR, WAHA tidak bisa:
- Kirim pesan
- Terima pesan  
- Upload gambar
- Apapun yang berhubungan dengan WhatsApp

Jadi HARUS scan QR dulu!