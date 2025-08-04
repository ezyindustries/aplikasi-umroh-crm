@echo off
echo ==========================================
echo CHECKING ALL SERVICE PORTS
echo ==========================================
echo.

echo Checking Backend (Port 3003)...
echo -------------------------------
curl -s http://localhost:3003/api/health
echo.
echo.

echo Checking WAHA (Port 3000)...
echo ----------------------------
curl -s http://localhost:3000/api/sessions
echo.
echo.

echo Checking Frontend (Port 8080)...
echo --------------------------------
curl -s -o nul -w "Frontend Status: %%{http_code}\n" http://localhost:8080/
echo.

echo ==========================================
echo Service Ports:
echo - Backend API: 3003
echo - WAHA WhatsApp: 3000  
echo - Frontend: 8080
echo.
echo Make sure all services are running!
echo ==========================================
echo.
pause