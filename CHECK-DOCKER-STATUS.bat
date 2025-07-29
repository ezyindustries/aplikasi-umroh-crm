@echo off
echo ========================================
echo     Docker & WAHA Status Check
echo ========================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker Desktop tidak terinstall!
    echo.
    pause
    exit /b 1
)

REM Check if Docker is running
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker Desktop tidak berjalan!
    echo.
    echo Silakan jalankan Docker Desktop dulu.
    pause
    exit /b 1
)

echo [OK] Docker Desktop berjalan
echo.
echo ========================================
echo     Docker Containers
echo ========================================
echo.
docker ps -a --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"

echo.
echo ========================================
echo     WAHA Health Check
echo ========================================
echo.

REM Check common WAHA ports
echo Checking port 3000...
curl -s http://localhost:3000/api/health >nul 2>&1
if %errorlevel% == 0 (
    echo [OK] WAHA ditemukan di port 3000
    curl -s http://localhost:3000/api/version
) else (
    echo [X] Tidak ada WAHA di port 3000
)

echo.
echo Checking port 3003...
curl -s http://localhost:3003/api/health >nul 2>&1
if %errorlevel% == 0 (
    echo [OK] WAHA ditemukan di port 3003
    curl -s http://localhost:3003/api/version
) else (
    echo [X] Tidak ada WAHA di port 3003
)

echo.
echo Checking port 3004...
curl -s http://localhost:3004/api/health >nul 2>&1
if %errorlevel% == 0 (
    echo [OK] WAHA ditemukan di port 3004
    curl -s http://localhost:3004/api/version
) else (
    echo [X] Tidak ada WAHA di port 3004
)

echo.
echo ========================================
echo.
pause