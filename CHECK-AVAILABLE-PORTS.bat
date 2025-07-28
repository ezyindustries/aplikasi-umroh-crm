@echo off
echo ========================================
echo Checking Port Availability
echo ========================================
echo.

echo Checking common ports...
echo.

echo Port 3000 (Backend default):
netstat -ano | findstr :3000 | findstr LISTENING
if %errorlevel%==1 (
    echo   [AVAILABLE]
) else (
    echo   [IN USE]
)

echo.
echo Port 3001 (Alternative backend):
netstat -ano | findstr :3001 | findstr LISTENING
if %errorlevel%==1 (
    echo   [AVAILABLE]
) else (
    echo   [IN USE]
)

echo.
echo Port 5000 (Alternative backend):
netstat -ano | findstr :5000 | findstr LISTENING
if %errorlevel%==1 (
    echo   [AVAILABLE]
) else (
    echo   [IN USE]
)

echo.
echo Port 8080 (Frontend default):
netstat -ano | findstr :8080 | findstr LISTENING
if %errorlevel%==1 (
    echo   [AVAILABLE]
) else (
    echo   [IN USE]
)

echo.
echo Port 8081 (Alternative frontend):
netstat -ano | findstr :8081 | findstr LISTENING
if %errorlevel%==1 (
    echo   [AVAILABLE]
) else (
    echo   [IN USE]
)

echo.
echo Port 8082 (Alternative frontend):
netstat -ano | findstr :8082 | findstr LISTENING
if %errorlevel%==1 (
    echo   [AVAILABLE]
) else (
    echo   [IN USE]
)

echo.
echo Port 8090 (Alternative frontend):
netstat -ano | findstr :8090 | findstr LISTENING
if %errorlevel%==1 (
    echo   [AVAILABLE]
) else (
    echo   [IN USE]
)

echo.
echo ========================================
pause