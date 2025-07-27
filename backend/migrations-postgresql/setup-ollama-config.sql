-- Setup Ollama Configuration for WhatsApp Bot
-- Run this after the CRM tables are created

-- Enable Ollama as LLM provider
INSERT INTO bot_configs (id, parameter, value, description, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'use_ollama', 'true', 'Use Ollama instead of OpenAI', NOW(), NOW()),
  (gen_random_uuid(), 'ollama_url', 'http://host.docker.internal:11434', 'Ollama API URL (use host.docker.internal from container)', NOW(), NOW()),
  (gen_random_uuid(), 'ollama_model', 'mistral:7b-instruct', 'Ollama model to use', NOW(), NOW())
ON CONFLICT (parameter) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Configure LLM parameters
INSERT INTO bot_configs (id, parameter, value, description, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'llm_temperature', '0.7', 'Response creativity (0-1)', NOW(), NOW()),
  (gen_random_uuid(), 'llm_max_tokens', '300', 'Maximum response length', NOW(), NOW()),
  (gen_random_uuid(), 'response_delay', '2000', 'Delay before bot responds (ms)', NOW(), NOW()),
  (gen_random_uuid(), 'confidence_threshold', '0.6', 'Min confidence for bot response', NOW(), NOW()),
  (gen_random_uuid(), 'office_hours', '08:00-17:00', 'Bot office hours', NOW(), NOW()),
  (gen_random_uuid(), 'max_bot_attempts', '3', 'Max attempts before human takeover', NOW(), NOW())
ON CONFLICT (parameter) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Add greeting template
INSERT INTO bot_templates (id, name, keywords, response_template, is_active, usage_count, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Greeting Template',
  ARRAY['assalamualaikum', 'asalamualaikum', 'assalamu', 'halo', 'hai', 'hello', 'pagi', 'siang', 'sore', 'malam', 'selamat'],
  'Waalaikumsalam warahmatullahi wabarakatuh 🙏

Selamat datang di *Vauza Tamma Travel* 
_Terpercaya Melayani Ibadah Umroh Sejak 2010_ 🕌

Saya adalah asisten virtual yang siap membantu Anda 24/7.

*Silakan pilih informasi yang dibutuhkan:*
1️⃣ Info Paket Umroh
2️⃣ Jadwal Keberangkatan 
3️⃣ Persyaratan Dokumen
4️⃣ Cara Pendaftaran
5️⃣ Simulasi Cicilan
6️⃣ Konsultasi dengan Tim

Ketik angka atau langsung tanyakan apa yang Anda butuhkan 😊

_Kantor: Jl. Contoh No.123 Jakarta_
_Telp: 021-12345678_',
  true,
  0,
  NOW(),
  NOW()
);

-- Add package info template
INSERT INTO bot_templates (id, name, keywords, response_template, is_active, usage_count, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Package Info',
  ARRAY['paket', 'program', 'pilihan', 'jenis', 'umroh', 'umrah', '1'],
  '📋 *PAKET UMROH VAUZA TAMMA 2025*

✈️ *PAKET HEMAT 9 HARI*
💰 Rp 22,5 Juta
🏨 Hotel Bintang 3 (± 500m)
✈️ Saudia Airlines
🍽️ Fullboard 3x sehari
👥 Quad (4 orang/kamar)

✈️ *PAKET REGULER 12 HARI*
💰 Rp 25 Juta  
🏨 Hotel Bintang 4 (± 300m)
✈️ Garuda Indonesia Direct
🍽️ Fullboard + Snack
👥 Triple (3 orang/kamar)
🎁 Free: Koper, Tas, Seragam

✈️ *PAKET PLUS TURKI 15 HARI*
💰 Rp 35 Juta
🏨 Hotel Bintang 5 
✈️ Turkish Airlines
🗺️ Bonus Tour Istanbul 3 Hari
🍽️ All Meals Included
👥 Double (2 orang/kamar)

✈️ *PAKET VIP 9 HARI*
💰 Rp 45 Juta
🏨 Hotel View Masjid
✈️ Business Class
🚐 Private Transport
👥 Double/Single Available
⭐ Executive Handling

*DP minimal Rp 10 Juta*
_Bisa dicicil 3-12 bulan_

Ketik nama paket untuk detail lengkap 📱',
  true,
  0,
  NOW(),
  NOW()
);

-- Add schedule template
INSERT INTO bot_templates (id, name, keywords, response_template, is_active, usage_count, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Schedule Info', 
  ARRAY['jadwal', 'keberangkatan', 'berangkat', 'kapan', 'bulan', '2'],
  '📅 *JADWAL KEBERANGKATAN 2025*

*JANUARI 2025*
• 15 Jan - Reguler ✈️
• 22 Jan - VIP ✈️

*FEBRUARI 2025*  
• 5 Feb - Plus Turki ✈️
• 12 Feb - Reguler ✈️
• 19 Feb - Hemat ✈️

*MARET 2025 (Awal Ramadhan)*
• 3 Mar - VIP Ramadhan ✈️
• 10 Mar - Reguler Ramadhan ✈️
• 17 Mar - Plus Turki ✈️

*APRIL 2025 (Full Ramadhan)*
• 1 Apr - Spesial Lailatul Qadar ✈️
• 7 Apr - VIP Ramadhan ✈️
• 14 Apr - Reguler Ramadhan ✈️

*MEI-JUNI 2025*
• Jadwal menyusul

*Seat Terbatas!* 
Hubungi kami untuk booking:
📱 0812-3456-7890 (Admin)',
  true,
  0,
  NOW(),
  NOW()
);

-- Add requirements template
INSERT INTO bot_templates (id, name, keywords, response_template, is_active, usage_count, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Requirements Info',
  ARRAY['syarat', 'dokumen', 'persyaratan', 'berkas', 'butuh', '3'],
  '📄 *PERSYARATAN DOKUMEN UMROH*

*DOKUMEN WAJIB:*
1️⃣ *Paspor*
   • Masa berlaku min. 7 bulan
   • Halaman kosong min. 4 lembar
   • Nama min. 3 suku kata

2️⃣ *KTP & KK*
   • Fotocopy 3 lembar
   • Asli dibawa saat penyerahan

3️⃣ *Pas Foto*
   • Ukuran 4x6 = 6 lembar
   • Ukuran 3x4 = 6 lembar  
   • Background putih
   • 80% wajah, wajib kelihatan telinga

4️⃣ *Buku Nikah* (jika sudah menikah)
   • Fotocopy 3 lembar

5️⃣ *Akta Lahir* (untuk anak)
   • Fotocopy 3 lembar

*DOKUMEN TAMBAHAN:*
• Surat Mahram (wanita < 45 tahun)
• Kartu Kuning Vaksin Meningitis
• Surat Keterangan Sehat

*KETENTUAN KHUSUS:*
👶 Bayi min. 2 tahun
👵 Lansia 65+ wajib didampingi
💉 Vaksin Meningitis & Covid-19

_Kami bantu proses dokumen!_',
  true,
  0,
  NOW(),
  NOW()
);

-- Add registration process template
INSERT INTO bot_templates (id, name, keywords, response_template, is_active, usage_count, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Registration Process',
  ARRAY['daftar', 'pendaftaran', 'cara', 'bagaimana', 'prosedur', '4'],
  '📝 *CARA PENDAFTARAN UMROH*

*LANGKAH PENDAFTARAN:*

1️⃣ *Pilih Paket*
   Tentukan paket & jadwal keberangkatan

2️⃣ *Isi Formulir*  
   • Online: bit.ly/DaftarUmrohVT
   • Offline: Datang ke kantor

3️⃣ *Bayar DP*
   • Minimal Rp 10 Juta
   • Transfer ke:
   Bank Mandiri 
   No. 123-456-789-0
   a.n. PT Vauza Tamma Travel

4️⃣ *Serahkan Dokumen*
   Bawa dokumen lengkap ke kantor

5️⃣ *Pelunasan*
   • H-45 sebelum keberangkatan
   • Bisa dicicil bulanan

*FASILITAS PENDAFTARAN:*
✅ Free konsultasi
✅ Bantu proses dokumen  
✅ Manasik 3x pertemuan
✅ Perlengkapan umroh
✅ Asuransi perjalanan

*Kantor Buka:*
Senin-Sabtu: 09.00-17.00
Minggu: 10.00-15.00

Atau daftar online sekarang? 📱',
  true,
  0,
  NOW(),
  NOW()
);

-- Add pricing/installment template
INSERT INTO bot_templates (id, name, keywords, response_template, is_active, usage_count, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Pricing Installment',
  ARRAY['harga', 'biaya', 'cicil', 'cicilan', 'bayar', 'dp', '5'],
  '💰 *SIMULASI CICILAN UMROH*

*PAKET REGULER Rp 25 JUTA*

*DP Rp 10 Juta, sisa cicil:*
• 3 bulan: Rp 5 juta/bln
• 6 bulan: Rp 2,5 juta/bln  
• 9 bulan: Rp 1,67 juta/bln
• 12 bulan: Rp 1,25 juta/bln

*DP Rp 15 Juta, sisa cicil:*
• 3 bulan: Rp 3,33 juta/bln
• 6 bulan: Rp 1,67 juta/bln

*METODE PEMBAYARAN:*
✅ Transfer Bank
✅ Kartu Kredit (+ 3%)
✅ Tokopedia/Shopee 
✅ Kantor Pos
✅ Arisan Umroh

*BONUS CASH:*
🎁 Diskon Rp 500rb (lunas cash)
🎁 Free upgrade hotel
🎁 Cashback next trip

*PENTING:*
⚠️ Harga bisa berubah
⚠️ Pelunasan H-45
⚠️ Include: visa, tiket, hotel, makan, transport, handling

Mau simulasi paket lain? 🧮',
  true,
  0,
  NOW(),
  NOW()
);

-- Add consultation request template
INSERT INTO bot_templates (id, name, keywords, response_template, is_active, usage_count, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Human Consultation',
  ARRAY['konsultasi', 'tanya', 'cs', 'admin', 'bantuan', 'tolong', '6'],
  '👥 *KONSULTASI DENGAN TIM KAMI*

Terima kasih atas minat Anda! 
Tim kami siap membantu lebih detail.

*SILAKAN HUBUNGI:*

📱 *Customer Service 1*
WA: 0812-3456-7890
Melayani: Info & Pendaftaran

📱 *Customer Service 2*  
WA: 0813-4567-8901
Melayani: Jadwal & Pembayaran

☎️ *Telp Kantor*
021-1234-5678 (Hunting)

*JAM OPERASIONAL:*
Senin-Jumat: 08.00-17.00
Sabtu: 09.00-15.00
Minggu: 10.00-14.00

*ATAU KUNJUNGI:*
📍 PT Vauza Tamma Travel
Jl. Contoh No. 123
Jakarta Selatan 12345

_Kami akan hubungi Anda segera!_
_Mohon save nomor ini ya_ 🙏',
  true,
  0,
  NOW(),
  NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bot_configs_parameter ON bot_configs(parameter);
CREATE INDEX IF NOT EXISTS idx_bot_templates_keywords ON bot_templates USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_bot_templates_active ON bot_templates(is_active);

-- Verify configuration
SELECT parameter, value, description FROM bot_configs WHERE parameter LIKE '%ollama%' OR parameter LIKE '%llm%' ORDER BY parameter;