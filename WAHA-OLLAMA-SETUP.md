# Setup WAHA dengan Ollama (LLM Lokal)

## Prerequisites
- ✅ Ollama sudah terinstall dan berjalan di `http://localhost:11434`
- ✅ Model Mistral 7B sudah terdownload (`ollama pull mistral:7b-instruct`)
- ✅ WAHA container sudah berjalan di port 3001
- ✅ Backend aplikasi sudah berjalan

## 1. Konfigurasi Bot untuk Menggunakan Ollama

### Option A: Via Database (Recommended)
Jalankan query SQL ini di PostgreSQL:

```sql
-- Enable Ollama
INSERT INTO bot_configs (id, parameter, value, description, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'use_ollama', 'true', 'Use Ollama instead of OpenAI', NOW(), NOW()),
  (gen_random_uuid(), 'ollama_url', 'http://host.docker.internal:11434', 'Ollama API URL', NOW(), NOW()),
  (gen_random_uuid(), 'ollama_model', 'mistral:7b-instruct', 'Ollama model to use', NOW(), NOW())
ON CONFLICT (parameter) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Configure LLM parameters
INSERT INTO bot_configs (id, parameter, value, description, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'llm_temperature', '0.7', 'Response creativity (0-1)', NOW(), NOW()),
  (gen_random_uuid(), 'llm_max_tokens', '300', 'Maximum response length', NOW(), NOW()),
  (gen_random_uuid(), 'response_delay', '2000', 'Delay before bot responds (ms)', NOW(), NOW()),
  (gen_random_uuid(), 'confidence_threshold', '0.6', 'Min confidence for bot response', NOW(), NOW())
ON CONFLICT (parameter) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
```

### Option B: Via .env File
Tambahkan ke file `.env`:

```env
# Ollama Configuration
USE_OLLAMA=true
OLLAMA_URL=http://host.docker.internal:11434
OLLAMA_MODEL=mistral:7b-instruct

# LLM Parameters
LLM_TEMPERATURE=0.7
LLM_MAX_TOKENS=300
```

## 2. Setup WhatsApp Session di WAHA

### A. Buat Session Baru
```bash
curl -X POST http://localhost:3001/api/sessions \
  -H "X-Api-Key: your-secret-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "default",
    "config": {
      "webhooks": [{
        "url": "http://backend:3000/api/crm/webhook",
        "events": ["message", "message.ack", "state.change", "group.join", "group.leave"]
      }]
    }
  }'
```

### B. Get QR Code
1. Buka browser: http://localhost:3001/api
2. Gunakan endpoint `/api/sessions/default/auth/qr`
3. Atau gunakan curl:

```bash
curl http://localhost:3001/api/sessions/default/auth/qr?format=image \
  -H "X-Api-Key: your-secret-api-key" \
  -o qr-code.png
```

### C. Scan QR Code
1. Buka WhatsApp di HP
2. Settings → Linked Devices → Link a Device
3. Scan QR code yang muncul

## 3. Template Respons Bot

Buat template respons di database:

```sql
-- Greeting template
INSERT INTO bot_templates (id, name, keywords, response_template, is_active, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Greeting Template',
  ARRAY['assalamualaikum', 'halo', 'hai', 'pagi', 'siang', 'sore', 'malam'],
  'Waalaikumsalam {greeting}! 

Selamat datang di Vauza Tamma Travel 🕌
Kami siap membantu perjalanan ibadah umroh Anda.

Silakan pilih informasi yang Anda butuhkan:
1️⃣ Paket Umroh
2️⃣ Jadwal Keberangkatan
3️⃣ Syarat Pendaftaran
4️⃣ Harga & Pembayaran
5️⃣ Konsultasi Langsung

Ketik angka atau topik yang Anda inginkan 😊',
  true,
  NOW(),
  NOW()
);

-- Package info template
INSERT INTO bot_templates (id, name, keywords, response_template, is_active, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Package Info',
  ARRAY['paket', 'program', 'pilihan', 'jenis'],
  '📋 *PAKET UMROH VAUZA TAMMA*

✈️ *PAKET REGULER 12 HARI*
• Harga: Rp 25 Juta
• Hotel: Bintang 4 (Dekat Masjid)
• Pesawat: Direct Flight
• Makan: 3x sehari
• Free: Koper, Tas, Seragam

✈️ *PAKET PLUS TURKI 15 HARI*  
• Harga: Rp 35 Juta
• Bonus: Tour Istanbul 3 hari
• Hotel: Bintang 5
• Include: Visa Turki

✈️ *PAKET VIP 9 HARI*
• Harga: Rp 45 Juta
• Hotel: View Masjid
• Private Handling
• Eksekutif Service

Untuk detail lengkap, ketik nama paket yang diminati 🌟',
  true,
  NOW(),
  NOW()
);
```

## 4. Test Bot WhatsApp

### Via WAHA API:
```bash
# Send test message
curl -X POST http://localhost:3001/api/sendText \
  -H "X-Api-Key: your-secret-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "session": "default",
    "chatId": "6281234567890@c.us",
    "text": "Test message from bot"
  }'
```

### Via WhatsApp:
1. Kirim pesan ke nomor yang terhubung dengan WAHA
2. Bot akan otomatis merespons menggunakan Ollama

## 5. Monitoring & Debug

### Check Ollama Status:
```bash
# Test Ollama
curl http://localhost:11434/api/generate -d '{
  "model": "mistral:7b-instruct",
  "prompt": "Halo, apa kabar?"
}'

# List models
curl http://localhost:11434/api/tags
```

### Check Bot Logs:
```bash
# Backend logs
docker logs vauza-tamma-backend -f --tail 100

# WAHA logs  
docker logs vauza-tamma-waha -f --tail 100
```

### Check Database:
```sql
-- View bot configuration
SELECT * FROM bot_configs ORDER BY parameter;

-- View recent conversations
SELECT * FROM wa_conversations ORDER BY created_at DESC LIMIT 10;

-- View recent messages
SELECT * FROM wa_messages ORDER BY created_at DESC LIMIT 20;
```

## 6. Tips Optimasi Ollama

### A. Response Speed:
```bash
# Pre-load model
curl http://localhost:11434/api/generate -d '{
  "model": "mistral:7b-instruct", 
  "prompt": "",
  "keep_alive": "5m"
}'
```

### B. Custom System Prompt:
Update system prompt untuk konteks lokal Indonesia:

```sql
UPDATE bot_configs 
SET value = 'Anda adalah asisten customer service Vauza Tamma Travel di Indonesia. 
Gunakan bahasa Indonesia yang sopan dan ramah. 
Fokus pada informasi umroh, haji, dan wisata religi.
Jawab dengan singkat, jelas, dan informatif.'
WHERE parameter = 'system_prompt';
```

### C. Memory Optimization:
Jika RAM terbatas, gunakan model yang lebih kecil:
```bash
# Download model lebih kecil
ollama pull phi
ollama pull tinyllama

# Update config
UPDATE bot_configs SET value = 'phi' WHERE parameter = 'ollama_model';
```

## 7. Troubleshooting

### Bot tidak merespons:
1. Cek Ollama: `curl http://localhost:11434/api/tags`
2. Cek WAHA session: `curl http://localhost:3001/api/sessions -H "X-Api-Key: your-secret-api-key"`
3. Cek webhook URL di WAHA config
4. Pastikan `use_ollama` = true di bot_configs

### Response terlalu lambat:
1. Pre-load model dengan keep_alive
2. Gunakan model lebih kecil
3. Kurangi max_tokens
4. Upgrade RAM/CPU

### Error connection refused:
1. Ganti `localhost` dengan `host.docker.internal` untuk akses dari container
2. Pastikan Ollama listening di 0.0.0.0, bukan 127.0.0.1

## 8. Production Tips

1. **Model Selection**: Untuk production, pertimbangkan model yang seimbang antara kualitas dan kecepatan
2. **Caching**: Implement response caching untuk FAQ
3. **Fallback**: Siapkan template response jika Ollama down
4. **Monitoring**: Setup alert untuk response time dan error rate
5. **Scaling**: Gunakan multiple Ollama instances dengan load balancer untuk high traffic