@echo off
title Fix Localhost Access Issues
color 0A
cls

echo ================================================
echo    FIXING LOCALHOST ACCESS ISSUES
echo ================================================
echo.

echo [1/5] Checking current server status...
echo ------------------------------------------------
netstat -an | findstr :8080 | findstr LISTENING >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Server is listening on port 8080
) else (
    echo [ERROR] No server on port 8080
    echo Starting Python server...
    cd frontend
    start "Frontend Server" cmd /k "python -m http.server 8080"
    cd ..
    timeout /t 3 /nobreak >nul
)

echo.
echo [2/5] Testing different localhost addresses...
echo ------------------------------------------------

echo Testing http://127.0.0.1:8080 ...
curl -s -o nul -w "Status: %%{http_code}\n" http://127.0.0.1:8080/test.html
echo.

echo Testing http://localhost:8080 ...
curl -s -o nul -w "Status: %%{http_code}\n" http://localhost:8080/test.html
echo.

echo Testing http://[::1]:8080 (IPv6) ...
curl -s -o nul -w "Status: %%{http_code}\n" http://[::1]:8080/test.html
echo.

echo [3/5] Checking Windows Firewall...
echo ------------------------------------------------
netsh advfirewall firewall show rule name="Python" >nul 2>&1
if %errorlevel% neq 0 (
    echo Adding firewall rule for Python...
    netsh advfirewall firewall add rule name="Python HTTP Server" dir=in action=allow protocol=TCP localport=8080 >nul 2>&1
    echo [OK] Firewall rule added
) else (
    echo [OK] Firewall rule already exists
)

echo.
echo [4/5] Checking hosts file...
echo ------------------------------------------------
type C:\Windows\System32\drivers\etc\hosts | findstr localhost >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] localhost not found in hosts file
    echo Add this line to C:\Windows\System32\drivers\etc\hosts:
    echo 127.0.0.1       localhost
) else (
    echo [OK] localhost entry found in hosts file
)

echo.
echo [5/5] Opening test pages...
echo ------------------------------------------------
echo Opening in default browser...

REM Try different URLs
start "" "http://127.0.0.1:8080/test.html"
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:8080/index.html"

echo.
echo ================================================
echo    TROUBLESHOOTING COMPLETE
echo ================================================
echo.
echo If still not working, try:
echo.
echo 1. Use http://127.0.0.1:8080 instead of localhost
echo 2. Disable Windows Defender temporarily
echo 3. Check if another application blocks port 8080
echo 4. Run this as Administrator
echo 5. Try a different browser
echo.
echo Current server directory:
cd frontend
echo %CD%
cd ..
echo.
pause