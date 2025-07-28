@echo off
title Port Configuration Verification - Aplikasi Umroh
color 0E
cls

echo ========================================
echo    PORT CONFIGURATION VERIFICATION
echo ========================================
echo.

echo EXPECTED PORT CONFIGURATION:
echo ========================================
echo Service          Port    Status
echo --------         ----    ------
echo Backend API      5000    %1
echo WAHA WhatsApp    3001    %2  
echo Frontend         8080    %3
echo PostgreSQL       5432    %4
echo Ollama AI        11434   %5 (Optional)
echo ========================================
echo.

echo CHECKING ACTUAL PORT STATUS...
echo ========================================

REM Check Backend (5000)
netstat -an | findstr :5000 | findstr LISTENING >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Port 5000: Backend API is LISTENING
    curl -s http://localhost:5000/health >nul 2>&1
    if %errorlevel% equ 0 (
        echo     └─ Health check: PASSED
    ) else (
        echo     └─ Health check: FAILED (server not responding)
    )
) else (
    echo [X] Port 5000: Backend API is NOT RUNNING
)

echo.

REM Check WAHA (3001)
netstat -an | findstr :3001 | findstr LISTENING >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Port 3001: WAHA WhatsApp is LISTENING
    curl -s http://localhost:3001/api/version >nul 2>&1
    if %errorlevel% equ 0 (
        echo     └─ API check: PASSED
    ) else (
        echo     └─ API check: FAILED (WAHA not responding)
    )
) else (
    echo [X] Port 3001: WAHA WhatsApp is NOT RUNNING
)

echo.

REM Check Frontend (8080)
netstat -an | findstr :8080 | findstr LISTENING >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Port 8080: Frontend Server is LISTENING
) else (
    echo [!] Port 8080: Frontend Server is NOT RUNNING
    echo     └─ Note: Frontend can work via file:// protocol
)

echo.

REM Check PostgreSQL (5432)
netstat -an | findstr :5432 | findstr LISTENING >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Port 5432: PostgreSQL is LISTENING
) else (
    echo [X] Port 5432: PostgreSQL is NOT RUNNING
)

echo.

REM Check Ollama (11434)
netstat -an | findstr :11434 | findstr LISTENING >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Port 11434: Ollama AI is LISTENING (Optional)
) else (
    echo [!] Port 11434: Ollama AI is NOT RUNNING (Optional)
)

echo.
echo ========================================
echo PORT CONFIGURATION IN FILES:
echo ========================================
echo.
echo Backend (.env):
echo - Backend API: PORT=5000
echo - WAHA URL: WAHA_API_URL=http://localhost:3001
echo - Database: DB_PORT=5432
echo - Ollama: OLLAMA_BASE_URL=http://localhost:11434
echo.
echo Frontend (crm-no-login.html):
echo - API_BASE: http://localhost:5000/api
echo - WAHA_URL: http://localhost:3001
echo.
echo WAHA Docker:
echo - Container Port: 3001:3000 (maps internal 3000 to external 3001)
echo - Webhook URL: http://host.docker.internal:5000/api/crm/webhook
echo.
echo ========================================
echo CONFIGURATION ISSUES FOUND:
echo ========================================

REM Check for port 3000 usage in frontend files
findstr /C:"localhost:3000" frontend\crm-*.html >nul 2>&1
if %errorlevel% equ 0 (
    echo [WARNING] Some frontend files use port 3000 instead of 5000:
    echo - crm-dashboard-pro.html
    echo - crm-complete.html
    echo - crm-simple.html
    echo These files need to be updated to use port 5000!
) else (
    echo [OK] All frontend files use correct ports
)

echo.
echo ========================================
echo RECOMMENDATIONS:
echo ========================================
echo.
echo 1. If Backend not running (5000):
echo    Run: START-BACKEND-FINAL.bat
echo.
echo 2. If WAHA not running (3001):
echo    Run: docker start waha-umroh
echo    Or restart with: docker restart waha-umroh
echo.
echo 3. If Frontend not running (8080):
echo    Run: START-FRONTEND.bat
echo.
echo 4. If PostgreSQL not running (5432):
echo    Start PostgreSQL service in Windows Services
echo.
echo ========================================
pause