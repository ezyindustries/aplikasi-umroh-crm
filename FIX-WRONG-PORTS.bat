@echo off
echo ========================================
echo FIXING WRONG PORT CONFIGURATIONS
echo ========================================
echo.

cd frontend

echo Fixing port 3000 to 5000 in frontend files...

REM Fix crm-dashboard-pro.html
powershell -Command "(Get-Content crm-dashboard-pro.html) -replace 'http://localhost:3000/api', 'http://localhost:5000/api' | Set-Content crm-dashboard-pro.html"
powershell -Command "(Get-Content crm-dashboard-pro.html) -replace 'ws://localhost:3000', 'ws://localhost:5000' | Set-Content crm-dashboard-pro.html"

REM Fix crm-dashboard-pro-safe.html
powershell -Command "(Get-Content crm-dashboard-pro-safe.html) -replace 'http://localhost:3000/api', 'http://localhost:5000/api' | Set-Content crm-dashboard-pro-safe.html"
powershell -Command "(Get-Content crm-dashboard-pro-safe.html) -replace 'ws://localhost:3000', 'ws://localhost:5000' | Set-Content crm-dashboard-pro-safe.html"

REM Fix crm-complete.html
powershell -Command "(Get-Content crm-complete.html) -replace 'http://localhost:3000/api', 'http://localhost:5000/api' | Set-Content crm-complete.html"

REM Fix crm-simple.html
powershell -Command "(Get-Content crm-simple.html) -replace 'http://localhost:3000/api', 'http://localhost:5000/api' | Set-Content crm-simple.html"

cd ..

echo.
echo All port configurations have been fixed!
echo.
echo ========================================
echo SUMMARY OF CHANGES:
echo ========================================
echo - Changed API_BASE from port 3000 to 5000
echo - Changed WebSocket from port 3000 to 5000
echo - Files updated:
echo   * crm-dashboard-pro.html
echo   * crm-dashboard-pro-safe.html
echo   * crm-complete.html
echo   * crm-simple.html
echo.
echo Now all files use the correct ports:
echo - Backend API: 5000
echo - WAHA WhatsApp: 3001
echo - Frontend: 8080
echo - PostgreSQL: 5432
echo ========================================
echo.
pause