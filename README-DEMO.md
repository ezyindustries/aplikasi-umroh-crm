# 🕌 Aplikasi Manajemen Umroh - Demo

Aplikasi lengkap untuk mengelola data jamaah umroh dengan fitur real-time notifications dan WebSocket.

## 🚀 Cara Menjalankan Demo

### Metode 1: Script Otomatis (Recommended)
```bash
# Klik dua kali file start-demo.bat atau jalankan di command prompt
start-demo.bat
```

### Metode 2: Manual

#### 1. Backend Setup
```bash
cd backend
npm install
node scripts/init-database.js
npm start
```

#### 2. Frontend Setup (terminal baru)
```bash
cd frontend
npm install
npm start
```

## 🔑 Login Credentials
- **Username:** `admin`
- **Password:** `admin123`
- **URL:** http://localhost:3000

## 📱 Fitur Yang Dapat Dicoba

### ✅ Manajemen Jamaah
- Tambah, edit, lihat data jamaah
- Upload dokumen (KTP, Paspor, dll)
- Status tracking (Terdaftar → Konfirmasi → Berangkat)

### ✅ Sistem Pembayaran
- Input pembayaran DP/Lunas
- Upload bukti pembayaran
- Verifikasi pembayaran oleh admin

### ✅ Paket Umroh
- Kelola paket umroh dengan kapasitas
- Monitor tingkat okupansi
- Atur tanggal keberangkatan

### ✅ Real-time Notifications
- Notifikasi otomatis untuk aktivitas baru
- WebSocket connection dengan indikator status
- Activity feed real-time di dashboard

### ✅ Laporan & Analytics
- Dashboard dengan grafik interaktif
- Laporan jamaah per paket
- Statistik pembayaran dan dokumen

### ✅ Import/Export Excel
- Import data jamaah dari Excel
- Export laporan ke Excel dengan filter
- Template Excel untuk import

## 🧪 Skenario Testing

### 1. Test Real-time Notifications
1. Buka aplikasi di 2 browser/tab berbeda
2. Login sebagai admin di kedua tab
3. Di tab 1: Tambah jamaah baru
4. Di tab 2: Lihat notifikasi muncul real-time

### 2. Test Import Excel
1. Download template Excel dari menu Import
2. Isi data jamaah di template
3. Upload dan lihat proses validasi
4. Import data dan lihat notifikasi

### 3. Test Payment Workflow
1. Tambah jamaah baru
2. Input pembayaran DP
3. Upload bukti pembayaran
4. Verifikasi pembayaran
5. Lihat notifikasi di setiap step

### 4. Test WebSocket Connection
1. Matikan internet/WiFi sebentar
2. Lihat indikator "Offline" di notification center
3. Nyalakan kembali internet
4. Lihat auto-reconnect dan sinkronisasi

## 🗂️ Struktur Database (SQLite)

```
📁 Database Tables:
├── users           # Data user/admin
├── packages        # Paket umroh
├── jamaah          # Data jamaah
├── payments        # Data pembayaran
├── documents       # Upload dokumen
└── notifications   # Sistem notifikasi
```

## 🔧 Konfigurasi

### Environment Variables
Backend `.env`:
```
NODE_ENV=development
PORT=5000
USE_SQLITE=true
SQLITE_PATH=./database.db
JWT_SECRET=supersecretjwtkey123456789abcdefghijklmnop
```

Frontend `.env`:
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_WS_URL=http://localhost:5000
```

## 🌐 Endpoints API

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout

### Jamaah Management
- `GET /api/jamaah` - List jamaah
- `POST /api/jamaah` - Create jamaah
- `PUT /api/jamaah/:id` - Update jamaah
- `DELETE /api/jamaah/:id` - Delete jamaah

### Real-time Features
- `GET /api/notifications` - Get notifications
- `WebSocket /` - Real-time connection

## 📊 Data Sampel

Aplikasi sudah terisi dengan data sampel:
- 2 paket umroh (Regular & VIP)
- 2 jamaah sampel
- 1 admin user

## ⚠️ Troubleshooting

### Port Sudah Digunakan
```bash
# Cek proses yang menggunakan port
netstat -ano | findstr :3000
netstat -ano | findstr :5000

# Kill proses jika perlu
taskkill /PID <PID_NUMBER> /F
```

### Database Error
```bash
# Reset database
rm backend/database.db
cd backend
node scripts/init-database.js
```

### WebSocket Connection Issues
- Pastikan port 5000 tidak diblokir firewall
- Coba restart kedua server
- Cek console browser untuk error WebSocket

## 🎯 Next Steps

Setelah demo, aplikasi dapat:
1. Dipindah ke PostgreSQL untuk production
2. Deploy ke cloud (AWS, DigitalOcean, etc.)
3. Tambah fitur advanced (SMS, Email, Payment Gateway)
4. Implementasi mobile app dengan React Native

---

**Happy Testing! 🚀**

Jika ada pertanyaan atau error, silakan cek log di console browser dan terminal.