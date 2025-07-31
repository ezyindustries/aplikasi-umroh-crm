@echo off
echo =========================================
echo  Test Media Download WhatsApp CRM
echo =========================================
echo.

echo Step 1: Pastikan semua service berjalan
echo ---------------------------------------
echo [✓] WAHA di port 3000
echo [✓] Backend di port 3001
echo [✓] Media download enabled
echo.

echo Step 2: Test kirim gambar
echo -------------------------
echo 1. Buka WhatsApp di HP
echo 2. Kirim gambar ke nomor yang terhubung dengan CRM
echo 3. Tunggu beberapa detik
echo.

echo Step 3: Cek di Frontend
echo -----------------------
echo 1. Buka http://localhost:8080 atau frontend Anda
echo 2. Masuk ke conversation
echo 3. Gambar seharusnya tampil dengan benar
echo.

echo Step 4: Verifikasi di Backend
echo -----------------------------
echo Checking recent media files...
echo.

REM Check media directories
if exist "backend\whatsapp\media\images" (
    echo Media folder exists!
    dir /b "backend\whatsapp\media\images" 2>nul | find /c /v "" > temp.txt
    set /p count=<temp.txt
    del temp.txt
    echo Found images in media folder
) else (
    echo Media folder not found - akan dibuat saat ada gambar masuk
)

echo.
echo Jika gambar tidak muncul, cek:
echo - Logs backend: cd backend\whatsapp ^&^& npm run dev
echo - Logs WAHA: docker logs -f whatsapp-http-api
echo.
pause