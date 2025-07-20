const { query, transaction } = require('../config/database');
const Joi = require('joi');

class Payment {
  
  static getValidationSchema() {
    return Joi.object({
      jamaah_id: Joi.number().integer().required(),
      amount: Joi.number().precision(2).min(0).required(),
      payment_date: Joi.date().required(),
      payment_method: Joi.string().valid(
        'cash', 'transfer', 'card', 'check', 'other'
      ).required(),
      reference_number: Joi.string().max(100).allow(''),
      notes: Joi.string().max(1000).allow(''),
      receipt_file_path: Joi.string().max(500).allow('')
    });
  }

  // Create new payment
  static async create(paymentData, createdBy) {
    const { error, value } = this.getValidationSchema().validate(paymentData);
    if (error) {
      throw new Error(`Validation error: ${error.details[0].message}`);
    }

    const result = await transaction(async (client) => {
      // Insert payment
      const insertResult = await client.query(
        `INSERT INTO payments (
          jamaah_id, amount, payment_date, payment_method, 
          reference_number, notes, receipt_file_path, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          value.jamaah_id,
          value.amount,
          value.payment_date,
          value.payment_method,
          value.reference_number,
          value.notes,
          value.receipt_file_path,
          createdBy
        ]
      );

      const payment = insertResult.rows[0];

      // Update jamaah payment totals
      await this.updateJamaahPaymentStatus(client, value.jamaah_id);

      return payment;
    });

    return result;
  }

  // Update jamaah payment status
  static async updateJamaahPaymentStatus(client, jamaahId) {
    // Calculate total payments
    const paymentResult = await client.query(
      'SELECT SUM(amount) as total_paid FROM payments WHERE jamaah_id = $1',
      [jamaahId]
    );

    const totalPaid = parseFloat(paymentResult.rows[0].total_paid) || 0;

    // Get jamaah package price (assuming we have this info)
    const jamaahResult = await client.query(
      `SELECT j.*, p.price as package_price 
       FROM jamaah j 
       LEFT JOIN packages p ON j.package_id = p.id 
       WHERE j.id = $1`,
      [jamaahId]
    );

    const jamaah = jamaahResult.rows[0];
    const packagePrice = parseFloat(jamaah.package_price) || 0;
    const remainingPayment = Math.max(0, packagePrice - totalPaid);

    // Determine payment status
    let paymentStatus = 'unpaid';
    if (totalPaid === 0) {
      paymentStatus = 'unpaid';
    } else if (totalPaid >= packagePrice && packagePrice > 0) {
      paymentStatus = 'paid';
    } else {
      paymentStatus = 'partial';
    }

    // Update jamaah
    await client.query(
      `UPDATE jamaah 
       SET total_payment = $1, remaining_payment = $2, payment_status = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [totalPaid, remainingPayment, paymentStatus, jamaahId]
    );

    return {
      total_paid: totalPaid,
      remaining_payment: remainingPayment,
      payment_status: paymentStatus
    };
  }

  // Get payment by ID
  static async findById(id) {
    const result = await query(
      `SELECT p.*, j.full_name as jamaah_name, u.full_name as created_by_name
       FROM payments p
       LEFT JOIN jamaah j ON p.jamaah_id = j.id
       LEFT JOIN users u ON p.created_by = u.id
       WHERE p.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  // Get payments by jamaah ID
  static async findByJamaah(jamaahId) {
    const result = await query(
      `SELECT p.*, u.full_name as created_by_name, uv.full_name as verified_by_name
       FROM payments p
       LEFT JOIN users u ON p.created_by = u.id
       LEFT JOIN users uv ON p.verified_by = uv.id
       WHERE p.jamaah_id = $1
       ORDER BY p.payment_date DESC, p.created_at DESC`,
      [jamaahId]
    );
    return result.rows;
  }

  // Get all payments with filters
  static async findAll(filters = {}, page = 1, limit = 50) {
    let whereConditions = ['1=1'];
    let values = [];
    let paramCount = 0;

    if (filters.jamaah_id) {
      paramCount++;
      whereConditions.push(`p.jamaah_id = $${paramCount}`);
      values.push(filters.jamaah_id);
    }

    if (filters.payment_method) {
      paramCount++;
      whereConditions.push(`p.payment_method = $${paramCount}`);
      values.push(filters.payment_method);
    }

    if (filters.verified !== undefined) {
      paramCount++;
      whereConditions.push(`p.verified_by IS ${filters.verified ? 'NOT NULL' : 'NULL'}`);
    }

    if (filters.date_from) {
      paramCount++;
      whereConditions.push(`p.payment_date >= $${paramCount}`);
      values.push(filters.date_from);
    }

    if (filters.date_to) {
      paramCount++;
      whereConditions.push(`p.payment_date <= $${paramCount}`);
      values.push(filters.date_to);
    }

    if (filters.search) {
      paramCount++;
      whereConditions.push(`(j.full_name ILIKE $${paramCount} OR p.reference_number ILIKE $${paramCount})`);
      values.push(`%${filters.search}%`);
    }

    const whereClause = whereConditions.join(' AND ');
    const offset = (page - 1) * limit;

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM payments p 
      LEFT JOIN jamaah j ON p.jamaah_id = j.id
      WHERE ${whereClause}
    `;
    const countResult = await query(countQuery, values);
    const total = parseInt(countResult.rows[0].total);

    // Get data with pagination
    paramCount++;
    values.push(limit);
    paramCount++;
    values.push(offset);

    const dataQuery = `
      SELECT p.*, j.full_name as jamaah_name, j.nik as jamaah_nik,
             u.full_name as created_by_name, uv.full_name as verified_by_name
      FROM payments p
      LEFT JOIN jamaah j ON p.jamaah_id = j.id
      LEFT JOIN users u ON p.created_by = u.id
      LEFT JOIN users uv ON p.verified_by = uv.id
      WHERE ${whereClause}
      ORDER BY p.payment_date DESC, p.created_at DESC
      LIMIT $${paramCount - 1} OFFSET $${paramCount}
    `;

    const dataResult = await query(dataQuery, values);

    return {
      data: dataResult.rows,
      pagination: {
        current_page: page,
        per_page: limit,
        total: total,
        total_pages: Math.ceil(total / limit)
      }
    };
  }

  // Update payment
  static async update(id, updateData, updatedBy) {
    const payment = await this.findById(id);
    if (!payment) {
      throw new Error('Payment tidak ditemukan');
    }

    const { error, value } = this.getValidationSchema().validate(updateData);
    if (error) {
      throw new Error(`Validation error: ${error.details[0].message}`);
    }

    const result = await transaction(async (client) => {
      // Build update query dynamically
      const updateFields = [];
      const updateValues = [];
      let paramCount = 0;

      for (const [key, val] of Object.entries(value)) {
        paramCount++;
        updateFields.push(`${key} = $${paramCount}`);
        updateValues.push(val);
      }

      paramCount++;
      updateValues.push(id);

      const updateQuery = `
        UPDATE payments 
        SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const updateResult = await client.query(updateQuery, updateValues);
      const updatedPayment = updateResult.rows[0];

      // Update jamaah payment status
      await this.updateJamaahPaymentStatus(client, payment.jamaah_id);

      return updatedPayment;
    });

    return result;
  }

  // Verify payment
  static async verify(id, verifiedBy) {
    const payment = await this.findById(id);
    if (!payment) {
      throw new Error('Payment tidak ditemukan');
    }

    const result = await query(
      `UPDATE payments 
       SET verified_by = $1, verification_date = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [verifiedBy, id]
    );

    return result.rows[0];
  }

  // Delete payment
  static async delete(id, deletedBy) {
    const payment = await this.findById(id);
    if (!payment) {
      throw new Error('Payment tidak ditemukan');
    }

    const result = await transaction(async (client) => {
      // Delete payment
      await client.query('DELETE FROM payments WHERE id = $1', [id]);

      // Update jamaah payment status
      await this.updateJamaahPaymentStatus(client, payment.jamaah_id);

      return { success: true };
    });

    return result;
  }

  // Get payment statistics
  static async getStatistics() {
    const result = await query(`
      SELECT 
        COUNT(*) as total_payments,
        SUM(amount) as total_amount,
        COUNT(CASE WHEN verified_by IS NOT NULL THEN 1 END) as verified_payments,
        COUNT(CASE WHEN verified_by IS NULL THEN 1 END) as unverified_payments,
        COUNT(CASE WHEN payment_method = 'cash' THEN 1 END) as cash_payments,
        COUNT(CASE WHEN payment_method = 'transfer' THEN 1 END) as transfer_payments,
        AVG(amount) as average_amount
      FROM payments
    `);

    // Get payment summary by month
    const monthlyResult = await query(`
      SELECT 
        DATE_TRUNC('month', payment_date) as month,
        COUNT(*) as payment_count,
        SUM(amount) as total_amount
      FROM payments
      WHERE payment_date >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', payment_date)
      ORDER BY month DESC
    `);

    return {
      ...result.rows[0],
      monthly_summary: monthlyResult.rows
    };
  }

  // Get payment summary for jamaah
  static async getJamaahPaymentSummary(jamaahId) {
    const result = await query(`
      SELECT 
        j.id,
        j.full_name,
        j.total_payment,
        j.remaining_payment,
        j.payment_status,
        p.price as package_price,
        COUNT(pay.id) as payment_count,
        COALESCE(SUM(pay.amount), 0) as total_paid,
        MIN(pay.payment_date) as first_payment_date,
        MAX(pay.payment_date) as last_payment_date
      FROM jamaah j
      LEFT JOIN packages p ON j.package_id = p.id
      LEFT JOIN payments pay ON j.id = pay.jamaah_id
      WHERE j.id = $1
      GROUP BY j.id, j.full_name, j.total_payment, j.remaining_payment, j.payment_status, p.price
    `, [jamaahId]);

    return result.rows[0];
  }

  // Get unverified payments
  static async findUnverified(page = 1, limit = 50) {
    return this.findAll({ verified: false }, page, limit);
  }

  // Bulk verify payments
  static async bulkVerify(paymentIds, verifiedBy) {
    const results = [];
    const errors = [];

    for (const id of paymentIds) {
      try {
        const payment = await this.verify(id, verifiedBy);
        results.push(payment);
      } catch (error) {
        errors.push({ id, error: error.message });
      }
    }

    return { results, errors };
  }
}

module.exports = Payment;