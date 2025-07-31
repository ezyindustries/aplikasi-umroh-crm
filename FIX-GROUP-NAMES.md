# Fix WhatsApp Group Names

## Masalah
Nama grup WhatsApp menampilkan ID grup (nomor panjang seperti `120363400489422761`) bukan nama grup yang sebenarnya.

## Penyebab
Untuk menghindari error puppeteer saat memanggil API `getGroupInfo`, kita menonaktifkan pemanggilan API tersebut dan menggunakan nama default.

## Solusi yang Diterapkan

### 1. Update SimpleMessageQueue.js
File: `backend/whatsapp/src/services/SimpleMessageQueue.js`

Sekarang mengekstrak nama grup dari data webhook:
```javascript
const groupName = whatsappMessage.chatName || 
                 whatsappMessage._data?.notifyName || 
                 whatsappMessage.chat?.name ||
                 whatsappMessage.chat?.subject ||
                 `Group ${groupIdClean}`;
```

### 2. Update Otomatis
Nama grup akan di-update otomatis saat:
- Menerima pesan baru dari grup
- Bot join ke grup baru
- Ada update info grup

### 3. Script Manual Update
Jalankan script untuk melihat grup mana yang perlu update:
```bash
cd backend/whatsapp
node update-existing-group-names.js
```

## Cara Kerja

1. **Saat Pesan Masuk**: SimpleMessageQueue akan mengekstrak nama grup dari payload webhook
2. **Database Update**: Jika nama grup masih default, akan di-update dengan nama yang benar
3. **Frontend Display**: Frontend akan menampilkan nama grup yang tersimpan di database

## Langkah untuk Fix Grup yang Sudah Ada

### Option 1: Tunggu Pesan Baru
- Nama grup akan ter-update otomatis saat ada pesan baru masuk dari grup tersebut
- Tidak perlu tindakan manual

### Option 2: Manual Update Database
Jika Anda tahu nama grupnya, bisa update manual di database:
```sql
UPDATE contacts 
SET name = 'Nama Grup Yang Benar', 
    group_name = 'Nama Grup Yang Benar'
WHERE group_id = '120363400489422761@g.us';
```

### Option 3: Trigger Update
Kirim pesan ke grup untuk trigger update nama:
1. Buka WhatsApp di HP
2. Kirim pesan ke grup
3. Nama grup akan ter-update di CRM

## Monitoring

Untuk melihat log update nama grup:
```bash
# Windows
type backend\whatsapp\logs\whatsapp-crm-*.log | findstr "group name"

# atau lihat real-time log saat backend berjalan
```

## Hasil Expected

- ❌ Before: "120363400489422761" atau "Group 120363400489422761"
- ✅ After: "Marketing Team", "Customer Support", dll (nama asli grup)

## Notes

1. Update nama grup tidak memerlukan restart backend
2. Perubahan akan langsung terlihat di frontend setelah refresh
3. Nama grup disimpan di field `name` dan `groupName` di tabel contacts