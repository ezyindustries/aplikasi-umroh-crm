const Payment = require('../models/Payment');

class PaymentController {

  // Create new payment
  static async create(req, res, next) {
    try {
      const payment = await Payment.create(req.body, req.user.id);
      
      res.status(201).json({
        success: true,
        message: 'Pembayaran berhasil dicatat',
        data: payment
      });
    } catch (error) {
      next(error);
    }
  }

  // Get all payments with filters
  static async getAll(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      
      const filters = {};
      if (req.query.jamaah_id) filters.jamaah_id = parseInt(req.query.jamaah_id);
      if (req.query.payment_method) filters.payment_method = req.query.payment_method;
      if (req.query.verified !== undefined) filters.verified = req.query.verified === 'true';
      if (req.query.date_from) filters.date_from = req.query.date_from;
      if (req.query.date_to) filters.date_to = req.query.date_to;
      if (req.query.search) filters.search = req.query.search;

      const result = await Payment.findAll(filters, page, limit);
      
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  // Get payment by ID
  static async getById(req, res, next) {
    try {
      const payment = await Payment.findById(req.params.id);
      
      if (!payment) {
        return res.status(404).json({
          success: false,
          error: 'Payment tidak ditemukan'
        });
      }

      res.json({
        success: true,
        data: payment
      });
    } catch (error) {
      next(error);
    }
  }

  // Get payments by jamaah ID
  static async getByJamaah(req, res, next) {
    try {
      const { jamaah_id } = req.params;
      const payments = await Payment.findByJamaah(jamaah_id);
      const summary = await Payment.getJamaahPaymentSummary(jamaah_id);

      res.json({
        success: true,
        data: {
          payments,
          summary
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Update payment
  static async update(req, res, next) {
    try {
      const payment = await Payment.update(req.params.id, req.body, req.user.id);
      
      res.json({
        success: true,
        message: 'Data pembayaran berhasil diperbarui',
        data: payment
      });
    } catch (error) {
      next(error);
    }
  }

  // Verify payment
  static async verify(req, res, next) {
    try {
      const payment = await Payment.verify(req.params.id, req.user.id);
      
      res.json({
        success: true,
        message: 'Pembayaran berhasil diverifikasi',
        data: payment
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete payment
  static async delete(req, res, next) {
    try {
      await Payment.delete(req.params.id, req.user.id);
      
      res.json({
        success: true,
        message: 'Data pembayaran berhasil dihapus'
      });
    } catch (error) {
      next(error);
    }
  }

  // Get payment statistics
  static async getStatistics(req, res, next) {
    try {
      const stats = await Payment.getStatistics();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  // Get unverified payments
  static async getUnverified(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;

      const result = await Payment.findUnverified(page, limit);
      
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  // Bulk verify payments
  static async bulkVerify(req, res, next) {
    try {
      const { payment_ids } = req.body;
      
      if (!payment_ids || !Array.isArray(payment_ids)) {
        return res.status(400).json({
          success: false,
          error: 'payment_ids harus berupa array'
        });
      }

      const result = await Payment.bulkVerify(payment_ids, req.user.id);

      res.json({
        success: true,
        message: `${result.results.length} pembayaran berhasil diverifikasi`,
        data: result.results,
        errors: result.errors
      });
    } catch (error) {
      next(error);
    }
  }

  // Get payment methods statistics
  static async getMethodStats(req, res, next) {
    try {
      const result = await Payment.query(`
        SELECT 
          payment_method,
          COUNT(*) as count,
          SUM(amount) as total_amount,
          AVG(amount) as average_amount
        FROM payments
        GROUP BY payment_method
        ORDER BY total_amount DESC
      `);

      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      next(error);
    }
  }

  // Get daily payment report
  static async getDailyReport(req, res, next) {
    try {
      const { date } = req.query;
      const targetDate = date || new Date().toISOString().split('T')[0];

      const result = await Payment.query(`
        SELECT 
          p.*,
          j.full_name as jamaah_name,
          j.nik as jamaah_nik,
          u.full_name as created_by_name
        FROM payments p
        LEFT JOIN jamaah j ON p.jamaah_id = j.id
        LEFT JOIN users u ON p.created_by = u.id
        WHERE DATE(p.payment_date) = $1
        ORDER BY p.created_at DESC
      `, [targetDate]);

      const summary = await Payment.query(`
        SELECT 
          COUNT(*) as total_payments,
          SUM(amount) as total_amount,
          payment_method,
          COUNT(*) as method_count
        FROM payments
        WHERE DATE(payment_date) = $1
        GROUP BY payment_method
        ORDER BY total_amount DESC
      `, [targetDate]);

      res.json({
        success: true,
        data: {
          date: targetDate,
          payments: result.rows,
          summary: summary.rows
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Upload payment receipt
  static async uploadReceipt(req, res, next) {
    try {
      const { id } = req.params;
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'File bukti pembayaran wajib diupload'
        });
      }

      const payment = await Payment.update(id, {
        receipt_file_path: req.file.path
      }, req.user.id);

      res.json({
        success: true,
        message: 'Bukti pembayaran berhasil diupload',
        data: payment
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = PaymentController;