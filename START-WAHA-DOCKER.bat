@echo off
title WAHA Docker Setup
color 0A
echo ========================================
echo     WAHA WhatsApp API - Easy Setup
echo ========================================
echo.

REM Keep window open on error
if "%1"=="" (
    cmd /k "%~f0" RUN
    exit /b
)

REM Check if Docker is installed
echo [1/7] Checking Docker installation...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Docker Desktop tidak terinstall!
    echo.
    echo Silakan install Docker Desktop terlebih dahulu:
    echo.
    echo 1. Buka browser
    echo 2. Kunjungi: https://www.docker.com/products/docker-desktop/
    echo 3. Download dan install Docker Desktop  
    echo 4. Restart komputer setelah install
    echo 5. Jalankan script ini lagi
    echo.
    echo Tekan Enter untuk membuka halaman download Docker...
    pause >nul
    start https://www.docker.com/products/docker-desktop/
    exit /b 1
)
echo [OK] Docker terinstall

REM Check if Docker is running
echo.
echo [2/7] Checking Docker status...
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo Docker Desktop belum berjalan...
    echo.
    echo Mencoba menjalankan Docker Desktop...
    
    REM Try multiple Docker Desktop locations
    if exist "C:\Program Files\Docker\Docker\Docker Desktop.exe" (
        start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    ) else if exist "%LOCALAPPDATA%\Docker\Docker Desktop.exe" (
        start "" "%LOCALAPPDATA%\Docker\Docker Desktop.exe"
    ) else (
        echo.
        echo [WARNING] Tidak bisa menemukan Docker Desktop
        echo Silakan jalankan Docker Desktop manual dari Start Menu
        echo.
        pause
        exit /b 1
    )
    
    echo.
    echo Menunggu Docker Desktop siap (maks 60 detik)...
    echo Ini bisa memakan waktu beberapa menit saat pertama kali...
    
    set COUNT=0
    :wait_docker
    timeout /t 5 /nobreak >nul
    set /a COUNT+=5
    
    docker ps >nul 2>&1
    if %errorlevel% == 0 goto docker_ready
    
    if %COUNT% LSS 60 (
        echo Masih menunggu... (%COUNT%/60 detik)
        goto wait_docker
    )
    
    echo.
    echo [ERROR] Docker Desktop tidak bisa dijalankan!
    echo.
    echo Silakan:
    echo 1. Jalankan Docker Desktop manual dari Start Menu
    echo 2. Tunggu sampai Docker icon di system tray berwarna hijau
    echo 3. Jalankan script ini lagi
    echo.
    pause
    exit /b 1
)

:docker_ready
echo [OK] Docker Desktop berjalan

REM Clean up old containers
echo.
echo [3/7] Cleaning up old containers...
docker stop waha-whatsapp >nul 2>&1
docker rm waha-whatsapp >nul 2>&1
echo [OK] Cleanup done

REM Find available port
echo.
echo [4/7] Finding available port...
set WAHA_PORT=3003

:find_port
netstat -an | findstr ":%WAHA_PORT%" | findstr "LISTENING" >nul 2>&1
if %errorlevel% == 0 (
    echo Port %WAHA_PORT% sudah digunakan, mencoba port lain...
    set /a WAHA_PORT+=1
    if %WAHA_PORT% GTR 3010 (
        echo.
        echo [ERROR] Tidak ada port tersedia dari 3003-3010!
        echo Silakan tutup aplikasi lain yang menggunakan port tersebut.
        pause
        exit /b 1
    )
    goto find_port
)

echo [OK] Menggunakan port %WAHA_PORT% untuk WAHA

REM Pull WAHA image
echo.
echo [5/7] Downloading WAHA Docker image...
echo Ini bisa memakan waktu beberapa menit saat pertama kali...
docker pull devlikeapro/waha
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Gagal download WAHA image!
    echo Pastikan internet Anda stabil.
    pause
    exit /b 1
)
echo [OK] WAHA image ready

REM Start WAHA container
echo.
echo [6/7] Starting WAHA container...
docker run -d --name waha-whatsapp -p %WAHA_PORT%:3000 --restart unless-stopped devlikeapro/waha
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Gagal menjalankan WAHA container!
    pause
    exit /b 1
)
echo [OK] WAHA container started

REM Wait and verify
echo.
echo [7/7] Verifying WAHA is running...
echo Menunggu WAHA siap (15 detik)...
timeout /t 15 /nobreak >nul

REM Create test script
echo Testing WAHA health... > test-waha.js
echo const http = require('http'); >> test-waha.js
echo const port = %WAHA_PORT%; >> test-waha.js
echo http.get(`http://localhost:${port}/api/health`, (res) =^> { >> test-waha.js
echo   if (res.statusCode === 200) { >> test-waha.js
echo     console.log('[OK] WAHA is running on port ' + port); >> test-waha.js
echo     process.exit(0); >> test-waha.js
echo   } else { >> test-waha.js
echo     console.log('[ERROR] WAHA returned status ' + res.statusCode); >> test-waha.js
echo     process.exit(1); >> test-waha.js
echo   } >> test-waha.js
echo }).on('error', (err) =^> { >> test-waha.js
echo   console.log('[ERROR] Cannot connect to WAHA: ' + err.message); >> test-waha.js
echo   process.exit(1); >> test-waha.js
echo }); >> test-waha.js

node test-waha.js
set WAHA_STATUS=%errorlevel%
del test-waha.js

if %WAHA_STATUS% neq 0 (
    echo.
    echo [WARNING] WAHA mungkin masih starting up...
    echo Coba tunggu beberapa saat lagi.
)

REM Update configuration
echo.
echo ========================================
echo    Updating WhatsApp CRM Configuration
echo ========================================

REM Create update script
(
echo const fs = require('fs'^);
echo const path = require('path'^);
echo.
echo console.log('Updating configuration...'^);
echo.
echo // Update .env file
echo const envPath = path.join(__dirname, 'backend/whatsapp/.env'^);
echo if (fs.existsSync(envPath^)^) {
echo   let envContent = fs.readFileSync(envPath, 'utf8'^);
echo   envContent = envContent.replace(/WAHA_URL=.*/g, 'WAHA_URL=http://localhost:%WAHA_PORT%'^);
echo   envContent = envContent.replace(/WAHA_BASE_URL=.*/g, 'WAHA_BASE_URL=http://localhost:%WAHA_PORT%'^);
echo   fs.writeFileSync(envPath, envContent^);
echo   console.log('[OK] Updated .env with WAHA port %WAHA_PORT%'^);
echo } else {
echo   console.log('[ERROR] .env file not found!'^);
echo }
echo.
echo // Switch to RealWAHAService
echo const files = [
echo   'backend/whatsapp/src/controllers/SessionController.js',
echo   'backend/whatsapp/src/services/MessageQueue.js',
echo   'backend/whatsapp/force-load-chats.js'
echo ];
echo.
echo files.forEach(file =^> {
echo   const filePath = path.join(__dirname, file^);
echo   if (fs.existsSync(filePath^)^) {
echo     let content = fs.readFileSync(filePath, 'utf8'^);
echo     content = content.replace(/WhatsAppWebService/g, 'RealWAHAService'^);
echo     fs.writeFileSync(filePath, content^);
echo     console.log('[OK] Updated ' + file^);
echo   }
echo }^);
echo.
echo console.log('\nConfiguration update complete!'^);
) > update-config.js

node update-config.js
del update-config.js

REM Show final status
echo.
echo ========================================
echo          WAHA Setup Complete!
echo ========================================
echo.
echo WAHA berjalan di: http://localhost:%WAHA_PORT%
echo.
echo Container Name: waha-whatsapp
echo Container akan restart otomatis jika komputer restart
echo.
echo ========================================
echo        Langkah Selanjutnya:
echo ========================================
echo.
echo 1. Tutup backend WhatsApp CRM jika masih berjalan
echo    (Tekan Ctrl+C di window backend)
echo.
echo 2. Jalankan START-WHATSAPP-CRM.bat
echo.
echo 3. Browser akan terbuka otomatis
echo.
echo 4. Klik "Connect WhatsApp"
echo.
echo 5. Scan QR Code dengan WhatsApp di HP
echo.
echo ========================================
echo.
echo Tekan Enter untuk keluar...
pause >nul