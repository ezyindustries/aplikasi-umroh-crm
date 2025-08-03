@echo off
echo === SHOWING WAHA QR CODE ===
echo.
echo Please wait while we get the QR code...
echo.

REM Save QR as image
curl -s http://localhost:3000/api/default/auth/qr?format=image -H "X-Api-Key: your-api-key" -o waha-qr-new.png

echo.
echo QR Code saved as: waha-qr-new.png
echo.
echo Opening QR code image...
start waha-qr-new.png

echo.
echo === INSTRUCTIONS ===
echo 1. A QR code image should open
echo 2. Open WhatsApp on your phone
echo 3. Go to Settings - Linked Devices
echo 4. Tap "Link a Device"
echo 5. Scan the QR code
echo.
echo If QR doesn't open, check these URLs in browser:
echo - http://localhost:3000 (use API key: your-api-key)
echo - Open file: waha-qr-new.png
echo.
pause