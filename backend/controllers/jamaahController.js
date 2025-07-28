const { Jamaah } = require('../models');

class JamaahController {
  
  // Create new jamaah
  static async create(req, res, next) {
    try {
      const jamaah = await Jamaah.create(req.body, req.user.id);
      
      res.status(201).json({
        success: true,
        message: 'Data jamaah berhasil ditambahkan',
        data: jamaah
      });
    } catch (error) {
      next(error);
    }
  }

  // Get all jamaah with filters and pagination
  static async getAll(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      
      const filters = {};
      if (req.query.search) filters.search = req.query.search;
      if (req.query.package_id) filters.package_id = parseInt(req.query.package_id);
      if (req.query.jamaah_status) filters.jamaah_status = req.query.jamaah_status;
      if (req.query.visa_status) filters.visa_status = req.query.visa_status;
      if (req.query.payment_status) filters.payment_status = req.query.payment_status;

      const result = await Jamaah.findAll(filters, page, limit);
      
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  // Get jamaah by ID
  static async getById(req, res, next) {
    try {
      const jamaah = await Jamaah.findById(req.params.id);
      
      if (!jamaah) {
        return res.status(404).json({
          success: false,
          error: 'Data jamaah tidak ditemukan'
        });
      }

      res.json({
        success: true,
        data: jamaah
      });
    } catch (error) {
      next(error);
    }
  }

  // Update jamaah
  static async update(req, res, next) {
    try {
      const jamaah = await Jamaah.update(req.params.id, req.body, req.user.id);
      
      res.json({
        success: true,
        message: 'Data jamaah berhasil diperbarui',
        data: jamaah
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete jamaah (soft delete)
  static async delete(req, res, next) {
    try {
      await Jamaah.delete(req.params.id, req.user.id);
      
      res.json({
        success: true,
        message: 'Data jamaah berhasil dihapus'
      });
    } catch (error) {
      next(error);
    }
  }

  // Get jamaah statistics
  static async getStatistics(req, res, next) {
    try {
      const stats = await Jamaah.getStatistics();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  // Update jamaah status
  static async updateStatus(req, res, next) {
    try {
      const { jamaah_status, visa_status, payment_status } = req.body;
      
      const updateData = {};
      if (jamaah_status) updateData.jamaah_status = jamaah_status;
      if (visa_status) updateData.visa_status = visa_status;
      if (payment_status) updateData.payment_status = payment_status;

      const jamaah = await Jamaah.update(req.params.id, updateData, req.user.id);
      
      res.json({
        success: true,
        message: 'Status jamaah berhasil diperbarui',
        data: jamaah
      });
    } catch (error) {
      next(error);
    }
  }

  // Bulk update jamaah
  static async bulkUpdate(req, res, next) {
    try {
      const { jamaah_ids, update_data } = req.body;
      
      if (!jamaah_ids || !Array.isArray(jamaah_ids) || jamaah_ids.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'jamaah_ids harus berupa array dan tidak boleh kosong'
        });
      }

      const results = [];
      const errors = [];

      for (const id of jamaah_ids) {
        try {
          const jamaah = await Jamaah.update(id, update_data, req.user.id);
          results.push(jamaah);
        } catch (error) {
          errors.push({ id, error: error.message });
        }
      }

      res.json({
        success: true,
        message: `${results.length} data jamaah berhasil diperbarui`,
        data: results,
        errors: errors
      });
    } catch (error) {
      next(error);
    }
  }

  // Check for duplicate NIK
  static async checkNik(req, res, next) {
    try {
      const { nik } = req.params;
      const jamaah = await Jamaah.findByNik(nik);
      
      res.json({
        success: true,
        data: {
          exists: !!jamaah,
          jamaah: jamaah || null
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Check for duplicate passport
  static async checkPassport(req, res, next) {
    try {
      const { passport_number } = req.params;
      const jamaah = await Jamaah.findByPassport(passport_number);
      
      res.json({
        success: true,
        data: {
          exists: !!jamaah,
          jamaah: jamaah || null
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = JamaahController;