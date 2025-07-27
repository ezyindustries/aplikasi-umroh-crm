# 🌐 Panduan Setup Aplikasi Umroh sebagai Server Network

## 📋 Langkah-Langkah Setup

### 1. Jalankan Server
```bash
JALANKAN-SERVER-NETWORK.bat
```

### 2. Setup Windows Firewall
Buka Windows Defender Firewall:
1. Tekan `Windows + R`, ketik `wf.msc`
2. Klik "Inbound Rules" → "New Rule"
3. Pilih "Port" → Next
4. Pilih "TCP", masukkan port: `5000`
5. Pilih "Allow the connection"
6. Centang semua network profiles (Domain, Private, Public)
7. Beri nama: "Umrah App Server"
8. Finish

### 3. Alternatif: Quick Firewall Command
Buka Command Prompt sebagai Administrator:
```cmd
netsh advfirewall firewall add rule name="Umrah App Server" dir=in action=allow protocol=TCP localport=5000
```

### 4. Cek IP Address Anda
```cmd
ipconfig
```
Cari "IPv4 Address" di bagian adapter network yang aktif.

## 🔗 Cara Akses dari Komputer Lain

### Dari komputer lain dalam jaringan yang sama:
1. Buka browser
2. Masukkan: `http://[IP-SERVER]:5000`
   Contoh: `http://192.168.1.100:5000`

### Login:
- Username: `admin`
- Password: `Admin123!`

## 🛡️ Keamanan

### Untuk Penggunaan Internal:
- Pastikan hanya diakses dalam jaringan lokal/kantor
- Gunakan VPN jika perlu akses dari luar

### Untuk Production:
1. Gunakan HTTPS dengan SSL certificate
2. Setup reverse proxy (nginx/IIS)
3. Implementasi rate limiting
4. Regular security updates

## 🔧 Troubleshooting

### Server tidak bisa diakses:
1. Cek apakah server berjalan
2. Cek Windows Firewall
3. Cek antivirus (mungkin memblokir)
4. Pastikan menggunakan IP yang benar
5. Test ping ke IP server

### Port 5000 sudah digunakan:
Edit PORT di file `.env` ke port lain (misal 3000, 8080)

### Database Error:
Jalankan `JALANKAN-APLIKASI.bat` dulu untuk setup database

## 📱 Akses dari Mobile
Smartphone dalam WiFi yang sama bisa akses dengan cara yang sama:
`http://[IP-SERVER]:5000`

## 🚀 Performance Tips
1. Gunakan SSD untuk database
2. Minimal RAM 8GB untuk 50+ concurrent users
3. Monitor CPU usage
4. Setup database backup routine

## 📞 Support
Jika ada masalah, cek:
- Log files di `backend/logs/`
- Console output di terminal
- Network connectivity dengan `ping`