const { query, transaction } = require('../config/database');
const Joi = require('joi');

class PackageBrosur {
  
  // Validation schema for brosur data
  static getValidationSchema() {
    return Joi.object({
      package_id: Joi.number().integer().required(),
      image_url: Joi.string().max(500).required(),
      image_filename: Joi.string().max(255).required(),
      image_size: Joi.number().integer().min(0).allow(null),
      image_order: Joi.number().integer().min(1).default(1),
      alt_text: Joi.string().max(255).allow('', null),
      description: Joi.string().max(2000).allow('', null),
      is_primary: Joi.boolean().default(false)
    });
  }

  // Add new brochure image
  static async create(brosurData, uploadedBy) {
    const { error, value } = this.getValidationSchema().validate(brosurData);
    if (error) {
      throw new Error(`Validation error: ${error.details[0].message}`);
    }

    const result = await transaction(async (client) => {
      // If this is marked as primary, unset other primary images for this package
      if (value.is_primary) {
        await client.query(
          'UPDATE package_brosur SET is_primary = false WHERE package_id = $1',
          [value.package_id]
        );
      }

      // Insert new brosur image
      const insertQuery = `
        INSERT INTO package_brosur (
          package_id, image_url, image_filename, image_size, image_order,
          alt_text, description, is_primary, uploaded_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;

      const insertValues = [
        value.package_id, value.image_url, value.image_filename, 
        value.image_size, value.image_order, value.alt_text, 
        value.description, value.is_primary, uploadedBy
      ];

      const insertResult = await client.query(insertQuery, insertValues);
      return insertResult.rows[0];
    });

    return result;
  }

  // Get all brochure images for a package
  static async findByPackageId(packageId, orderBy = 'image_order ASC') {
    const result = await query(`
      SELECT pb.*, u.full_name as uploaded_by_name
      FROM package_brosur pb
      LEFT JOIN users u ON pb.uploaded_by = u.id
      WHERE pb.package_id = $1
      ORDER BY ${orderBy}
    `, [packageId]);

    return result.rows;
  }

  // Get primary/cover image for a package
  static async getPrimaryImage(packageId) {
    const result = await query(`
      SELECT * FROM package_brosur 
      WHERE package_id = $1 AND is_primary = true
    `, [packageId]);

    return result.rows[0];
  }

  // Update brochure image details
  static async update(id, updateData) {
    const brosur = await this.findById(id);
    if (!brosur) {
      throw new Error('Gambar brosur tidak ditemukan');
    }

    const { error, value } = this.getValidationSchema().validate(updateData);
    if (error) {
      throw new Error(`Validation error: ${error.details[0].message}`);
    }

    const result = await transaction(async (client) => {
      // If this is being set as primary, unset other primary images for this package
      if (value.is_primary && !brosur.is_primary) {
        await client.query(
          'UPDATE package_brosur SET is_primary = false WHERE package_id = $1 AND id != $2',
          [brosur.package_id, id]
        );
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
        UPDATE package_brosur 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const updateResult = await client.query(updateQuery, updateValues);
      return updateResult.rows[0];
    });

    return result;
  }

  // Delete brochure image
  static async delete(id) {
    const brosur = await this.findById(id);
    if (!brosur) {
      throw new Error('Gambar brosur tidak ditemukan');
    }

    await query('DELETE FROM package_brosur WHERE id = $1', [id]);
    return { success: true };
  }

  // Find brochure by ID
  static async findById(id) {
    const result = await query(`
      SELECT pb.*, u.full_name as uploaded_by_name
      FROM package_brosur pb
      LEFT JOIN users u ON pb.uploaded_by = u.id
      WHERE pb.id = $1
    `, [id]);

    return result.rows[0];
  }

  // Reorder images for a package
  static async reorderImages(packageId, imageOrders) {
    // imageOrders should be array of {id, order} objects
    const result = await transaction(async (client) => {
      for (const item of imageOrders) {
        await client.query(
          'UPDATE package_brosur SET image_order = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND package_id = $3',
          [item.order, item.id, packageId]
        );
      }
      
      // Return updated images
      const updatedResult = await client.query(`
        SELECT * FROM package_brosur 
        WHERE package_id = $1 
        ORDER BY image_order ASC
      `, [packageId]);
      
      return updatedResult.rows;
    });

    return result;
  }

  // Set primary image
  static async setPrimaryImage(packageId, imageId) {
    const result = await transaction(async (client) => {
      // First, unset all primary flags for this package
      await client.query(
        'UPDATE package_brosur SET is_primary = false, updated_at = CURRENT_TIMESTAMP WHERE package_id = $1',
        [packageId]
      );

      // Then set the specified image as primary
      const updateResult = await client.query(
        'UPDATE package_brosur SET is_primary = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND package_id = $2 RETURNING *',
        [imageId, packageId]
      );

      return updateResult.rows[0];
    });

    return result;
  }

  // Get statistics
  static async getStatistics() {
    const result = await query(`
      SELECT 
        COUNT(*) as total_images,
        COUNT(DISTINCT package_id) as packages_with_images,
        AVG(image_size) as avg_image_size,
        SUM(image_size) as total_storage_used,
        COUNT(CASE WHEN is_primary = true THEN 1 END) as primary_images
      FROM package_brosur
    `);

    return result.rows[0];
  }

  // Validate image file
  static validateImageFile(file) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error('Format file tidak didukung. Gunakan JPG, PNG, atau WebP.');
    }
    
    if (file.size > maxSize) {
      throw new Error('Ukuran file terlalu besar. Maksimal 10MB.');
    }
    
    return true;
  }

  // Get packages with their primary images
  static async getPackagesWithPrimaryImages() {
    const result = await query(`
      SELECT 
        p.*,
        pb.image_url as primary_image_url,
        pb.image_filename as primary_image_filename,
        pb.alt_text as primary_image_alt
      FROM packages p
      LEFT JOIN package_brosur pb ON p.id = pb.package_id AND pb.is_primary = true
      WHERE p.is_active = true
      ORDER BY p.created_at DESC
    `);

    return result.rows;
  }
}

module.exports = PackageBrosur;