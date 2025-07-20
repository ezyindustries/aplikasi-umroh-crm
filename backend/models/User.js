const { query, transaction } = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');

class User {
  
  static getValidationSchema() {
    return Joi.object({
      username: Joi.string().alphanum().min(3).max(30).required(),
      email: Joi.string().email().required(),
      password: Joi.string().min(6).required(),
      full_name: Joi.string().min(2).max(255).required(),
      role_id: Joi.number().integer().required()
    });
  }

  static getUpdateValidationSchema() {
    return Joi.object({
      username: Joi.string().alphanum().min(3).max(30),
      email: Joi.string().email(),
      full_name: Joi.string().min(2).max(255),
      role_id: Joi.number().integer(),
      is_active: Joi.boolean()
    });
  }

  // Create new user
  static async create(userData) {
    const { error, value } = this.getValidationSchema().validate(userData);
    if (error) {
      throw new Error(`Validation error: ${error.details[0].message}`);
    }

    // Check if username exists
    const existingUsername = await this.findByUsername(value.username);
    if (existingUsername) {
      throw new Error('Username sudah digunakan');
    }

    // Check if email exists
    const existingEmail = await this.findByEmail(value.email);
    if (existingEmail) {
      throw new Error('Email sudah digunakan');
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(value.password, saltRounds);

    const result = await query(
      `INSERT INTO users (username, email, password_hash, full_name, role_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, email, full_name, role_id, is_active, created_at`,
      [value.username, value.email, passwordHash, value.full_name, value.role_id]
    );

    return result.rows[0];
  }

  // Find user by username
  static async findByUsername(username) {
    const result = await query(
      `SELECT u.*, r.name as role_name, r.description as role_description
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.username = $1`,
      [username]
    );
    return result.rows[0];
  }

  // Find user by email
  static async findByEmail(email) {
    const result = await query(
      `SELECT u.*, r.name as role_name, r.description as role_description
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.email = $1`,
      [email]
    );
    return result.rows[0];
  }

  // Find user by ID
  static async findById(id) {
    const result = await query(
      `SELECT u.*, r.name as role_name, r.description as role_description
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  // Authenticate user
  static async authenticate(username, password) {
    const user = await this.findByUsername(username);
    if (!user) {
      throw new Error('Username atau password salah');
    }

    if (!user.is_active) {
      throw new Error('Akun tidak aktif');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('Username atau password salah');
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role_name 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Remove password hash from response
    delete user.password_hash;

    return { user, token };
  }

  // Get all users
  static async findAll(page = 1, limit = 50) {
    const offset = (page - 1) * limit;

    // Get total count
    const countResult = await query('SELECT COUNT(*) as total FROM users');
    const total = parseInt(countResult.rows[0].total);

    // Get users with pagination
    const result = await query(
      `SELECT u.id, u.username, u.email, u.full_name, u.is_active, u.created_at,
              r.name as role_name, r.description as role_description
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       ORDER BY u.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return {
      data: result.rows,
      pagination: {
        current_page: page,
        per_page: limit,
        total: total,
        total_pages: Math.ceil(total / limit)
      }
    };
  }

  // Update user
  static async update(id, updateData) {
    const user = await this.findById(id);
    if (!user) {
      throw new Error('User tidak ditemukan');
    }

    const { error, value } = this.getUpdateValidationSchema().validate(updateData);
    if (error) {
      throw new Error(`Validation error: ${error.details[0].message}`);
    }

    // Check for duplicate username (excluding current user)
    if (value.username && value.username !== user.username) {
      const existingUsername = await this.findByUsername(value.username);
      if (existingUsername && existingUsername.id !== id) {
        throw new Error('Username sudah digunakan');
      }
    }

    // Check for duplicate email (excluding current user)
    if (value.email && value.email !== user.email) {
      const existingEmail = await this.findByEmail(value.email);
      if (existingEmail && existingEmail.id !== id) {
        throw new Error('Email sudah digunakan');
      }
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
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, username, email, full_name, role_id, is_active, updated_at
    `;

    const result = await query(updateQuery, updateValues);
    return result.rows[0];
  }

  // Change password
  static async changePassword(id, currentPassword, newPassword) {
    const user = await this.findById(id);
    if (!user) {
      throw new Error('User tidak ditemukan');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isCurrentPasswordValid) {
      throw new Error('Password saat ini salah');
    }

    // Validate new password
    if (newPassword.length < 6) {
      throw new Error('Password baru minimal 6 karakter');
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    await query(
      'UPDATE users SET password_hash = $1, updated_at = $2 WHERE id = $3',
      [newPasswordHash, new Date(), id]
    );

    return { success: true };
  }

  // Verify JWT token
  static verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error('Token tidak valid');
    }
  }

  // Get user statistics
  static async getStatistics() {
    const result = await query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_users,
        COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_users
      FROM users
    `);

    const roleStats = await query(`
      SELECT r.name, COUNT(u.id) as user_count
      FROM roles r
      LEFT JOIN users u ON r.id = u.role_id
      GROUP BY r.id, r.name
      ORDER BY user_count DESC
    `);

    return {
      ...result.rows[0],
      role_distribution: roleStats.rows
    };
  }
}

module.exports = User;