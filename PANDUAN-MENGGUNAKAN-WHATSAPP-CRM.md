# PANDUAN MENGGUNAKAN WHATSAPP CRM

## ✅ WhatsApp Sudah Terhubung! Sekarang Apa?

### 📱 CARA MELIHAT PERCAKAPAN WHATSAPP:

1. **Buka CRM Dashboard**
   - http://localhost:8080/crm-no-login.html
   - Status WhatsApp harus "Connected" (hijau)

2. **Navigate ke Menu "Conversations"**
   - Klik menu "Conversations" di sidebar kiri
   - Semua percakapan WhatsApp akan muncul di sini

3. **Fitur yang Tersedia:**
   - **Real-time Messages**: Pesan masuk otomatis muncul
   - **Send Messages**: Kirim pesan langsung dari CRM
   - **Lead Capture**: Nomor baru otomatis jadi lead
   - **AI Bot**: Auto-reply dengan AI (jika Ollama running)
   - **Labels**: Kategorisasi percakapan
   - **Search**: Cari percakapan atau pesan

### 🎯 FITUR-FITUR WHATSAPP CRM:

#### 1. **Conversations Management**
- Lihat semua chat dalam satu dashboard
- Filter by: Unread, Today, This Week
- Search by nama atau nomor
- Label conversations (Hot Lead, Follow Up, etc)

#### 2. **Auto Lead Capture**
Setiap nomor baru yang chat otomatis:
- Tersimpan sebagai Lead
- Bisa di-convert jadi Jamaah
- Track conversation history

#### 3. **AI Bot Integration**
- Auto-reply untuk pertanyaan umum
- Escalate ke human jika perlu
- Custom response templates

#### 4. **Broadcast Messages**
- Kirim pesan ke multiple contacts
- Template messages
- Schedule broadcasts
- Track delivery status

#### 5. **Media Support**
- Terima dan kirim gambar
- Document sharing (PDF, etc)
- Auto-save media files

### 📊 CARA MENGGUNAKAN:

#### Melihat Percakapan:
1. Menu **Conversations** → Lihat semua chat
2. Klik pada conversation untuk buka detail
3. Pesan baru muncul real-time

#### Mengirim Pesan:
1. Pilih conversation atau nomor
2. Ketik pesan di text box
3. Klik Send atau tekan Enter
4. Status: ✓ (sent) ✓✓ (delivered) ✓✓ (read)

#### Manage Leads:
1. Menu **Leads** → Lihat semua prospek
2. Filter by status: New, Contacted, Qualified
3. Convert to Jamaah jika deal

#### Broadcast Campaign:
1. Menu **Campaigns** → Create New
2. Select target audience
3. Compose message
4. Schedule atau send immediately

### 🤖 AI BOT COMMANDS:

Bot akan auto-reply untuk keywords:
- "info paket" → Kirim info paket umroh
- "harga" → Kirim daftar harga
- "jadwal" → Kirim jadwal keberangkatan
- "syarat" → Kirim syarat pendaftaran

### 📈 MONITORING & REPORTS:

1. **Dashboard Stats**:
   - Total conversations
   - Messages today
   - Active leads
   - Response rate

2. **Lead Analytics**:
   - Conversion rate
   - Source tracking
   - Follow-up reminders

3. **Message Analytics**:
   - Peak hours
   - Response time
   - Bot vs Human replies

### ⚠️ IMPORTANT NOTES:

1. **Privacy**: Semua percakapan tersimpan di database lokal
2. **Backup**: Data di-backup otomatis setiap hari
3. **Compliance**: Follow WhatsApp Business Policy
4. **Rate Limits**: Max 1000 messages/day

### 🔧 TROUBLESHOOTING:

**Pesan tidak masuk?**
- Check WhatsApp connection status
- Check webhook URL di WAHA
- Restart backend server

**Tidak bisa kirim pesan?**
- Check rate limit status
- Verify nomor tujuan valid
- Check internet connection

**AI Bot tidak reply?**
- Check Ollama service running
- Verify bot configuration
- Check bot templates

### 📞 TEST YOUR SETUP:

1. Kirim pesan ke nomor WhatsApp yang terhubung
2. Pesan harus muncul di CRM dalam 1-2 detik
3. Try keywords untuk test bot
4. Send reply dari CRM

---

## QUICK ACCESS LINKS:

- **CRM Dashboard**: http://localhost:8080/crm-no-login.html
- **WAHA Dashboard**: http://localhost:3001/dashboard
- **Backend API**: http://localhost:5000/api/crm
- **View Logs**: `docker logs -f waha-umroh`

---

**Note**: Data percakapan WhatsApp Anda aman dan hanya tersimpan di server lokal Anda, tidak dikirim kemana-mana.