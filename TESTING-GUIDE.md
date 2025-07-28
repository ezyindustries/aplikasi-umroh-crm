# WhatsApp CRM Testing Guide

## Prerequisites

1. **Install WAHA (WhatsApp Web API)**
   ```bash
   # Using Docker (recommended)
   docker run -it --rm -p 3000:3000/tcp devlikeapro/waha

   # Or using NPM
   npm install -g @devlikeapro/waha
   waha
   ```

2. **Verify WAHA is running**
   - Open: http://localhost:3000
   - You should see WAHA dashboard

## Starting the Application

1. **Start the backend and frontend**
   ```bash
   # Windows
   START-WHATSAPP-CRM.bat
   
   # Or manually start backend
   cd backend/whatsapp
   npm install
   npm start
   
   # Start frontend (in new terminal)
   cd frontend
   python -m http.server 8080
   ```

2. **Open the application**
   - Navigate to: http://localhost:8080/conversations-beautiful.html

## Connecting WhatsApp

1. Click the **"Connect WhatsApp"** button in the header
2. A QR code will appear
3. Open WhatsApp on your phone:
   - Go to Settings > Linked Devices
   - Tap "Link a Device"
   - Scan the QR code
4. Wait for connection confirmation
5. Your contacts will automatically load

## Testing Features

### 1. View Contacts
- After connecting, all your WhatsApp contacts will appear in the left sidebar
- Contacts with recent conversations will show last message preview

### 2. Send Messages
- Click on any contact
- Type a message in the input field
- Press Enter or click Send button
- Message will appear in real-time

### 3. Receive Messages
- Messages from WhatsApp will appear automatically
- New message notifications will show on contact list
- Unread count badges will update

### 4. Real-time Updates
- Message status updates (sent, delivered, read)
- Typing indicators
- Online/offline status

## Troubleshooting

### WAHA Connection Issues
1. Check WAHA is running: http://localhost:3000
2. Check backend logs: `backend/whatsapp/logs/`
3. Try restarting WAHA

### QR Code Not Showing
1. Check browser console for errors
2. Verify backend is running on port 3001
3. Check CORS settings if different ports

### Messages Not Sending
1. Verify WhatsApp is connected (green status)
2. Check contact has valid phone number
3. Review backend logs for errors

### No Contacts Loading
1. Ensure WhatsApp is fully connected
2. Click "Sync Contacts" button
3. Check if contacts have privacy settings blocking

## API Testing

Test individual endpoints:

```bash
# Check backend health
curl http://localhost:3001/api/health

# Get session status
curl http://localhost:3001/api/sessions/default/status

# List contacts
curl http://localhost:3001/api/contacts
```

## Database Inspection

View SQLite database:
```bash
# Install SQLite viewer or use command line
sqlite3 backend/whatsapp/data/whatsapp-crm.db
.tables
SELECT * FROM Contacts LIMIT 10;
```

## Important Notes

1. **WhatsApp Web Limitations**
   - Only one active web session at a time
   - Phone must stay connected to internet
   - Some features may be limited vs native app

2. **Rate Limits**
   - Respect WhatsApp rate limits
   - Don't send too many messages quickly
   - Use template messages for bulk sending

3. **Privacy**
   - Only contacts who have your number saved can receive messages
   - Respect WhatsApp Terms of Service
   - Don't use for spam

## Next Steps

After successful testing:
1. Configure business settings in `.env`
2. Set up proper authentication
3. Deploy to production server
4. Configure SSL certificates
5. Set up monitoring and backups