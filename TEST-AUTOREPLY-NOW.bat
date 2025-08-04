@echo off
echo ==========================================
echo TEST AUTO-REPLY SETELAH FIX ERROR
echo ==========================================
echo.

echo PENTING: Restart backend dulu!
echo ------------------------------
echo 1. Tekan Ctrl+C di console backend
echo 2. Jalankan: cd backend\whatsapp
echo 3. Jalankan: npm start
echo.
echo Tekan Enter setelah backend restart...
pause > nul
echo.

echo Step 1: Check System Status
echo --------------------------
echo Master Switch:
curl -s http://localhost:3003/api/automation/master-switch/status
echo.
echo.
echo Active Rules:
curl -s "http://localhost:3003/api/automation/rules?isActive=true" | findstr /C:"name" /C:"123123"
echo.
echo.

echo Step 2: Test Auto-Reply
echo ----------------------
echo Kirim pesan "123123" dari WhatsApp Anda
echo ke nomor yang terhubung dengan sistem.
echo.
echo Lihat console backend untuk log:
echo - "AUTOMATION ENGINE: PROCESSING MESSAGE"
echo - "Found X active automation rules"
echo - "Evaluating rule"
echo.
echo Tekan Enter setelah mengirim pesan...
pause > nul
echo.

echo Step 3: Check Recent Logs
echo ------------------------
curl -s "http://localhost:3003/api/automation/logs?limit=5" | findstr /C:"success" /C:"failed"
echo.
echo.

echo ==========================================
echo HASIL:
echo.
echo Jika ada log "success" = Auto-reply berfungsi!
echo Jika tidak ada = Cek console backend
echo ==========================================
echo.
pause