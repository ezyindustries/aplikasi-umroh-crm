# Cara Install WAHA (WhatsApp HTTP API)

WAHA tidak bisa diinstall via NPM. Ada 2 cara:

## Option 1: Install Docker Desktop (Recommended)

### Step 1: Download Docker Desktop
1. Kunjungi: https://www.docker.com/products/docker-desktop/
2. Klik "Download for Windows"
3. Download file (sekitar 500MB)

### Step 2: Install Docker
1. Double click file installer
2. Ikuti wizard (Next, Next, Install)
3. **PENTING**: Akan restart komputer

### Step 3: Setup Docker
1. Setelah restart, Docker Desktop akan start otomatis
2. Jika diminta, pilih "Use WSL 2 instead of Hyper-V" (recommended)
3. Tunggu sampai Docker icon di system tray berwarna hijau

### Step 4: Jalankan WAHA
1. Buka Command Prompt
2. Ketik:
```bash
docker run -it --rm -p 3000:3000/tcp devlikeapro/waha
```
3. Pertama kali akan download (±200MB)
4. Tunggu sampai muncul "WAHA is running"

---

## Option 2: Pakai WAHA Cloud (Tanpa Install)

Jika tidak mau install Docker, bisa pakai WAHA versi cloud:

1. Daftar di: https://app.devlike.pro/
2. Create new session
3. Dapatkan API endpoint
4. Update backend config ke cloud endpoint

**TAPI**: Versi cloud berbayar untuk production use.

---

## Option 3: Alternative - Baileys (Open Source)

Karena kesulitan dengan WAHA, bisa pertimbangkan alternatif:

### Install Baileys (Free & Open Source):
```bash
npm install @whiskeysockets/baileys
```

Baileys adalah library WhatsApp Web yang gratis dan banyak dipakai.

---

## Rekomendasi Saya:

Untuk development & testing, saya sarankan:

1. **Install Docker Desktop** - One time setup, worth it
2. **ATAU gunakan Baileys** - Lebih mudah, gratis, npm-based

Mau saya buatkan integrasi dengan Baileys sebagai alternatif WAHA?