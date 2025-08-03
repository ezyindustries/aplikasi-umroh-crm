# WAHA Plus Setup Guide - Sudah Punya License

## Yang Anda Butuhkan dari Email WAHA

Setelah beli WAHA Plus, Anda harusnya terima email dengan:

### 1. License Key
```
Format: WAHA-XXXX-XXXX-XXXX
atau: waha_plus_xxxxxxxxxxxxxx
```

### 2. Docker Hub Credentials
```
Username: waha-customer-12345 (atau format serupa)
Password: xxxxxxxxxxxxxxxxxx
```

### 3. Documentation Links
- Setup guide
- API documentation

## Cara Install WAHA Plus

### Step 1: Cari Email dari WAHA
- Check inbox untuk email dari WAHA/DevLike
- Subject biasanya: "WAHA Plus License" atau "Your WAHA Plus Access"
- Check juga folder Spam/Junk

### Step 2: Run Install Script
```bash
INSTALL-WAHA-PLUS-LICENSE.bat
```

Saat diminta:
1. **Docker Login**: 
   - Username: Dari email WAHA (BUKAN personal Docker Hub)
   - Password: Dari email WAHA

2. **License Key**: Copy paste dari email

### Step 3: Verify Installation
```bash
CHECK-WAHA-LICENSE.bat
```

## Troubleshooting

### "pull access denied"
Ini artinya Docker login gagal. Pastikan:
- Menggunakan credentials dari email WAHA
- BUKAN personal Docker Hub credentials
- Copy paste username/password dengan benar

### "Invalid license key"
- Check format license key
- Copy paste dari email tanpa spasi
- Pastikan tidak expired

### Tidak dapat email?
1. Check folder Spam/Junk
2. Login ke dashboard pembelian
3. Contact WAHA support: support@devlike.pro

## Manual Setup (Jika Script Error)

### 1. Docker Login
```bash
docker login
# Username: [dari email WAHA]
# Password: [dari email WAHA]
```

### 2. Pull Image
```bash
docker pull devlikeapro/waha-plus:latest
```

### 3. Run Container
```bash
docker run -d \
  --name waha \
  --restart always \
  -p 3000:3000 \
  -e WAHA_LICENSE_KEY=[YOUR_LICENSE_KEY] \
  -e WHATSAPP_HOOK_URL=http://host.docker.internal:3003/api/webhook \
  -e WHATSAPP_HOOK_EVENTS=* \
  -e WHATSAPP_API_KEY=your-api-key \
  -v waha-data:/app/data \
  devlikeapro/waha-plus:latest
```

## After Installation

### 1. Access Dashboard
```
http://localhost:3000
API Key: your-api-key (yang Anda set)
```

### 2. Start WhatsApp Session
- Go to Sessions
- Click "Start"  
- Scan QR Code

### 3. Test Image Sending
```
http://localhost:8080/test-image-upload.html
```

## Need Help?

### WAHA Support
- Email: support@devlike.pro
- Docs: https://waha.devlike.pro/docs

### Common Issues
1. **Can't find email**: Check spam, or login to purchase dashboard
2. **Docker login fails**: Make sure using WAHA credentials, not personal
3. **License invalid**: Check expiry date, correct format
4. **Container won't start**: Check `docker logs waha` for details