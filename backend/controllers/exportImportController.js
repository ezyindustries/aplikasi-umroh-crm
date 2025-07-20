const exportImportService = require('../services/exportImportService');
const { logActivity } = require('../utils/activityLogger');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/imports/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

class ExportImportController {

  // Generate templates
  static async generateJamaahTemplate(req, res, next) {
    try {
      const result = await exportImportService.generateJamaahTemplate();

      await logActivity(req.user.id, 'export', 'template', 'Generated jamaah import template', req.ip);

      res.download(result.filepath, result.filename);
    } catch (error) {
      next(error);
    }
  }

  static async generatePaymentTemplate(req, res, next) {
    try {
      const result = await exportImportService.generatePaymentTemplate();

      await logActivity(req.user.id, 'export', 'template', 'Generated payment import template', req.ip);

      res.download(result.filepath, result.filename);
    } catch (error) {
      next(error);
    }
  }

  // Export data
  static async exportJamaah(req, res, next) {
    try {
      const filters = {
        package_id: req.query.package_id ? parseInt(req.query.package_id) : undefined,
        jamaah_status: req.query.jamaah_status,
        visa_status: req.query.visa_status,
        payment_status: req.query.payment_status,
        created_from: req.query.created_from,
        created_to: req.query.created_to
      };

      const result = await exportImportService.exportAllJamaah(filters);

      await logActivity(req.user.id, 'export', 'jamaah', `Exported ${result.recordCount} jamaah records`, req.ip);

      res.download(result.filepath, result.filename);
    } catch (error) {
      next(error);
    }
  }

  static async exportPayments(req, res, next) {
    try {
      const filters = {
        jamaah_id: req.query.jamaah_id ? parseInt(req.query.jamaah_id) : undefined,
        payment_method: req.query.payment_method,
        verified: req.query.verified,
        date_from: req.query.date_from,
        date_to: req.query.date_to
      };

      const result = await exportImportService.exportPayments(filters);

      await logActivity(req.user.id, 'export', 'payments', `Exported ${result.recordCount} payment records`, req.ip);

      res.download(result.filepath, result.filename);
    } catch (error) {
      next(error);
    }
  }

  static async exportPackages(req, res, next) {
    try {
      const result = await exportImportService.exportPackages();

      await logActivity(req.user.id, 'export', 'packages', `Exported ${result.recordCount} package records`, req.ip);

      res.download(result.filepath, result.filename);
    } catch (error) {
      next(error);
    }
  }

  static async exportGroups(req, res, next) {
    try {
      const filters = {
        package_id: req.query.package_id ? parseInt(req.query.package_id) : undefined
      };

      const result = await exportImportService.exportGroups(filters);

      await logActivity(req.user.id, 'export', 'groups', `Exported ${result.recordCount} group records`, req.ip);

      res.download(result.filepath, result.filename);
    } catch (error) {
      next(error);
    }
  }

  // Import data
  static async importJamaah(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded'
        });
      }

      const result = await exportImportService.importJamaahFromExcel(req.file.path, req.user.id);

      await logActivity(
        req.user.id, 
        'import', 
        'jamaah', 
        `Imported jamaah: ${result.success} success, ${result.failed} failed`, 
        req.ip
      );

      // Clean up uploaded file
      const fs = require('fs').promises;
      try {
        await fs.unlink(req.file.path);
      } catch (error) {
        console.warn('Failed to delete upload file:', error.message);
      }

      res.json({
        success: true,
        data: result,
        message: `Import completed: ${result.success} records imported, ${result.failed} failed`
      });
    } catch (error) {
      // Clean up uploaded file on error
      if (req.file) {
        const fs = require('fs').promises;
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          console.warn('Failed to delete upload file after error:', unlinkError.message);
        }
      }
      next(error);
    }
  }

  // Get statistics
  static async getStatistics(req, res, next) {
    try {
      const stats = await exportImportService.getStatistics();

      await logActivity(req.user.id, 'export', 'statistics', 'Viewed export/import statistics', req.ip);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  // Cleanup old exports
  static async cleanupOldExports(req, res, next) {
    try {
      const daysOld = parseInt(req.query.days) || 30;
      const deletedCount = await exportImportService.cleanupOldExports(daysOld);

      await logActivity(req.user.id, 'export', 'cleanup', `Cleaned up ${deletedCount} old export files`, req.ip);

      res.json({
        success: true,
        data: { deletedCount },
        message: `Cleaned up ${deletedCount} old export files`
      });
    } catch (error) {
      next(error);
    }
  }

  // Get export/import history
  static async getHistory(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 50;
      
      // Get recent export/import activities from audit logs
      const { query } = require('../config/database');
      const result = await query(`
        SELECT 
          al.id,
          al.action,
          al.resource_type,
          al.description,
          u.full_name as user_name,
          al.ip_address,
          al.created_at
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE al.resource_type IN ('export', 'import', 'template')
        ORDER BY al.created_at DESC
        LIMIT $1
      `, [limit]);

      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      next(error);
    }
  }

  // Batch export multiple data types
  static async batchExport(req, res, next) {
    try {
      const { types, filters } = req.body;
      
      if (!Array.isArray(types) || types.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Types array is required'
        });
      }

      const results = {};
      const allowedTypes = ['jamaah', 'payments', 'packages', 'groups'];

      for (const type of types) {
        if (!allowedTypes.includes(type)) {
          continue;
        }

        try {
          switch (type) {
            case 'jamaah':
              results[type] = await exportImportService.exportAllJamaah(filters?.jamaah || {});
              break;
            case 'payments':
              results[type] = await exportImportService.exportPayments(filters?.payments || {});
              break;
            case 'packages':
              results[type] = await exportImportService.exportPackages();
              break;
            case 'groups':
              results[type] = await exportImportService.exportGroups(filters?.groups || {});
              break;
          }
        } catch (error) {
          results[type] = { error: error.message };
        }
      }

      await logActivity(req.user.id, 'export', 'batch', `Batch export: ${types.join(', ')}`, req.ip);

      res.json({
        success: true,
        data: results,
        message: `Batch export completed for: ${types.join(', ')}`
      });
    } catch (error) {
      next(error);
    }
  }

  // Middleware for file upload
  static uploadFile = upload.single('file');
}

module.exports = ExportImportController;