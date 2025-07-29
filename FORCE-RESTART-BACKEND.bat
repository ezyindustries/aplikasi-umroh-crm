@echo off
title Force Restart Backend
color 0A

echo Killing all Node processes...
taskkill /F /IM node.exe 2>nul

echo.
echo Waiting for ports to be freed...
timeout /t 3 /nobreak > nul

echo.
echo Starting backend...
cd /d "%~dp0backend\whatsapp"
node server.js

pause