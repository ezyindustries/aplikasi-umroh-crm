@echo off
echo ================================================
echo Switching to SQLite Database (No PostgreSQL Required)
echo ================================================
echo.

cd backend

echo Creating SQLite configuration...
(
echo # Database Configuration - Using SQLite
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
echo JWT_REFRESH_SECRET=supersecretrefreshtoken123456789abcdef
echo JWT_REFRESH_EXPIRE=7d
echo.
echo # File Upload Configuration
echo UPLOAD_PATH=uploads
echo MAX_FILE_SIZE=10485760
echo ALLOWED_FILE_TYPES=jpg,jpeg,png,pdf,doc,docx
echo.
echo # Security Configuration
echo BCRYPT_ROUNDS=10
echo RATE_LIMIT_WINDOW_MS=900000
echo RATE_LIMIT_MAX_REQUESTS=100
echo.
echo # CORS Configuration
echo CORS_ORIGIN=http://localhost:8090,http://localhost:8080,http://localhost:3001,http://localhost:3000
echo ALLOWED_ORIGINS=http://localhost:8090,http://localhost:8080,http://localhost:3001,http://localhost:3000
echo FRONTEND_PORT=8090
echo.
echo # WhatsApp Configuration
echo WAHA_API_URL=http://localhost:3003
echo WAHA_API_KEY=your-secret-api-key
echo WAHA_SESSION_NAME=default
echo WAHA_WEBHOOK_SECRET=your-webhook-secret
echo.
echo # Application Settings
echo APP_NAME=Aplikasi Umroh Management
echo APP_VERSION=1.0.0
) > .env

echo.
echo SQLite configuration created!
echo.
echo Starting backend with SQLite...
npm start

pause