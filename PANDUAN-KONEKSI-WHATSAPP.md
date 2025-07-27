# Panduan Koneksi WhatsApp dengan WAHA

## Status Saat Ini
✅ WAHA container berjalan di port 3001
✅ Session "default" sudah dibuat
✅ Status: SCAN_QR_CODE (siap untuk scan)
✅ Backend siap menerima webhook
✅ Ollama siap untuk AI responses

## Langkah-Langkah Koneksi

### 1. Buka QR Scanner Interface
```
http://localhost:8081/waha-qr-scanner.html
```

### 2. Scan QR Code
1. Buka WhatsApp di HP Anda
2. Tap ⋮ (3 titik) → Linked Devices
3. Tap "Link a Device"
4. Scan QR code yang muncul di layar
5. Tunggu sampai status berubah menjadi "✅ WhatsApp Connected!"

### 3. Monitor Koneksi (Optional)
Jalankan script monitoring untuk melihat status real-time:
```bash
cd backend
node scripts/setup-waha-webhook.js
```

### 4. Test Bot WhatsApp

#### Option A: Kirim Pesan WhatsApp
- Kirim pesan ke nomor WhatsApp yang terhubung
- Bot akan auto-reply menggunakan Ollama

#### Option B: Test via API
```bash
curl -X POST http://localhost:3000/api/bot/test \
  -H "Content-Type: application/json" \
  -d '{"message": "Assalamualaikum, saya mau tanya paket umroh"}'
```

#### Option C: Gunakan CRM Dashboard
1. Buka: http://localhost:8081/crm-dashboard.html
2. Login: admin/admin123
3. Gunakan WhatsApp chat interface di sidebar kanan

## Monitoring & Debugging

### Check WAHA Status
```bash
curl http://localhost:3001/api/sessions/default \
  -H "X-Api-Key: your-secret-api-key" | python -m json.tool
```

### Check Backend Logs
```bash
docker logs vauza-tamma-backend -f
```

### Check WAHA Logs
```bash
docker logs vauza-tamma-waha -f
```

### Check Ollama Status
```bash
curl http://localhost:11434/api/tags
```

## Troubleshooting

### QR Code Tidak Muncul
1. Refresh halaman QR scanner
2. Restart WAHA session:
```bash
curl -X POST http://localhost:3001/api/sessions/default/restart \
  -H "X-Api-Key: your-secret-api-key"
```

### Bot Tidak Merespon
1. Pastikan Ollama berjalan dengan CORS enabled:
```bash
START-OLLAMA-CORS.bat
```

2. Check bot configuration:
```bash
docker exec vauza-tamma-backend node -e "
const { BotConfig } = require('./models');
BotConfig.findAll().then(configs => {
  configs.forEach(c => console.log(c.parameter + ':', c.value));
});"
```

### Session Disconnected
Jika WhatsApp terputus, cukup scan ulang QR code di:
http://localhost:8081/waha-qr-scanner.html

## Webhook Configuration

WAHA akan otomatis mengirim pesan ke:
```
POST http://backend:3000/api/crm/webhook
```

Webhook events yang dimonitor:
- `message` - Pesan masuk
- `message.ack` - Status pesan (delivered, read, etc)

## Testing Flow

1. **Koneksi WhatsApp** → Scan QR Code
2. **Kirim Test Message** → "Halo, info paket umroh"
3. **Bot Auto Reply** → Respons dari Ollama/Template
4. **Check CRM** → Lead tercatat di dashboard
5. **Monitor Conversation** → History tersimpan

## API Endpoints

### WAHA Endpoints
- Session info: `GET /api/sessions/default`
- Send message: `POST /api/sendText`
- Get QR: Included in session info when status is SCAN_QR_CODE

### Backend CRM Endpoints
- Webhook: `POST /api/crm/webhook`
- Test bot: `POST /api/bot/test`
- Get leads: `GET /api/crm/leads`
- Get conversations: `GET /api/crm/conversations/:leadId`