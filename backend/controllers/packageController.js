const Package = require('../models/Package');

class PackageController {

  // Create new package
  static async create(req, res, next) {
    try {
      const packageData = await Package.create(req.body, req.user.id);
      
      res.status(201).json({
        success: true,
        message: 'Paket berhasil dibuat',
        data: packageData
      });
    } catch (error) {
      next(error);
    }
  }

  // Get all packages with filters
  static async getAll(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      
      const filters = {};
      if (req.query.is_active !== undefined) filters.is_active = req.query.is_active === 'true';
      if (req.query.search) filters.search = req.query.search;
      if (req.query.available_only) filters.available_only = req.query.available_only === 'true';

      const result = await Package.findAll(filters, page, limit);
      
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  // Get package by ID
  static async getById(req, res, next) {
    try {
      const packageData = await Package.findById(req.params.id);
      
      if (!packageData) {
        return res.status(404).json({
          success: false,
          error: 'Paket tidak ditemukan'
        });
      }

      res.json({
        success: true,
        data: packageData
      });
    } catch (error) {
      next(error);
    }
  }

  // Get package with jamaah details
  static async getWithJamaah(req, res, next) {
    try {
      const packageWithJamaah = await Package.getWithJamaah(req.params.id);
      
      res.json({
        success: true,
        data: packageDataWithJamaah
      });
    } catch (error) {
      next(error);
    }
  }

  // Update package
  static async update(req, res, next) {
    try {
      const packageData = await Package.update(req.params.id, req.body);
      
      res.json({
        success: true,
        message: 'Paket berhasil diperbarui',
        data: packageData
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete package
  static async delete(req, res, next) {
    try {
      await Package.delete(req.params.id);
      
      res.json({
        success: true,
        message: 'Paket berhasil dihapus'
      });
    } catch (error) {
      next(error);
    }
  }

  // Get package statistics
  static async getStatistics(req, res, next) {
    try {
      const stats = await Package.getStatistics();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  // Get available packages
  static async getAvailable(req, res, next) {
    try {
      const packages = await Package.getAvailable();
      
      res.json({
        success: true,
        data: packageDatas
      });
    } catch (error) {
      next(error);
    }
  }

  // Get packages by date range
  static async getByDateRange(req, res, next) {
    try {
      const { start_date, end_date } = req.query;
      
      if (!start_date || !end_date) {
        return res.status(400).json({
          success: false,
          error: 'start_date dan end_date wajib diisi'
        });
      }

      const packages = await Package.findByDateRange(start_date, end_date);
      
      res.json({
        success: true,
        data: packageDatas
      });
    } catch (error) {
      next(error);
    }
  }

  // Get package occupancy report
  static async getOccupancyReport(req, res, next) {
    try {
      const report = await Package.getOccupancyReport();
      
      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      next(error);
    }
  }

  // Get popular packages
  static async getPopular(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 5;
      const packages = await Package.getPopular(limit);
      
      res.json({
        success: true,
        data: packageDatas
      });
    } catch (error) {
      next(error);
    }
  }

  // Update package capacity
  static async updateCapacity(req, res, next) {
    try {
      const packageData = await Package.updateCapacity(req.params.id);
      
      res.json({
        success: true,
        message: 'Kapasitas paket berhasil diperbarui',
        data: packageData
      });
    } catch (error) {
      next(error);
    }
  }

  // Check package capacity
  static async checkCapacity(req, res, next) {
    try {
      const { id } = req.params;
      const { count = 1 } = req.query;
      
      const hasCapacity = await Package.hasCapacity(id, parseInt(count));
      const packageData = await Package.findById(id);
      
      res.json({
        success: true,
        data: {
          has_capacity: hasCapacity,
          available_spots: packageData ? (packageData.max_capacity - packageData.current_capacity) : 0,
          package_details: packageData
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Activate/Deactivate package
  static async toggleStatus(req, res, next) {
    try {
      const packageData = await Package.findById(req.params.id);
      
      if (!packageData) {
        return res.status(404).json({
          success: false,
          error: 'Paket tidak ditemukan'
        });
      }

      const updatedPackage = await Package.update(req.params.id, {
        is_active: !packageData.is_active
      });
      
      res.json({
        success: true,
        message: `Paket berhasil ${updatedPackage.is_active ? 'diaktifkan' : 'dinonaktifkan'}`,
        data: updatedPackage
      });
    } catch (error) {
      next(error);
    }
  }

  // Duplicate package
  static async duplicate(req, res, next) {
    try {
      const originalPackage = await Package.findById(req.params.id);
      
      if (!originalPackage) {
        return res.status(404).json({
          success: false,
          error: 'Paket tidak ditemukan'
        });
      }

      // Create new package with similar data
      const newPackageData = {
        name: `${originalPackage.name} (Copy)`,
        description: originalPackage.description,
        price: originalPackage.price,
        hotel_mecca: originalPackage.hotel_mecca,
        hotel_medina: originalPackage.hotel_medina,
        airline: originalPackage.airline,
        max_capacity: originalPackage.max_capacity,
        is_active: false // Start as inactive
      };

      const newPackage = await Package.create(newPackageData, req.user.id);
      
      res.status(201).json({
        success: true,
        message: 'Paket berhasil diduplikasi',
        data: newPackage
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = PackageController;