# WhatsApp CRM Application

Aplikasi CRM sederhana untuk mengelola komunikasi dengan customer melalui WhatsApp menggunakan WAHA (WhatsApp HTTP API).

## 🚀 Features

### Core Features
- **CRM Dashboard** - Interface utama untuk mengelola percakapan WhatsApp
- **WhatsApp Integration** - Menggunakan WAHA Plus untuk koneksi WhatsApp yang stabil
- **Auto-Reply System** - Sistem balasan otomatis dengan template dan media support
- **AI Integration** - Integrasi dengan Ollama untuk respons AI cerdas
- **Media Support** - Kirim gambar, dokumen, dan media lainnya
- **Template Management** - Kelola template pesan dengan mudah

### Technical Features
- Real-time message synchronization
- SQLite database untuk penyimpanan data
- Glass Morphism UI design yang modern
- Automation engine dengan rule-based system
- Webhook integration untuk incoming messages
- Label management untuk kategorisasi chat

## 📋 Prerequisites

- Node.js v14 atau lebih tinggi
- Docker Desktop (untuk menjalankan WAHA)
- WhatsApp account untuk scanning QR code

## 🛠️ Installation

1. Clone repository:
```bash
git clone https://github.com/[username]/aplikasi-umroh.git
cd aplikasi-umroh
```

2. Install dependencies:
```bash
cd backend/whatsapp
npm install
```

3. Setup environment:
```bash
# Copy .env.example ke .env dan sesuaikan konfigurasi
cp .env.example .env
```

4. Start WAHA container:
```bash
docker run -d \
  --name waha-plus \
  -p 3000:3000 \
  -v waha-data:/app/data \
  -e WHATSAPP_API_KEY=your-api-key \
  devlikeapro/waha-plus
```

5. Start backend server:
```bash
npm run dev-sqlite
```

6. Start frontend server:
```bash
cd frontend
npm start
```

## 🔧 Configuration

### Environment Variables
```env
# WhatsApp Configuration
WAHA_API_URL=http://localhost:3000
WAHA_API_KEY=your-api-key
WAHA_SESSION_NAME=default

# Database
DB_TYPE=sqlite
DB_PATH=./data/whatsapp-crm.db

# Server
PORT=3003
FRONTEND_PORT=8080
```

### Webhook Configuration
Backend akan otomatis mengkonfigurasi webhook ke WAHA saat startup. Pastikan URL webhook dapat diakses dari container Docker.

## 📱 Usage

1. **Scan QR Code**
   - Buka http://localhost:3000/api/default/auth/qr?format=image
   - Scan dengan WhatsApp

2. **Access CRM**
   - Dashboard: http://localhost:8080/crm-main.html
   - Conversations: http://localhost:8080/conversations-beautiful.html
   - AI Automation: http://localhost:8080/ai-automation.html

3. **Setup Auto-Reply**
   - Buka Autoreply Management
   - Aktifkan Master Switch
   - Buat rules dan templates
   - Test dengan mengirim pesan

## 🏗️ Architecture

```
aplikasi-umroh/
├── backend/
│   └── whatsapp/          # Node.js backend
│       ├── src/
│       │   ├── models/    # Database models
│       │   ├── routes/    # API routes
│       │   ├── services/  # Business logic
│       │   └── controllers/
│       └── data/          # SQLite database
├── frontend/              # HTML/CSS/JS frontend
│   ├── crm-main.html     # Dashboard utama
│   ├── conversations-beautiful.html
│   └── ai-automation.html
└── media/                 # Package images
```

## 🔄 Auto-Reply System

### Creating Rules
1. Keyword-based rules untuk mendeteksi intent
2. Smart rules dengan AI integration
3. Exact match rules untuk perintah spesifik

### Template System
- Support text dan media (gambar, dokumen)
- Dynamic variables untuk personalisasi
- Quick replies dan buttons (coming soon)

## 🐛 Troubleshooting

### Auto-reply tidak bekerja
1. Cek Master Switch di Autoreply Management
2. Pastikan webhook terkonfigurasi: `node check-webhook-connection.js`
3. Cek logs: `docker logs waha-plus`

### Timeout errors
- Sudah diperbaiki dengan timeout 60 detik dan retry logic
- Jika masih bermasalah, cek koneksi internet

### Database errors
- Run migrations: `node add-media-files-column.js`
- Check schema: `node check-schema.js`

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

MIT License

## 👥 Team

- Development Team - Vauza Tamma
- WhatsApp Integration - WAHA by devlike.pro

## 📞 Support

Untuk bantuan dan pertanyaan:
- Create issue di GitHub
- WhatsApp support: [Nomor Support]

---

**Note**: Aplikasi ini menggunakan WAHA Plus untuk integrasi WhatsApp. Pastikan mematuhi WhatsApp Terms of Service.