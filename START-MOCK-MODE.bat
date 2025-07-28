@echo off
echo ========================================
echo Starting WhatsApp CRM in MOCK MODE
echo ========================================
echo.
echo This mode simulates WhatsApp connection
echo for testing without real WhatsApp/WAHA
echo.

REM Set mock mode environment
set MOCK_MODE=true
set WAHA_BASE_URL=http://localhost:3001/mock

REM Start backend with mock mode
cd backend\whatsapp
echo Starting backend in MOCK mode...
start cmd /k "title WhatsApp CRM Backend (MOCK) && npm start"

REM Wait for backend
timeout /t 5 /nobreak >nul

REM Start frontend
cd ..\..\frontend
echo Starting frontend...
start cmd /k "title WhatsApp CRM Frontend && python -m http.server 8080"

echo.
echo ========================================
echo Application started in MOCK MODE!
echo.
echo Open: http://localhost:8080/conversations-beautiful.html
echo.
echo Mock features:
echo - Simulated WhatsApp connection
echo - Test contacts pre-loaded
echo - Send/receive dummy messages
echo - All compliance rules active
echo ========================================
echo.
pause