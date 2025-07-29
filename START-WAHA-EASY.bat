@echo off
echo ========================================
echo     WAHA WhatsApp API - Easy Setup
echo ========================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker Desktop tidak terinstall!
    echo.
    echo Silakan install Docker Desktop terlebih dahulu:
    echo 1. Buka browser
    echo 2. Kunjungi: https://www.docker.com/products/docker-desktop/
    echo 3. Download dan install Docker Desktop
    echo 4. Restart komputer setelah install
    echo 5. Jalankan script ini lagi
    echo.
    pause
    exit /b 1
)

REM Check if Docker is running
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Docker Desktop belum berjalan...
    echo Mencoba menjalankan Docker Desktop...
    echo.
    
    REM Try to start Docker Desktop
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    
    echo Menunggu Docker Desktop siap (30 detik)...
    timeout /t 30 /nobreak >nul
    
    REM Check again
    docker ps >nul 2>&1
    if %errorlevel% neq 0 (
        echo [ERROR] Docker Desktop tidak bisa dijalankan!
        echo.
        echo Silakan jalankan Docker Desktop manual:
        echo 1. Cari "Docker Desktop" di Start Menu
        echo 2. Klik untuk menjalankan
        echo 3. Tunggu sampai Docker icon di system tray berwarna hijau
        echo 4. Jalankan script ini lagi
        echo.
        pause
        exit /b 1
    )
)

echo [OK] Docker Desktop sudah berjalan!
echo.

REM Check if WAHA container exists
echo Mengecek apakah WAHA sudah ada...
docker ps -a --filter "name=waha-whatsapp" --format "{{.Names}}" | findstr /i "waha-whatsapp" >nul
if %errorlevel% == 0 (
    echo [INFO] Container WAHA sudah ada, menghapus yang lama...
    docker stop waha-whatsapp >nul 2>&1
    docker rm waha-whatsapp >nul 2>&1
)

REM Find available port
echo Mencari port yang tersedia...
set WAHA_PORT=3003
:find_port
netstat -an | findstr :%WAHA_PORT% | findstr LISTENING >nul
if %errorlevel% == 0 (
    echo Port %WAHA_PORT% sudah digunakan, mencoba port lain...
    set /a WAHA_PORT+=1
    if %WAHA_PORT% GTR 3010 (
        echo [ERROR] Tidak ada port tersedia dari 3003-3010!
        pause
        exit /b 1
    )
    goto :find_port
)

echo [OK] Menggunakan port %WAHA_PORT% untuk WAHA
echo.

REM Start WAHA container
echo ========================================
echo    Menjalankan WAHA di port %WAHA_PORT%
echo ========================================
echo.
echo Downloading WAHA image (pertama kali bisa lama)...
docker pull devlikeapro/waha

echo.
echo Starting WAHA container...
docker run -d --name waha-whatsapp -p %WAHA_PORT%:3000 devlikeapro/waha

REM Wait for WAHA to be ready
echo.
echo Menunggu WAHA siap (10 detik)...
timeout /t 10 /nobreak >nul

REM Verify WAHA is running
echo.
echo Mengecek status WAHA...
curl -s http://localhost:%WAHA_PORT%/api/health >nul 2>&1
if %errorlevel% == 0 (
    echo [OK] WAHA berhasil dijalankan!
) else (
    echo [WARNING] WAHA mungkin masih starting up...
)

REM Update configuration
echo.
echo ========================================
echo    Updating WhatsApp CRM Configuration
echo ========================================

REM Create config update script
echo const fs = require('fs'); > update-waha-config.js
echo const path = require('path'); >> update-waha-config.js
echo. >> update-waha-config.js
echo // Update .env file >> update-waha-config.js
echo const envPath = path.join(__dirname, 'backend/whatsapp/.env'); >> update-waha-config.js
echo let envContent = fs.readFileSync(envPath, 'utf8'); >> update-waha-config.js
echo envContent = envContent.replace(/WAHA_URL=.*/g, 'WAHA_URL=http://localhost:%WAHA_PORT%'); >> update-waha-config.js
echo envContent = envContent.replace(/WAHA_BASE_URL=.*/g, 'WAHA_BASE_URL=http://localhost:%WAHA_PORT%'); >> update-waha-config.js
echo fs.writeFileSync(envPath, envContent); >> update-waha-config.js
echo console.log('Updated .env with WAHA port %WAHA_PORT%'); >> update-waha-config.js
echo. >> update-waha-config.js
echo // Switch to RealWAHAService >> update-waha-config.js
echo const files = [ >> update-waha-config.js
echo   'backend/whatsapp/src/controllers/SessionController.js', >> update-waha-config.js
echo   'backend/whatsapp/src/services/MessageQueue.js', >> update-waha-config.js
echo   'backend/whatsapp/force-load-chats.js' >> update-waha-config.js
echo ]; >> update-waha-config.js
echo. >> update-waha-config.js
echo files.forEach(file =^> { >> update-waha-config.js
echo   const filePath = path.join(__dirname, file); >> update-waha-config.js
echo   if (fs.existsSync(filePath)) { >> update-waha-config.js
echo     let content = fs.readFileSync(filePath, 'utf8'); >> update-waha-config.js
echo     content = content.replace(/WhatsAppWebService/g, 'RealWAHAService'); >> update-waha-config.js
echo     fs.writeFileSync(filePath, content); >> update-waha-config.js
echo     console.log('Updated', file); >> update-waha-config.js
echo   } >> update-waha-config.js
echo }); >> update-waha-config.js

REM Run config update
node update-waha-config.js
del update-waha-config.js

echo.
echo ========================================
echo          WAHA Setup Complete!
echo ========================================
echo.
echo WAHA API berjalan di: http://localhost:%WAHA_PORT%
echo.
echo Langkah selanjutnya:
echo 1. Tutup backend WhatsApp CRM jika sedang berjalan (Ctrl+C)
echo 2. Jalankan START-WHATSAPP-CRM.bat
echo 3. Buka browser dan refresh halaman
echo 4. Klik "Connect WhatsApp"
echo 5. Scan QR Code dengan WhatsApp HP
echo.
echo ========================================
echo.
pause