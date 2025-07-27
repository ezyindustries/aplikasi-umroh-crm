const { query, transaction } = require('../config/database');
const Joi = require('joi');
const path = require('path');
const fs = require('fs');

class Document {
  
  static getValidationSchema() {
    return Joi.object({
      jamaah_id: Joi.number().integer().required(),
      document_type: Joi.string().valid(
        'passport', 'ktp', 'visa', 'photo', 'medical', 
        'certificate', 'other'
      ).required(),
      file_name: Joi.string().max(255).required(),
      file_path: Joi.string().max(500).required(),
      file_size: Joi.number().integer().min(0),
      mime_type: Joi.string().max(100)
    });
  }

  // Create new document
  static async create(documentData, uploadedBy) {
    const { error, value } = this.getValidationSchema().validate(documentData);
    if (error) {
      throw new Error(`Validation error: ${error.details[0].message}`);
    }

    const result = await query(
      `INSERT INTO documents (
        jamaah_id, document_type, file_name, file_path, 
        file_size, mime_type, uploaded_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        value.jamaah_id,
        value.document_type,
        value.file_name,
        value.file_path,
        value.file_size,
        value.mime_type,
        uploadedBy
      ]
    );

    return result.rows[0];
  }

  // Get documents by jamaah ID
  static async findByJamaah(jamaahId) {
    const result = await query(
      `SELECT d.*, u.full_name as uploaded_by_name
       FROM documents d
       LEFT JOIN users u ON d.uploaded_by = u.id
       WHERE d.jamaah_id = $1
       ORDER BY d.upload_date DESC`,
      [jamaahId]
    );
    return result.rows;
  }

  // Get document by ID
  static async findById(id) {
    const result = await query(
      `SELECT d.*, u.full_name as uploaded_by_name, j.full_name as jamaah_name
       FROM documents d
       LEFT JOIN users u ON d.uploaded_by = u.id
       LEFT JOIN jamaah j ON d.jamaah_id = j.id
       WHERE d.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  // Get all documents with filters
  static async findAll(filters = {}, page = 1, limit = 50) {
    let whereConditions = ['1=1'];
    let values = [];
    let paramCount = 0;

    if (filters.jamaah_id) {
      paramCount++;
      whereConditions.push(`d.jamaah_id = $${paramCount}`);
      values.push(filters.jamaah_id);
    }

    if (filters.document_type) {
      paramCount++;
      whereConditions.push(`d.document_type = $${paramCount}`);
      values.push(filters.document_type);
    }

    if (filters.is_verified !== undefined) {
      paramCount++;
      whereConditions.push(`d.is_verified = $${paramCount}`);
      values.push(filters.is_verified);
    }

    const whereClause = whereConditions.join(' AND ');
    const offset = (page - 1) * limit;

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM documents d 
      LEFT JOIN jamaah j ON d.jamaah_id = j.id
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
      SELECT d.*, j.full_name as jamaah_name, u.full_name as uploaded_by_name
      FROM documents d
      LEFT JOIN jamaah j ON d.jamaah_id = j.id
      LEFT JOIN users u ON d.uploaded_by = u.id
      WHERE ${whereClause}
      ORDER BY d.upload_date DESC
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

  // Verify document
  static async verify(id, verifiedBy) {
    const result = await query(
      `UPDATE documents 
       SET is_verified = true, verified_by = $1, verification_date = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [verifiedBy, id]
    );

    if (result.rows.length === 0) {
      throw new Error('Document tidak ditemukan');
    }

    return result.rows[0];
  }

  // Delete document
  static async delete(id, deletedBy) {
    const document = await this.findById(id);
    if (!document) {
      throw new Error('Document tidak ditemukan');
    }

    const result = await transaction(async (client) => {
      // Delete file from filesystem
      try {
        if (fs.existsSync(document.file_path)) {
          fs.unlinkSync(document.file_path);
        }
      } catch (error) {
        console.error('Error deleting file:', error);
      }

      // Delete from database
      await client.query('DELETE FROM documents WHERE id = $1', [id]);

      return { success: true };
    });

    return result;
  }

  // Get document statistics
  static async getStatistics() {
    const result = await query(`
      SELECT 
        COUNT(*) as total_documents,
        COUNT(CASE WHEN is_verified = true THEN 1 END) as verified_documents,
        COUNT(CASE WHEN is_verified = false THEN 1 END) as unverified_documents,
        COUNT(CASE WHEN document_type = 'passport' THEN 1 END) as passport_documents,
        COUNT(CASE WHEN document_type = 'visa' THEN 1 END) as visa_documents,
        COUNT(CASE WHEN document_type = 'photo' THEN 1 END) as photo_documents
      FROM documents
    `);

    return result.rows[0];
  }

  // Get documents by type
  static async findByType(documentType, page = 1, limit = 50) {
    return this.findAll({ document_type: documentType }, page, limit);
  }

  // Get unverified documents
  static async findUnverified(page = 1, limit = 50) {
    return this.findAll({ is_verified: false }, page, limit);
  }

  // Get file path for serving
  static getFilePath(document) {
    return path.resolve(document.file_path);
  }

  // Check if file exists
  static fileExists(document) {
    return fs.existsSync(document.file_path);
  }

  // Get file info
  static getFileInfo(filePath) {
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const stats = fs.statSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    
    return {
      size: stats.size,
      extension: ext,
      lastModified: stats.mtime,
      isImage: ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext),
      isPdf: ext === '.pdf',
      isDocument: ['.doc', '.docx', '.pdf'].includes(ext)
    };
  }
}

module.exports = Document;