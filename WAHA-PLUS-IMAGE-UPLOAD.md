# WAHA Plus Image Upload Documentation

## Overview
Sistem sekarang mendukung pengiriman gambar melalui WhatsApp menggunakan WAHA Plus.

## What's New

### 1. Backend Updates
- **Media Controller** (`backend/whatsapp/src/controllers/mediaController.js`)
  - Upload endpoint untuk gambar dan dokumen
  - Support untuk file hingga 16MB (batas WAHA Plus)
  - Automatic file type validation

- **API Routes** (`backend/whatsapp/src/routes/api.js`)
  - POST `/api/media/upload` - Upload file
  - GET `/api/media/:filename` - Get uploaded file
  - DELETE `/api/media/:filename` - Delete file

- **Static File Serving** (`backend/whatsapp/server.js`)
  - Serving uploaded files dari `/uploads` directory
  - CORS headers untuk cross-origin access

### 2. Existing Support
- **SimpleMessageQueue** sudah mendukung pengiriman gambar
- **RealWAHAService** sudah memiliki method `sendImageMessage()`
- **AutomationEngine** sudah bisa mengirim gambar untuk template response

### 3. Test Tools
- **test-image-upload.html** - Test page untuk:
  - Upload gambar ke server
  - Kirim gambar via WhatsApp
  - Test dengan caption
  - Check WAHA status

## How to Use

### 1. Restart Backend
```bash
RESTART-BACKEND-SIMPLE.bat
```

### 2. Test Image Upload
Buka browser dan akses:
```
http://localhost:8080/test-image-upload.html
```

### 3. Test Steps:
1. **Upload Test**: Pilih gambar dan klik "Test Upload"
2. **Send Test**: Masukkan nomor WhatsApp dan klik "Send Image"
3. **Verify**: Cek WhatsApp penerima untuk memastikan gambar terkirim

## Integration with Frontend

### Conversations Page
Untuk menggunakan fitur image di halaman conversations:
1. Gunakan `conversations-with-images.html` (prototype dengan UI image upload)
2. Atau update existing `conversations-beautiful.html` dengan menambahkan:
   - File input untuk gambar
   - Preview modal
   - Upload progress indicator

### Code Example - Send Image
```javascript
// Upload image first
const formData = new FormData();
formData.append('file', imageFile);

const uploadResponse = await fetch('http://localhost:3003/api/media/upload', {
    method: 'POST',
    body: formData
});

const uploadResult = await uploadResponse.json();
const imageUrl = uploadResult.url;

// Send image message
const messageData = {
    conversationId: conversationId,
    toNumber: phoneNumber,
    messageType: 'image',
    content: caption, // optional caption
    mediaUrl: imageUrl
};

const response = await fetch('http://localhost:3003/api/messages/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(messageData)
});
```

## Supported File Types

### Images
- JPEG/JPG
- PNG
- GIF
- WebP

### Documents (future)
- PDF
- DOC/DOCX
- XLS/XLSX

## Important Notes

1. **WAHA Plus Required**: Image sending requires WAHA Plus license
2. **File Size Limit**: Maximum 16MB per file
3. **Auto-cleanup**: Implement cleanup for old uploaded files
4. **Security**: Files are validated before upload
5. **Performance**: Large images should be compressed client-side

## Troubleshooting

### Error: "Image sending requires WAHA Plus version"
- Pastikan WAHA Plus sudah terinstall dan aktif
- Check license status di WAHA dashboard

### Error: "Failed to upload media"
- Check file size (max 16MB)
- Verify file type is supported
- Ensure uploads directory exists and writable

### Images not showing
- Check CORS settings
- Verify static file serving is working
- Test direct image URL access

## Next Steps

1. **Add to Main UI**: Integrate image upload to main conversation page
2. **Image Compression**: Add client-side compression for large images
3. **Progress Tracking**: Show real-time upload progress
4. **Bulk Send**: Support sending multiple images
5. **Image Gallery**: Show sent/received images in gallery view