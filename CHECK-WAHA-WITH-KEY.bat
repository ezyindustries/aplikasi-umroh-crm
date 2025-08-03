@echo off
echo === CHECK WAHA PLUS WITH API KEY ===
echo.

set /p API_KEY="Enter the API key you used when starting WAHA Plus: "
echo.

echo 1. Check Version (No Auth):
curl -s http://localhost:3000/
echo.
echo.

echo 2. Check Sessions with API Key:
curl -s -H "X-Api-Key: %API_KEY%" http://localhost:3000/api/sessions
echo.
echo.

echo 3. Start Default Session:
echo Starting WhatsApp session...
curl -s -X POST -H "X-Api-Key: %API_KEY%" -H "Content-Type: application/json" -d "{\"name\":\"default\"}" http://localhost:3000/api/sessions/start
echo.
echo.

echo 4. Get QR Code:
echo.
echo If session started, scan this QR code with WhatsApp:
echo http://localhost:3000/api/screenshot?session=default
echo.
echo Or open WAHA Dashboard:
echo http://localhost:3000
echo.

echo 5. Check if Plus features available:
curl -s -H "X-Api-Key: %API_KEY%" http://localhost:3000/api/sendImage 2>nul
if %errorlevel% equ 0 (
    echo.
    echo [INFO] sendImage endpoint exists - Plus features available!
) else (
    echo.
    echo [INFO] Checking Plus features...
)

echo.
echo === IMPORTANT ===
echo 1. Use the SAME API key you set when starting container
echo 2. If sessions empty, need to start session and scan QR
echo 3. Dashboard URL: http://localhost:3000
echo.
pause