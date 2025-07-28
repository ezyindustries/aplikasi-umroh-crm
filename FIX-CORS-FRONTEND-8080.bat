@echo off
echo ========================================
echo Fixing CORS Issue - Keep Frontend at 8080
echo ========================================
echo.

echo Step 1: Updating backend to accept port 8080...
cd backend

echo Setting environment variable...
set FRONTEND_PORT=8080
set ALLOWED_ORIGINS=http://localhost:8080,http://127.0.0.1:8080,http://localhost:3000

echo.
echo Step 2: Restarting backend with new configuration...
echo.
echo Starting backend server...
echo (This will accept frontend from port 8080)
echo.

npm start

pause