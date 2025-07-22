# Tutorial Sistem Keuangan - Vauza Tamma Management System

## Daftar Isi
1. [Konsep Dasar](#konsep-dasar)
2. [Chart of Accounts (COA)](#chart-of-accounts-coa)
3. [Alur Otomatis](#alur-otomatis)
4. [Pengelolaan Keuangan](#pengelolaan-keuangan)
5. [Laporan Keuangan](#laporan-keuangan)
6. [Tips & Best Practices](#tips--best-practices)

---

## Konsep Dasar

### Sistem Double-Entry Bookkeeping
Aplikasi ini menggunakan sistem pembukuan double-entry, di mana setiap transaksi dicatat minimal di dua akun:
- **Debit**: Penambahan aset/beban, pengurangan kewajiban/modal/pendapatan
- **Kredit**: Pengurangan aset/beban, penambahan kewajiban/modal/pendapatan

**Aturan Penting**: Total Debit HARUS sama dengan Total Kredit

### Kategori Akun

1. **Aset (1-xxxxx)**: Harta perusahaan
   - Kas, Bank, Piutang, Perlengkapan, Kendaraan
   - Saldo Normal: Debit

2. **Kewajiban (2-xxxxx)**: Hutang perusahaan
   - Hutang Vendor, Hutang Hotel, Pendapatan Diterima Dimuka
   - Saldo Normal: Kredit

3. **Modal (3-xxxxx)**: Modal pemilik
   - Modal Pemilik, Laba Ditahan
   - Saldo Normal: Kredit

4. **Pendapatan (4-xxxxx)**: Income perusahaan
   - Pendapatan Umroh, Pendapatan Administrasi
   - Saldo Normal: Kredit

5. **Beban (5-xxxxx)**: Pengeluaran operasional
   - Beban Hotel, Beban Tiket, Beban Gaji
   - Saldo Normal: Debit

---

## Chart of Accounts (COA)

### Cara Setup COA

1. **Load Default COA**
   - Klik tombol "Load Default COA" untuk memuat akun standar
   - Sistem akan memuat ~30 akun yang umum digunakan untuk bisnis umroh

2. **Tambah Akun Baru**
   - Klik tombol "Tambah Akun"
   - Isi kode akun (format: X-XXXXX)
   - Pilih kategori yang sesuai
   - Saldo normal akan otomatis terisi

3. **Format Kode Akun**
   ```
   1-10001 = Kas
   1-10002 = Bank BCA
   1-20001 = Piutang Jamaah
   2-10001 = Hutang Vendor
   3-10001 = Modal Pemilik
   4-10001 = Pendapatan Umroh
   5-10001 = Beban Hotel
   ```

---

## Alur Otomatis

### 1. Pendaftaran Jamaah Baru
Ketika jamaah mendaftar, sistem otomatis membuat jurnal:
```
Debit:  Piutang Jamaah         Rp 15.000.000
Kredit: Pendapatan Umroh       Rp 15.000.000
```

### 2. Verifikasi Pembayaran
Ketika pembayaran diverifikasi:
```
Debit:  Kas/Bank               Rp 5.000.000
Kredit: Piutang Jamaah         Rp 5.000.000
```

### 3. Pencatatan Pengeluaran
Contoh pengeluaran hotel:
```
Debit:  Beban Hotel            Rp 20.000.000
Kredit: Kas/Bank               Rp 20.000.000
```

---

## Pengelolaan Keuangan

### Input Jurnal Umum
1. Klik tombol "Jurnal Umum"
2. Minimal 2 baris (1 debit, 1 kredit)
3. Total debit HARUS = total kredit
4. Sistem akan validasi otomatis

### Input Pengeluaran
1. Klik tombol "Pengeluaran"
2. Pilih kategori (Hotel, Tiket, Visa, dll)
3. Isi vendor dan jumlah
4. Sistem otomatis buat jurnal

### Contoh Jurnal Kompleks
Transfer antar bank:
```
Debit:  Bank Mandiri           Rp 50.000.000
Kredit: Bank BCA               Rp 50.000.000
```

Bayar hutang vendor:
```
Debit:  Hutang Vendor          Rp 10.000.000
Kredit: Bank BCA               Rp 10.000.000
```

---

## Laporan Keuangan

### 1. Neraca (Balance Sheet)
Menampilkan posisi keuangan:
- **Aset = Kewajiban + Modal**
- Snapshot pada tanggal tertentu
- Cek kesehatan finansial

### 2. Laporan Laba Rugi (Income Statement)
Menampilkan performa bisnis:
- **Laba/Rugi = Pendapatan - Beban**
- Periode tertentu (bulanan/tahunan)
- Evaluasi profitabilitas

### 3. Laporan Arus Kas (Cash Flow)
Menampilkan aliran kas:
- Aktivitas Operasi
- Aktivitas Investasi
- Aktivitas Pendanaan

### 4. Jurnal Umum
- Semua transaksi kronologis
- Audit trail lengkap
- Export ke Excel

### 5. Jurnal Khusus
- Jurnal Penerimaan Kas
- Jurnal Pengeluaran Kas
- Memudahkan analisis

### 6. Buku Besar
- Mutasi per akun
- Saldo berjalan
- Detail transaksi

---

## Tips & Best Practices

### DO's ✅
1. **Backup rutin**: Export data minimal seminggu sekali
2. **Rekonsiliasi bank**: Cocokkan saldo sistem dengan bank
3. **Review jurnal**: Periksa jurnal sebelum closing
4. **Dokumentasi**: Simpan bukti transaksi
5. **Training staff**: Pastikan tim paham sistem

### DON'TS ❌
1. **Jangan hapus jurnal**: Gunakan jurnal koreksi
2. **Jangan abaikan balance**: Debit = Kredit WAJIB
3. **Jangan skip verifikasi**: Semua pembayaran harus diverifikasi
4. **Jangan lupa closing**: Tutup buku tiap akhir periode

### Troubleshooting

**Jurnal tidak balance?**
- Cek ulang nominal debit/kredit
- Pastikan tidak ada typo
- Gunakan kalkulator untuk validasi

**Laporan tidak sesuai?**
- Cek tanggal jurnal
- Pastikan semua transaksi sudah diinput
- Verifikasi saldo awal akun

**Piutang tidak berkurang?**
- Pastikan pembayaran sudah diverifikasi
- Cek apakah pembayaran terhubung ke jamaah yang benar

---

## Contoh Kasus

### Kasus 1: Jamaah Daftar dan Bayar DP
1. Ahmad daftar paket Rp 15.000.000
   - Otomatis: Debit Piutang, Kredit Pendapatan
2. Ahmad bayar DP Rp 5.000.000
   - Input pembayaran di menu Pembayaran
   - Verifikasi pembayaran
   - Otomatis: Debit Kas, Kredit Piutang

### Kasus 2: Bayar Hotel untuk Grup
1. Bayar hotel Makkah Rp 50.000.000
   - Menu Keuangan > Pengeluaran
   - Kategori: Hotel
   - Otomatis: Debit Beban Hotel, Kredit Bank

### Kasus 3: Refund Jamaah
1. Buat jurnal manual:
   ```
   Debit:  Pendapatan Umroh       Rp 15.000.000
   Kredit: Kas                    Rp 15.000.000
   ```

---

## FAQ

**Q: Bagaimana cara melihat total keuntungan?**
A: Buka Laporan Laba Rugi, lihat baris "Laba Bersih"

**Q: Bisakah edit jurnal yang sudah posting?**
A: Tidak. Buat jurnal koreksi untuk perbaikan

**Q: Bagaimana cara tracking hutang ke vendor?**
A: Lihat akun "Hutang Vendor" di Neraca atau Buku Besar

**Q: Export laporan ke Excel?**
A: Setiap laporan ada tombol "Export Excel"

**Q: Cara setup multi-currency?**
A: Belum tersedia di versi ini

---

## Kontak Support

Untuk bantuan lebih lanjut:
- Email: support@vauzatamma.com
- WhatsApp: +62 XXX-XXXX-XXXX
- Manual lengkap: docs.vauzatamma.com

---

*Dokumen ini terakhir diupdate: ${new Date().toLocaleDateString('id-ID')}*