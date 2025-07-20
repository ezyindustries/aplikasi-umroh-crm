const { query, transaction } = require('../config/database');
const Joi = require('joi');

class Jamaah {
  
  // Validation schema for jamaah data
  static getValidationSchema() {
    return Joi.object({
      full_name: Joi.string().min(2).max(255).required(),
      nik: Joi.string().length(16).pattern(/^\d+$/).required(),
      birth_place: Joi.string().max(255).allow(''),
      birth_date: Joi.date().max('now').allow(null),
      gender: Joi.string().valid('M', 'F').required(),
      marital_status: Joi.string().valid('single', 'married', 'divorced', 'widowed').allow(''),
      address: Joi.string().max(1000).allow(''),
      phone: Joi.string().max(20).allow(''),
      email: Joi.string().email().max(255).allow(''),
      emergency_contact: Joi.string().max(255).allow(''),
      emergency_phone: Joi.string().max(20).allow(''),
      
      passport_number: Joi.string().max(50).allow(''),
      passport_issue_date: Joi.date().allow(null),
      passport_expiry_date: Joi.date().greater(Joi.ref('passport_issue_date')).allow(null),
      passport_issue_place: Joi.string().max(255).allow(''),
      
      // Passport photo fields
      passport_photo_url: Joi.string().max(500).allow('', null),
      passport_photo_filename: Joi.string().max(255).allow('', null),
      passport_photo_size: Joi.number().integer().min(0).allow(null),
      
      package_id: Joi.number().integer().allow(null),
      
      medical_notes: Joi.string().max(2000).allow(''),
      is_elderly: Joi.boolean().default(false),
      special_needs: Joi.string().max(1000).allow(''),
      
      total_payment: Joi.number().precision(2).min(0).default(0),
      remaining_payment: Joi.number().precision(2).min(0).default(0)
    });
  }

  // Create new jamaah
  static async create(jamaahData, createdBy) {
    const { error, value } = this.getValidationSchema().validate(jamaahData);
    if (error) {
      throw new Error(`Validation error: ${error.details[0].message}`);
    }

    // Check for duplicate NIK
    const existingNik = await this.findByNik(value.nik);
    if (existingNik) {
      throw new Error('NIK sudah terdaftar dalam sistem');
    }

    // Check for duplicate passport if provided
    if (value.passport_number) {
      const existingPassport = await this.findByPassport(value.passport_number);
      if (existingPassport) {
        throw new Error('Nomor paspor sudah terdaftar dalam sistem');
      }
    }

    const result = await transaction(async (client) => {
      // Insert jamaah
      const insertQuery = `
        INSERT INTO jamaah (
          full_name, nik, birth_place, birth_date, gender, marital_status,
          address, phone, email, emergency_contact, emergency_phone,
          passport_number, passport_issue_date, passport_expiry_date, passport_issue_place,
          passport_photo_url, passport_photo_filename, passport_photo_size,
          package_id, medical_notes, is_elderly, special_needs,
          total_payment, remaining_payment, created_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20, $21, $22, $23, $24, $25
        ) RETURNING *
      `;

      const insertValues = [
        value.full_name, value.nik, value.birth_place, value.birth_date,
        value.gender, value.marital_status, value.address, value.phone,
        value.email, value.emergency_contact, value.emergency_phone,
        value.passport_number, value.passport_issue_date, value.passport_expiry_date,
        value.passport_issue_place, value.passport_photo_url, value.passport_photo_filename, value.passport_photo_size,
        value.package_id, value.medical_notes,
        value.is_elderly, value.special_needs, value.total_payment,
        value.remaining_payment, createdBy
      ];

      const insertResult = await client.query(insertQuery, insertValues);
      const jamaah = insertResult.rows[0];

      // Update package capacity if package is assigned
      if (value.package_id) {
        await client.query(
          'UPDATE packages SET current_capacity = current_capacity + 1 WHERE id = $1',
          [value.package_id]
        );
      }

      return jamaah;
    });

    return result;
  }

  // Find jamaah by ID
  static async findById(id) {
    const result = await query(
      `SELECT j.*, p.name as package_name, u.full_name as created_by_name
       FROM jamaah j
       LEFT JOIN packages p ON j.package_id = p.id
       LEFT JOIN users u ON j.created_by = u.id
       WHERE j.id = $1 AND j.is_deleted = false`,
      [id]
    );
    return result.rows[0];
  }

  // Find jamaah by NIK
  static async findByNik(nik) {
    const result = await query(
      'SELECT * FROM jamaah WHERE nik = $1 AND is_deleted = false',
      [nik]
    );
    return result.rows[0];
  }

  // Find jamaah by passport number
  static async findByPassport(passportNumber) {
    const result = await query(
      'SELECT * FROM jamaah WHERE passport_number = $1 AND is_deleted = false',
      [passportNumber]
    );
    return result.rows[0];
  }

  // Get all jamaah with filters and pagination
  static async findAll(filters = {}, page = 1, limit = 50) {
    let whereConditions = ['j.is_deleted = false'];
    let values = [];
    let paramCount = 0;

    // Build WHERE conditions
    if (filters.search) {
      paramCount++;
      whereConditions.push(`(j.full_name ILIKE $${paramCount} OR j.nik ILIKE $${paramCount})`);
      values.push(`%${filters.search}%`);
    }

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
    const offset = (page - 1) * limit;

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM jamaah j 
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
      SELECT j.*, p.name as package_name, u.full_name as created_by_name
      FROM jamaah j
      LEFT JOIN packages p ON j.package_id = p.id
      LEFT JOIN users u ON j.created_by = u.id
      WHERE ${whereClause}
      ORDER BY j.created_at DESC
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

  // Update jamaah
  static async update(id, updateData, updatedBy) {
    const jamaah = await this.findById(id);
    if (!jamaah) {
      throw new Error('Jamaah tidak ditemukan');
    }

    // Validate update data
    const { error, value } = this.getValidationSchema().validate(updateData);
    if (error) {
      throw new Error(`Validation error: ${error.details[0].message}`);
    }

    // Check for duplicate NIK (excluding current record)
    if (value.nik && value.nik !== jamaah.nik) {
      const existingNik = await this.findByNik(value.nik);
      if (existingNik && existingNik.id !== id) {
        throw new Error('NIK sudah terdaftar dalam sistem');
      }
    }

    // Check for duplicate passport (excluding current record)
    if (value.passport_number && value.passport_number !== jamaah.passport_number) {
      const existingPassport = await this.findByPassport(value.passport_number);
      if (existingPassport && existingPassport.id !== id) {
        throw new Error('Nomor paspor sudah terdaftar dalam sistem');
      }
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
      updateFields.push(`updated_at = $${paramCount}`);
      updateValues.push(new Date());

      paramCount++;
      updateValues.push(id);

      const updateQuery = `
        UPDATE jamaah 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount} AND is_deleted = false
        RETURNING *
      `;

      const updateResult = await client.query(updateQuery, updateValues);

      // Handle package capacity changes
      if (value.package_id && value.package_id !== jamaah.package_id) {
        // Remove from old package
        if (jamaah.package_id) {
          await client.query(
            'UPDATE packages SET current_capacity = current_capacity - 1 WHERE id = $1',
            [jamaah.package_id]
          );
        }
        // Add to new package
        await client.query(
          'UPDATE packages SET current_capacity = current_capacity + 1 WHERE id = $1',
          [value.package_id]
        );
      }

      return updateResult.rows[0];
    });

    return result;
  }

  // Soft delete jamaah
  static async delete(id, deletedBy) {
    const jamaah = await this.findById(id);
    if (!jamaah) {
      throw new Error('Jamaah tidak ditemukan');
    }

    const result = await transaction(async (client) => {
      // Soft delete
      await client.query(
        `UPDATE jamaah 
         SET is_deleted = true, deleted_at = $1, updated_at = $1
         WHERE id = $2`,
        [new Date(), id]
      );

      // Update package capacity
      if (jamaah.package_id) {
        await client.query(
          'UPDATE packages SET current_capacity = current_capacity - 1 WHERE id = $1',
          [jamaah.package_id]
        );
      }

      return { success: true };
    });

    return result;
  }

  // Get jamaah statistics
  static async getStatistics() {
    const result = await query(`
      SELECT 
        COUNT(*) as total_jamaah,
        COUNT(CASE WHEN jamaah_status = 'registered' THEN 1 END) as registered,
        COUNT(CASE WHEN jamaah_status = 'confirmed' THEN 1 END) as confirmed,
        COUNT(CASE WHEN jamaah_status = 'departed' THEN 1 END) as departed,
        COUNT(CASE WHEN visa_status = 'approved' THEN 1 END) as visa_approved,
        COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as fully_paid,
        COUNT(CASE WHEN is_elderly = true THEN 1 END) as elderly_count
      FROM jamaah 
      WHERE is_deleted = false
    `);

    return result.rows[0];
  }

  // Upload passport photo
  static async uploadPassportPhoto(jamaahId, photoData) {
    const jamaah = await this.findById(jamaahId);
    if (!jamaah) {
      throw new Error('Jamaah tidak ditemukan');
    }

    const { filename, size, url } = photoData;
    
    const result = await query(`
      UPDATE jamaah 
      SET 
        passport_photo_url = $1,
        passport_photo_filename = $2,
        passport_photo_size = $3,
        passport_photo_uploaded_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4 AND is_deleted = false
      RETURNING *
    `, [url, filename, size, jamaahId]);

    return result.rows[0];
  }

  // Delete passport photo
  static async deletePassportPhoto(jamaahId) {
    const jamaah = await this.findById(jamaahId);
    if (!jamaah) {
      throw new Error('Jamaah tidak ditemukan');
    }

    const result = await query(`
      UPDATE jamaah 
      SET 
        passport_photo_url = NULL,
        passport_photo_filename = NULL,
        passport_photo_size = NULL,
        passport_photo_uploaded_at = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND is_deleted = false
      RETURNING *
    `, [jamaahId]);

    return result.rows[0];
  }

  // Get jamaah with passport photo info
  static async findByIdWithPhoto(id) {
    const result = await query(
      `SELECT j.*, p.name as package_name, u.full_name as created_by_name,
              CASE 
                WHEN j.passport_photo_url IS NOT NULL THEN true 
                ELSE false 
              END as has_passport_photo
       FROM jamaah j
       LEFT JOIN packages p ON j.package_id = p.id
       LEFT JOIN users u ON j.created_by = u.id
       WHERE j.id = $1 AND j.is_deleted = false`,
      [id]
    );
    return result.rows[0];
  }

  // Validate passport photo file
  static validatePassportPhoto(file) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error('Format file tidak didukung. Gunakan JPG, JPEG, atau PNG.');
    }
    
    if (file.size > maxSize) {
      throw new Error('Ukuran file terlalu besar. Maksimal 5MB.');
    }
    
    return true;
  }

  // Get statistics with photo upload info
  static async getStatisticsWithPhoto() {
    const result = await query(`
      SELECT 
        COUNT(*) as total_jamaah,
        COUNT(CASE WHEN jamaah_status = 'registered' THEN 1 END) as registered,
        COUNT(CASE WHEN jamaah_status = 'confirmed' THEN 1 END) as confirmed,
        COUNT(CASE WHEN jamaah_status = 'departed' THEN 1 END) as departed,
        COUNT(CASE WHEN visa_status = 'approved' THEN 1 END) as visa_approved,
        COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as fully_paid,
        COUNT(CASE WHEN is_elderly = true THEN 1 END) as elderly_count,
        COUNT(CASE WHEN passport_photo_url IS NOT NULL THEN 1 END) as with_passport_photo,
        COUNT(CASE WHEN passport_photo_url IS NULL THEN 1 END) as without_passport_photo
      FROM jamaah 
      WHERE is_deleted = false
    `);

    return result.rows[0];
  }
}

module.exports = Jamaah;