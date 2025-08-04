@echo off
echo ==========================================
echo Creating Basic Templates for Auto-Reply
echo ==========================================
echo.

echo Creating Greeting Template...
curl -X POST http://localhost:3003/api/templates ^
  -H "Content-Type: application/json" ^
  -d "{\"templateName\":\"Basic Greeting\",\"category\":\"greeting\",\"templateContent\":\"Assalamualaikum {{nama}}! Selamat datang di Vauza Tamma Travel. Ada yang bisa kami bantu hari ini?\",\"keywords\":\"halo,hello,hi,assalamualaikum,selamat pagi,selamat siang,selamat sore,selamat malam\",\"intent\":\"greeting\",\"priority\":10,\"isActive\":true}"
echo.
echo.

echo Creating Package Info Template...
curl -X POST http://localhost:3003/api/templates ^
  -H "Content-Type: application/json" ^
  -d "{\"templateName\":\"Package Info\",\"category\":\"package\",\"templateContent\":\"Terima kasih atas minat Anda pada paket umroh kami. Kami memiliki berbagai pilihan paket umroh dengan fasilitas terbaik. Berikut beberapa paket unggulan kami:\n\n1. Paket Regular 9 Hari - Mulai dari 25 juta\n2. Paket Plus 12 Hari - Mulai dari 35 juta\n3. Paket VIP 14 Hari - Mulai dari 45 juta\n\nSilakan tanyakan detail paket yang Anda minati.\",\"keywords\":\"paket,umroh,harga,berapa,info paket,paket umroh\",\"intent\":\"inquiry\",\"priority\":9,\"isActive\":true}"
echo.
echo.

echo Creating FAQ Template...
curl -X POST http://localhost:3003/api/templates ^
  -H "Content-Type: application/json" ^
  -d "{\"templateName\":\"Document Requirements\",\"category\":\"faq\",\"templateContent\":\"Untuk mendaftar umroh, dokumen yang diperlukan:\n\n1. Paspor dengan masa berlaku minimal 7 bulan\n2. KTP\n3. Kartu Keluarga\n4. Akta Nikah (untuk suami istri)\n5. Pas foto 4x6 dan 3x4 (background putih)\n6. Surat Mahram (untuk wanita < 45 tahun)\n\nKami akan membantu proses pembuatan visa dan dokumen lainnya.\",\"keywords\":\"dokumen,syarat,persyaratan,apa saja,kelengkapan\",\"intent\":\"document_inquiry\",\"priority\":8,\"isActive\":true}"
echo.
echo.

echo Creating General Info Template...
curl -X POST http://localhost:3003/api/templates ^
  -H "Content-Type: application/json" ^
  -d "{\"templateName\":\"General Info\",\"category\":\"faq\",\"templateContent\":\"Terima kasih telah menghubungi Vauza Tamma Travel. Kami adalah travel umroh terpercaya dengan pengalaman lebih dari 10 tahun. Silakan tanyakan apa saja yang ingin Anda ketahui tentang:\n\n- Paket Umroh\n- Jadwal Keberangkatan\n- Harga dan Pembayaran\n- Fasilitas Hotel\n- Persyaratan Dokumen\n\nTim kami siap membantu Anda!\",\"keywords\":\"info,tanya,gimana,bagaimana,apa,travel\",\"intent\":\"general_inquiry\",\"priority\":7,\"isActive\":true}"
echo.
echo.

echo Checking created templates...
echo -----------------------------
curl -s "http://localhost:3003/api/templates"
echo.
echo.

echo ==========================================
echo Templates created! Now the template rule
echo should work properly. Try sending a message
echo with keywords like: halo, info paket, dokumen
echo ==========================================
echo.
pause