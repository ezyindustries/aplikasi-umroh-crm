@echo off
echo Stopping backend...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak > nul

echo Starting backend...
cd backend\whatsapp
start cmd /k npm start

echo.
echo Backend starting in new window...
echo.
pause