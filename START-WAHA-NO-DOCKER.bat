@echo off
echo ===========================================
echo   WhatsApp CRM Backend - WAHA Mode
echo   Using whatsapp-web.js (No Docker)
echo ===========================================
echo.

cd backend\whatsapp

echo Installing dependencies...
call npm install

echo.
echo Starting WhatsApp CRM Backend...
echo.
echo Note: QR code will appear in terminal and browser
echo Please scan with WhatsApp mobile app
echo.

node server.js

pause