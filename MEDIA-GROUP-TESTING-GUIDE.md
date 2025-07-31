# Media and Group Chat Testing Guide

## Features Implemented

### 1. Media Message Support
- **Images** - Photos with thumbnails and captions
- **Videos** - Video files with duration display
- **Audio** - Voice messages and audio files
- **Documents** - PDFs, Word docs, spreadsheets, etc.
- **Location** - Maps with coordinates and address
- **Contacts** - vCard contact sharing
- **Stickers** - Animated stickers

### 2. Group Chat Support
- Group conversation display with member count
- Participant names shown in messages
- Group icon and styling differentiation
- Group participant tracking in database

## Testing Steps

### Step 1: Run Database Migrations
```batch
RUN-MIGRATIONS.bat
```

### Step 2: Start All Services
```batch
START-ALL-SYSTEM.bat
```

### Step 3: Test Media Messages

1. **Send an Image**
   - Open WhatsApp on your phone
   - Send a photo to your connected number
   - Check if image appears in web interface with thumbnail

2. **Send a Video**
   - Send a video file from WhatsApp
   - Verify video player appears in chat

3. **Send a Document**
   - Send a PDF or document file
   - Check if download link appears

4. **Send Location**
   - Share your location in WhatsApp
   - Verify map preview appears

5. **Send Voice Message**
   - Record and send a voice note
   - Check if audio player appears

### Step 4: Test Group Chats

1. **Create a Group**
   - Create a new WhatsApp group
   - Add your connected number to it
   - Send a message in the group

2. **Check Web Interface**
   - Group should appear in contact list with group icon
   - Member count should be displayed
   - Messages should show participant names

### Step 5: Run Test Script
```batch
cd backend\whatsapp
node test-media-messages.js
```

## Verification Checklist

- [ ] Images display with proper thumbnails
- [ ] Videos show with player controls
- [ ] Audio messages have playback controls
- [ ] Documents show download links with file names
- [ ] Location messages show map preview
- [ ] Contact cards display properly
- [ ] Groups appear in contact list
- [ ] Group messages show sender names
- [ ] Media files can be downloaded
- [ ] Database stores all media metadata

## Troubleshooting

### Media Not Displaying
1. Check WAHA webhook configuration
2. Verify media endpoint is accessible
3. Check browser console for errors

### Groups Not Appearing
1. Ensure you're added to the group
2. Send a message in the group
3. Check database for group_participants table

### Database Errors
1. Run migrations again: `RUN-MIGRATIONS.bat`
2. Check SQLite file permissions
3. Review backend logs for errors

## API Endpoints for Testing

- **Get Media**: `GET http://localhost:3001/api/messages/media/{mediaId}`
- **List Groups**: `GET http://localhost:3001/api/contacts?isGroup=true`
- **Dashboard Stats**: `GET http://localhost:3001/api/dashboard/test`

## WebSocket Events

Monitor these events in browser console:
- `message:new` - New message received
- `conversation:updated` - Conversation updated
- `message:status` - Message status change