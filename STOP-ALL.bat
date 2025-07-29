@echo off
title WhatsApp CRM - Stop All Services
color 0C

echo ============================================
echo        STOPPING ALL WHATSAPP CRM SERVICES
echo ============================================
echo.

:: Stop WAHA Docker
echo [1] Stopping WAHA Docker container...
docker stop waha >nul 2>&1
docker rm waha >nul 2>&1
echo WAHA stopped.
echo.

:: Kill Node.js processes
echo [2] Stopping Node.js processes...
taskkill /F /IM node.exe >nul 2>&1
echo Node.js processes stopped.
echo.

:: Kill any http-server processes
echo [3] Stopping http-server...
taskkill /F /IM http-server.exe >nul 2>&1
echo HTTP server stopped.
echo.

echo ============================================
echo         ALL SERVICES STOPPED
echo ============================================
echo.
pause