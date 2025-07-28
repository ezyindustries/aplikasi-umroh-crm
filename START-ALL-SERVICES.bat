@echo off
echo ========================================
echo Starting All Services for Umroh CRM App
echo ========================================
echo.

REM Start Backend Server
echo [1/3] Starting Backend Server (Port 5000)...
start "Backend Server" cmd /k "cd backend && npm start"
timeout /t 3 >nul

REM Start WAHA WhatsApp API
echo [2/3] Starting WAHA WhatsApp API (Port 3001)...
docker start waha-umroh 2>nul || (
    echo Creating new WAHA container...
    docker run -d ^
        --name waha-umroh ^
        -p 3001:3000 ^
        -e WHATSAPP_HOOK_URL=http://host.docker.internal:5000/api/crm/webhook ^
        -e WHATSAPP_HOOK_EVENTS=* ^
        -e WHATSAPP_API_KEY=your-api-key ^
        -e WHATSAPP_SESSIONS_ENABLED=true ^
        -v waha-data:/app/data ^
        devlikeapro/waha
)
timeout /t 5 >nul

REM Open CRM Dashboard
echo [3/3] Opening CRM Dashboard...
start "" "http://localhost:8080/crm-no-login.html"

echo.
echo ========================================
echo All services started successfully!
echo ========================================
echo.
echo Backend API: http://localhost:5000
echo WAHA API: http://localhost:3001
echo CRM Dashboard: http://localhost:8080/crm-no-login.html
echo.
echo Press any key to view service status...
pause >nul

REM Check services status
echo.
echo Checking services status...
echo.
curl -s http://localhost:5000/health || echo Backend server not responding
echo.
curl -s http://localhost:3001/api/version || echo WAHA API not responding
echo.
echo Done!
pause