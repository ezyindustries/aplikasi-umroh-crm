@echo off
echo ================================================
echo Installing SQLite and Starting Application
echo ================================================
echo.

cd backend

echo Installing SQLite3 module...
npm install sqlite3 --save

echo.
echo Creating SQLite database configuration...
(
echo # Database Configuration - SQLite
echo DB_TYPE=sqlite
echo DB_STORAGE=./database.db
echo.
echo # Server Configuration  
echo PORT=3001
echo NODE_ENV=development
echo.
echo # JWT Configuration
echo JWT_SECRET=supersecretjwtkey123456789abcdefghijklmnop
echo JWT_EXPIRE=24h
echo.
echo # CORS Configuration
echo CORS_ORIGIN=http://localhost:8090,http://localhost:8080
echo ALLOWED_ORIGINS=http://localhost:8090,http://localhost:8080
echo FRONTEND_PORT=8090
echo.
echo # Application Settings
echo APP_NAME=Aplikasi Umroh Management
echo APP_VERSION=1.0.0
) > .env

echo.
echo ================================================
echo Starting Services...
echo ================================================

:: Start Backend
echo Starting Backend...
start "Backend Server" cmd /k "npm start"
timeout /t 5 >nul

:: Start Frontend
echo Starting Frontend...
cd ..\frontend
start "Frontend Server" cmd /k "python -m http.server 8090"
timeout /t 3 >nul

echo.
echo ================================================
echo Application Started Successfully!
echo ================================================
echo.
echo Frontend: http://localhost:8090
echo Backend:  http://localhost:3001
echo.
echo Login Credentials:
echo Username: admin
echo Password: admin123
echo ================================================
echo.
echo Opening browser...
start http://localhost:8090

pause