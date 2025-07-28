@echo off
echo ================================================
echo Testing Backend Connection
echo ================================================
echo.

echo Testing port 3001...
curl -s http://localhost:3001/api/health >nul 2>&1
if %errorlevel%==0 (
    echo ✅ Backend is running on port 3001
    curl http://localhost:3001/api/health
) else (
    echo ❌ Backend NOT running on port 3001
    echo.
    echo Testing port 3000...
    curl -s http://localhost:3000/api/health >nul 2>&1
    if %errorlevel%==0 (
        echo ✅ Backend is running on port 3000
        curl http://localhost:3000/api/health
    ) else (
        echo ❌ Backend NOT running on port 3000
    )
)

echo.
echo ================================================
echo Testing CORS Headers
echo ================================================
echo.
echo From port 8090:
curl -s -I -X OPTIONS http://localhost:3001/api/auth/login -H "Origin: http://localhost:8090" -H "Access-Control-Request-Method: POST" 2>nul | findstr "Access-Control"

echo.
echo From port 8080:
curl -s -I -X OPTIONS http://localhost:3001/api/auth/login -H "Origin: http://localhost:8080" -H "Access-Control-Request-Method: POST" 2>nul | findstr "Access-Control"

echo.
pause