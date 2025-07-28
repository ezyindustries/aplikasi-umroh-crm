# Testing Guide: WhatsApp Rate Limiting & Message Queue

## Prerequisites

1. Semua service harus running:
```bash
docker-compose ps
# Pastikan semua healthy: backend, frontend, db, waha
```

2. WhatsApp harus connected:
- Buka http://localhost:8081/crm-dashboard-pro.html
- Login dengan admin/admin123
- Pastikan WhatsApp status "Connected" (indicator hijau)

## Test Scenarios

### 1. Test Per-User Rate Limit (5 messages/minute)

**Steps:**
1. Pilih satu conversation yang aktif
2. Kirim 6 pesan berturut-turut dengan cepat
3. Expected: Pesan ke-6 akan ditolak dengan error rate limit

**Test Script:**
```javascript
// Run di browser console
async function testRateLimit() {
    for (let i = 1; i <= 6; i++) {
        const input = document.getElementById('chat-input');
        input.value = `Test message ${i} - ${new Date().toISOString()}`;
        await sendMessage();
        await new Promise(resolve => setTimeout(resolve, 500)); // 0.5 second delay
    }
}
testRateLimit();
```

**Expected Results:**
- Messages 1-5: Terkirim dan masuk queue
- Message 6: Error "You are sending messages too quickly"
- UI menampilkan countdown timer di tombol Send

### 2. Test Daily Limit

**Steps:**
1. Check current daily usage di "Usage Limits" card
2. Kirim messages hingga mendekati limit
3. Monitor progress bar berubah warna:
   - 0-70%: Biru (normal)
   - 70-90%: Kuning (warning)
   - 90-100%: Merah (danger)

**Check via API:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3000/api/crm/rate-limits
```

**Expected Response:**
```json
{
  "success": true,
  "limits": {
    "daily": {
      "limit": 100,
      "used": 45,
      "remaining": 55
    }
  },
  "tier": "basic"
}
```

### 3. Test Business Hours

**Steps untuk Test Outside Business Hours:**
1. Set system time ke 21:00 (9 PM)
2. Coba kirim message baru
3. Expected: Error "Outside business hours"

**Steps untuk Test Reply Exception:**
1. Pastikan ada inbound message dalam 24 jam terakhir
2. Kirim reply di luar business hours
3. Expected: Message terkirim (bypass business hours)

### 4. Test Anti-Spam

**Test Spam Keywords:**
```javascript
// Test di console
const spamMessages = [
    "CLICK HERE NOW! Limited time offer!",
    "Congratulations! You won $1000!",
    "Buy viagra cheap pharmacy",
    "100% FREE! Act now!",
    "Check this out: bit.ly/spam123"
];

for (const msg of spamMessages) {
    document.getElementById('chat-input').value = msg;
    await sendMessage();
    await new Promise(resolve => setTimeout(resolve, 1000));
}
```

**Expected:** Semua messages ditolak dengan "Message blocked due to spam detection"

**Test Duplicate Messages:**
1. Kirim message: "Hello, test message"
2. Tunggu 2 detik
3. Kirim exact same message lagi
4. Expected: Error "You recently sent an identical message"

### 5. Test Message Queue

**Test Queue Processing:**
1. Kirim 10 messages dengan delay minimal
2. Monitor Queue Indicators di setiap message
3. Expected:
   - Setiap message shows queue position
   - Messages diproses dengan 2 second delay
   - Status berubah: queued → sending → sent

**Monitor via WebSocket:**
```javascript
// Di console, monitor WebSocket events
ws.addEventListener('message', (event) => {
    const data = JSON.parse(event.data);
    console.log('WebSocket Event:', data.type, data);
});
```

### 6. Test Failed Messages & Retry

**Simulate Failure:**
1. Disconnect WAHA (Stop WhatsApp session)
2. Kirim message
3. Expected:
   - Message status: failed (red error icon)
   - Retry button muncul
   - Error toast notification

**Test Retry:**
1. Reconnect WAHA
2. Click Retry button pada failed message
3. Expected: Message di-queue ulang dan terkirim

### 7. Test Rate Limit Headers

**Check Response Headers:**
```bash
curl -i -X POST http://localhost:3000/api/crm/conversations/CONV_ID/messages \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Test message"}'
```

**Expected Headers:**
```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 4
X-RateLimit-Reset: 1675845180000
X-Daily-Limit: 100
X-Daily-Remaining: 54
```

### 8. Test UI Updates

**Test Real-time Updates:**
1. Buka 2 browser tabs dengan dashboard yang sama
2. Di tab 1: Kirim messages
3. Di tab 2: Monitor:
   - Usage Limits card updates
   - Queue indicators appear
   - Message status changes

**Test Progress Bars:**
1. Send messages hingga 80% dari daily limit
2. Expected: Progress bar berubah kuning
3. Send hingga 95%
4. Expected: Progress bar merah + warning notification

### 9. Load Testing

**Stress Test Queue:**
```javascript
// Simulate burst of messages
async function stressTest() {
    const promises = [];
    for (let i = 0; i < 20; i++) {
        promises.push(
            fetch(`/api/crm/conversations/${currentChatId}/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    content: `Stress test message ${i}`
                })
            })
        );
    }
    
    const results = await Promise.all(promises);
    console.log('Results:', results.map(r => r.status));
}
```

**Expected:**
- First 5: 200 OK (queued)
- Rest: 429 Too Many Requests

### 10. Test Emergency Override

**For Admin Users:**
```bash
curl -X POST http://localhost:3000/api/crm/conversations/CONV_ID/messages \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Emergency: true" \
  -d '{"content": "Emergency message"}'
```

**Expected:** Bypass global rate limit (admin only)

## Monitoring Dashboard

### Check Queue Status:
```bash
curl http://localhost:3000/api/crm/queue/status \
  -H "Authorization: Bearer TOKEN"
```

### Monitor in Real-time:
1. Open browser DevTools → Network tab
2. Filter by "rate-limits" 
3. See periodic updates every 30 seconds

## Common Issues & Solutions

### Issue: Messages stuck in queue
**Check:**
- WAHA connection status
- Queue processing logs: `docker logs vauza-tamma-backend -f | grep queue`
- Message status in database

**Fix:**
- Restart message queue processor
- Check for errors in backend logs

### Issue: Rate limits not resetting
**Check:**
- Server time vs client time
- Daily limit reset at midnight

**Fix:**
- Verify timezone settings
- Clear browser cache
- Check Redis/memory store

### Issue: Spam detection too aggressive
**Check:**
- Review spam patterns in `simpleRateLimiter.js`
- Check for false positives

**Fix:**
- Adjust spam patterns
- Add whitelist for certain content

## Performance Benchmarks

### Expected Processing Times:
- Queue add: < 100ms
- Message send: 2-3 seconds (with delay)
- Rate limit check: < 10ms
- Spam detection: < 50ms

### Capacity:
- Queue capacity: 1000 messages
- Process rate: 30 messages/minute
- Concurrent users: 100+

## Test Automation Script

Save as `test-rate-limits.js`:
```javascript
const tests = {
    async testRateLimit() {
        console.log('Testing rate limits...');
        // Implementation
    },
    
    async testBusinessHours() {
        console.log('Testing business hours...');
        // Implementation
    },
    
    async testSpamDetection() {
        console.log('Testing spam detection...');
        // Implementation
    }
};

// Run all tests
async function runAllTests() {
    for (const [name, test] of Object.entries(tests)) {
        console.log(`\n=== Running ${name} ===`);
        try {
            await test();
            console.log(`✅ ${name} passed`);
        } catch (error) {
            console.error(`❌ ${name} failed:`, error);
        }
    }
}

runAllTests();
```

## Success Criteria

✅ **Rate Limiting Working:**
- [ ] 5 msgs/minute limit enforced
- [ ] Daily limits enforced by tier
- [ ] Proper error messages shown
- [ ] UI updates correctly

✅ **Message Queue Working:**
- [ ] Messages queued with position
- [ ] 2-second delay between sends
- [ ] Retry mechanism works
- [ ] Status updates real-time

✅ **Compliance Features:**
- [ ] Business hours enforced
- [ ] Spam detection active
- [ ] Duplicate prevention works
- [ ] Audit logging functional

✅ **UI/UX:**
- [ ] Usage limits displayed
- [ ] Progress bars update
- [ ] Error messages clear
- [ ] Queue indicators visible

## Next Steps

After successful testing:
1. Monitor production usage
2. Adjust limits based on usage patterns
3. Implement analytics dashboard
4. Add automated alerts
5. Create user documentation