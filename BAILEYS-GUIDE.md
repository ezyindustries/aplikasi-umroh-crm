# Baileys WhatsApp Integration Guide

## ✅ Apa itu Baileys?

Baileys adalah library WhatsApp Web yang:
- **Gratis & Open Source** - Tidak ada biaya
- **NPM Based** - Install mudah via npm
- **Popular** - Digunakan ribuan developer
- **Well Maintained** - Update rutin
- **No Docker Required** - Langsung jalan

## 🚀 Cara Menjalankan

### 1. Start Aplikasi
```bash
# Double click file ini:
START-BAILEYS.bat
```

### 2. Connect WhatsApp
1. Buka browser: http://localhost:8080/conversations-beautiful.html
2. Klik tombol "Connect WhatsApp" (kanan atas)
3. **LIHAT BACKEND WINDOW** - QR code muncul di terminal
4. Scan QR dengan HP:
   - Buka WhatsApp
   - Settings → Linked Devices
   - Link a Device → Scan QR
5. Tunggu status "Connected"

## 📱 Penting!

### QR Code Location
QR code muncul di **terminal/command prompt** backend, BUKAN di browser!
Pastikan lihat window yang judulnya "WhatsApp CRM Backend (Baileys)"

### Keep Phone Online
- HP harus tetap online
- Jangan logout dari HP
- Jangan matikan data/wifi HP

## 🛡️ Compliance Tetap Berlaku!

Meskipun pakai Baileys (bukan WAHA), semua aturan anti-ban tetap aktif:
- Max 50 kontak/hari
- Delay 5-8 detik antar pesan
- Jam aktif 08:00-21:00 WIB
- No spam words
- Human behavior simulation

## 🔧 Troubleshooting

### QR Code Tidak Muncul
1. Cek backend window (cmd prompt)
2. QR muncul di terminal, bukan browser
3. Pastikan tidak ada error merah

### "Cannot find module"
```bash
cd backend/whatsapp
npm install
```

### Session Expired
- Normal setelah 14 hari
- Scan QR lagi untuk reconnect

### Messages Not Sending
1. Cek compliance panel (kanan)
2. Pastikan dalam jam aktif
3. Tunggu 5+ detik antar pesan

## 📂 Session Storage

Baileys menyimpan session di:
```
backend/whatsapp/sessions/default/
```

Folder ini berisi auth info, jangan dihapus kecuali mau logout.

## 🆚 Baileys vs WAHA

| Feature | Baileys | WAHA |
|---------|---------|------|
| Price | Free | Free/Paid |
| Install | NPM | Docker |
| Complexity | Simple | Complex |
| Community | Large | Small |
| Updates | Frequent | Regular |
| Risk | Same | Same |

## 📝 Tips

1. **First Time**
   - QR scan bisa 30-60 detik
   - Tunggu sampai "Connected"
   - Contacts load otomatis

2. **Daily Use**
   - Start dengan START-BAILEYS.bat
   - Monitor compliance panel
   - Logout saat selesai

3. **Best Practice**
   - Jangan kirim >50 kontak/hari
   - Personal messages only
   - Respect time delays
   - Monitor warnings

## 🔗 Resources

- Baileys GitHub: https://github.com/WhiskeySockets/Baileys
- Documentation: https://whiskeysockets.github.io/
- Examples: https://github.com/WhiskeySockets/Baileys/tree/master/Example

---

**Remember**: WhatsApp dapat ban kapan saja jika detect bot behavior. Always follow compliance rules! 🛡️