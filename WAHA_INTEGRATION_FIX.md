# WAHA Integration Fix Plan

## Current Issues:
1. Contact list clicks not working - event handler problems
2. No messages displayed when clicking contacts
3. Webhook not configured for real-time updates
4. Socket.IO events not properly connected to WAHA events
5. Database schema mismatch between old Baileys and WAHA

## Architecture Overview:
```
Frontend (conversations-beautiful.html)
    ↓ HTTP/WebSocket
Backend API (port 3001)
    ↓ HTTP
WAHA Docker (port 3000)
    ↓ Webhooks
Backend API → Database (SQLite)
```

## Required Fixes:

### 1. Frontend Fixes:
- Fix contact click handlers to properly pass element reference
- Fix selectContact function to not rely on event.currentTarget
- Fix message loading to use correct API endpoints
- Add proper error handling for all API calls

### 2. Backend Fixes:
- Configure WAHA webhooks on session start
- Update WebhookHandler to match WAHA event format
- Fix ContactController to properly query database
- Fix MessageController to handle WAHA message format

### 3. Database Fixes:
- Ensure Contact model has correct fields for WAHA
- Ensure Message model can store WAHA message types
- Add proper indexes for performance

### 4. WAHA Integration:
- Set webhook URL when starting session
- Handle WAHA webhook events properly
- Convert WAHA message format to our database format
- Emit socket events for real-time updates

## Implementation Steps:
1. Fix frontend contact click handlers
2. Configure WAHA webhooks
3. Update webhook handler for WAHA events
4. Fix message loading and display
5. Test end-to-end flow