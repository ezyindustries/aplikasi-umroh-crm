@echo off
echo ================================================
echo Starting Backend in Debug Mode
echo ================================================
echo.

cd backend

echo Current .env configuration:
echo -------------------------------
type .env
echo -------------------------------
echo.

echo Starting backend...
node server.js

pause