@echo off
echo ================================================
echo Quick Start - Using SQLite (No PostgreSQL Needed)
echo ================================================
echo.

:: Kill any existing processes
echo Cleaning up old processes...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001 ^| findstr LISTENING') do taskkill /PID %%a /F 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8090 ^| findstr LISTENING') do taskkill /PID %%a /F 2>nul
timeout /t 2 >nul

:: Start Backend with SQLite
echo.
echo Starting Backend with SQLite database...
cd backend
start "Backend SQLite" cmd /k "USE-SQLITE-DATABASE.bat"
echo Waiting for backend to start...
timeout /t 5 >nul

:: Start Frontend
echo.
echo Starting Frontend on port 8090...
cd ..\frontend
start "Frontend Server" cmd /k "python -m http.server 8090"
echo Waiting for frontend to start...
timeout /t 3 >nul

:: Show status
echo.
echo ================================================
echo Services Started!
echo ================================================
echo Backend:  http://localhost:3001 (SQLite)
echo Frontend: http://localhost:8090
echo.
echo Login: admin / admin123
echo ================================================
echo.
echo Opening browser...
start http://localhost:8090

pause