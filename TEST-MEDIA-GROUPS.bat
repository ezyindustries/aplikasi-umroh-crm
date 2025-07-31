@echo off
echo ===============================================
echo TESTING MEDIA AND GROUP MESSAGING
echo ===============================================
echo.

cd /d "%~dp0backend\whatsapp"

echo [1/5] Testing database schema...
echo.
node -e "const { sequelize, Message, Contact, Conversation, GroupParticipant, MediaFile } = require('./src/models'); (async () => { try { await sequelize.authenticate(); console.log('✅ Database connection successful'); const messageDesc = await Message.describe(); console.log('✅ Message table has', Object.keys(messageDesc).length, 'columns'); if (messageDesc.mediaId) console.log('✅ Media fields present'); if (messageDesc.isGroupMessage) console.log('✅ Group fields present'); const contactDesc = await Contact.describe(); if (contactDesc.isGroup) console.log('✅ Contact group fields present'); const tables = await sequelize.getQueryInterface().showAllTables(); if (tables.includes('group_participants')) console.log('✅ Group participants table exists'); if (tables.includes('media_files')) console.log('✅ Media files table exists'); } catch (error) { console.error('❌ Database test failed:', error.message); } })();"

echo.
echo [2/5] Testing WAHA connection...
echo.
curl -s http://localhost:3000/api/default/sessions/ | node -pe "try { const data = JSON.parse(require('fs').readFileSync(0, 'utf-8')); if (data && data.length > 0) { console.log('✅ WAHA is running'); console.log('Sessions:', data.map(s => s.name).join(', ')); } else { console.log('⚠️ No sessions found'); } } catch(e) { console.log('❌ WAHA not accessible'); }"

echo.
echo [3/5] Testing webhook configuration...
echo.
curl -s http://localhost:3000/api/default/sessions/default | node -pe "try { const data = JSON.parse(require('fs').readFileSync(0, 'utf-8')); if (data.config && data.config.webhooks) { console.log('✅ Webhook configured:', data.config.webhooks[0].url); console.log('Events:', data.config.webhooks[0].events.join(', ')); } else { console.log('⚠️ No webhook configured'); } } catch(e) { console.log('❌ Could not check webhook'); }"

echo.
echo [4/5] Testing backend endpoints...
echo.
echo Testing media endpoint...
curl -s -o nul -w "Media endpoint: %%{http_code}\n" http://localhost:3001/api/messages/media/test
echo.
echo Testing dashboard endpoint...
curl -s http://localhost:3001/api/dashboard/test | node -pe "try { const data = JSON.parse(require('fs').readFileSync(0, 'utf-8')); console.log('Database stats:', JSON.stringify(data.data, null, 2)); } catch(e) { console.log('❌ Backend not accessible'); }"

echo.
echo [5/5] Frontend check...
echo.
if exist "%~dp0frontend\conversations-beautiful.html" (
    echo ✅ Frontend files present
    echo.
    echo To test media and group features:
    echo 1. Open http://localhost:8080/conversations-beautiful.html
    echo 2. Send an image/video/document from WhatsApp
    echo 3. Join a group chat and send messages
    echo 4. Check if media displays correctly
    echo 5. Check if group names and participants show
) else (
    echo ❌ Frontend files not found
)

echo.
echo ===============================================
echo TEST COMPLETE
echo ===============================================
echo.
echo Next steps:
echo 1. Send test messages with media from WhatsApp
echo 2. Create or join a group chat
echo 3. Monitor the console for any errors
echo 4. Check if messages appear in the web interface
echo.
pause