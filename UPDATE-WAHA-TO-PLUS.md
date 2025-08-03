# Update WAHA Core to WAHA Plus in Docker

## Prerequisites
- WAHA Plus license key (dapatkan dari https://waha.devlike.pro/)
- Docker Desktop running

## Step-by-Step Guide

### 1. Stop Current WAHA Container
```bash
# List running containers
docker ps

# Stop WAHA container
docker stop waha

# Remove old container (optional, untuk clean install)
docker rm waha
```

### 2. Pull WAHA Plus Image
```bash
# Pull WAHA Plus image
docker pull devlikeapro/waha-plus:latest
```

### 3. Run WAHA Plus with License Key
```bash
docker run -d \
  --name waha \
  --restart always \
  -p 3000:3000 \
  -e WAHA_LICENSE_KEY=your-license-key-here \
  -e WHATSAPP_HOOK_URL=http://host.docker.internal:3003/api/webhook \
  -e WHATSAPP_HOOK_EVENTS=* \
  -e WHATSAPP_API_KEY=your-api-key \
  -e WHATSAPP_RESTART_ALL_SESSIONS=true \
  -v waha-data:/app/data \
  devlikeapro/waha-plus:latest
```

### 4. Untuk Windows dengan persistent data
```bash
docker run -d ^
  --name waha ^
  --restart always ^
  -p 3000:3000 ^
  -e WAHA_LICENSE_KEY=your-license-key-here ^
  -e WHATSAPP_HOOK_URL=http://host.docker.internal:3003/api/webhook ^
  -e WHATSAPP_HOOK_EVENTS=* ^
  -e WHATSAPP_API_KEY=your-api-key ^
  -e WHATSAPP_RESTART_ALL_SESSIONS=true ^
  -v waha-data:/app/data ^
  devlikeapro/waha-plus:latest
```

## Environment Variables Explained

- `WAHA_LICENSE_KEY`: Your WAHA Plus license key
- `WHATSAPP_HOOK_URL`: Webhook endpoint untuk menerima events
- `WHATSAPP_HOOK_EVENTS`: Events yang akan dikirim ke webhook (* = semua)
- `WHATSAPP_API_KEY`: API key untuk security
- `WHATSAPP_RESTART_ALL_SESSIONS`: Auto restart sessions on container restart
- `-v waha-data:/app/data`: Volume untuk persistent data (sessions, etc)

## Alternative: Docker Compose

Buat file `docker-compose.yml`:

```yaml
version: '3.8'

services:
  waha:
    image: devlikeapro/waha-plus:latest
    container_name: waha
    restart: always
    ports:
      - "3000:3000"
    environment:
      - WAHA_LICENSE_KEY=your-license-key-here
      - WHATSAPP_HOOK_URL=http://host.docker.internal:3003/api/webhook
      - WHATSAPP_HOOK_EVENTS=*
      - WHATSAPP_API_KEY=your-api-key
      - WHATSAPP_RESTART_ALL_SESSIONS=true
      # Optional configurations
      - WHATSAPP_FILES_MIMETYPES=audio,document,image,video
      - WHATSAPP_FILES_LIFETIME=180
      - WHATSAPP_DOWNLOADS_FOLDER=/app/downloads
    volumes:
      - waha-data:/app/data
      - waha-downloads:/app/downloads
    networks:
      - waha-network

volumes:
  waha-data:
  waha-downloads:

networks:
  waha-network:
    driver: bridge
```

Kemudian jalankan:
```bash
docker-compose up -d
```

## Verify Installation

### 1. Check container status
```bash
docker ps
docker logs waha
```

### 2. Check WAHA API
```bash
curl http://localhost:3000/api/version
```

### 3. Check Plus features
```bash
curl http://localhost:3000/api/plus/features
```

## Migration Notes

1. **Sessions**: Sessions dari WAHA Core akan tetap tersimpan jika menggunakan volume yang sama
2. **QR Code**: Mungkin perlu scan ulang QR code setelah upgrade
3. **API Compatibility**: WAHA Plus backward compatible dengan Core API

## Troubleshooting

### License Key Error
```
Error: Invalid license key
```
- Pastikan license key valid
- Check tanggal expiry license
- Pastikan format environment variable benar

### Sessions Not Loading
- Check volume mounting
- Verify data persistence
- May need to recreate sessions

### Webhook Not Working
- Check `host.docker.internal` (untuk Windows/Mac)
- Untuk Linux, gunakan IP host atau `172.17.0.1`
- Verify backend running on port 3003

## Features Unlocked with Plus

- ✅ Send images, videos, documents
- ✅ Send voice messages
- ✅ Send locations
- ✅ Send contacts (vCard)
- ✅ Advanced message reactions
- ✅ Message editing
- ✅ Status/Stories management
- ✅ Advanced group management
- ✅ Polls support
- ✅ And more...

## Next Steps

1. Update Docker container dengan command di atas
2. Restart backend jika diperlukan
3. Test image sending dengan `test-image-upload.html`
4. Verify Plus features working