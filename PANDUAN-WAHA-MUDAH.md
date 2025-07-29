# 📱 Panduan Mudah Setup WAHA untuk WhatsApp CRM

## 🎯 Apa itu WAHA?
WAHA adalah sistem yang membuat WhatsApp bisa diakses melalui aplikasi web kita. Dengan WAHA, aplikasi CRM bisa mengirim dan menerima pesan WhatsApp otomatis.

## 📋 Yang Perlu Disiapkan
1. **Docker Desktop** - Program untuk menjalankan WAHA
2. **WhatsApp** di HP Anda - Untuk scan QR Code

## 🚀 Langkah-Langkah Setup

### Langkah 1: Install Docker Desktop
1. Buka browser (Chrome/Firefox/Edge)
2. Kunjungi: https://www.docker.com/products/docker-desktop/
3. Klik tombol **"Download for Windows"**
4. Setelah download selesai, double-click file installer
5. Ikuti petunjuk instalasi (klik Next, Next, Install)
6. **PENTING**: Restart komputer setelah instalasi selesai

### Langkah 2: Jalankan Docker Desktop
1. Setelah restart, cari **"Docker Desktop"** di Start Menu
2. Klik untuk menjalankan
3. Tunggu sampai muncul icon Docker di system tray (pojok kanan bawah)
4. Icon Docker akan berubah hijau jika sudah siap

### Langkah 3: Jalankan WAHA
1. Double-click file **`START-WAHA-EASY.bat`**
2. Script akan otomatis:
   - Cek apakah Docker sudah jalan
   - Download WAHA (pertama kali agak lama)
   - Jalankan WAHA
   - Update konfigurasi aplikasi
3. Tunggu sampai muncul pesan **"WAHA Setup Complete!"**
4. **JANGAN TUTUP** window command prompt ini

### Langkah 4: Jalankan WhatsApp CRM
1. Tutup backend WhatsApp CRM jika sedang jalan (Ctrl+C)
2. Double-click **`START-WHATSAPP-CRM.bat`**
3. Tunggu sampai backend dan frontend berjalan
4. Browser akan otomatis terbuka

### Langkah 5: Connect WhatsApp
1. Di browser, klik tombol **"Connect WhatsApp"**
2. QR Code akan muncul
3. Buka WhatsApp di HP Anda
4. Tap titik 3 (menu) → **Linked Devices** → **Link a Device**
5. Scan QR Code yang muncul di browser
6. Tunggu sampai status berubah menjadi **"Connected"**

### Langkah 6: Load Chat History (Opsional)
1. Setelah connected, klik **"Load Chat History"**
2. Tunggu proses loading selesai
3. Chat-chat lama akan muncul di aplikasi

## 🔧 Troubleshooting

### ❌ Error: Docker Desktop tidak terinstall
- Install Docker Desktop dulu (lihat Langkah 1)

### ❌ Error: Docker Desktop tidak berjalan
- Jalankan Docker Desktop manual dari Start Menu
- Tunggu icon Docker hijau di system tray

### ❌ WAHA tidak bisa dijalankan
- Cek status dengan double-click **`CHECK-DOCKER-STATUS.bat`**
- Pastikan tidak ada error

### ❌ QR Code tidak muncul
- Refresh browser (F5)
- Pastikan backend berjalan (ada 2 window command prompt)
- Cek apakah WAHA berjalan dengan `CHECK-DOCKER-STATUS.bat`

### ❌ WhatsApp tidak bisa connect
- Pastikan HP terkoneksi internet
- Coba disconnect dulu di HP (Settings → Linked Devices → Logout)
- Ulangi scan QR Code

## 📌 Tips Penting

1. **Jangan Tutup Window**
   - Window Docker Desktop
   - Window START-WAHA-EASY.bat
   - Window backend WhatsApp CRM
   - Window frontend server

2. **Urutan Start yang Benar**
   1. Docker Desktop
   2. START-WAHA-EASY.bat
   3. START-WHATSAPP-CRM.bat

3. **Untuk Stop Aplikasi**
   - Tutup semua window command prompt
   - Docker Desktop bisa tetap jalan

4. **Restart Aplikasi**
   - Jalankan lagi dari Langkah 3

## 🆘 Bantuan

Jika masih ada masalah:
1. Screenshot error yang muncul
2. Jalankan `CHECK-DOCKER-STATUS.bat` dan screenshot hasilnya
3. Minta bantuan tim IT dengan memberikan screenshot tersebut

---
**Note**: WAHA gratis untuk 1 session WhatsApp. Jika butuh multiple WhatsApp, perlu upgrade ke WAHA Plus.