# WhatsApp Rate Limiting & Message Queue System

## Overview
Sistem ini menerapkan rate limiting dan message queue untuk memastikan compliance dengan WhatsApp Business policies dan mencegah pemblokiran akun.

## Rate Limits yang Diimplementasikan

### 1. Per-User Per-Phone Rate Limit
- **Limit**: 5 pesan per menit per nomor telepon
- **Reset**: Setiap 1 menit
- **Key**: `userId:phoneNumber`
- **Error**: HTTP 429 dengan pesan spesifik

### 2. Global System Rate Limit
- **Limit**: 100 pesan per menit untuk seluruh sistem
- **Reset**: Setiap 1 menit
- **Bypass**: Admin dengan header `x-emergency: true`

### 3. Daily User Limits
- **Basic Tier**: 100 pesan/hari
- **Premium Tier**: 500 pesan/hari
- **Enterprise Tier**: 2000 pesan/hari
- **Reset**: Tengah malam setiap hari

### 4. Business Hours Enforcement
- **Jam Operasional**: Senin-Sabtu, 08:00-20:00 WIB
- **Exception**: Balasan dalam 24 jam (isReply: true)
- **Bypass**: Admin users

### 5. Anti-Spam Detection
- **Pattern Detection**: Viagra, pharmacy, "click here now", dll
- **Duplicate Message**: Blokir pesan identik dalam 5 menit
- **Excessive Caps**: Blokir jika >80% huruf kapital
- **Excessive Emojis**: Blokir jika >10 emoji

## Message Queue System

### Queue Configuration
```javascript
{
  minDelayBetweenMessages: 2000,      // 2 detik
  maxMessagesPerMinute: 10,            // 10 pesan/menit
  maxNewConversationsPerDay: 15,      // 15 konversasi baru/hari
  maxMessagesPerHour: 30,              // 30 pesan/jam
  businessHoursStart: 8,               // 08:00
  businessHoursEnd: 20                 // 20:00
}
```

### Queue Priority
- **high**: Reply messages (dalam 24-hour window)
- **normal**: Business-initiated messages

### Queue Events
- `message:queued`: Pesan masuk antrian
- `message:sent`: Pesan berhasil terkirim
- `message:retry`: Pesan akan dicoba ulang
- `message:failed`: Pesan gagal setelah max retries

## API Endpoints

### 1. Send Message with Rate Limiting
```http
POST /api/crm/conversations/:id/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Hello, terima kasih telah menghubungi kami",
  "type": "text",
  "isReply": true  // Optional: bypass business hours if true
}
```

**Response Success:**
```json
{
  "success": true,
  "data": {
    "id": "message-uuid",
    "content": "Hello...",
    "status": "queued",
    "queue_id": "queue-123"
  },
  "queue": {
    "id": "queue-123",
    "position": 3,
    "estimatedTime": 6  // seconds
  }
}
```

**Response Rate Limited:**
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "message": "You are sending messages too quickly. Please slow down.",
  "retryAfter": 1675845123000
}
```

### 2. Get Rate Limit Info
```http
GET /api/crm/rate-limits
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "limits": {
    "daily": {
      "limit": 100,
      "used": 45,
      "remaining": 55
    },
    "perMinute": {
      "limit": 5,
      "window": "1 minute"
    },
    "perHour": {
      "limit": 30,
      "window": "1 hour"
    },
    "businessHours": {
      "days": "Monday - Saturday",
      "hours": "8:00 AM - 8:00 PM WIB",
      "currentlyOpen": true
    }
  },
  "tier": "basic"
}
```

### 3. Get Queue Status
```http
GET /api/crm/queue/status
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "queueLength": 5,
    "processing": true,
    "messagesSetToday": 45,
    "config": {
      "minDelayBetweenMessages": 2000,
      "maxMessagesPerMinute": 10
    }
  }
}
```

## Frontend Integration

### 1. Update Send Message Function
```javascript
async function sendMessage(conversationId, content) {
  try {
    const response = await fetch(`/api/crm/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: content,
        type: 'text',
        isReply: isWithin24HourWindow()
      })
    });

    const data = await response.json();

    if (response.status === 429) {
      // Rate limited
      showError(data.message);
      updateRateLimitUI(data.retryAfter);
      return;
    }

    if (data.success) {
      // Show queued message
      showQueuedMessage(data.data, data.queue);
    }
  } catch (error) {
    console.error('Send error:', error);
  }
}
```

### 2. Handle WebSocket Events
```javascript
// Listen for queue events
ws.on('message_queued', (data) => {
  updateMessageStatus(data.message.id, 'queued');
  showQueuePosition(data.queuePosition);
});

ws.on('message:sent', (data) => {
  updateMessageStatus(data.id, 'sent');
  showSuccessIndicator();
});

ws.on('message:failed', (data) => {
  updateMessageStatus(data.id, 'failed');
  showErrorMessage(data.error);
});
```

### 3. Display Rate Limit Info
```javascript
// Get and display rate limits
async function updateRateLimitDisplay() {
  const response = await fetch('/api/crm/rate-limits');
  const data = await response.json();
  
  if (data.success) {
    document.getElementById('daily-limit').textContent = 
      `${data.limits.daily.used}/${data.limits.daily.limit}`;
    
    document.getElementById('rate-limit-bar').style.width = 
      `${(data.limits.daily.used / data.limits.daily.limit) * 100}%`;
  }
}

// Update every minute
setInterval(updateRateLimitDisplay, 60000);
```

## Testing Scenarios

### 1. Test Rate Limiting
```bash
# Send 6 messages in quick succession (should fail on 6th)
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/crm/conversations/123/messages \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"content": "Test message '$i'"}'
  sleep 0.5
done
```

### 2. Test Business Hours
```bash
# Set system time to 9 PM and try sending
# Should fail with business hours error
```

### 3. Test Spam Detection
```bash
# Try sending spam content
curl -X POST http://localhost:3000/api/crm/conversations/123/messages \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "CLICK HERE NOW! Limited time offer!!!"}'
```

## Monitoring & Alerts

### 1. Key Metrics to Monitor
- Queue length over time
- Rate limit hits by user
- Failed messages count
- Average queue processing time
- Business hours violations

### 2. Alert Thresholds
- Queue length > 100: System overload
- Rate limit hits > 50/hour: Potential abuse
- Failed messages > 10%: System issue
- Processing time > 30s: Performance issue

## Best Practices

### For Developers:
1. Always check rate limit headers in responses
2. Implement exponential backoff for retries
3. Cache rate limit info to reduce API calls
4. Show clear feedback to users about limits

### For Users:
1. Batch messages when possible
2. Use templates for common responses
3. Schedule messages during business hours
4. Monitor daily usage via dashboard

## Troubleshooting

### Common Issues:

1. **"Rate limit exceeded" errors**
   - Check current limits: GET /api/crm/rate-limits
   - Wait for reset time
   - Consider upgrading tier

2. **Messages stuck in queue**
   - Check queue status: GET /api/crm/queue/status
   - Verify WAHA connection
   - Check for system errors

3. **Business hours blocking**
   - Verify timezone settings
   - Use isReply flag for customer responses
   - Contact admin for override

## Environment Variables

```env
# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Business Hours (24-hour format)
BUSINESS_HOURS_START=8
BUSINESS_HOURS_END=20
BUSINESS_TIMEZONE=Asia/Jakarta

# Queue Settings
QUEUE_MIN_DELAY_MS=2000
QUEUE_MAX_RETRIES=3
QUEUE_RETRY_DELAY_MS=5000
```

## Compliance Checklist

- [x] Rate limiting per user/phone
- [x] Global system rate limits
- [x] Daily message limits by tier
- [x] Business hours enforcement
- [x] Anti-spam detection
- [x] Message queue with delays
- [x] Duplicate message prevention
- [x] Consent verification
- [x] Audit logging
- [x] Real-time monitoring

This system ensures WhatsApp Business compliance while maintaining good user experience and system performance.