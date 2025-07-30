@echo off
echo ===============================================
echo FIXING WEBSOCKET CONNECTION ISSUES
echo ===============================================
echo.

echo [1/4] Checking service status...
netstat -an | findstr ":3000 :3001 :8080" | findstr "LISTENING"

echo.
echo [2/4] Testing backend health...
curl -s http://localhost:3001/api/health || echo Backend not responding

echo.
echo [3/4] Testing Socket.IO endpoint...
curl -s http://localhost:3001/socket.io/?EIO=4^&transport=polling || echo Socket.IO not accessible

echo.
echo [4/4] Opening test page...
echo.
echo Please open http://localhost:8080/test-socketio.html in your browser
echo This page will help diagnose Socket.IO connection issues
echo.
echo If WebSocket fails but polling works, that's OK - Socket.IO will use polling
echo.
echo TIPS:
echo - Make sure all services are running (WAHA, Backend, Frontend)
echo - Check browser console for detailed error messages
echo - WebSocket may fail due to antivirus/firewall - polling is a good fallback
echo.
pause