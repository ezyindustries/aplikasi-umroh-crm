# Cara Mendapatkan QR Code WhatsApp dari WAHA

## Status Saat Ini
- WAHA session "default" status: SCAN_QR_CODE ✅
- Backend siap menerima webhook ✅
- Ollama siap untuk AI responses ✅

## 3 Cara Mendapatkan QR Code:

### Cara 1: WAHA Swagger UI (PALING MUDAH) ⭐
1. Buka browser: http://localhost:3001/
2. Ini adalah Swagger UI bawaan WAHA
3. Cari endpoint yang berkaitan dengan:
   - Sessions
   - Auth
   - QR
4. Gunakan session name: `default`
5. Klik "Try it out" → "Execute"
6. QR code akan muncul (bisa sebagai gambar atau text)

### Cara 2: Alternative Interface
1. Buka: http://localhost:8081/waha-direct-qr.html
2. Klik "Open WAHA Swagger UI"
3. Atau gunakan tombol-tombol untuk check status

### Cara 3: Terminal Commands
```bash
# Download QR as image (jika endpoint tersedia)
curl -s http://localhost:3001/api/sessions/default/auth/qr \
  -H "X-Api-Key: your-secret-api-key" \
  -H "Accept: image/png" \
  -o whatsapp-qr.png

# Get session info (mungkin ada QR data)
curl -s http://localhost:3001/api/sessions/default \
  -H "X-Api-Key: your-secret-api-key" | python -m json.tool
```

## Setelah Mendapat QR Code:

1. **Scan dengan WhatsApp**
   - Buka WhatsApp di HP
   - Tap ⋮ → Linked Devices → Link a Device
   - Scan QR code

2. **Verifikasi Koneksi**
   ```bash
   # Check status
   curl http://localhost:3001/api/sessions/default \
     -H "X-Api-Key: your-secret-api-key" | grep status
   ```
   
   Harusnya berubah dari `SCAN_QR_CODE` ke `WORKING`

3. **Test Bot**
   - Kirim pesan WhatsApp ke nomor yang terhubung
   - Bot akan auto-reply
   - Check CRM Dashboard: http://localhost:8081/crm-dashboard.html

## Tips:
- WAHA menggunakan WhatsApp Web, jadi QR code mirip dengan WhatsApp Web
- Session akan tetap terhubung sampai di-logout dari HP
- Jika QR expired, restart session dan coba lagi
- WAHA Swagger UI adalah cara paling reliable untuk akses QR

## Monitoring Tools:
- Session Status: http://localhost:8081/waha-direct-qr.html
- Backend Logs: `docker logs vauza-tamma-backend -f`
- WAHA Logs: `docker logs vauza-tamma-waha -f`