const { query } = require('../config/database');
const XLSX = require('xlsx');

class ReportController {

  // Get dashboard summary
  static async getDashboard(req, res, next) {
    try {
      // Get jamaah statistics
      const jamaahStats = await query(`
        SELECT 
          COUNT(*) as total_jamaah,
          COUNT(CASE WHEN jamaah_status = 'registered' THEN 1 END) as registered,
          COUNT(CASE WHEN jamaah_status = 'confirmed' THEN 1 END) as confirmed,
          COUNT(CASE WHEN jamaah_status = 'departed' THEN 1 END) as departed,
          COUNT(CASE WHEN visa_status = 'approved' THEN 1 END) as visa_approved,
          COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as fully_paid,
          COUNT(CASE WHEN is_elderly = true THEN 1 END) as elderly_count,
          COUNT(CASE WHEN gender = 'M' THEN 1 END) as male_count,
          COUNT(CASE WHEN gender = 'F' THEN 1 END) as female_count
        FROM jamaah 
        WHERE is_deleted = false
      `);

      // Get payment statistics
      const paymentStats = await query(`
        SELECT 
          COUNT(*) as total_payments,
          SUM(amount) as total_amount,
          AVG(amount) as average_amount,
          COUNT(CASE WHEN verified_by IS NOT NULL THEN 1 END) as verified_payments
        FROM payments
      `);

      // Get package statistics
      const packageStats = await query(`
        SELECT 
          COUNT(*) as total_packages,
          COUNT(CASE WHEN is_active = true THEN 1 END) as active_packages,
          SUM(max_capacity) as total_capacity,
          SUM(current_capacity) as total_occupied
        FROM packages
      `);

      // Get recent activities (last 7 days)
      const recentActivities = await query(`
        SELECT 
          'jamaah' as type,
          'Jamaah baru terdaftar' as activity,
          full_name as description,
          created_at
        FROM jamaah 
        WHERE created_at >= CURRENT_DATE - INTERVAL '7 days' AND is_deleted = false
        
        UNION ALL
        
        SELECT 
          'payment' as type,
          'Pembayaran baru' as activity,
          CONCAT('Rp ', TO_CHAR(amount, 'FM999,999,999')) as description,
          created_at
        FROM payments 
        WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
        
        ORDER BY created_at DESC
        LIMIT 10
      `);

      // Get monthly trends (last 12 months)
      const monthlyTrends = await query(`
        SELECT 
          DATE_TRUNC('month', created_at) as month,
          COUNT(*) as jamaah_count
        FROM jamaah
        WHERE created_at >= CURRENT_DATE - INTERVAL '12 months' AND is_deleted = false
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month
      `);

      res.json({
        success: true,
        data: {
          jamaah_stats: jamaahStats.rows[0],
          payment_stats: paymentStats.rows[0],
          package_stats: packageStats.rows[0],
          recent_activities: recentActivities.rows,
          monthly_trends: monthlyTrends.rows
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Export jamaah data to Excel
  static async exportJamaah(req, res, next) {
    try {
      const filters = {};
      if (req.query.package_id) filters.package_id = parseInt(req.query.package_id);
      if (req.query.jamaah_status) filters.jamaah_status = req.query.jamaah_status;
      if (req.query.visa_status) filters.visa_status = req.query.visa_status;
      if (req.query.payment_status) filters.payment_status = req.query.payment_status;

      let whereConditions = ['j.is_deleted = false'];
      let values = [];
      let paramCount = 0;

      if (filters.package_id) {
        paramCount++;
        whereConditions.push(`j.package_id = $${paramCount}`);
        values.push(filters.package_id);
      }

      if (filters.jamaah_status) {
        paramCount++;
        whereConditions.push(`j.jamaah_status = $${paramCount}`);
        values.push(filters.jamaah_status);
      }

      if (filters.visa_status) {
        paramCount++;
        whereConditions.push(`j.visa_status = $${paramCount}`);
        values.push(filters.visa_status);
      }

      if (filters.payment_status) {
        paramCount++;
        whereConditions.push(`j.payment_status = $${paramCount}`);
        values.push(filters.payment_status);
      }

      const whereClause = whereConditions.join(' AND ');

      const jamaahResult = await query(`
        SELECT 
          j.full_name,
          j.nik,
          j.birth_place,
          j.birth_date,
          CASE WHEN j.gender = 'M' THEN 'Laki-laki' ELSE 'Perempuan' END as gender,
          j.marital_status,
          j.address,
          j.phone,
          j.email,
          j.passport_number,
          j.passport_issue_date,
          j.passport_expiry_date,
          p.name as package_name,
          j.jamaah_status,
          j.visa_status,
          j.payment_status,
          j.total_payment,
          j.remaining_payment,
          j.registration_date,
          CASE WHEN j.is_elderly THEN 'Ya' ELSE 'Tidak' END as is_elderly
        FROM jamaah j
        LEFT JOIN packages p ON j.package_id = p.id
        WHERE ${whereClause}
        ORDER BY j.full_name
      `, values);

      // Create Excel workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(jamaahResult.rows);

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Data Jamaah');

      // Generate filename
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `laporan_jamaah_${timestamp}.xlsx`;

      // Set response headers
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      // Write and send file
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.send(buffer);

    } catch (error) {
      next(error);
    }
  }

  // Get jamaah analysis report
  static async getJamaahAnalysis(req, res, next) {
    try {
      // Age distribution
      const ageDistribution = await query(`
        SELECT 
          CASE 
            WHEN EXTRACT(YEAR FROM AGE(birth_date)) < 20 THEN '< 20'
            WHEN EXTRACT(YEAR FROM AGE(birth_date)) BETWEEN 20 AND 30 THEN '20-30'
            WHEN EXTRACT(YEAR FROM AGE(birth_date)) BETWEEN 31 AND 40 THEN '31-40'
            WHEN EXTRACT(YEAR FROM AGE(birth_date)) BETWEEN 41 AND 50 THEN '41-50'
            WHEN EXTRACT(YEAR FROM AGE(birth_date)) BETWEEN 51 AND 60 THEN '51-60'
            ELSE '> 60'
          END as age_group,
          COUNT(*) as count
        FROM jamaah 
        WHERE is_deleted = false AND birth_date IS NOT NULL
        GROUP BY age_group
        ORDER BY age_group
      `);

      // Gender distribution by package
      const genderByPackage = await query(`
        SELECT 
          p.name as package_name,
          COUNT(CASE WHEN j.gender = 'M' THEN 1 END) as male_count,
          COUNT(CASE WHEN j.gender = 'F' THEN 1 END) as female_count
        FROM jamaah j
        LEFT JOIN packages p ON j.package_id = p.id
        WHERE j.is_deleted = false
        GROUP BY p.id, p.name
        ORDER BY p.name
      `);

      // Regional distribution (from address)
      const regionalDistribution = await query(`
        SELECT 
          CASE 
            WHEN address ILIKE '%jakarta%' THEN 'Jakarta'
            WHEN address ILIKE '%bandung%' THEN 'Bandung'
            WHEN address ILIKE '%surabaya%' THEN 'Surabaya'
            WHEN address ILIKE '%medan%' THEN 'Medan'
            WHEN address ILIKE '%makassar%' THEN 'Makassar'
            WHEN address ILIKE '%semarang%' THEN 'Semarang'
            ELSE 'Lainnya'
          END as region,
          COUNT(*) as count
        FROM jamaah 
        WHERE is_deleted = false AND address IS NOT NULL AND address != ''
        GROUP BY region
        ORDER BY count DESC
      `);

      // Payment analysis
      const paymentAnalysis = await query(`
        SELECT 
          j.payment_status,
          COUNT(*) as jamaah_count,
          AVG(j.total_payment) as avg_payment,
          SUM(j.total_payment) as total_payment,
          SUM(j.remaining_payment) as total_remaining
        FROM jamaah j
        WHERE j.is_deleted = false
        GROUP BY j.payment_status
      `);

      res.json({
        success: true,
        data: {
          age_distribution: ageDistribution.rows,
          gender_by_package: genderByPackage.rows,
          regional_distribution: regionalDistribution.rows,
          payment_analysis: paymentAnalysis.rows
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get financial report
  static async getFinancialReport(req, res, next) {
    try {
      const { start_date, end_date } = req.query;
      
      let dateFilter = '';
      let values = [];
      let paramCount = 0;

      if (start_date && end_date) {
        paramCount += 2;
        dateFilter = `AND p.payment_date BETWEEN $${paramCount - 1} AND $${paramCount}`;
        values.push(start_date, end_date);
      }

      // Payment summary
      const paymentSummary = await query(`
        SELECT 
          COUNT(*) as total_transactions,
          SUM(amount) as total_amount,
          AVG(amount) as average_amount,
          MIN(amount) as min_amount,
          MAX(amount) as max_amount,
          COUNT(CASE WHEN verified_by IS NOT NULL THEN 1 END) as verified_count,
          COUNT(CASE WHEN verified_by IS NULL THEN 1 END) as unverified_count
        FROM payments p
        WHERE 1=1 ${dateFilter}
      `, values);

      // Payment by method
      const paymentByMethod = await query(`
        SELECT 
          payment_method,
          COUNT(*) as transaction_count,
          SUM(amount) as total_amount,
          AVG(amount) as average_amount
        FROM payments p
        WHERE 1=1 ${dateFilter}
        GROUP BY payment_method
        ORDER BY total_amount DESC
      `, values);

      // Daily payment trends
      const dailyTrends = await query(`
        SELECT 
          DATE(payment_date) as payment_date,
          COUNT(*) as transaction_count,
          SUM(amount) as daily_amount
        FROM payments p
        WHERE 1=1 ${dateFilter}
        GROUP BY DATE(payment_date)
        ORDER BY payment_date DESC
        LIMIT 30
      `, values);

      // Outstanding payments
      const outstandingPayments = await query(`
        SELECT 
          j.full_name,
          j.nik,
          p.name as package_name,
          j.total_payment,
          j.remaining_payment,
          CASE 
            WHEN j.remaining_payment > 0 THEN 'Belum Lunas'
            ELSE 'Lunas'
          END as status
        FROM jamaah j
        LEFT JOIN packages p ON j.package_id = p.id
        WHERE j.is_deleted = false AND j.remaining_payment > 0
        ORDER BY j.remaining_payment DESC
        LIMIT 50
      `);

      res.json({
        success: true,
        data: {
          payment_summary: paymentSummary.rows[0],
          payment_by_method: paymentByMethod.rows,
          daily_trends: dailyTrends.rows,
          outstanding_payments: outstandingPayments.rows
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get package performance report
  static async getPackageReport(req, res, next) {
    try {
      const packagePerformance = await query(`
        SELECT 
          p.id,
          p.name,
          p.price,
          p.max_capacity,
          p.current_capacity,
          (p.current_capacity::float / p.max_capacity * 100) as occupancy_percentage,
          COUNT(j.id) as actual_jamaah_count,
          SUM(CASE WHEN j.payment_status = 'paid' THEN 1 ELSE 0 END) as paid_jamaah_count,
          SUM(j.total_payment) as total_revenue,
          AVG(j.total_payment) as avg_revenue_per_jamaah
        FROM packages p
        LEFT JOIN jamaah j ON p.id = j.package_id AND j.is_deleted = false
        GROUP BY p.id, p.name, p.price, p.max_capacity, p.current_capacity
        ORDER BY occupancy_percentage DESC
      `);

      // Package revenue comparison
      const revenueComparison = await query(`
        SELECT 
          p.name as package_name,
          COUNT(j.id) as jamaah_count,
          SUM(j.total_payment) as total_revenue,
          SUM(j.remaining_payment) as remaining_revenue,
          (SUM(j.total_payment) - SUM(j.remaining_payment)) as collected_revenue
        FROM packages p
        LEFT JOIN jamaah j ON p.id = j.package_id AND j.is_deleted = false
        GROUP BY p.id, p.name
        HAVING COUNT(j.id) > 0
        ORDER BY total_revenue DESC
      `);

      res.json({
        success: true,
        data: {
          package_performance: packagePerformance.rows,
          revenue_comparison: revenueComparison.rows
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get visa status report
  static async getVisaReport(req, res, next) {
    try {
      // Visa status distribution
      const visaStatus = await query(`
        SELECT 
          visa_status,
          COUNT(*) as count,
          COUNT(CASE WHEN gender = 'M' THEN 1 END) as male_count,
          COUNT(CASE WHEN gender = 'F' THEN 1 END) as female_count
        FROM jamaah
        WHERE is_deleted = false
        GROUP BY visa_status
        ORDER BY count DESC
      `);

      // Visa processing timeline
      const visaTimeline = await query(`
        SELECT 
          j.full_name,
          j.nik,
          j.visa_status,
          j.passport_expiry_date,
          p.name as package_name,
          CASE 
            WHEN j.passport_expiry_date < CURRENT_DATE + INTERVAL '6 months' THEN 'Perlu Diperpanjang'
            ELSE 'Masih Valid'
          END as passport_status
        FROM jamaah j
        LEFT JOIN packages p ON j.package_id = p.id
        WHERE j.is_deleted = false AND j.passport_number IS NOT NULL
        ORDER BY j.passport_expiry_date ASC
      `);

      // Visa approval rate by package
      const approvalByPackage = await query(`
        SELECT 
          p.name as package_name,
          COUNT(*) as total_jamaah,
          COUNT(CASE WHEN j.visa_status = 'approved' THEN 1 END) as approved_count,
          COUNT(CASE WHEN j.visa_status = 'rejected' THEN 1 END) as rejected_count,
          COUNT(CASE WHEN j.visa_status = 'pending' THEN 1 END) as pending_count,
          ROUND(COUNT(CASE WHEN j.visa_status = 'approved' THEN 1 END)::float / COUNT(*) * 100, 2) as approval_rate
        FROM jamaah j
        LEFT JOIN packages p ON j.package_id = p.id
        WHERE j.is_deleted = false
        GROUP BY p.id, p.name
        HAVING COUNT(*) > 0
        ORDER BY approval_rate DESC
      `);

      res.json({
        success: true,
        data: {
          visa_status_distribution: visaStatus.rows,
          visa_timeline: visaTimeline.rows,
          approval_by_package: approvalByPackage.rows
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get custom report based on parameters
  static async getCustomReport(req, res, next) {
    try {
      const { 
        report_type, 
        start_date, 
        end_date, 
        package_id, 
        group_by 
      } = req.query;

      let baseQuery = '';
      let whereConditions = ['j.is_deleted = false'];
      let values = [];
      let paramCount = 0;

      // Add date filters
      if (start_date) {
        paramCount++;
        whereConditions.push(`j.created_at >= $${paramCount}`);
        values.push(start_date);
      }

      if (end_date) {
        paramCount++;
        whereConditions.push(`j.created_at <= $${paramCount}`);
        values.push(end_date);
      }

      if (package_id) {
        paramCount++;
        whereConditions.push(`j.package_id = $${paramCount}`);
        values.push(package_id);
      }

      const whereClause = whereConditions.join(' AND ');

      switch (report_type) {
        case 'registration_trend':
          baseQuery = `
            SELECT 
              DATE_TRUNC('${group_by || 'month'}', j.created_at) as period,
              COUNT(*) as jamaah_count,
              COUNT(CASE WHEN j.gender = 'M' THEN 1 END) as male_count,
              COUNT(CASE WHEN j.gender = 'F' THEN 1 END) as female_count
            FROM jamaah j
            WHERE ${whereClause}
            GROUP BY period
            ORDER BY period
          `;
          break;

        case 'payment_trend':
          baseQuery = `
            SELECT 
              DATE_TRUNC('${group_by || 'month'}', p.payment_date) as period,
              COUNT(*) as payment_count,
              SUM(p.amount) as total_amount,
              AVG(p.amount) as average_amount
            FROM payments p
            LEFT JOIN jamaah j ON p.jamaah_id = j.id
            WHERE ${whereClause}
            GROUP BY period
            ORDER BY period
          `;
          break;

        default:
          return res.status(400).json({
            success: false,
            error: 'Report type tidak valid'
          });
      }

      const result = await query(baseQuery, values);

      res.json({
        success: true,
        data: {
          report_type,
          parameters: req.query,
          results: result.rows
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ReportController;