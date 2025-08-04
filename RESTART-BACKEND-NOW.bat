@echo off
echo RESTARTING BACKEND...
taskkill /F /IM node.exe 2^
timeout /t 2 /nobreak ^
cd backendwhatsapp
npm start
