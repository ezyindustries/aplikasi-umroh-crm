const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class MediaDownloadService {
  constructor() {
    this.baseMediaPath = path.join(__dirname, '../../media');
    this.wahaBaseUrl = process.env.WAHA_BASE_URL || 'http://localhost:3000';
    this.sessionId = process.env.WHATSAPP_SESSION_ID || 'default';
    this.ensureMediaDirectories();
  }

  async ensureMediaDirectories() {
    const dirs = ['images', 'videos', 'documents', 'audio', 'stickers'];
    for (const dir of dirs) {
      const dirPath = path.join(this.baseMediaPath, dir);
      try {
        await fs.mkdir(dirPath, { recursive: true });
      } catch (error) {
        logger.error('Error creating media directory:', error);
      }
    }
  }

  getMediaTypeFromMimeType(mimeType) {
    if (!mimeType) return 'documents';
    
    if (mimeType.startsWith('image/')) return 'images';
    if (mimeType.startsWith('video/')) return 'videos';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('sticker')) return 'stickers';
    return 'documents';
  }

  getFileExtension(mimeType, filename) {
    // If filename has extension, use it
    if (filename && filename.includes('.')) {
      return path.extname(filename);
    }

    // Otherwise, map mime type to extension
    const mimeToExt = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'video/mp4': '.mp4',
      'video/3gpp': '.3gp',
      'audio/ogg': '.ogg',
      'audio/mpeg': '.mp3',
      'audio/mp4': '.m4a',
      'application/pdf': '.pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
      'application/vnd.ms-excel': '.xls',
      'application/msword': '.doc'
    };

    return mimeToExt[mimeType] || '.bin';
  }

  async downloadFromWAHA(messageId, mediaData) {
    try {
      // If media.url is provided, use it directly
      if (mediaData.url) {
        return await this.downloadFromUrl(mediaData.url, mediaData.mimetype, mediaData.filename);
      }

      // Otherwise, try to get media from WAHA API
      const mediaUrl = `${this.wahaBaseUrl}/api/${this.sessionId}/messages/${messageId}?downloadMedia=true`;
      
      logger.info('Attempting to download media from WAHA:', {
        messageId,
        url: mediaUrl
      });

      const response = await axios.get(mediaUrl, {
        responseType: 'json',
        timeout: 30000
      });

      if (response.data && response.data.media && response.data.media.url) {
        return await this.downloadFromUrl(
          response.data.media.url, 
          response.data.media.mimetype || mediaData.mimetype,
          response.data.media.filename || mediaData.filename
        );
      }

      throw new Error('No media URL found in WAHA response');
    } catch (error) {
      logger.error('Error downloading from WAHA:', error);
      throw error;
    }
  }

  async downloadFromUrl(url, mimeType, filename) {
    try {
      logger.info('Downloading media from URL:', {
        url,
        mimeType,
        filename
      });

      // Download the file
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 60000,
        maxContentLength: 50 * 1024 * 1024, // 50MB max
        headers: {
          'User-Agent': 'WhatsApp-CRM/1.0'
        }
      });

      // Generate unique filename
      const mediaType = this.getMediaTypeFromMimeType(mimeType);
      const extension = this.getFileExtension(mimeType, filename);
      const uniqueFilename = `${uuidv4()}${extension}`;
      const filePath = path.join(this.baseMediaPath, mediaType, uniqueFilename);

      // Save file
      await fs.writeFile(filePath, response.data);

      logger.info('Media file saved successfully:', {
        path: filePath,
        size: response.data.length,
        mimeType
      });

      return {
        filename: uniqueFilename,
        originalFilename: filename,
        path: filePath,
        relativePath: `${mediaType}/${uniqueFilename}`,
        mimeType: mimeType || response.headers['content-type'],
        size: response.data.length
      };
    } catch (error) {
      logger.error('Error downloading from URL:', error);
      throw error;
    }
  }

  async downloadAndSaveMedia(messageId, mediaData) {
    try {
      // Check if we already have this media
      const existingMedia = await this.checkExistingMedia(messageId);
      if (existingMedia) {
        logger.info('Media already exists:', existingMedia);
        return existingMedia;
      }

      // Download the media
      const downloadResult = await this.downloadFromWAHA(messageId, mediaData);

      // Save media info to database
      const { MediaFile, Message } = require('../models');
      
      // Find the message to link the media
      const message = await Message.findOne({
        where: { whatsappMessageId: messageId }
      });
      
      if (message) {
        const mediaRecord = await MediaFile.create({
          messageId: message.id,
          filePath: downloadResult.relativePath,
          fileName: downloadResult.originalFilename || downloadResult.filename,
          mimeType: downloadResult.mimeType,
          fileSize: downloadResult.size,
          whatsappMediaId: messageId,
          downloadStatus: 'completed',
          downloadedAt: new Date()
        });

        return {
          ...downloadResult,
          id: mediaRecord.id
        };
      }

      return downloadResult;
    } catch (error) {
      logger.error('Error in downloadAndSaveMedia:', error);
      throw error;
    }
  }

  async checkExistingMedia(messageId) {
    try {
      const { MediaFile, Message } = require('../models');
      
      // Find message first
      const message = await Message.findOne({
        where: { whatsappMessageId: messageId }
      });
      
      if (!message) return null;
      
      const media = await MediaFile.findOne({
        where: { 
          messageId: message.id,
          downloadStatus: 'completed'
        }
      });

      if (media) {
        // Check if file still exists
        const fullPath = path.join(this.baseMediaPath, media.filePath);
        try {
          await fs.access(fullPath);
          return {
            filename: path.basename(media.filePath),
            path: media.filePath,
            mimeType: media.mimeType,
            size: media.fileSize
          };
        } catch {
          // File doesn't exist, update status
          await media.update({ downloadStatus: 'failed' });
          return null;
        }
      }

      return null;
    } catch (error) {
      logger.error('Error checking existing media:', error);
      return null;
    }
  }

  async getMediaFile(filename) {
    try {
      // Try to find in all media directories
      const dirs = ['images', 'videos', 'documents', 'audio', 'stickers'];
      
      for (const dir of dirs) {
        const filePath = path.join(this.baseMediaPath, dir, filename);
        try {
          await fs.access(filePath);
          const stats = await fs.stat(filePath);
          const content = await fs.readFile(filePath);
          
          return {
            content,
            stats,
            path: filePath
          };
        } catch {
          // File not in this directory, continue
        }
      }

      throw new Error('Media file not found');
    } catch (error) {
      logger.error('Error getting media file:', error);
      throw error;
    }
  }

  async deleteMediaFile(filename) {
    try {
      const dirs = ['images', 'videos', 'documents', 'audio', 'stickers'];
      
      for (const dir of dirs) {
        const filePath = path.join(this.baseMediaPath, dir, filename);
        try {
          await fs.unlink(filePath);
          logger.info('Media file deleted:', filePath);
          return true;
        } catch {
          // File not in this directory, continue
        }
      }

      return false;
    } catch (error) {
      logger.error('Error deleting media file:', error);
      return false;
    }
  }

  // Clean up old media files
  async cleanupOldMedia(daysToKeep = 30) {
    try {
      const { MediaFile } = require('../models');
      const { Op } = require('sequelize');
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      // Find old media records
      const oldMedia = await MediaFile.findAll({
        where: {
          downloadedAt: {
            [Op.lt]: cutoffDate
          },
          downloadStatus: 'completed'
        }
      });

      let deletedCount = 0;
      for (const media of oldMedia) {
        const filename = path.basename(media.filePath);
        const deleted = await this.deleteMediaFile(filename);
        if (deleted) {
          await media.destroy();
          deletedCount++;
        }
      }

      logger.info(`Cleanup completed: ${deletedCount} media files deleted`);
      return deletedCount;
    } catch (error) {
      logger.error('Error in media cleanup:', error);
      return 0;
    }
  }
}

module.exports = new MediaDownloadService();