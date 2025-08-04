@echo off
echo ==========================================
echo Restarting Backend for Template Toggle Fix
echo ==========================================
echo.

echo Stopping any running backend processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak > nul

echo.
echo Starting backend...
cd backend\whatsapp
start /min cmd /c "npm start"
cd ..\..

echo.
echo Waiting for backend to start...
timeout /t 5 /nobreak > nul

echo.
echo Testing toggle endpoint...
curl -X POST "http://localhost:3003/api/templates/1/toggle" -H "Content-Type: application/json"

echo.
echo.
echo ==========================================
echo Backend restarted!
echo Try toggling template in Template Manager now.
echo ==========================================
echo.
pause