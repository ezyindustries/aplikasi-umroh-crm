@echo off
echo === FIX WHATSAPP CONNECTION ===
echo.

echo Step 1: Restart Backend (untuk apply CORS fix)
echo Stopping backend...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo Starting backend...
cd /d "D:\ezyin\Documents\aplikasi umroh\backend\whatsapp"
start "WhatsApp Backend" cmd /k "npm start"
timeout /t 5 /nobreak >nul

echo.
echo Step 2: Check WAHA Plus Status
echo.
set /p API_KEY="Enter your WAHA API key (default: your-api-key): "
if "%API_KEY%"=="" set API_KEY=your-api-key

echo.
echo Checking WAHA sessions...
curl -s -H "X-Api-Key: %API_KEY%" http://localhost:3000/api/sessions
echo.
echo.

echo Step 3: Connect WhatsApp
echo.
echo Option A - Via WAHA Dashboard (RECOMMENDED):
echo 1. Open: http://localhost:3000
echo 2. Login with API key: %API_KEY%
echo 3. Go to Sessions
echo 4. Click Start/+ 
echo 5. Name: default
echo 6. Scan QR Code with WhatsApp
echo.
echo Option B - Via API:
echo Starting session...
curl -s -X POST -H "X-Api-Key: %API_KEY%" -H "Content-Type: application/json" -d "{\"name\":\"default\"}" http://localhost:3000/api/sessions/start
echo.
echo.
echo Get QR Code URL:
echo http://localhost:3000/api/sessions/default/qr?format=image
echo.
echo Or check screenshot:
echo http://localhost:3000/api/screenshot?session=default
echo.
pause