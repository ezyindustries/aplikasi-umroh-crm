@echo off
echo Testing Autoreply with Enhanced Logging
echo ======================================
echo.

echo 1. First, let's check if backend is running...
curl -s http://localhost:3003/api/health > nul 2>&1
if %errorlevel% neq 0 (
    echo Backend is not running! Please start it first.
    pause
    exit /b 1
)
echo Backend is running OK

echo.
echo 2. Sending test messages to trigger automation rules...
echo.

REM Test 1: Keyword-based rule
echo Test 1: Sending keyword message "info paket"
curl -X POST http://localhost:3003/api/webhook/waha ^
  -H "Content-Type: application/json" ^
  -d "{\"event\":\"message\",\"session\":\"default\",\"me\":{\"id\":\"628113032232@c.us\",\"pushName\":\"Vauza Tamma\"},\"payload\":{\"id\":\"3EB0B5F5A1B2C3D4E5F6_0@c.us\",\"timestamp\":1701320400,\"from\":\"6281234567890@c.us\",\"fromMe\":false,\"to\":\"628113032232@c.us\",\"body\":\"Halo, saya mau info paket umroh dong\",\"hasMedia\":false,\"ack\":0,\"vCards\":[],\"_data\":{\"id\":{\"fromMe\":false,\"remote\":\"6281234567890@c.us\",\"id\":\"3EB0B5F5A1B2C3D4E5F6_0\",\"_serialized\":\"false_6281234567890@c.us_3EB0B5F5A1B2C3D4E5F6_0\"},\"body\":\"Halo, saya mau info paket umroh dong\",\"type\":\"chat\",\"t\":1701320400,\"from\":\"6281234567890@c.us\",\"to\":\"628113032232@c.us\"}}}"

timeout /t 3 > nul

REM Test 2: Template-based rule
echo.
echo Test 2: Sending inquiry about price
curl -X POST http://localhost:3003/api/webhook/waha ^
  -H "Content-Type: application/json" ^
  -d "{\"event\":\"message\",\"session\":\"default\",\"me\":{\"id\":\"628113032232@c.us\",\"pushName\":\"Vauza Tamma\"},\"payload\":{\"id\":\"3EB0B5F5A1B2C3D4E5F7_0@c.us\",\"timestamp\":1701320410,\"from\":\"6281234567891@c.us\",\"fromMe\":false,\"to\":\"628113032232@c.us\",\"body\":\"Berapa harga paket umroh 12 hari?\",\"hasMedia\":false,\"ack\":0,\"vCards\":[],\"_data\":{\"id\":{\"fromMe\":false,\"remote\":\"6281234567891@c.us\",\"id\":\"3EB0B5F5A1B2C3D4E5F7_0\",\"_serialized\":\"false_6281234567891@c.us_3EB0B5F5A1B2C3D4E5F7_0\"},\"body\":\"Berapa harga paket umroh 12 hari?\",\"type\":\"chat\",\"t\":1701320410,\"from\":\"6281234567891@c.us\",\"to\":\"628113032232@c.us\"}}}"

timeout /t 3 > nul

REM Test 3: Greeting message
echo.
echo Test 3: Sending greeting message
curl -X POST http://localhost:3003/api/webhook/waha ^
  -H "Content-Type: application/json" ^
  -d "{\"event\":\"message\",\"session\":\"default\",\"me\":{\"id\":\"628113032232@c.us\",\"pushName\":\"Vauza Tamma\"},\"payload\":{\"id\":\"3EB0B5F5A1B2C3D4E5F8_0@c.us\",\"timestamp\":1701320420,\"from\":\"6281234567892@c.us\",\"fromMe\":false,\"to\":\"628113032232@c.us\",\"body\":\"Assalamualaikum\",\"hasMedia\":false,\"ack\":0,\"vCards\":[],\"_data\":{\"id\":{\"fromMe\":false,\"remote\":\"6281234567892@c.us\",\"id\":\"3EB0B5F5A1B2C3D4E5F8_0\",\"_serialized\":\"false_6281234567892@c.us_3EB0B5F5A1B2C3D4E5F8_0\"},\"body\":\"Assalamualaikum\",\"type\":\"chat\",\"t\":1701320420,\"from\":\"6281234567892@c.us\",\"to\":\"628113032232@c.us\"}}}"

echo.
echo.
echo 3. Waiting for processing to complete...
timeout /t 5 > nul

echo.
echo 4. Checking new logs in database...
echo.

REM Run test script to check logs
cd backend\whatsapp
node test-api-endpoint.js

echo.
echo.
echo Test completed! Check the Autoreply Management page now.
echo.
pause