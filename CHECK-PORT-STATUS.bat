@echo off
echo ========================================
echo Checking Port Status
echo ========================================
echo.

echo Checking what's using port 8080...
netstat -ano | findstr :8080

echo.
echo Checking what's using port 8081...
netstat -ano | findstr :8081

echo.
echo Checking what's using port 3000 (backend)...
netstat -ano | findstr :3000

echo.
echo ========================================
echo If you see PID numbers above, you can:
echo 1. Kill the process: taskkill /PID [number] /F
echo 2. Or use a different port
echo ========================================

pause