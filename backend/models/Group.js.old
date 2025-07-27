const { query } = require('../config/database');
const Joi = require('joi');

class Group {
  
  // Validation schema
  static getValidationSchema() {
    return Joi.object({
      name: Joi.string().min(3).max(255).required()
        .messages({
          'string.min': 'Nama grup minimal 3 karakter',
          'string.max': 'Nama grup maksimal 255 karakter',
          'any.required': 'Nama grup wajib diisi'
        }),
      package_id: Joi.number().integer().positive().required()
        .messages({
          'number.positive': 'Package ID harus berupa angka positif',
          'any.required': 'Package ID wajib diisi'
        }),
      leader_jamaah_id: Joi.number().integer().positive().allow(null)
        .messages({
          'number.positive': 'Leader jamaah ID harus berupa angka positif'
        }),
      departure_date: Joi.date().allow(null)
        .messages({
          'date.base': 'Tanggal keberangkatan harus berupa tanggal yang valid'
        }),
      bus_number: Joi.string().max(50).allow(null, '')
        .messages({
          'string.max': 'Nomor bus maksimal 50 karakter'
        }),
      gathering_point: Joi.string().max(255).allow(null, '')
        .messages({
          'string.max': 'Titik kumpul maksimal 255 karakter'
        }),
      gathering_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).allow(null, '')
        .messages({
          'string.pattern.base': 'Waktu kumpul harus dalam format HH:MM'
        }),
      hotel_info: Joi.string().allow(null, ''),
      notes: Joi.string().allow(null, '')
    });
  }

  // Create new group
  static async create(groupData, userId) {
    const { error, value } = this.getValidationSchema().validate(groupData);
    if (error) {
      throw new Error(error.details[0].message);
    }

    // Check if package exists
    const packageResult = await query('SELECT id FROM packages WHERE id = $1', [value.package_id]);
    if (packageResult.rows.length === 0) {
      throw new Error('Package tidak ditemukan');
    }

    // Check if leader jamaah exists and belongs to the package
    if (value.leader_jamaah_id) {
      const jamaahResult = await query(
        'SELECT id FROM jamaah WHERE id = $1 AND package_id = $2 AND is_deleted = false',
        [value.leader_jamaah_id, value.package_id]
      );
      if (jamaahResult.rows.length === 0) {
        throw new Error('Leader jamaah tidak ditemukan atau tidak sesuai dengan package');
      }
    }

    // Check if group name is unique for this package
    const nameCheck = await query(
      'SELECT id FROM groups WHERE name = $1 AND package_id = $2',
      [value.name, value.package_id]
    );
    if (nameCheck.rows.length > 0) {
      throw new Error('Nama grup sudah digunakan untuk package ini');
    }

    const result = await query(`
      INSERT INTO groups (
        name, package_id, leader_jamaah_id, departure_date, 
        bus_number, gathering_point, gathering_time, hotel_info, notes,
        created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      value.name, value.package_id, value.leader_jamaah_id, value.departure_date,
      value.bus_number, value.gathering_point, value.gathering_time, 
      value.hotel_info, value.notes, userId, userId
    ]);

    return result.rows[0];
  }

  // Get all groups with filters and pagination
  static async getAll(filters = {}, pagination = {}) {
    const { page = 1, limit = 50 } = pagination;
    const offset = (page - 1) * limit;
    
    let whereConditions = [];
    let values = [];
    let paramCount = 0;

    // Build WHERE clause based on filters
    if (filters.package_id) {
      paramCount++;
      whereConditions.push(`g.package_id = $${paramCount}`);
      values.push(filters.package_id);
    }

    if (filters.departure_date_from) {
      paramCount++;
      whereConditions.push(`g.departure_date >= $${paramCount}`);
      values.push(filters.departure_date_from);
    }

    if (filters.departure_date_to) {
      paramCount++;
      whereConditions.push(`g.departure_date <= $${paramCount}`);
      values.push(filters.departure_date_to);
    }

    if (filters.search) {
      paramCount++;
      whereConditions.push(`(g.name ILIKE $${paramCount} OR g.bus_number ILIKE $${paramCount})`);
      values.push(`%${filters.search}%`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get groups with related data
    const groupsQuery = `
      SELECT 
        g.*,
        p.name as package_name,
        p.price as package_price,
        j.full_name as leader_name,
        COUNT(gm.jamaah_id) as member_count,
        COUNT(CASE WHEN jm.payment_status = 'paid' THEN 1 END) as paid_members,
        COUNT(CASE WHEN jm.visa_status = 'approved' THEN 1 END) as visa_approved_members
      FROM groups g
      LEFT JOIN packages p ON g.package_id = p.id
      LEFT JOIN jamaah j ON g.leader_jamaah_id = j.id
      LEFT JOIN group_members gm ON g.id = gm.group_id
      LEFT JOIN jamaah jm ON gm.jamaah_id = jm.id AND jm.is_deleted = false
      ${whereClause}
      GROUP BY g.id, p.name, p.price, j.full_name
      ORDER BY g.departure_date ASC, g.name ASC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    values.push(limit, offset);

    const result = await query(groupsQuery, values);

    // Get total count
    const countQuery = `
      SELECT COUNT(DISTINCT g.id) as total
      FROM groups g
      LEFT JOIN packages p ON g.package_id = p.id
      ${whereClause}
    `;

    const countResult = await query(countQuery, values.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);

    return {
      groups: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // Get group by ID with members
  static async getById(id) {
    const groupResult = await query(`
      SELECT 
        g.*,
        p.name as package_name,
        p.price as package_price,
        p.departure_city,
        j.full_name as leader_name,
        j.phone as leader_phone
      FROM groups g
      LEFT JOIN packages p ON g.package_id = p.id
      LEFT JOIN jamaah j ON g.leader_jamaah_id = j.id
      WHERE g.id = $1
    `, [id]);

    if (groupResult.rows.length === 0) {
      return null;
    }

    const group = groupResult.rows[0];

    // Get group members
    const membersResult = await query(`
      SELECT 
        j.id,
        j.full_name,
        j.nik,
        j.gender,
        j.birth_date,
        j.phone,
        j.jamaah_status,
        j.visa_status,
        j.payment_status,
        gm.joined_at,
        gm.role as member_role,
        gm.room_number,
        gm.seat_number
      FROM group_members gm
      JOIN jamaah j ON gm.jamaah_id = j.id
      WHERE gm.group_id = $1 AND j.is_deleted = false
      ORDER BY gm.joined_at ASC
    `, [id]);

    group.members = membersResult.rows;

    return group;
  }

  // Update group
  static async update(id, updateData, userId) {
    // Remove fields that shouldn't be updated
    const allowedFields = [
      'name', 'leader_jamaah_id', 'departure_date', 'bus_number',
      'gathering_point', 'gathering_time', 'hotel_info', 'notes'
    ];
    
    const filteredData = {};
    allowedFields.forEach(field => {
      if (updateData.hasOwnProperty(field)) {
        filteredData[field] = updateData[field];
      }
    });

    const { error, value } = this.getValidationSchema().validate(filteredData, { allowUnknown: false });
    if (error) {
      throw new Error(error.details[0].message);
    }

    // Check if group exists
    const existingGroup = await query('SELECT * FROM groups WHERE id = $1', [id]);
    if (existingGroup.rows.length === 0) {
      throw new Error('Grup tidak ditemukan');
    }

    // Check if leader jamaah exists and belongs to the package
    if (value.leader_jamaah_id) {
      const jamaahResult = await query(
        'SELECT id FROM jamaah WHERE id = $1 AND package_id = $2 AND is_deleted = false',
        [value.leader_jamaah_id, existingGroup.rows[0].package_id]
      );
      if (jamaahResult.rows.length === 0) {
        throw new Error('Leader jamaah tidak ditemukan atau tidak sesuai dengan package');
      }
    }

    // Build update query
    const updateFields = Object.keys(value);
    if (updateFields.length === 0) {
      throw new Error('Tidak ada data yang diupdate');
    }

    let setClause = updateFields.map((field, index) => `${field} = $${index + 1}`).join(', ');
    setClause += `, updated_by = $${updateFields.length + 1}, updated_at = CURRENT_TIMESTAMP`;
    
    const values = [...Object.values(value), userId];

    const result = await query(`
      UPDATE groups 
      SET ${setClause}
      WHERE id = $${updateFields.length + 2}
      RETURNING *
    `, [...values, id]);

    return result.rows[0];
  }

  // Delete group (soft delete)
  static async delete(id, userId) {
    // Check if group has members
    const memberCount = await query(
      'SELECT COUNT(*) as count FROM group_members WHERE group_id = $1',
      [id]
    );

    if (parseInt(memberCount.rows[0].count) > 0) {
      throw new Error('Tidak dapat menghapus grup yang masih memiliki anggota');
    }

    const result = await query(`
      DELETE FROM groups 
      WHERE id = $1
      RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      throw new Error('Grup tidak ditemukan');
    }

    return result.rows[0];
  }

  // Add member to group
  static async addMember(groupId, jamaahId, memberData = {}, userId) {
    // Check if group exists
    const groupCheck = await query('SELECT * FROM groups WHERE id = $1', [groupId]);
    if (groupCheck.rows.length === 0) {
      throw new Error('Grup tidak ditemukan');
    }

    // Check if jamaah exists and belongs to the same package
    const jamaahCheck = await query(`
      SELECT id FROM jamaah 
      WHERE id = $1 AND package_id = $2 AND is_deleted = false
    `, [jamaahId, groupCheck.rows[0].package_id]);

    if (jamaahCheck.rows.length === 0) {
      throw new Error('Jamaah tidak ditemukan atau tidak sesuai dengan package grup');
    }

    // Check if jamaah is already in this group
    const memberCheck = await query(
      'SELECT id FROM group_members WHERE group_id = $1 AND jamaah_id = $2',
      [groupId, jamaahId]
    );

    if (memberCheck.rows.length > 0) {
      throw new Error('Jamaah sudah menjadi anggota grup ini');
    }

    // Check if jamaah is already in another group for the same package
    const otherGroupCheck = await query(`
      SELECT g.name FROM group_members gm
      JOIN groups g ON gm.group_id = g.id
      WHERE gm.jamaah_id = $1 AND g.package_id = $2
    `, [jamaahId, groupCheck.rows[0].package_id]);

    if (otherGroupCheck.rows.length > 0) {
      throw new Error(`Jamaah sudah menjadi anggota grup "${otherGroupCheck.rows[0].name}"`);
    }

    const result = await query(`
      INSERT INTO group_members (group_id, jamaah_id, role, room_number, seat_number, added_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      groupId, 
      jamaahId, 
      memberData.role || 'member',
      memberData.room_number || null,
      memberData.seat_number || null,
      userId
    ]);

    return result.rows[0];
  }

  // Remove member from group
  static async removeMember(groupId, jamaahId, userId) {
    const result = await query(`
      DELETE FROM group_members 
      WHERE group_id = $1 AND jamaah_id = $2
      RETURNING *
    `, [groupId, jamaahId]);

    if (result.rows.length === 0) {
      throw new Error('Anggota grup tidak ditemukan');
    }

    return result.rows[0];
  }

  // Update member data
  static async updateMember(groupId, jamaahId, updateData, userId) {
    const allowedFields = ['role', 'room_number', 'seat_number'];
    const filteredData = {};
    
    allowedFields.forEach(field => {
      if (updateData.hasOwnProperty(field)) {
        filteredData[field] = updateData[field];
      }
    });

    if (Object.keys(filteredData).length === 0) {
      throw new Error('Tidak ada data yang diupdate');
    }

    const updateFields = Object.keys(filteredData);
    const setClause = updateFields.map((field, index) => `${field} = $${index + 1}`).join(', ');
    const values = Object.values(filteredData);

    const result = await query(`
      UPDATE group_members 
      SET ${setClause}
      WHERE group_id = $${values.length + 1} AND jamaah_id = $${values.length + 2}
      RETURNING *
    `, [...values, groupId, jamaahId]);

    if (result.rows.length === 0) {
      throw new Error('Anggota grup tidak ditemukan');
    }

    return result.rows[0];
  }

  // Get groups statistics
  static async getStatistics() {
    const stats = await query(`
      SELECT 
        COUNT(*) as total_groups,
        COUNT(CASE WHEN departure_date IS NOT NULL THEN 1 END) as groups_with_departure,
        COUNT(CASE WHEN leader_jamaah_id IS NOT NULL THEN 1 END) as groups_with_leader,
        AVG(member_counts.member_count) as avg_members_per_group,
        MAX(member_counts.member_count) as max_members_in_group,
        MIN(member_counts.member_count) as min_members_in_group
      FROM groups g
      LEFT JOIN (
        SELECT group_id, COUNT(*) as member_count
        FROM group_members
        GROUP BY group_id
      ) member_counts ON g.id = member_counts.group_id
    `);

    return stats.rows[0];
  }

  // Bulk add members to group
  static async bulkAddMembers(groupId, jamaahIds, userId) {
    if (!Array.isArray(jamaahIds) || jamaahIds.length === 0) {
      throw new Error('Daftar jamaah ID harus berupa array dan tidak boleh kosong');
    }

    // Check if group exists
    const groupCheck = await query('SELECT * FROM groups WHERE id = $1', [groupId]);
    if (groupCheck.rows.length === 0) {
      throw new Error('Grup tidak ditemukan');
    }

    const results = [];
    const errors = [];

    for (const jamaahId of jamaahIds) {
      try {
        const result = await this.addMember(groupId, jamaahId, {}, userId);
        results.push(result);
      } catch (error) {
        errors.push({ jamaah_id: jamaahId, error: error.message });
      }
    }

    return { results, errors };
  }

  // Generate manifest for group
  static async generateManifest(groupId) {
    const group = await this.getById(groupId);
    if (!group) {
      throw new Error('Grup tidak ditemukan');
    }

    // Calculate additional statistics
    const stats = await query(`
      SELECT 
        COUNT(*) as total_members,
        COUNT(CASE WHEN j.gender = 'M' THEN 1 END) as male_count,
        COUNT(CASE WHEN j.gender = 'F' THEN 1 END) as female_count,
        COUNT(CASE WHEN j.is_elderly = true THEN 1 END) as elderly_count,
        COUNT(CASE WHEN j.visa_status = 'approved' THEN 1 END) as visa_approved,
        COUNT(CASE WHEN j.payment_status = 'paid' THEN 1 END) as fully_paid
      FROM group_members gm
      JOIN jamaah j ON gm.jamaah_id = j.id
      WHERE gm.group_id = $1 AND j.is_deleted = false
    `, [groupId]);

    group.statistics = stats.rows[0];

    return group;
  }
}

module.exports = Group;