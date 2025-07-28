# Panduan Testing Mekanisme Kirim dan Terima Pesan WhatsApp

## Status Implementasi ✅

### Fitur yang Sudah Diimplementasikan:

1. **Kirim Pesan** ✅
   - Frontend mengirim ke backend API
   - Backend forward ke WAHA
   - Loading state dengan spinner
   - Pesan muncul langsung di UI
   - Auto-sync dengan database

2. **Terima Pesan** ✅
   - Webhook dari WAHA ke backend
   - Backend proses dan simpan ke database
   - WebSocket broadcast ke frontend
   - Real-time update di dashboard
   - Notification sound & browser notification

3. **Real-time Features** ✅
   - WebSocket connection dengan auto-reconnect
   - Live conversation updates
   - Unread message counter
   - Time ago format (Just now, 5m ago, etc)
   - Active chat indicators

## Cara Testing

### 1. Persiapan
```bash
# Pastikan semua service running
docker-compose ps

# Expected output:
# vauza-tamma-backend    ... healthy
# vauza-tamma-frontend   ... healthy
# vauza-tamma-db         ... healthy
# vauza-tamma-waha       ... healthy
```

### 2. Connect WhatsApp
1. Buka: http://localhost:8081/crm-dashboard-pro.html
2. Login dengan admin/admin123
3. Lihat WhatsApp Control Center
4. Klik "Connect" → "Scan QR"
5. QR Code akan muncul besar di layar
6. Scan dengan WhatsApp di HP

### 3. Test Kirim Pesan
1. Di bagian "WhatsApp Conversations" di bawah
2. Pilih salah satu conversation (atau tunggu ada yang masuk)
3. Ketik pesan di input box
4. Tekan Enter atau klik Send
5. Pesan akan:
   - Muncul di chat dengan tanda ✓
   - Terkirim ke WhatsApp penerima
   - Tersimpan di database

### 4. Test Terima Pesan
1. Kirim pesan WhatsApp ke nomor yang terhubung
2. Pesan akan:
   - Muncul real-time di conversation list
   - Update badge unread count
   - Jika chat sedang dibuka, muncul langsung
   - Play notification sound
   - Show browser notification (jika diizinkan)

### 5. Test Bot Auto-Reply
1. Di WhatsApp Control Center, toggle "Auto-Reply Bot" → ON
2. Pilih AI Provider (Ollama atau OpenAI)
3. Kirim pesan dari HP lain
4. Bot akan auto-reply berdasarkan context

## Flow Teknis

### Kirim Pesan:
```
Frontend → Backend API → WAHA API → WhatsApp
    ↓          ↓            ↓
   UI      Database     Delivered
```

### Terima Pesan:
```
WhatsApp → WAHA → Webhook → Backend
                               ↓
                          Save to DB
                               ↓
                         WebSocket Emit
                               ↓
                        Frontend Update
```

## Monitoring

### Check Logs:
```bash
# Backend logs
docker logs vauza-tamma-backend -f | grep -E "(message|webhook|bot)"

# WAHA logs  
docker logs vauza-tamma-waha -f | grep -E "(message|sent|received)"
```

### Check Database:
```sql
-- Recent messages
SELECT * FROM wa_messages 
ORDER BY created_at DESC 
LIMIT 10;

-- Active conversations
SELECT * FROM wa_conversations 
WHERE status = 'active'
ORDER BY last_message_at DESC;
```

## Troubleshooting

### Pesan tidak terkirim:
1. Check WAHA status di Control Center
2. Pastikan WhatsApp connected (indicator hijau)
3. Check console browser untuk error
4. Verify WAHA API key correct

### Pesan tidak diterima real-time:
1. Check WebSocket connection di console
2. Pastikan webhook URL accessible dari WAHA
3. Check backend logs untuk webhook events
4. Restart backend jika perlu

### Bot tidak merespon:
1. Toggle Bot OFF dan ON lagi
2. Check Ollama running: `curl http://localhost:11434/api/tags`
3. Verify bot config di database
4. Check bot service logs

## Expected Results

✅ **Kirim Pesan:**
- Instant send dengan loading state
- Muncul di chat dengan timestamp
- Status indicator (✓)
- Terkirim ke WhatsApp target

✅ **Terima Pesan:**
- Real-time update < 1 detik
- Notification sound plays
- Browser notification muncul
- Unread badge update
- Conversation naik ke atas

✅ **Bot Response:**
- Reply dalam 2-5 detik
- Context-aware responses
- Bahasa Indonesia support
- Info paket umroh relevant

## Performance Metrics

- Message send: < 1 second
- Message receive: < 1 second
- Bot response: 2-5 seconds
- WebSocket latency: < 100ms
- UI update: Instant

## Next Steps

Jika semua test berhasil, sistem messaging WhatsApp sudah siap digunakan untuk:
- Customer service real-time
- Marketing automation
- Lead nurturing
- Bot assistance 24/7