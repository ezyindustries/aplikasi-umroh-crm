@echo off
echo Opening CRM Dashboard...
echo.

REM Open CRM Dashboard
start "" "http://localhost:8080/crm-no-login.html"

echo ========================================
echo CRM Dashboard opened in browser!
echo.
echo If page doesn't load, make sure:
echo 1. Frontend server is running (port 8080)
echo 2. Backend server is running (port 5000)
echo 3. WAHA is running (port 3001)
echo.
echo Alternative direct file locations:
echo - D:\ezyin\Documents\aplikasi umroh\frontend\crm-no-login.html
echo - D:\ezyin\Documents\aplikasi umroh\frontend\crm-complete.html
echo - D:\ezyin\Documents\aplikasi umroh\frontend\index.html
echo ========================================
pause