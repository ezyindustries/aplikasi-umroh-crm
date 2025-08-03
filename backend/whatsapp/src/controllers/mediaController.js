const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const logger = require('../utils/logger');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads');
        try {
            await fs.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        } catch (error) {
            cb(error);
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

// File filter for allowed types
const fileFilter = (req, file, cb) => {
    const allowedMimes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only images and documents are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 16 * 1024 * 1024 // 16MB limit (WAHA Plus supports up to 16MB)
    }
});

const mediaController = {
    // Upload media file
    uploadMedia: async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    error: 'No file uploaded'
                });
            }
            
            const file = req.file;
            const baseUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 3003}`;
            const fileUrl = `${baseUrl}/uploads/${file.filename}`;
            
            logger.info('Media uploaded:', {
                filename: file.filename,
                originalName: file.originalname,
                size: file.size,
                mimetype: file.mimetype
            });
            
            res.json({
                success: true,
                url: fileUrl,
                filename: file.filename,
                originalName: file.originalname,
                size: file.size,
                mimetype: file.mimetype
            });
            
        } catch (error) {
            logger.error('Error uploading media:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to upload media'
            });
        }
    },
    
    // Get media file
    getMedia: async (req, res) => {
        try {
            const { filename } = req.params;
            const filePath = path.join(__dirname, '../../uploads', filename);
            
            // Check if file exists
            await fs.access(filePath);
            
            // Send file
            res.sendFile(filePath);
            
        } catch (error) {
            logger.error('Error getting media:', error);
            res.status(404).json({
                success: false,
                error: 'Media not found'
            });
        }
    },
    
    // Delete media file
    deleteMedia: async (req, res) => {
        try {
            const { filename } = req.params;
            const filePath = path.join(__dirname, '../../uploads', filename);
            
            // Delete file
            await fs.unlink(filePath);
            
            logger.info('Media deleted:', filename);
            
            res.json({
                success: true,
                message: 'Media deleted successfully'
            });
            
        } catch (error) {
            logger.error('Error deleting media:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete media'
            });
        }
    }
};

module.exports = {
    mediaController,
    upload
};