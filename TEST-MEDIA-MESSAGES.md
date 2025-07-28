# Testing Guide: WhatsApp Media Messages (Images, PDF, Files)

## Overview
Sistem sekarang mendukung pengiriman dan penerimaan berbagai jenis media melalui WhatsApp:
- **Images**: JPEG, PNG, GIF, WebP
- **Documents**: PDF, Word, Excel
- **Videos**: MP4, MPEG
- **Audio**: MP3, WAV, OGG

## Prerequisites

1. Pastikan semua service running:
```bash
docker-compose ps
# Semua harus healthy
```

2. WhatsApp harus connected
3. Folder uploads harus writable:
```bash
# Windows
mkdir uploads\whatsapp 2>nul

# Linux/Mac
mkdir -p uploads/whatsapp
chmod 755 uploads/whatsapp
```

## Test Scenarios

### 1. Test Upload Image

**Steps:**
1. Buka conversation di dashboard
2. Klik tombol 📎 (attach file) di sebelah input chat
3. Pilih file gambar (JPG/PNG)
4. Preview akan muncul
5. Tambahkan caption (optional)
6. Klik Send

**Expected:**
- Preview menampilkan gambar
- Gambar terkirim dengan caption
- Muncul di chat dengan thumbnail
- Penerima menerima gambar di WhatsApp

**Test different formats:**
```javascript
// Test di console
const testImages = [
    'test-image.jpg',    // JPEG
    'test-image.png',    // PNG
    'test-image.gif',    // Animated GIF
    'test-image.webp'    // WebP
];
```

### 2. Test Upload PDF

**Steps:**
1. Klik attach file
2. Pilih file PDF
3. Preview menampilkan icon PDF + nama file + ukuran
4. Send

**Expected:**
- PDF terkirim sebagai document
- Penerima bisa download PDF
- Nama file terlihat di chat

### 3. Test Drag & Drop

**Steps:**
1. Drag file dari explorer/finder
2. Drop ke area chat messages
3. Area chat akan highlight saat drag over
4. File akan auto preview setelah drop

**Expected:**
- Visual feedback saat drag over
- Auto preview setelah drop
- Support multiple files

### 4. Test File Size Limit

**Steps:**
1. Coba upload file > 100MB
2. Expected: Error message "File too large"

**Test script:**
```javascript
// Create large file for testing
function createLargeFile() {
    const size = 101 * 1024 * 1024; // 101MB
    const blob = new Blob([new ArrayBuffer(size)]);
    const file = new File([blob], 'large-file.bin');
    
    // Trigger upload
    mediaUploadHandler.handleFiles([file]);
}
```

### 5. Test Multiple File Types

**Test Word Document:**
```bash
# Upload .docx file
Expected: Document icon, filename visible, downloadable
```

**Test Excel:**
```bash
# Upload .xlsx file  
Expected: Spreadsheet icon, proper handling
```

**Test Video:**
```bash
# Upload .mp4 file (< 100MB)
Expected: Video preview with controls, can play before send
```

### 6. Test Incoming Media

**From WhatsApp to Dashboard:**

1. **Send Image from WhatsApp:**
   - Send image from phone to bot number
   - Expected: Image appears in dashboard chat
   - Can click to view full size

2. **Send PDF from WhatsApp:**
   - Send PDF document
   - Expected: Shows as document with download link

3. **Send Voice Note:**
   - Record voice note in WhatsApp
   - Expected: Audio player in dashboard

### 7. Test Rate Limiting with Media

**Steps:**
1. Send 5 media messages quickly
2. 6th should be rate limited
3. Media messages count toward rate limit

**Expected:**
- Same rate limits apply
- Queue shows longer time for media (3s vs 2s)

### 8. Test Media with Caption

**Test Cases:**
1. Image with caption
2. PDF with description
3. Video with long caption (>500 chars)
4. Special characters in caption: emojis 😊, symbols @#$

**Expected:**
- Caption appears below media
- Special characters handled properly
- Long captions truncated in preview

### 9. Test Error Handling

**Network Error During Upload:**
```javascript
// Simulate network error
const originalFetch = window.fetch;
window.fetch = () => Promise.reject(new Error('Network error'));

// Try upload
// Should show error message
// File should not be stuck

window.fetch = originalFetch; // Restore
```

**WAHA Offline:**
1. Stop WAHA container
2. Try sending media
3. Expected: Queued but failed status
4. Retry button should appear

### 10. Test Media Preview Features

**Image Preview:**
- Click image in chat → Opens in new tab
- Zoom functionality
- Download option

**Video Preview:**
- Play controls work
- Fullscreen option
- Audio works

**Document Preview:**
- Click downloads file
- Correct filename preserved
- Opens in default app

## Performance Testing

### Upload Speed Test:
```javascript
async function testUploadSpeed() {
    const sizes = [1, 5, 10, 20, 50]; // MB
    
    for (const size of sizes) {
        const blob = new Blob([new ArrayBuffer(size * 1024 * 1024)]);
        const file = new File([blob], `test-${size}mb.bin`);
        
        console.time(`Upload ${size}MB`);
        // Upload file
        console.timeEnd(`Upload ${size}MB`);
    }
}
```

### Expected Performance:
- 1MB: < 2 seconds
- 10MB: < 10 seconds  
- 50MB: < 30 seconds
- 100MB: < 60 seconds

## API Testing

### Test Media Upload Endpoint:
```bash
curl -X POST http://localhost:3000/api/crm/conversations/CONV_ID/media \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@test-image.jpg" \
  -F "caption=Test image from API" \
  -F "isReply=false"
```

### Expected Response:
```json
{
  "success": true,
  "data": {
    "id": "msg-uuid",
    "type": "image",
    "content": "Test image from API",
    "media_url": "/uploads/whatsapp/wa-1234567890.jpg",
    "status": "queued"
  },
  "queue": {
    "id": "queue-123",
    "position": 1,
    "estimatedTime": 3
  }
}
```

## WebSocket Events

Monitor media events:
```javascript
ws.addEventListener('message', (event) => {
    const data = JSON.parse(event.data);
    
    if (data.type === 'new_message' && data.message.media_url) {
        console.log('New media message:', data.message);
    }
});
```

## Troubleshooting

### Media Not Sending:
1. Check file permissions on uploads folder
2. Verify WAHA supports media endpoints
3. Check console for errors
4. Verify file type is allowed

### Preview Not Working:
1. Check browser console for errors
2. Verify file reader permissions
3. Try different browser

### Download Not Working:
1. Check static file serving
2. Verify uploads path in Express
3. Check file exists on server

## Security Considerations

### File Type Validation:
- Only allowed MIME types accepted
- File extension validation
- Content-type verification

### File Size Limits:
- Frontend: 100MB max
- Backend: Configurable limit
- Chunked upload for large files

### Path Traversal Protection:
- Sanitized filenames
- No directory navigation allowed
- Random filename generation

### Access Control:
- Files served through Express
- Authentication required
- Rate limiting applied

## Monitoring

### Check Upload Stats:
```sql
-- Daily media message count
SELECT 
    DATE(created_at) as date,
    type,
    COUNT(*) as count
FROM wa_messages
WHERE type != 'text'
GROUP BY DATE(created_at), type
ORDER BY date DESC;

-- Average file sizes
SELECT 
    type,
    AVG(LENGTH(media_url)) as avg_path_length,
    COUNT(*) as total
FROM wa_messages
WHERE media_url IS NOT NULL
GROUP BY type;
```

### Disk Usage:
```bash
# Check uploads folder size
du -sh uploads/whatsapp/

# Find large files
find uploads/whatsapp -type f -size +10M -ls

# Clean old files (>30 days)
find uploads/whatsapp -type f -mtime +30 -delete
```

## Success Criteria

✅ **Upload Working:**
- [ ] All file types upload successfully
- [ ] Preview shows correctly
- [ ] Progress indication visible
- [ ] Error messages clear

✅ **Send/Receive Working:**
- [ ] Media queued with proper delay
- [ ] Shows in both sender and receiver
- [ ] Download works properly
- [ ] Captions display correctly

✅ **Performance:**
- [ ] Upload completes in reasonable time
- [ ] No UI freezing during upload
- [ ] Multiple uploads handled well
- [ ] Memory usage acceptable

✅ **User Experience:**
- [ ] Intuitive file selection
- [ ] Clear preview interface
- [ ] Drag & drop works smoothly
- [ ] Error handling graceful