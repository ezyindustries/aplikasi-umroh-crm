@echo off
echo ========================================
echo Checking Ollama and Backend Status
echo ========================================
echo.

echo 1. Checking if Ollama is installed...
where ollama >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Ollama is installed
    echo.
    echo Available models:
    ollama list
) else (
    echo [ERROR] Ollama is not installed or not in PATH
    echo Please install from: https://ollama.ai
    goto end
)

echo.
echo 2. Checking if Ollama service is running...
netstat -an | findstr :11434 >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Ollama is running on port 11434
) else (
    echo [ERROR] Ollama is not running
    echo.
    echo Starting Ollama...
    start "Ollama Server" cmd /k "ollama serve"
    echo Please wait for Ollama to start...
    timeout /t 5 /nobreak >nul
)

echo.
echo 3. Checking backend server...
netstat -an | findstr :3003 >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Backend is running on port 3003
) else (
    echo [ERROR] Backend is not running
    echo Please run RESTART-BACKEND-AI.bat
)

echo.
echo 4. Testing Ollama API directly...
echo Response from Ollama:
curl -s http://localhost:11434/api/tags | findstr "models"
if %errorlevel% neq 0 (
    echo [ERROR] Cannot connect to Ollama API
)

echo.
echo 5. Testing Backend AI routes...
echo Response from Backend:
curl -s http://localhost:3003/api/ai/connection
if %errorlevel% neq 0 (
    echo [ERROR] Cannot connect to Backend AI routes
)

:end
echo.
echo ========================================
echo Status check complete!
echo ========================================
echo.
pause