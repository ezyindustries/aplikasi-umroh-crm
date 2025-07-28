@echo off
cd backend
start "Backend Server - JANGAN TUTUP WINDOW INI" npm start
echo.
echo ========================================
echo Backend server starting...
echo.
echo JANGAN TUTUP WINDOW YANG BARU MUNCUL!
echo ========================================
echo.
echo Tunggu 10 detik...
timeout /t 10 /nobreak
echo.
echo Testing backend...
curl http://localhost:5000/health
echo.
echo ========================================
echo Jika muncul {"status":"OK"} = Backend berjalan!
echo.
echo Sekarang buka browser dan refresh CRM dashboard
echo ========================================
pause