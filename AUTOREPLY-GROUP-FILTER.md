# Autoreply Group Filter Documentation

## Overview
Sistem autoreply sekarang hanya bekerja untuk chat personal/individual, tidak untuk group chat.

## Changes Made

### 1. AutomationEngine.js
- Added check in `processMessage()` to skip group messages
- Added check in `sendTemplateResponse()` to skip group conversations
- Group messages are identified by:
  - `message.isGroupMessage` flag
  - `conversation.isGroup` flag

### 2. SimpleMessageQueue.js
- Added filter to skip system messages (e2e_notification, etc)
- Group messages are still saved to database but not processed for autoreply

## Testing

### Test Scripts:
1. `test-autoreply-simple.js` - Test overall autoreply system
2. `test-group-filter.js` - Test group message filtering

### Run Tests:
```bash
# Restart backend
RESTART-BACKEND-CLEAN.bat

# Test autoreply system
node test-autoreply-simple.js

# Test group filter
node test-group-filter.js
```

## Behavior:
- ✅ Individual/Personal Chat: Autoreply ENABLED
- ❌ Group Chat: Autoreply DISABLED
- ❌ System Messages (e2e_notification): IGNORED

## Important Notes:
- Group messages are still stored in database for history
- Automation rules only trigger for personal chats
- Template responses only sent to individual contacts
- System maintains conversation history for both personal and group chats