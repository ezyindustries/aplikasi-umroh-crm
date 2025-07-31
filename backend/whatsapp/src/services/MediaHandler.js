const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const logger = require('../utils/logger');

class MediaHandler {
  constructor() {
    this.mediaPath = path.join(__dirname, '../../media');
    this.ensureMediaDirectory();
  }

  async ensureMediaDirectory() {
    try {
      await fs.mkdir(this.mediaPath, { recursive: true });
    } catch (error) {
      logger.error('Error creating media directory:', error);
    }
  }

  /**
   * Save base64 media data to file
   * @param {string} base64Data - Base64 encoded media data
   * @param {string} mimeType - MIME type of the media
   * @param {string} messageId - Message ID for reference
   * @returns {Promise<{path: string, filename: string}>}
   */
  async saveBase64Media(base64Data, mimeType, messageId) {
    try {
      // Generate filename based on mime type
      const extension = this.getExtensionFromMimeType(mimeType);
      const filename = `${messageId}${extension}`;
      const filePath = path.join(this.mediaPath, filename);

      // Convert base64 to buffer and save
      const buffer = Buffer.from(base64Data, 'base64');
      await fs.writeFile(filePath, buffer);

      logger.info(`Media saved: ${filename}`);
      return {
        path: filePath,
        filename: filename
      };
    } catch (error) {
      logger.error('Error saving media:', error);
      throw error;
    }
  }

  /**
   * Get file extension from MIME type
   */
  getExtensionFromMimeType(mimeType) {
    const mimeMap = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'video/mp4': '.mp4',
      'video/3gpp': '.3gp',
      'audio/ogg': '.ogg',
      'audio/mpeg': '.mp3',
      'audio/wav': '.wav',
      'application/pdf': '.pdf',
      'application/vnd.ms-excel': '.xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
      'application/msword': '.doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    };
    return mimeMap[mimeType] || '.bin';
  }

  /**
   * Serve media file
   */
  async getMedia(messageId) {
    try {
      // Try different extensions
      const extensions = ['.jpg', '.png', '.gif', '.webp', '.mp4', '.pdf', '.bin'];
      
      for (const ext of extensions) {
        const filename = `${messageId}${ext}`;
        const filePath = path.join(this.mediaPath, filename);
        
        try {
          await fs.access(filePath);
          const data = await fs.readFile(filePath);
          return {
            data: data,
            mimeType: this.getMimeTypeFromExtension(ext),
            filename: filename
          };
        } catch (error) {
          // File doesn't exist with this extension, try next
          continue;
        }
      }
      
      throw new Error('Media file not found');
    } catch (error) {
      logger.error('Error retrieving media:', error);
      throw error;
    }
  }

  getMimeTypeFromExtension(ext) {
    const extMap = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.mp4': 'video/mp4',
      '.3gp': 'video/3gpp',
      '.ogg': 'audio/ogg',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.pdf': 'application/pdf',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.bin': 'application/octet-stream'
    };
    return extMap[ext] || 'application/octet-stream';
  }
}

module.exports = new MediaHandler();