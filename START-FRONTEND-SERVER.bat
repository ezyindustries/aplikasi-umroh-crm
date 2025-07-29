@echo off
title WhatsApp CRM Frontend Server
echo ========================================
echo     Starting Frontend Server
echo ========================================
echo.

cd /d "D:\ezyin\Documents\aplikasi umroh\frontend"

echo Starting HTTP server on port 8080...
echo.
echo Frontend will be available at:
echo http://localhost:8080/conversations-beautiful.html
echo.
echo Press Ctrl+C to stop the server
echo.

python -m http.server 8080