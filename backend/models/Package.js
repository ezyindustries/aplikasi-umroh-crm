const { query, transaction } = require('../config/database');
const Joi = require('joi');

class Package {
  
  static getValidationSchema() {
    return Joi.object({
      // Required fields based on new structure
      kode_paket: Joi.string().max(50).required().pattern(/^#\d{4}_\d+H_[A-Z]{3}_\d{4}$/),
      nama_paket: Joi.string().max(255).required(),
      jumlah_hari: Joi.number().integer().min(1).required(),
      kota_asal: Joi.string().max(100).required(),
      maskapai: Joi.string().max(100).required(),
      hotel_makkah: Joi.string().max(255).required(),
      jumlah_malam_makkah: Joi.number().integer().min(1).required(),
      hotel_medina: Joi.string().max(255).required(),
      jumlah_malam_medina: Joi.number().integer().min(1).required(),
      jumlah_seat_total: Joi.number().integer().min(1).required(),
      sisa_seat: Joi.number().integer().min(0).max(Joi.ref('jumlah_seat_total')).required(),
      
      // Optional fields
      kota_transit: Joi.string().max(100).allow('', null),
      jumlah_malam_transit: Joi.number().integer().min(0).default(0),
      kereta_cepat: Joi.boolean().default(false),
      thaif: Joi.boolean().default(false),
      
      // Additional fields for internal use
      price: Joi.number().precision(2).min(0).allow(null),
      description: Joi.string().max(2000).allow(''),
      departure_date: Joi.date().allow(null),
      return_date: Joi.date().greater(Joi.ref('departure_date')).allow(null),
      max_capacity: Joi.number().integer().min(1).allow(null), // Deprecated
      is_active: Joi.boolean().default(true)
    });
  }

  // Generate automatic package code
  static generateKodePaket(tahun, jumlahHari, kotaAsal, bulanTanggal) {
    const kotaCode = kotaAsal.substring(0, 3).toUpperCase();
    return `#${tahun}_${jumlahHari}H_${kotaCode}_${bulanTanggal}`;
  }

  // Create new package
  static async create(packageData, createdBy) {
    const { error, value } = this.getValidationSchema().validate(packageData);
    if (error) {
      throw new Error(`Validation error: ${error.details[0].message}`);
    }

    const result = await query(
      `INSERT INTO packages (
        kode_paket, nama_paket, jumlah_hari, kota_asal, maskapai, kota_transit, 
        jumlah_malam_transit, hotel_makkah, jumlah_malam_makkah, 
        hotel_medina, jumlah_malam_medina, kereta_cepat, thaif,
        jumlah_seat_total, sisa_seat, price, description, departure_date, 
        return_date, max_capacity, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      RETURNING *`,
      [
        value.kode_paket,
        value.nama_paket,
        value.jumlah_hari,
        value.kota_asal,
        value.maskapai,
        value.kota_transit,
        value.jumlah_malam_transit,
        value.hotel_makkah,
        value.jumlah_malam_makkah,
        value.hotel_medina,
        value.jumlah_malam_medina,
        value.kereta_cepat,
        value.thaif,
        value.jumlah_seat_total,
        value.sisa_seat,
        value.price,
        value.description,
        value.departure_date,
        value.return_date,
        value.max_capacity,
        value.is_active
      ]
    );

    return result.rows[0];
  }

  // Get package by ID
  static async findById(id) {
    const result = await query(
      'SELECT * FROM packages WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  // Get all packages with filters
  static async findAll(filters = {}, page = 1, limit = 50) {
    let whereConditions = ['1=1'];
    let values = [];
    let paramCount = 0;

    if (filters.is_active !== undefined) {
      paramCount++;
      whereConditions.push(`is_active = $${paramCount}`);
      values.push(filters.is_active);
    }

    if (filters.search) {
      paramCount++;
      whereConditions.push(`(kode_paket ILIKE $${paramCount} OR nama_paket ILIKE $${paramCount} OR kota_asal ILIKE $${paramCount} OR maskapai ILIKE $${paramCount})`);
      values.push(`%${filters.search}%`);
    }

    if (filters.available_only) {
      whereConditions.push('sisa_seat > 0');
    }

    const whereClause = whereConditions.join(' AND ');
    const offset = (page - 1) * limit;

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM packages WHERE ${whereClause}`;
    const countResult = await query(countQuery, values);
    const total = parseInt(countResult.rows[0].total);

    // Get data with pagination
    paramCount++;
    values.push(limit);
    paramCount++;
    values.push(offset);

    const dataQuery = `
      SELECT p.*, 
             p.sisa_seat as available_capacity,
             (p.jumlah_seat_total - p.sisa_seat) as occupied_seats,
             COUNT(j.id) as jamaah_count,
             ROUND((p.jumlah_seat_total - p.sisa_seat)::decimal / p.jumlah_seat_total * 100, 2) as occupancy_percentage
      FROM packages p
      LEFT JOIN jamaah j ON p.id = j.package_id AND j.is_deleted = false
      WHERE ${whereClause}
      GROUP BY p.id
      ORDER BY p.departure_date ASC, p.kode_paket ASC
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

  // Update package
  static async update(id, updateData) {
    const packageData = await this.findById(id);
    if (!packageData) {
      throw new Error('Package tidak ditemukan');
    }

    const { error, value } = this.getValidationSchema().validate(updateData);
    if (error) {
      throw new Error(`Validation error: ${error.details[0].message}`);
    }

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
    updateFields.push(`updated_at = $${paramCount}`);
    updateValues.push(new Date());

    paramCount++;
    updateValues.push(id);

    const updateQuery = `
      UPDATE packages 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await query(updateQuery, updateValues);
    return result.rows[0];
  }

  // Delete package (only if no jamaah assigned)
  static async delete(id) {
    const packageData = await this.findById(id);
    if (!packageData) {
      throw new Error('Package tidak ditemukan');
    }

    // Check if any jamaah is assigned to this package
    const jamaahCount = await query(
      'SELECT COUNT(*) as count FROM jamaah WHERE package_id = $1 AND is_deleted = false',
      [id]
    );

    if (parseInt(jamaahCount.rows[0].count) > 0) {
      throw new Error('Package tidak dapat dihapus karena masih ada jamaah yang terdaftar');
    }

    await query('DELETE FROM packages WHERE id = $1', [id]);
    return { success: true };
  }

  // Get package statistics
  static async getStatistics() {
    const result = await query(`
      SELECT 
        COUNT(*) as total_packages,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_packages,
        COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_packages,
        AVG(price) as average_price,
        MIN(price) as min_price,
        MAX(price) as max_price,
        SUM(max_capacity) as total_capacity,
        SUM(current_capacity) as total_occupied
      FROM packages
    `);

    return result.rows[0];
  }

  // Get package with jamaah details
  static async getWithJamaah(id) {
    const packageData = await this.findById(id);
    if (!packageData) {
      throw new Error('Package tidak ditemukan');
    }

    const jamaahResult = await query(
      `SELECT id, full_name, nik, phone, jamaah_status, payment_status
       FROM jamaah 
       WHERE package_id = $1 AND is_deleted = false
       ORDER BY full_name`,
      [id]
    );

    return {
      ...packageData,
      jamaah_list: jamaahResult.rows
    };
  }

  // Get available packages (not full)
  static async getAvailable() {
    const result = await query(`
      SELECT p.*, (p.max_capacity - p.current_capacity) as available_capacity
      FROM packages p
      WHERE p.is_active = true 
        AND p.current_capacity < p.max_capacity
        AND (p.departure_date IS NULL OR p.departure_date >= CURRENT_DATE)
      ORDER BY p.departure_date ASC, p.name ASC
    `);

    return result.rows;
  }

  // Update package seat availability (called when jamaah is assigned/removed)
  static async updateSeatAvailability(id) {
    const result = await query(`
      UPDATE packages 
      SET sisa_seat = jumlah_seat_total - (
        SELECT COUNT(*) 
        FROM jamaah 
        WHERE package_id = $1 AND is_deleted = false
      ),
      current_capacity = (
        SELECT COUNT(*) 
        FROM jamaah 
        WHERE package_id = $1 AND is_deleted = false
      ),
      updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [id]);

    return result.rows[0];
  }

  // Check if package has available seats
  static async hasAvailableSeats(id, requestedSeats = 1) {
    const packageData = await this.findById(id);
    if (!packageData) {
      return false;
    }

    return packageData.sisa_seat >= requestedSeats;
  }

  // Get package by code
  static async findByCode(kode_paket) {
    const result = await query(
      'SELECT * FROM packages WHERE kode_paket = $1',
      [kode_paket]
    );
    return result.rows[0];
  }

  // Get packages by departure date range
  static async findByDateRange(startDate, endDate) {
    const result = await query(`
      SELECT p.*, 
             (p.max_capacity - p.current_capacity) as available_capacity
      FROM packages p
      WHERE p.departure_date BETWEEN $1 AND $2
        AND p.is_active = true
      ORDER BY p.departure_date ASC
    `, [startDate, endDate]);

    return result.rows;
  }

  // Get package occupancy report
  static async getOccupancyReport() {
    const result = await query(`
      SELECT 
        p.id,
        p.name,
        p.max_capacity,
        p.current_capacity,
        p.departure_date,
        p.price,
        (p.current_capacity::float / p.max_capacity * 100) as occupancy_percentage,
        (p.max_capacity - p.current_capacity) as available_spots
      FROM packages p
      WHERE p.is_active = true
      ORDER BY p.departure_date ASC
    `);

    return result.rows;
  }

  // Check if package has capacity for new jamaah
  static async hasCapacity(id, count = 1) {
    const packageData = await this.findById(id);
    if (!packageData) {
      return false;
    }

    return (packageData.current_capacity + count) <= packageData.max_capacity;
  }

  // Get popular packages (most jamaah registered)
  static async getPopular(limit = 5) {
    const result = await query(`
      SELECT p.*, 
             COUNT(j.id) as jamaah_count,
             (p.current_capacity::float / p.max_capacity * 100) as occupancy_percentage
      FROM packages p
      LEFT JOIN jamaah j ON p.id = j.package_id AND j.is_deleted = false
      WHERE p.is_active = true
      GROUP BY p.id
      ORDER BY jamaah_count DESC, p.created_at DESC
      LIMIT $1
    `, [limit]);

    return result.rows;
  }

  // Get package with brochure images
  static async getWithBrosur(id) {
    const packageData = await this.findById(id);
    if (!packageData) {
      throw new Error('Package tidak ditemukan');
    }

    const brosurResult = await query(`
      SELECT * FROM package_brosur 
      WHERE package_id = $1 
      ORDER BY image_order ASC, created_at ASC
    `, [id]);

    return {
      ...packageData,
      brosur_images: brosurResult.rows
    };
  }

  // Get packages with primary brochure images
  static async findAllWithPrimaryImage(filters = {}, page = 1, limit = 50) {
    let whereConditions = ['1=1'];
    let values = [];
    let paramCount = 0;

    if (filters.is_active !== undefined) {
      paramCount++;
      whereConditions.push(`p.is_active = $${paramCount}`);
      values.push(filters.is_active);
    }

    if (filters.search) {
      paramCount++;
      whereConditions.push(`(p.kode_paket ILIKE $${paramCount} OR p.nama_paket ILIKE $${paramCount} OR p.kota_asal ILIKE $${paramCount} OR p.maskapai ILIKE $${paramCount})`);
      values.push(`%${filters.search}%`);
    }

    if (filters.available_only) {
      whereConditions.push('p.sisa_seat > 0');
    }

    const whereClause = whereConditions.join(' AND ');
    const offset = (page - 1) * limit;

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM packages p WHERE ${whereClause}`;
    const countResult = await query(countQuery, values);
    const total = parseInt(countResult.rows[0].total);

    // Get data with pagination and primary brochure image
    paramCount++;
    values.push(limit);
    paramCount++;
    values.push(offset);

    const dataQuery = `
      SELECT p.*, 
             p.sisa_seat as available_capacity,
             (p.jumlah_seat_total - p.sisa_seat) as occupied_seats,
             COUNT(j.id) as jamaah_count,
             ROUND((p.jumlah_seat_total - p.sisa_seat)::decimal / p.jumlah_seat_total * 100, 2) as occupancy_percentage,
             pb.image_url as primary_image_url,
             pb.image_filename as primary_image_filename,
             pb.alt_text as primary_image_alt
      FROM packages p
      LEFT JOIN jamaah j ON p.id = j.package_id AND j.is_deleted = false
      LEFT JOIN package_brosur pb ON p.id = pb.package_id AND pb.is_primary = true
      WHERE ${whereClause}
      GROUP BY p.id, pb.image_url, pb.image_filename, pb.alt_text
      ORDER BY p.departure_date ASC, p.kode_paket ASC
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
}

module.exports = Package;