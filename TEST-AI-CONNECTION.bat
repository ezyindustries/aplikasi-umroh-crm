@echo off
echo Testing AI Connection...
echo.
echo 1. Testing Ollama direct connection...
curl -s http://localhost:11434/api/tags > nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Ollama is running on port 11434
) else (
    echo [ERROR] Ollama is not running. Please run: ollama serve
)
echo.
echo 2. Testing Backend proxy...
curl -s http://localhost:3003/api/ai/connection > nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Backend proxy is running on port 3003
) else (
    echo [ERROR] Backend is not running. Please run: npm start in backend/whatsapp
)
echo.
echo 3. Opening test page...
start "" "test-ollama-connection.html"
echo.
pause