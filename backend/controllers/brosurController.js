const PackageBrosur = require('../models/PackageBrosur');
const Package = require('../models/Package');
const { upload } = require('../middleware/upload');
const path = require('path');
const fs = require('fs').promises;

class BrosurController {

  // Upload brosur images for a package
  static async uploadImages(req, res, next) {
    try {
      const packageId = parseInt(req.params.packageId);
      
      // Verify package exists
      const packageData = await Package.findById(packageId);
      if (!packageData) {
        return res.status(404).json({
          success: false,
          message: 'Paket tidak ditemukan'
        });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Tidak ada file yang diupload'
        });
      }

      const results = [];
      const errors = [];

      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        
        try {
          // Validate file
          PackageBrosur.validateImageFile(file);
          
          // Create brosur record
          const brosurData = {
            package_id: packageId,
            image_url: `/uploads/brosur/${file.filename}`,
            image_filename: file.originalname,
            image_size: file.size,
            image_order: i + 1,
            alt_text: req.body.alt_text || file.originalname,
            description: req.body.description || '',
            is_primary: i === 0 && req.body.setPrimary === 'true' // First image is primary if requested
          };

          const brosur = await PackageBrosur.create(brosurData, req.user.id);
          results.push(brosur);

        } catch (error) {
          errors.push({
            filename: file.originalname,
            error: error.message
          });
          
          // Delete the uploaded file if validation failed
          try {
            await fs.unlink(file.path);
          } catch (unlinkError) {
            console.error('Error deleting file:', unlinkError);
          }
        }
      }

      res.status(201).json({
        success: true,
        message: `${results.length} gambar berhasil diupload`,
        data: results,
        errors: errors.length > 0 ? errors : undefined
      });

    } catch (error) {
      next(error);
    }
  }

  // Get all brosur images for a package
  static async getByPackageId(req, res, next) {
    try {
      const packageId = parseInt(req.params.packageId);
      
      // Verify package exists
      const packageData = await Package.findById(packageId);
      if (!packageData) {
        return res.status(404).json({
          success: false,
          message: 'Paket tidak ditemukan'
        });
      }

      const images = await PackageBrosur.findByPackageId(packageId);
      
      res.json({
        success: true,
        data: images
      });

    } catch (error) {
      next(error);
    }
  }

  // Get package with brosur images
  static async getPackageWithBrosur(req, res, next) {
    try {
      const packageId = parseInt(req.params.packageId);
      
      const packageWithBrosur = await Package.getWithBrosur(packageId);
      
      res.json({
        success: true,
        data: packageWithBrosur
      });

    } catch (error) {
      next(error);
    }
  }

  // Update brosur image details
  static async updateImage(req, res, next) {
    try {
      const imageId = parseInt(req.params.imageId);
      
      const updatedImage = await PackageBrosur.update(imageId, req.body);
      
      res.json({
        success: true,
        message: 'Gambar brosur berhasil diupdate',
        data: updatedImage
      });

    } catch (error) {
      next(error);
    }
  }

  // Set primary image
  static async setPrimaryImage(req, res, next) {
    try {
      const packageId = parseInt(req.params.packageId);
      const imageId = parseInt(req.params.imageId);
      
      const updatedImage = await PackageBrosur.setPrimaryImage(packageId, imageId);
      
      if (!updatedImage) {
        return res.status(404).json({
          success: false,
          message: 'Gambar tidak ditemukan'
        });
      }

      res.json({
        success: true,
        message: 'Gambar utama berhasil diatur',
        data: updatedImage
      });

    } catch (error) {
      next(error);
    }
  }

  // Reorder images
  static async reorderImages(req, res, next) {
    try {
      const packageId = parseInt(req.params.packageId);
      const { imageOrders } = req.body; // Array of {id, order}
      
      if (!Array.isArray(imageOrders)) {
        return res.status(400).json({
          success: false,
          message: 'imageOrders harus berupa array'
        });
      }

      const reorderedImages = await PackageBrosur.reorderImages(packageId, imageOrders);
      
      res.json({
        success: true,
        message: 'Urutan gambar berhasil diubah',
        data: reorderedImages
      });

    } catch (error) {
      next(error);
    }
  }

  // Delete brosur image
  static async deleteImage(req, res, next) {
    try {
      const imageId = parseInt(req.params.imageId);
      
      // Get image info before deletion
      const image = await PackageBrosur.findById(imageId);
      if (!image) {
        return res.status(404).json({
          success: false,
          message: 'Gambar tidak ditemukan'
        });
      }

      // Delete from database
      await PackageBrosur.delete(imageId);
      
      // Delete physical file
      try {
        const filePath = path.join(__dirname, '..', image.image_url);
        await fs.unlink(filePath);
      } catch (fileError) {
        console.error('Error deleting physical file:', fileError);
        // Continue even if file deletion fails
      }

      res.json({
        success: true,
        message: 'Gambar brosur berhasil dihapus'
      });

    } catch (error) {
      next(error);
    }
  }

  // Get brosur statistics
  static async getStatistics(req, res, next) {
    try {
      const stats = await PackageBrosur.getStatistics();
      
      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      next(error);
    }
  }

  // Get packages with primary images (for listing)
  static async getPackagesWithPrimaryImages(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      
      const filters = {};
      if (req.query.is_active !== undefined) filters.is_active = req.query.is_active === 'true';
      if (req.query.search) filters.search = req.query.search;
      if (req.query.available_only) filters.available_only = req.query.available_only === 'true';

      const result = await Package.findAllWithPrimaryImage(filters, page, limit);
      
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = BrosurController;