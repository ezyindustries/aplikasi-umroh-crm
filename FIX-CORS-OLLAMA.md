# Fix CORS Issues untuk Testing WhatsApp Bot dengan Ollama

## 1. Start Ollama dengan CORS Enabled

### Windows:
Jalankan file `START-OLLAMA-CORS.bat` atau manual:
```cmd
set OLLAMA_ORIGINS=*
ollama serve
```

### Linux/Mac:
```bash
OLLAMA_ORIGINS=* ollama serve
```

## 2. Akses Test Interface dari Web Server

Jangan buka file HTML langsung! Gunakan URL ini:
```
http://localhost:8081/test-waha-ollama.html
```

## 3. Test Bot via API Langsung

### Test dari Terminal:
```bash
# Test bot response
curl -X POST http://localhost:3000/api/bot/test \
  -H "Content-Type: application/json" \
  -d '{"message": "Assalamualaikum, info paket umroh dong"}'
```

### Test dari CRM Dashboard:
1. Buka: http://localhost:8081/crm-dashboard.html
2. Login dengan admin/admin123
3. Gunakan WhatsApp chat interface

## 4. Setup WhatsApp Session

### Via Swagger UI (Recommended):
1. Buka: http://localhost:3001/api
2. Tidak perlu authentication untuk Swagger UI
3. Create session "default"
4. Get QR code dan scan

### Via API:
```bash
# Create session
curl -X POST http://localhost:3001/api/sessions \
  -H "X-Api-Key: your-secret-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "default",
    "config": {
      "webhooks": [{
        "url": "http://backend:3000/api/crm/webhook",
        "events": ["message"]
      }]
    }
  }'
```

## 5. Verify Configuration

### Check Ollama:
```bash
curl http://localhost:11434/api/tags
```

### Check Bot Config:
```sql
-- Run in PostgreSQL
SELECT parameter, value 
FROM bot_configs 
WHERE parameter IN ('use_ollama', 'ollama_url', 'ollama_model')
ORDER BY parameter;
```

Expected result:
```
parameter    | value
-------------|--------------------------------
ollama_model | mistral:7b-instruct
ollama_url   | http://host.docker.internal:11434
use_ollama   | true
```

## 6. Test Flow

1. **Start Ollama with CORS**:
   - Run `START-OLLAMA-CORS.bat`
   - Verify: `curl http://localhost:11434/api/tags`

2. **Setup WhatsApp**:
   - http://localhost:3001/api
   - Create session & scan QR

3. **Test Bot**:
   - Send WhatsApp message
   - Or use: http://localhost:8081/test-waha-ollama.html
   - Or curl API directly

## 7. Troubleshooting

### CORS Error dari file:// 
- Solution: Akses via http://localhost:8081/test-waha-ollama.html

### Ollama Connection Refused:
- Check Ollama running: `ollama list`
- Use `host.docker.internal` instead of `localhost` from container

### WAHA 401 Unauthorized:
- Use correct API key: `your-secret-api-key`
- Or use Swagger UI yang tidak perlu auth

### Bot Not Responding:
```bash
# Check backend logs
docker logs vauza-tamma-backend -f --tail 50

# Test Ollama directly
curl http://localhost:11434/api/generate -d '{
  "model": "mistral:7b-instruct",
  "prompt": "Hello"
}'
```

## 8. Quick Test Commands

```bash
# 1. Test Ollama
curl http://localhost:11434/api/tags

# 2. Test Bot API
curl -X POST http://localhost:3000/api/bot/test \
  -H "Content-Type: application/json" \
  -d '{"message": "halo"}'

# 3. Check WAHA session
curl http://localhost:3001/api/sessions \
  -H "X-Api-Key: your-secret-api-key"
```