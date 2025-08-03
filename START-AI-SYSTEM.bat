@echo off
echo ==========================================
echo Starting Complete AI System
echo ==========================================
echo.

echo Step 1: Checking Ollama installation...
where ollama >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Ollama is not installed!
    echo.
    echo Please install Ollama from: https://ollama.ai
    echo After installation, run this script again.
    pause
    exit /b
)
echo [OK] Ollama is installed

echo.
echo Step 2: Starting Ollama service...
netstat -an | findstr :11434 >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Ollama already running
) else (
    echo Starting Ollama in new window...
    start "Ollama Server" cmd /k "ollama serve"
    echo Waiting for Ollama to start...
    timeout /t 5 /nobreak >nul
)

echo.
echo Step 3: Checking models...
ollama list | findstr "llama3.2" >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] llama3.2 model not found
    echo.
    echo Downloading llama3.2:1b model (1.3GB)...
    echo This may take a few minutes...
    ollama pull llama3.2:1b
)
echo [OK] Models are available

echo.
echo Step 4: Restarting backend with AI support...
echo Killing existing Node processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo Starting backend server...
cd backend\whatsapp
start "WhatsApp CRM Backend" cmd /k "npm start"
cd ..\..

echo Waiting for backend to initialize...
timeout /t 8 /nobreak >nul

echo.
echo Step 5: Verifying all services...
echo.

echo Ollama API: 
curl -s http://localhost:11434/api/tags | findstr "models" >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Ollama API responding
) else (
    echo [ERROR] Ollama API not responding
)

echo.
echo Backend API:
curl -s http://localhost:3003/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Backend API responding
) else (
    echo [ERROR] Backend API not responding
)

echo.
echo Backend AI Routes:
curl -s -X GET http://localhost:3003/api/ai/connection >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] AI routes available
    curl -s http://localhost:3003/api/ai/connection
) else (
    echo [ERROR] AI routes not responding
)

echo.
echo ==========================================
echo System startup complete!
echo ==========================================
echo.
echo Opening AI Dashboard...
start "" "frontend\ai-llm-dashboard.html"

echo.
echo If the dashboard shows "Offline", try:
echo 1. Refresh the page (F5)
echo 2. Check the console (F12) for errors
echo 3. Run CHECK-OLLAMA-STATUS.bat
echo.
pause