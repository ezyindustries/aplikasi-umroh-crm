# WhatsApp CRM Application

Simple WhatsApp CRM application using WAHA (WhatsApp HTTP API) with SQLite database.

## Features

- **CRM Dashboard** - Manage WhatsApp conversations
- **Chat Interface** - Beautiful conversation view
- **SQLite Database** - Simple and portable data storage
- **WAHA Integration** - Official WhatsApp HTTP API

## Requirements

- Node.js 14+
- WAHA Server (Docker or standalone)
- SQLite

## Quick Start

### 1. Start WAHA Server
```bash
# Using Docker
docker run -it --rm -p 3000:3000/tcp --name waha devlikeapro/waha

# Or use the provided batch file
START-WAHA-DOCKER.bat
```

### 2. Start WhatsApp Backend
```bash
cd backend/whatsapp
npm install
npm start
```

### 3. Open CRM Interface
- CRM Dashboard: http://localhost:8080/crm-main.html
- Conversations: http://localhost:8080/conversations-beautiful.html

## Project Structure

```
├── frontend/
│   ├── crm-main.html          # CRM Dashboard
│   ├── conversations-beautiful.html  # Chat Interface
│   ├── css/                   # Styles
│   └── js/                    # JavaScript files
└── backend/
    └── whatsapp/
        ├── server.js          # Main server
        ├── src/               # Source code
        └── data/
            └── whatsapp-crm.db  # SQLite database
```

## Configuration

Create `.env` file in `backend/whatsapp/`:

```env
PORT=3001
WAHA_URL=http://localhost:3000
WAHA_API_KEY=your-api-key
DATABASE_PATH=./data/whatsapp-crm.db
```

## API Endpoints

- `GET /api/sessions` - Get WhatsApp sessions
- `POST /api/sessions/start` - Start new session
- `GET /api/conversations` - Get all conversations
- `GET /api/messages/:chatId` - Get messages for a chat
- `POST /api/messages/send` - Send a message

## Support

For WAHA documentation: https://waha.devlike.pro/