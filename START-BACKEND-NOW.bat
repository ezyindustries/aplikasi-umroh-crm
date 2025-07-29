@echo off
title WhatsApp Backend
color 0A

echo ======================================
echo     STARTING WHATSAPP BACKEND
echo ======================================
echo.

cd /d "%~dp0backend\whatsapp"

echo Starting backend on port 3001...
node server.js

pause