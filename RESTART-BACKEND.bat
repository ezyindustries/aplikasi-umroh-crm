@echo off
title Restart WhatsApp CRM Backend
echo ========================================
echo     Restarting WhatsApp CRM Backend
echo ========================================
echo.

echo [1/3] Stopping backend process...
taskkill /F /FI "WINDOWTITLE eq WhatsApp CRM Backend*" 2>nul
timeout /t 2 /nobreak >nul

echo.
echo [2/3] Starting backend on port 3002...
cd backend\whatsapp
start "WhatsApp CRM Backend" cmd /k "npm start"

echo.
echo [3/3] Waiting for backend to be ready...
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo Backend restarted!
echo.
echo Now refresh your browser (F5) and try connecting WhatsApp again.
echo ========================================
echo.
pause