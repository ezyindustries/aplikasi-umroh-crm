@echo off
echo ================================================
echo Fixing Configuration and Starting App
echo ================================================
echo.

:: Kill existing processes
echo Stopping any existing services...
taskkill /F /IM node.exe 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do taskkill /PID %%a /F 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8090') do taskkill /PID %%a /F 2>nul
timeout /t 2 >nul

cd backend

echo.
echo Creating proper .env file...
(
echo # Database - SQLite
echo DB_TYPE=sqlite
echo DB_STORAGE=./database.db
echo.
echo # Server
echo PORT=3001
echo NODE_ENV=development
echo.
echo # JWT
echo JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
echo JWT_EXPIRE=24h
echo.
echo # CORS
echo CORS_ORIGIN=http://localhost:8090
echo ALLOWED_ORIGINS=http://localhost:8090
echo.
echo # File Upload
echo UPLOAD_PATH=uploads
echo MAX_FILE_SIZE=10485760
) > .env

echo.
echo Installing dependencies if needed...
if not exist node_modules (
    echo Installing backend dependencies...
    npm install
)

echo.
echo ================================================
echo Starting Backend on port 3001...
echo ================================================
start "Backend" cmd /c "npm start || pause"

echo Waiting for backend to start...
timeout /t 8 >nul

:: Test if backend is running
curl -s http://localhost:3001/api/health >nul 2>&1
if %errorlevel%==0 (
    echo ✅ Backend is running!
) else (
    echo ❌ Backend failed to start. Check the backend window for errors.
    echo.
    echo Common issues:
    echo - Port 3001 might be in use
    echo - Missing dependencies
    echo - Database connection issues
    pause
    exit /b 1
)

echo.
echo ================================================
echo Starting Frontend on port 8090...
echo ================================================
cd ..\frontend
start "Frontend" cmd /c "python -m http.server 8090"

echo.
echo ================================================
echo Application Started!
echo ================================================
echo.
echo Frontend: http://localhost:8090
echo Backend:  http://localhost:3001/api/health
echo.
echo Default Login:
echo Username: admin
echo Password: admin123
echo ================================================
echo.
timeout /t 3 >nul
start http://localhost:8090

echo.
echo Press any key to exit...
pause >nul