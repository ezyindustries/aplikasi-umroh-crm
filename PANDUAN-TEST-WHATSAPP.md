# Panduan Testing WhatsApp Dashboard Real-Time

## Prerequisites
✅ WhatsApp sudah connected (status WORKING)
✅ Ollama running dengan model mistral:7b-instruct
✅ Backend dan Frontend running
✅ WAHA container dengan webhook configured

## 1. Akses WhatsApp Dashboard
```
http://localhost:8081/whatsapp-dashboard.html
```

Login dengan:
- Username: admin
- Password: admin123

## 2. Test Flow Manual

### A. Test Incoming Message (dari HP)
1. Kirim pesan WhatsApp ke nomor yang terhubung
2. Pesan akan muncul di dashboard secara real-time
3. Bot akan auto-reply berdasarkan konfigurasi
4. Reply bot akan muncul di conversation

### B. Test Outgoing Message (dari Dashboard)
1. Pilih conversation di sidebar kiri
2. Ketik pesan di input box bawah
3. Klik Send atau tekan Enter
4. Pesan akan terkirim ke WhatsApp

### C. Test dengan Script
```bash
# Install dependencies
cd backend
npm install axios

# Edit test phone number in test-whatsapp-flow.js
# Replace 6281234567890 with your test number

# Run test
node ../test-whatsapp-flow.js
```

## 3. Monitoring Real-Time

### Check Backend Logs
```bash
docker logs vauza-tamma-backend -f
```

### Check WAHA Logs
```bash
docker logs vauza-tamma-waha -f
```

### Check Webhook Activity
Lihat di backend logs untuk:
- "Webhook received"
- "Bot response sent"
- "new_message" websocket events

## 4. Dashboard Features

### Sidebar (Conversation List)
- 🟢 Active conversations dengan last message preview
- 🔵 Unread count badge
- 🔍 Search conversations by name/phone
- ⏱️ Time stamps (just now, 5m ago, etc)

### Chat Area
- 💬 Real-time message display
- 📥 Inbound messages (gray, left-aligned)
- 📤 Outbound messages (blue, right-aligned)
- ✓ Message status indicators
- 🕐 Message timestamps

### Header Actions
- 👤 View Lead - Opens lead details
- 🔄 Refresh - Manual refresh messages

## 5. Troubleshooting

### Pesan tidak muncul di dashboard
1. Check webhook configuration:
```bash
docker logs vauza-tamma-waha | grep webhook
```

2. Verify webhook URL is accessible:
```bash
# From inside WAHA container
docker exec vauza-tamma-waha curl http://host.docker.internal:3000/api/crm/webhook
```

3. Check WebSocket connection in browser console

### Bot tidak merespon
1. Check Ollama running:
```bash
curl http://localhost:11434/api/tags
```

2. Check bot configuration:
```sql
-- In PostgreSQL
SELECT * FROM bot_configs WHERE parameter LIKE '%ollama%';
```

### WebSocket disconnected
- Dashboard akan auto-reconnect setiap 5 detik
- Check browser console untuk error messages

## 6. Testing Scenarios

### Scenario 1: New Lead
1. Send message dari nomor baru
2. System akan create new lead otomatis
3. Bot akan respond dengan greeting
4. Lead muncul di conversation list

### Scenario 2: Existing Lead
1. Send message dari nomor existing
2. Conversation akan update
3. History messages tetap ada
4. Bot respond based on context

### Scenario 3: Multi-User
1. Buka dashboard di 2 browser/tab
2. Send message dari satu tab
3. Message muncul real-time di kedua tab
4. Test concurrent messaging

## 7. Expected Results

✅ Messages appear instantly (< 1 second)
✅ Bot responds within 2-5 seconds
✅ All messages saved to database
✅ Lead status updated automatically
✅ WebSocket maintains connection
✅ Search works for phone/name
✅ Message status indicators accurate

## 8. Performance Metrics

Monitor di dashboard:
- Response time bot
- Message delivery status
- Active conversations count
- WebSocket connection status

## 9. Data Flow

```
WhatsApp Message → WAHA → Webhook → Backend
                                        ↓
                                   Process Bot
                                        ↓
                                   Save to DB
                                        ↓
                                WebSocket Emit
                                        ↓
                              Dashboard Update
```

## 10. Quick Commands

```bash
# Test send message via CURL
curl -X POST http://localhost:3001/api/sendText \
  -H "X-Api-Key: your-secret-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "session": "default",
    "chatId": "6281234567890@c.us",
    "text": "Test from CURL"
  }'

# Check conversations
curl http://localhost:3000/api/crm/conversations \
  -H "Authorization: Bearer YOUR_TOKEN"

# Monitor real-time
tail -f backend.log | grep -E "(webhook|message|bot)"
```