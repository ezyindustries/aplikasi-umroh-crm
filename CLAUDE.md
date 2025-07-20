# Aplikasi Manajemen Umroh – Requirements & AI Prompt

## 1. Executive Summary
Aplikasi ini bertujuan menjadi pusat kendali data jamaah umroh dalam skala besar (target: 50.000/tahun), agar tim internal dapat menginput, melacak, dan mengelola informasi jamaah secara efisien, akurat, dan terdokumentasi. Saat ini, proses manual dan file terpisah menyebabkan pencarian sulit, duplikasi data, dan risiko kesalahan tinggi. Solusi ini dibangun untuk memberdayakan semua peran tim (admin, marketing, visa, keberangkatan, keuangan, dsb) dalam satu platform kolaboratif.

## 2. Business Objectives & Success Metrics
- Objective 1: Mempercepat input data jamaah
  - Success Metric: Entry < 3 menit, >95% sukses import via Excel
- Objective 2: Mengurangi human error
  - Success Metric: Duplikasi < 0.5%, validasi otomatis semua field utama
- Objective 3: Menyediakan laporan dan visualisasi
  - Success Metric: 5 laporan utama, waktu respon < 5 detik
- Objective 4: Input massal via Excel
  - Success Metric: >80% input pakai template, error minor
- Objective 5: Dapat menangani 50.000 jamaah per tahun
  - Success Metric: Sistem tetap stabil, dievaluasi langsung oleh owner

## 3. Business Process Flows  
Kategori Aplikasi: Manajemen Jamaah Umroh  
Aktor & Flow:

### Aktor:
- Admin
- Marketing
- Keuangan
- Operator Keberangkatan
- Tim Visa
- Tim Ticketing
- Tim Hotel

### Alur Utama: *Pendaftaran dan Manajemen Jamaah*

#### Input:
- Data dari form atau Excel: identitas, paspor, paket, dokumen
- Diupload oleh berbagai role: Admin, Marketing, dsb

#### Proses:
- Validasi: NIK 16 digit, paspor unik, format file benar
- Simpan ke database pusat terstruktur
- Logging semua aktivitas (by role, time, IP)

#### Output:
- Data bisa dilihat semua tim (akses terbuka tapi terekam)
- Laporan keuangan, keberangkatan, progres visa

#### Exception:
- Data bisa diubah tapi tidak dihapus (soft-delete)
- Perubahan selalu terekam (audit log)
- Error pada import Excel: tampilkan baris & alasan

---

### Alur Khusus:
#### Keuangan:
- Input bukti pembayaran → sinkron ke status jamaah
- Hanya tim keuangan yang bisa edit nominal

#### Tim Visa:
- Lihat data paspor, update status proses visa
- Upload file visa yang sudah jadi

#### Operator Keberangkatan:
- Buat daftar rombongan, penempatan bus, waktu kumpul
- Print rooming list dan manifest keberangkatan

#### Hotel & Ticketing:
- Lihat nama-nama jamaah per paket
- Bantu alokasi kamar dan kursi

---

## Integrasi Eksternal
- Belum ada (saat ini hanya untuk penggunaan internal)
- Rencana ke depan: integrasi API e-visa atau modul agen (terpisah)

## 4. Phased Roadmap & Milestones

### Phase 1 (MVP)
- Input data jamaah (form & Excel)
- View/edit data
- Log aktivitas per user
- Role-based access (akses penuh, log aktif)
- Export data (PDF, Excel)
- Backup otomatis
- Dashboard ringkas

### Phase 2
- Upload dokumen jamaah
- Relasi keluarga/mahram
- Catatan medis & status lansia
- Laporan: jamaah/paket/pembayaran/keberangkatan

### Phase 3
- Dashboard visualisasi
- Monitor aktivitas user
- Analitik jamaah (usia, domisili, dsb)
- API ekspor data
- Modul manajemen paket
- Offline access (opsional)

## 5. Technical Architecture Overview (Usulan Best Practice)

### Stack/Platform:
- Frontend: React
- Backend: Node.js (Express)
- DB: PostgreSQL
- Storage: MinIO / S3-compatible
- Deployment: dockerized, cloud-ready

### Security & Modularity:
- Semua data di-log (aktivitas, edit, akses)
- Soft-delete dengan histori
- Validasi ketat NIK/paspor
- Tidak ada multi-login enforcement (berbasis kepercayaan)

### Maintainability:
- Struktur modular per modul (jamaah, dokumen, relasi, pembayaran)
- Endpoint RESTful
- Automated testing untuk form, import, validasi
- Backup harian & monitoring error

## 6. Agentic AI Instruction (Prompt)

- Dokumen ini adalah single source of truth bagi semua agent AI atau developer.
- Setiap tugas dimulai dengan plan mode (3 langkah), tunggu validasi user.
- Interview harus mencakup:
  - Masalah bisnis
  - Tujuan & metrik
  - Flow proses bisnis
  - Roadmap & arsitektur
  - Agent harus mampu memahami alur kerja nyata, bukan hanya form permukaan.
- Semua modul wajib mencerminkan proses bisnis: siapa melakukan apa, data apa masuk, hasilnya apa, dan penanganan gagal.
- Terapkan agentic meta pattern: Orchestrator, Specialist, Evaluator.
- Terapkan best practice:
  - Validasi input
  - Audit log
  - Backup otomatis
  - Modular & secure
- Gunakan fallback ke standar industri jika ada ketidakjelasan: OWASP, Google Engineering Guide, Laravel Docs, dsb.

## 7. Task Output Format
- Ringkasan hasil (fitur, endpoint, validasi)
- Perubahan file/folder
- Prompt/plan yang digunakan
- Self-evaluation kualitas hasil