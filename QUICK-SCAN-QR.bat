@echo off
echo === QUICK SCAN QR FOR WAHA ===
echo.
echo Using API Key: your-api-key
echo.

echo 1. Starting session...
curl -X POST http://localhost:3000/api/sessions/start ^
  -H "X-Api-Key: your-api-key" ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"default\"}"
echo.
echo.

echo 2. Get QR Code URL:
echo.
echo Option A - Direct QR Image:
echo http://localhost:3000/api/sessions/default/qr?format=image
echo.
echo Option B - Screenshot:
echo http://localhost:3000/api/screenshot?session=default
echo.
echo Option C - QR in Terminal:
curl -s http://localhost:3000/api/sessions/default/qr ^
  -H "X-Api-Key: your-api-key" | findstr "qr"
echo.
echo.
echo 3. Scan QR Code with WhatsApp:
echo - Open WhatsApp on phone
echo - Settings - Linked Devices - Link a Device
echo - Scan the QR code
echo.
pause