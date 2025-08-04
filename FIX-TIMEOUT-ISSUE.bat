@echo off
echo ===============================================
echo FIXING WAHA TIMEOUT ISSUE
echo ===============================================
echo.

echo [1] Clearing message queue...
echo Please wait...

REM Create a script to clear stuck messages
echo const { Message } = require('./backend/whatsapp/src/models'); > clear-queue.js
echo const { Op } = require('sequelize'); >> clear-queue.js
echo. >> clear-queue.js
echo async function clearStuckMessages() { >> clear-queue.js
echo   try { >> clear-queue.js
echo     // Update all pending messages to failed >> clear-queue.js
echo     const result = await Message.update( >> clear-queue.js
echo       { >> clear-queue.js
echo         status: 'failed', >> clear-queue.js
echo         errorMessage: 'Cleared due to timeout issues' >> clear-queue.js
echo       }, >> clear-queue.js
echo       { >> clear-queue.js
echo         where: { >> clear-queue.js
echo           status: 'pending', >> clear-queue.js
echo           createdAt: { >> clear-queue.js
echo             [Op.lt]: new Date(Date.now() - 60000) // Older than 1 minute >> clear-queue.js
echo           } >> clear-queue.js
echo         } >> clear-queue.js
echo       } >> clear-queue.js
echo     ); >> clear-queue.js
echo     console.log(`Cleared ${result[0]} stuck messages`); >> clear-queue.js
echo   } catch (error) { >> clear-queue.js
echo     console.error('Error:', error); >> clear-queue.js
echo   } >> clear-queue.js
echo   process.exit(0); >> clear-queue.js
echo } >> clear-queue.js
echo. >> clear-queue.js
echo clearStuckMessages(); >> clear-queue.js

node clear-queue.js
del clear-queue.js

echo.
echo [2] Restarting WAHA container...
docker restart waha-plus

echo.
echo [3] Waiting for WAHA to be ready...
timeout /t 10 /nobreak

echo.
echo [4] Testing WAHA connection...
node test-waha-connection.js

echo.
echo ===============================================
echo Fix completed!
echo - Stuck messages have been cleared
echo - WAHA container has been restarted
echo - Please restart your backend server as well
echo ===============================================
pause