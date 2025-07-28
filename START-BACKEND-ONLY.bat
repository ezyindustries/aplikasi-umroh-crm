@echo off
title Backend Server - Aplikasi Umroh
color 0B
cls

echo ========================================
echo    STARTING BACKEND SERVER ONLY
echo ========================================
echo.

cd backend

echo Installing dependencies...
call npm install --silent

echo.
echo Starting backend server on port 5000...
echo.
echo ========================================
echo Server endpoints:
echo - Health: http://localhost:5000/health
echo - CRM API: http://localhost:5000/api/crm
echo ========================================
echo.

npm start

pause