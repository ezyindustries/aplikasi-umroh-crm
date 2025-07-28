@echo off
echo ========================================
echo Starting Frontend Server on Port 8081
echo ========================================
echo.

cd frontend
echo Starting server at http://localhost:8081
echo Press Ctrl+C to stop the server
echo.

python -m http.server 8081

pause