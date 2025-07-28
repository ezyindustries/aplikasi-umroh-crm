const { Document } = require('../models');
const path = require('path');
const fs = require('fs');

class DocumentController {

  // Upload document for jamaah
  static async upload(req, res, next) {
    try {
      const { jamaah_id, document_type } = req.body;
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'File wajib diupload'
        });
      }

      if (!jamaah_id || !document_type) {
        return res.status(400).json({
          success: false,
          error: 'jamaah_id dan document_type wajib diisi'
        });
      }

      const documentData = {
        jamaah_id: parseInt(jamaah_id),
        document_type,
        file_name: req.file.originalname,
        file_path: req.file.path,
        file_size: req.file.size,
        mime_type: req.file.mimetype
      };

      const document = await Document.create(documentData, req.user.id);

      res.status(201).json({
        success: true,
        message: 'Dokumen berhasil diupload',
        data: document
      });
    } catch (error) {
      // Clean up uploaded file if error occurs
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      next(error);
    }
  }

  // Get documents by jamaah ID
  static async getByJamaah(req, res, next) {
    try {
      const { jamaah_id } = req.params;
      const documents = await Document.findByJamaah(jamaah_id);

      res.json({
        success: true,
        data: documents
      });
    } catch (error) {
      next(error);
    }
  }

  // Get all documents with filters
  static async getAll(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      
      const filters = {};
      if (req.query.jamaah_id) filters.jamaah_id = parseInt(req.query.jamaah_id);
      if (req.query.document_type) filters.document_type = req.query.document_type;
      if (req.query.is_verified !== undefined) filters.is_verified = req.query.is_verified === 'true';

      const result = await Document.findAll(filters, page, limit);

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  // Get document by ID
  static async getById(req, res, next) {
    try {
      const document = await Document.findById(req.params.id);
      
      if (!document) {
        return res.status(404).json({
          success: false,
          error: 'Dokumen tidak ditemukan'
        });
      }

      res.json({
        success: true,
        data: document
      });
    } catch (error) {
      next(error);
    }
  }

  // Serve/download document file
  static async downloadFile(req, res, next) {
    try {
      const document = await Document.findById(req.params.id);
      
      if (!document) {
        return res.status(404).json({
          success: false,
          error: 'Dokumen tidak ditemukan'
        });
      }

      const filePath = Document.getFilePath(document);
      
      if (!Document.fileExists(document)) {
        return res.status(404).json({
          success: false,
          error: 'File tidak ditemukan di server'
        });
      }

      // Set appropriate headers
      res.setHeader('Content-Disposition', `attachment; filename="${document.file_name}"`);
      res.setHeader('Content-Type', document.mime_type || 'application/octet-stream');

      // Stream file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      next(error);
    }
  }

  // View document file (for images/PDFs)
  static async viewFile(req, res, next) {
    try {
      const document = await Document.findById(req.params.id);
      
      if (!document) {
        return res.status(404).json({
          success: false,
          error: 'Dokumen tidak ditemukan'
        });
      }

      const filePath = Document.getFilePath(document);
      
      if (!Document.fileExists(document)) {
        return res.status(404).json({
          success: false,
          error: 'File tidak ditemukan di server'
        });
      }

      // Set appropriate headers for inline viewing
      res.setHeader('Content-Type', document.mime_type || 'application/octet-stream');
      res.setHeader('Content-Disposition', `inline; filename="${document.file_name}"`);

      // Stream file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      next(error);
    }
  }

  // Verify document
  static async verify(req, res, next) {
    try {
      const document = await Document.verify(req.params.id, req.user.id);

      res.json({
        success: true,
        message: 'Dokumen berhasil diverifikasi',
        data: document
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete document
  static async delete(req, res, next) {
    try {
      await Document.delete(req.params.id, req.user.id);

      res.json({
        success: true,
        message: 'Dokumen berhasil dihapus'
      });
    } catch (error) {
      next(error);
    }
  }

  // Get document statistics
  static async getStatistics(req, res, next) {
    try {
      const stats = await Document.getStatistics();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  // Get documents by type
  static async getByType(req, res, next) {
    try {
      const { type } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;

      const result = await Document.findByType(type, page, limit);

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  // Get unverified documents
  static async getUnverified(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;

      const result = await Document.findUnverified(page, limit);

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  // Bulk verify documents
  static async bulkVerify(req, res, next) {
    try {
      const { document_ids } = req.body;
      
      if (!document_ids || !Array.isArray(document_ids)) {
        return res.status(400).json({
          success: false,
          error: 'document_ids harus berupa array'
        });
      }

      const results = [];
      const errors = [];

      for (const id of document_ids) {
        try {
          const document = await Document.verify(id, req.user.id);
          results.push(document);
        } catch (error) {
          errors.push({ id, error: error.message });
        }
      }

      res.json({
        success: true,
        message: `${results.length} dokumen berhasil diverifikasi`,
        data: results,
        errors: errors
      });
    } catch (error) {
      next(error);
    }
  }

  // Get file info
  static async getFileInfo(req, res, next) {
    try {
      const document = await Document.findById(req.params.id);
      
      if (!document) {
        return res.status(404).json({
          success: false,
          error: 'Dokumen tidak ditemukan'
        });
      }

      const fileInfo = Document.getFileInfo(document.file_path);
      
      if (!fileInfo) {
        return res.status(404).json({
          success: false,
          error: 'File tidak ditemukan di server'
        });
      }

      res.json({
        success: true,
        data: {
          ...document,
          file_info: fileInfo
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = DocumentController;
