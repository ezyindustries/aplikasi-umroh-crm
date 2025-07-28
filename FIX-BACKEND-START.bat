@echo off
title Fix & Start Backend - Aplikasi Umroh
color 0E
cls

echo ========================================
echo    FIXING BACKEND DEPENDENCIES
echo ========================================
echo.

cd backend

echo Installing all required dependencies...
call npm install express-mongo-sanitize --save
call npm install dotenv --save

echo.
echo ========================================
echo    STARTING BACKEND SERVER
echo ========================================
echo.
echo If you see any errors, the script will try to fix them...
echo.

:START_SERVER
npm start

REM If server crashes, wait and restart
echo.
echo ========================================
echo Server stopped. Restarting in 5 seconds...
echo Press Ctrl+C to exit
echo ========================================
timeout /t 5 /nobreak >nul
goto START_SERVER

pause