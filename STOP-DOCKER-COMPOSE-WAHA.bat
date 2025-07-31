@echo off
echo Stopping docker-compose WAHA...
docker-compose -f docker-compose.waha.yml down
echo.
echo Docker-compose WAHA stopped.
echo You can continue using whatsapp-http-api on port 3000
echo.
pause