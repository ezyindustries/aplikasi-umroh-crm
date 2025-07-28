# Panduan Koneksi WhatsApp

## Status Saat Ini
WAHA container sudah berjalan di port 3001. Saya sudah memperbaiki tombol Connect WhatsApp agar berfungsi dengan baik.

## Cara Menghubungkan WhatsApp:

### 1. Pastikan WAHA Berjalan
```bash
docker ps
```
Harus ada container `vauza-tamma-waha` yang running di port 3001.

### 2. Buka CRM Dashboard
```
http://localhost:5000/frontend/crm-no-login.html
```

### 3. Klik Tab "WhatsApp"
Di sidebar sebelah kiri, klik menu "WhatsApp"

### 4. Klik Tombol "Connect WhatsApp"
- Tombol hijau dengan icon QR code
- Akan muncul popup dengan QR code

### 5. Scan QR Code
- Buka WhatsApp di HP Anda
- Pergi ke Settings → Linked Devices → Link a Device
- Scan QR code yang muncul di layar

### 6. Tunggu Konfirmasi
- Setelah scan berhasil, popup akan otomatis tertutup
- Status akan berubah menjadi "WhatsApp Connected" (hijau)

## Troubleshooting

### Jika QR Code Tidak Muncul:
1. Cek apakah WAHA berjalan:
   ```bash
   curl http://localhost:3001/api/sessions/default -H "X-Api-Key: your-secret-api-key"
   ```

2. Restart WAHA jika perlu:
   ```bash
   docker restart vauza-tamma-waha
   ```

### Jika Tombol Tidak Berfungsi:
1. Buka Developer Tools (F12)
2. Cek Console untuk error
3. Pastikan file `js/whatsapp-connection.js` ter-load

### Test Connection:
Buka file test yang saya buat:
```
http://localhost:5000/test-whatsapp-connection.html
```

Ini akan menampilkan:
- Status koneksi real-time
- Tombol untuk test berbagai fungsi
- Log detail untuk debugging

## Fitur yang Sudah Diperbaiki:

1. **Auto Connect Check**: Otomatis cek status koneksi setiap 3 detik saat QR muncul
2. **Auto Close Modal**: Popup QR otomatis tertutup saat berhasil connect
3. **Status Update**: Status indicator update real-time
4. **Error Handling**: Pesan error yang jelas jika ada masalah
5. **Webhook Integration**: Otomatis setup webhook ke backend

## Setelah Terhubung:

1. **Conversations**: Akan muncul daftar percakapan WhatsApp
2. **Send Message**: Bisa kirim pesan ke kontak
3. **Auto Reply Bot**: Bot akan otomatis reply jika diaktifkan
4. **Real-time Updates**: Pesan masuk akan muncul real-time

## API Configuration:

Jika perlu ubah konfigurasi, buka tab "Settings" dan atur:
- Backend API URL: `http://localhost:5000/api`
- WAHA URL: `http://localhost:3001`
- WAHA API Key: `your-secret-api-key`

Klik "Save Settings" lalu "Test Connection" untuk memastikan semua berfungsi.