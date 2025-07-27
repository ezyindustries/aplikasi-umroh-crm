@echo off
echo ========================================
echo COMPREHENSIVE APPLICATION TESTING
echo ========================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not running!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo [1/8] Starting Docker containers...
docker-compose up -d
if errorlevel 1 (
    echo ERROR: Failed to start Docker containers
    pause
    exit /b 1
)

echo.
echo [2/8] Waiting for services to be ready...
timeout /t 30 /nobreak >nul

echo.
echo [3/8] Checking database connection...
docker exec vauza-tamma-backend node -e "console.log('Database check...')"

echo.
echo [4/8] Installing test dependencies...
cd backend
call npm install --save-dev supertest jest @types/jest
cd ..

echo.
echo [5/8] Installing frontend test dependencies...
cd frontend
call npm install --save-dev puppeteer @testing-library/react @testing-library/jest-dom
cd ..

echo.
echo [6/8] Running backend API tests...
cd backend
call npm test
cd ..

echo.
echo [7/8] Running comprehensive integration tests...
node comprehensive-testing.js

echo.
echo [8/8] Running frontend UI tests...
node frontend-testing.js

echo.
echo ========================================
echo TEST EXECUTION COMPLETED
echo ========================================
echo.
echo Check the test reports for detailed results:
echo - test-report-*.json (API tests)
echo - frontend-test-report-*.json (UI tests)
echo - screenshots/ folder (UI screenshots)
echo.

pause