# WhatsApp Integration Setup Guide

## Overview
The WhatsApp integration is now running using WAHA (WhatsApp HTTP API) on port 3001.

## Access Points

- **WAHA API**: http://localhost:3001
- **WAHA Swagger UI**: http://localhost:3001/api
- **Backend API**: http://localhost:3000/api
- **Frontend CRM**: http://localhost:8081/crm-dashboard.html

## Initial Setup Steps

### 1. Access WAHA Swagger UI
Open your browser and go to: http://localhost:3001/api

### 2. Create WhatsApp Session
1. In Swagger UI, find the `/api/sessions` endpoint
2. Click "Try it out"
3. Use this request body:
```json
{
  "name": "default",
  "config": {
    "webhooks": [
      {
        "url": "http://backend:3000/api/crm/webhook",
        "events": ["message", "message.ack", "state.change"]
      }
    ]
  }
}
```
4. Click "Execute"

### 3. Get QR Code
1. Find the `/api/sessions/{session}/auth/qr` endpoint
2. Use session name: `default`
3. Click "Try it out" and "Execute"
4. Scan the QR code with WhatsApp on your phone

### 4. Verify Connection
1. Check session status at `/api/sessions/{session}`
2. Status should show "WORKING"

### 5. Configure Bot Settings
1. Access CRM Dashboard: http://localhost:8081/crm-dashboard.html
2. Navigate to "AI Bot Config" in the sidebar
3. Configure:
   - OpenAI API Key (required for LLM responses)
   - Response templates
   - Bot behavior settings

### 6. Test the Integration
1. Send a WhatsApp message to your connected number
2. Check the CRM Dashboard > WhatsApp section
3. The message should appear in conversations
4. Bot should auto-reply based on your configuration

## API Authentication
- WAHA API Key: `your-secret-api-key` (configured in docker-compose.waha.yml)
- Use header: `X-API-Key: your-secret-api-key`

## Troubleshooting

### Check WAHA Logs
```bash
docker logs vauza-tamma-waha -f
```

### Check Backend Logs
```bash
docker logs vauza-tamma-backend -f
```

### Common Issues
1. **QR Code not showing**: Restart WAHA container
2. **Messages not received**: Check webhook URL configuration
3. **Bot not responding**: Verify OpenAI API key in bot config

## Environment Variables
Add these to your `.env` file:
```env
WAHA_API_KEY=your-secret-api-key
WAHA_PORT=3001
OPENAI_API_KEY=your-openai-api-key
```

## Testing WhatsApp Bot

1. Send common queries:
   - "Assalamualaikum"
   - "Info paket umroh"
   - "Berapa harga paket reguler?"
   - "Syarat pendaftaran apa saja?"

2. Monitor responses in:
   - CRM Dashboard > WhatsApp
   - Backend logs for processing
   - WAHA logs for message flow

## Security Notes
- Change the default API key in production
- Use HTTPS for webhook URLs in production
- Implement rate limiting for bot responses
- Monitor for suspicious activity

## Next Steps
1. Configure marketing automation rules
2. Set up broadcast campaigns
3. Create custom response templates
4. Implement lead scoring based on conversations