@echo off
echo ========================================
echo WhatsApp CRM Startup
echo ========================================
echo.

echo [1] Starting WAHA Docker...
start cmd /k "docker run -it --rm -p 3000:3000/tcp --name waha devlikeapro/waha"

echo.
echo [2] Waiting for WAHA to start (10 seconds)...
timeout /t 10 /nobreak > nul

echo.
echo [3] Starting WhatsApp Backend...
start cmd /k "cd backend\whatsapp && npm start"

echo.
echo [4] Waiting for backend to start (5 seconds)...
timeout /t 5 /nobreak > nul

echo.
echo [5] Opening CRM Dashboard...
start http://localhost:8080/crm-main.html

echo.
echo ========================================
echo All services started!
echo ========================================
echo.
echo WAHA API: http://localhost:3000
echo WhatsApp Backend: http://localhost:3001
echo CRM Dashboard: http://localhost:8080/crm-main.html
echo Conversations: http://localhost:8080/conversations-beautiful.html
echo.
pause