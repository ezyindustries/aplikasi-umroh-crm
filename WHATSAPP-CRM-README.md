# WhatsApp CRM Integration Guide (WAHA Version)

## ⚠️ IMPORTANT: WAHA Implementation
This system uses **WAHA (WhatsApp Web API)** - NOT the official WhatsApp Business API. 
- **Risk**: Higher chance of being banned
- **Limits**: Very conservative (50 contacts/day)
- **Recommendation**: For production use, migrate to official WhatsApp Business API

## Overview
This WhatsApp CRM system is designed with WAHA integration and strict compliance rules to minimize ban risk. It features real-time messaging, conversation management, and comprehensive anti-ban safeguards.

## Quick Start

1. **Install Prerequisites**
   - Node.js (v14+)
   - Python (for frontend server)
   - WAHA (WhatsApp Web API) - Must be running on http://localhost:3000

2. **Start the Application**
   ```bash
   # Windows
   START-WHATSAPP-CRM.bat
   
   # Or manually:
   cd backend/whatsapp
   npm install
   npm start
   
   # In another terminal:
   cd frontend
   python -m http.server 8080
   ```

3. **Access the Application**
   - Frontend: http://localhost:8080/conversations-beautiful.html
   - Backend API: http://localhost:3001/api
   - API Health Check: http://localhost:3001/api/health

## Architecture

### Backend Stack
- **Framework**: Node.js with Express
- **Database**: SQLite with Sequelize ORM
- **Message Queue**: Bull with Redis
- **Real-time**: Socket.IO
- **WhatsApp Integration**: WAHA (WhatsApp Web API)

### Key Features
1. **WAHA Anti-Ban Compliance**
   - Conservative limits (50 contacts/day max)
   - Human behavior simulation (5-8 sec delays)
   - Active hours enforcement (08:00-21:00 WIB)
   - Prohibited content filtering
   - Warming period for new numbers (14 days)
   - Emergency auto-pause on anomalies

2. **Message Management**
   - Reliable message delivery with queue system
   - Message status tracking (pending, sent, delivered, read, failed)
   - Support for text, image, video, audio, and document messages
   - Starred messages for important conversations

3. **Contact Management**
   - Automatic contact syncing from WhatsApp
   - Tags and metadata support
   - Block/unblock functionality
   - Contact statistics and conversation history

4. **Conversation Features**
   - Real-time message updates
   - Conversation priority levels
   - Label system for organization
   - Archive functionality
   - Assignment system for team collaboration

## API Endpoints

### Sessions
- `POST /api/sessions/start` - Start WhatsApp session
- `POST /api/sessions/:sessionId/stop` - Stop session
- `GET /api/sessions/:sessionId/status` - Get session status
- `GET /api/sessions` - List all sessions

### Messages
- `POST /api/messages/send` - Send message
- `GET /api/messages/:conversationId` - Get conversation messages
- `GET /api/messages/search` - Search messages
- `POST /api/messages/:messageId/star` - Star/unstar message

### Contacts
- `GET /api/contacts` - List contacts
- `GET /api/contacts/:contactId` - Get contact details
- `POST /api/contacts` - Create/update contact
- `POST /api/contacts/sync` - Sync contacts from WhatsApp

### Conversations
- `GET /api/conversations` - List conversations
- `POST /api/conversations` - Create conversation
- `POST /api/conversations/:conversationId/close` - Close conversation
- `POST /api/conversations/:conversationId/archive` - Archive conversation

## Configuration

### Environment Variables (.env)
```env
# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:8080

# Database
DATABASE_PATH=./data/whatsapp-crm.db

# WAHA
WAHA_BASE_URL=http://localhost:3000
WAHA_SESSION_NAME=default

# WhatsApp Business
WHATSAPP_PHONE_NUMBER=6281234567890
WHATSAPP_TIER=tier2
BUSINESS_INITIATED_LIMIT=1000
```

## Database Schema

### Core Tables
1. **Contacts** - WhatsApp contacts with metadata
2. **Conversations** - Active conversation threads
3. **Messages** - All messages with full history
4. **ConversationSessions** - 24-hour window tracking
5. **WhatsAppSessions** - Session management
6. **MessageTemplates** - Business message templates

## Security Features

1. **Rate Limiting**
   - API-level rate limiting
   - WhatsApp Business tier-based limits
   - Message sending throttling

2. **Data Protection**
   - Input validation with Joi
   - SQL injection prevention
   - XSS protection with Helmet

3. **Logging**
   - Comprehensive Winston logging
   - API request logging
   - Error tracking

## Monitoring

### Logs Location
- `backend/whatsapp/logs/api.log` - API requests
- `backend/whatsapp/logs/error.log` - Error logs
- `backend/whatsapp/logs/waha.log` - WhatsApp integration logs

### Health Monitoring
- Check API health: `GET /api/health`
- Monitor queue status: `GET /api/messages/queue/status`
- Session status: `GET /api/sessions/:sessionId/status`

## Troubleshooting

### Common Issues

1. **Cannot connect to WhatsApp**
   - Ensure WAHA is running on http://localhost:3000
   - Check session status in the UI
   - Review WAHA logs

2. **Messages not sending**
   - Check 24-hour window status
   - Verify contact opt-in status
   - Check rate limits

3. **Database errors**
   - Run migrations: `npm run migrate`
   - Check write permissions on data folder

## Future Features

- [ ] AI-based auto-reply system
- [ ] Template message UI
- [ ] Bulk messaging
- [ ] Advanced analytics
- [ ] Multi-agent support
- [ ] Conversation export
- [ ] Backup/restore system

## Support

For issues or questions:
1. Check logs in `backend/whatsapp/logs/`
2. Verify all services are running
3. Ensure WAHA is properly configured
4. Check WhatsApp Business compliance requirements