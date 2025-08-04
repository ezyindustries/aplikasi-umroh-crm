@echo off
echo ==========================================
echo Checking Template Routes
echo ==========================================
echo.

echo Available template endpoints:
echo -----------------------------
curl -s http://localhost:3003/api/templates
echo.
echo.

echo Testing specific endpoints:
echo ---------------------------
echo 1. GET /templates/1
curl -s http://localhost:3003/api/templates/1 | findstr "success"
echo.

echo 2. POST /templates/1/toggle
curl -X POST http://localhost:3003/api/templates/1/toggle -H "Content-Type: application/json" -d "{}"
echo.
echo.

echo 3. List all API routes (debug)
echo ------------------------------
curl -s http://localhost:3003/api/debug/routes 2>nul
echo.

echo ==========================================
echo If toggle returns 404, backend needs restart.
echo Run RESTART-BACKEND-TEMPLATE.bat
echo ==========================================
echo.
pause