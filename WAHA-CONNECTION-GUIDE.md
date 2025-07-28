# WAHA WhatsApp Connection Guide

## Prerequisites

### 1. Install Docker (Recommended)
- Download: https://www.docker.com/products/docker-desktop/
- Install dan restart komputer
- Verify: `docker --version`

### 2. OR Install Node.js 
- Download: https://nodejs.org/
- Install LTS version
- Verify: `node --version`

## Step-by-Step Connection

### 1. Start WAHA Service

#### Docker Method:
```bash
docker run -it --rm -p 3000:3000/tcp devlikeapro/waha
```

#### NPM Method:
```bash
npm install -g @devlikeapro/waha
waha
```

### 2. Verify WAHA Running
- Open: http://localhost:3000
- Should see WAHA API documentation

### 3. Start Application
```bash
# Easy way
START-WHATSAPP-CRM.bat

# Or manually
cd backend/whatsapp && npm start
cd frontend && python -m http.server 8080
```

### 4. Connect WhatsApp

1. Open: http://localhost:8080/conversations-beautiful.html
2. Click "Connect WhatsApp" button (top right)
3. QR Code popup will appear
4. On your phone:
   - Open WhatsApp
   - Tap Settings (⚙️)
   - Tap "Linked Devices"
   - Tap "Link a Device"
   - Scan the QR code
5. Wait for "Connected" status
6. Contacts will load automatically

## Important Notes

### ⚠️ Keep Phone Online
- Your phone MUST stay connected to internet
- If phone goes offline, WhatsApp Web disconnects
- If phone battery dies, connection lost

### 🔄 Session Limits
- WhatsApp Web sessions expire after 14 days inactive
- Need to re-scan QR periodically
- Don't logout from phone (will disconnect)

### 🛡️ Compliance Rules
- Max 50 contacts per day
- 5-8 second delay between messages
- Active hours: 08:00 - 21:00 WIB
- No spam/prohibited content

## Troubleshooting

### QR Code Not Showing
```bash
# 1. Check WAHA
curl http://localhost:3000/api/sessions/default/status

# 2. Check Backend
curl http://localhost:3001/api/health

# 3. Check Browser Console
F12 → Console tab → Look for red errors
```

### Connection Failed
1. Ensure WAHA is running (port 3000)
2. Ensure backend is running (port 3001)
3. Check firewall not blocking ports
4. Try different browser
5. Clear browser cache

### Messages Not Sending
1. Check compliance status (panel right)
2. Verify within active hours
3. Check daily limit not exceeded
4. Ensure no prohibited words
5. Wait 5+ seconds between messages

### Contacts Not Loading
1. Verify WhatsApp connected (green status)
2. Click "Sync Contacts" button
3. Check browser console for errors
4. May take 30-60 seconds for large contact lists

## Quick Test

After connecting, try this:
1. Select a contact
2. Type: "Test message from CRM"
3. Click Send
4. Should see "Sent" status
5. Check phone for delivery

## Best Practices

### DO ✅
- Keep sessions short (<8 hours/day)
- Send personalized messages
- Respect time delays
- Monitor compliance panel
- Logout when done

### DON'T ❌
- Send bulk messages
- Use spam words
- Message outside hours
- Ignore warnings
- Leave session running 24/7

## Need Help?

1. Check logs:
   - Backend: `backend/whatsapp/logs/`
   - WAHA: Docker logs
   - Browser: F12 Console

2. Common fixes:
   - Restart all services
   - Clear browser cache
   - Re-scan QR code
   - Check phone online

3. For persistent issues:
   - Document error messages
   - Check GitHub issues
   - Consider official API