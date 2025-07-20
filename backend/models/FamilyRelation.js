const { query, transaction } = require('../config/database');
const Joi = require('joi');

class FamilyRelation {
  
  static getValidationSchema() {
    return Joi.object({
      jamaah_id: Joi.number().integer().required(),
      related_jamaah_id: Joi.number().integer().required(),
      relation_type: Joi.string().valid(
        'spouse', 'child', 'parent', 'sibling', 
        'mahram', 'guardian', 'other'
      ).required()
    }).custom((value, helpers) => {
      // Prevent self-relation
      if (value.jamaah_id === value.related_jamaah_id) {
        return helpers.error('custom.selfRelation');
      }
      return value;
    }, 'Self-relation validation').messages({
      'custom.selfRelation': 'Jamaah tidak dapat berhubungan dengan dirinya sendiri'
    });
  }

  // Create new family relation
  static async create(relationData, createdBy) {
    const { error, value } = this.getValidationSchema().validate(relationData);
    if (error) {
      throw new Error(`Validation error: ${error.details[0].message}`);
    }

    // Check if both jamaah exist
    const jamaah1 = await query('SELECT id, full_name FROM jamaah WHERE id = $1 AND is_deleted = false', [value.jamaah_id]);
    const jamaah2 = await query('SELECT id, full_name FROM jamaah WHERE id = $1 AND is_deleted = false', [value.related_jamaah_id]);

    if (jamaah1.rows.length === 0) {
      throw new Error('Jamaah pertama tidak ditemukan');
    }

    if (jamaah2.rows.length === 0) {
      throw new Error('Jamaah kedua tidak ditemukan');
    }

    // Check if relation already exists
    const existingRelation = await this.findRelation(value.jamaah_id, value.related_jamaah_id);
    if (existingRelation) {
      throw new Error('Hubungan keluarga sudah ada');
    }

    const result = await transaction(async (client) => {
      // Insert relation
      const insertResult = await client.query(
        `INSERT INTO family_relations (jamaah_id, related_jamaah_id, relation_type)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [value.jamaah_id, value.related_jamaah_id, value.relation_type]
      );

      const relation = insertResult.rows[0];

      // Create reciprocal relation for certain types
      const reciprocalType = this.getReciprocalRelationType(value.relation_type);
      if (reciprocalType) {
        await client.query(
          `INSERT INTO family_relations (jamaah_id, related_jamaah_id, relation_type)
           VALUES ($1, $2, $3)`,
          [value.related_jamaah_id, value.jamaah_id, reciprocalType]
        );
      }

      return relation;
    });

    return result;
  }

  // Get reciprocal relation type
  static getReciprocalRelationType(relationType) {
    const reciprocals = {
      'spouse': 'spouse',
      'parent': 'child',
      'child': 'parent',
      'sibling': 'sibling',
      'mahram': 'mahram'
    };
    return reciprocals[relationType] || null;
  }

  // Find existing relation between two jamaah
  static async findRelation(jamaahId1, jamaahId2) {
    const result = await query(
      `SELECT * FROM family_relations 
       WHERE (jamaah_id = $1 AND related_jamaah_id = $2) 
          OR (jamaah_id = $2 AND related_jamaah_id = $1)`,
      [jamaahId1, jamaahId2]
    );
    return result.rows[0];
  }

  // Get family relations for a jamaah
  static async findByJamaah(jamaahId) {
    const result = await query(
      `SELECT fr.*, j.full_name as related_jamaah_name, j.nik as related_jamaah_nik,
              j.gender as related_jamaah_gender, j.birth_date as related_jamaah_birth_date
       FROM family_relations fr
       LEFT JOIN jamaah j ON fr.related_jamaah_id = j.id
       WHERE fr.jamaah_id = $1 AND j.is_deleted = false
       ORDER BY fr.relation_type, j.full_name`,
      [jamaahId]
    );
    return result.rows;
  }

  // Get all family relations with jamaah details
  static async findAll(filters = {}, page = 1, limit = 50) {
    let whereConditions = ['j1.is_deleted = false AND j2.is_deleted = false'];
    let values = [];
    let paramCount = 0;

    if (filters.jamaah_id) {
      paramCount++;
      whereConditions.push(`fr.jamaah_id = $${paramCount}`);
      values.push(filters.jamaah_id);
    }

    if (filters.relation_type) {
      paramCount++;
      whereConditions.push(`fr.relation_type = $${paramCount}`);
      values.push(filters.relation_type);
    }

    if (filters.search) {
      paramCount++;
      whereConditions.push(`(j1.full_name ILIKE $${paramCount} OR j2.full_name ILIKE $${paramCount})`);
      values.push(`%${filters.search}%`);
    }

    const whereClause = whereConditions.join(' AND ');
    const offset = (page - 1) * limit;

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM family_relations fr
      LEFT JOIN jamaah j1 ON fr.jamaah_id = j1.id
      LEFT JOIN jamaah j2 ON fr.related_jamaah_id = j2.id
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
      SELECT fr.*, 
             j1.full_name as jamaah_name, j1.nik as jamaah_nik,
             j2.full_name as related_jamaah_name, j2.nik as related_jamaah_nik
      FROM family_relations fr
      LEFT JOIN jamaah j1 ON fr.jamaah_id = j1.id
      LEFT JOIN jamaah j2 ON fr.related_jamaah_id = j2.id
      WHERE ${whereClause}
      ORDER BY j1.full_name, j2.full_name
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

  // Update family relation
  static async update(id, updateData) {
    const relation = await this.findById(id);
    if (!relation) {
      throw new Error('Hubungan keluarga tidak ditemukan');
    }

    const { error, value } = this.getValidationSchema().validate(updateData);
    if (error) {
      throw new Error(`Validation error: ${error.details[0].message}`);
    }

    const result = await query(
      `UPDATE family_relations 
       SET relation_type = $1
       WHERE id = $2
       RETURNING *`,
      [value.relation_type, id]
    );

    return result.rows[0];
  }

  // Delete family relation
  static async delete(id) {
    const relation = await this.findById(id);
    if (!relation) {
      throw new Error('Hubungan keluarga tidak ditemukan');
    }

    const result = await transaction(async (client) => {
      // Delete the main relation
      await client.query('DELETE FROM family_relations WHERE id = $1', [id]);

      // Delete reciprocal relation if exists
      await client.query(
        `DELETE FROM family_relations 
         WHERE jamaah_id = $1 AND related_jamaah_id = $2`,
        [relation.related_jamaah_id, relation.jamaah_id]
      );

      return { success: true };
    });

    return result;
  }

  // Find relation by ID
  static async findById(id) {
    const result = await query(
      `SELECT fr.*, 
              j1.full_name as jamaah_name, j1.nik as jamaah_nik,
              j2.full_name as related_jamaah_name, j2.nik as related_jamaah_nik
       FROM family_relations fr
       LEFT JOIN jamaah j1 ON fr.jamaah_id = j1.id
       LEFT JOIN jamaah j2 ON fr.related_jamaah_id = j2.id
       WHERE fr.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  // Get family tree for a jamaah
  static async getFamilyTree(jamaahId) {
    const result = await query(
      `WITH RECURSIVE family_tree AS (
        -- Start with the given jamaah
        SELECT $1 as jamaah_id, 0 as level
        
        UNION
        
        -- Find all related jamaah
        SELECT fr.related_jamaah_id, ft.level + 1
        FROM family_tree ft
        JOIN family_relations fr ON ft.jamaah_id = fr.jamaah_id
        WHERE ft.level < 3  -- Limit depth to prevent infinite recursion
      )
      SELECT DISTINCT ft.jamaah_id, ft.level,
             j.full_name, j.nik, j.gender, j.birth_date,
             fr.relation_type
      FROM family_tree ft
      LEFT JOIN jamaah j ON ft.jamaah_id = j.id
      LEFT JOIN family_relations fr ON (fr.jamaah_id = $1 AND fr.related_jamaah_id = ft.jamaah_id)
      WHERE j.is_deleted = false
      ORDER BY ft.level, j.full_name`,
      [jamaahId]
    );

    return result.rows;
  }

  // Get mahram relations for a jamaah (Islamic law-based relationships)
  static async getMahramRelations(jamaahId) {
    const result = await query(
      `SELECT fr.*, j.full_name as related_jamaah_name, j.nik as related_jamaah_nik,
              j.gender as related_jamaah_gender
       FROM family_relations fr
       LEFT JOIN jamaah j ON fr.related_jamaah_id = j.id
       WHERE fr.jamaah_id = $1 
         AND fr.relation_type IN ('spouse', 'parent', 'child', 'sibling', 'mahram')
         AND j.is_deleted = false
       ORDER BY j.full_name`,
      [jamaahId]
    );
    return result.rows;
  }

  // Check if two jamaah are mahram (can travel together)
  static async areMahram(jamaahId1, jamaahId2) {
    // Check direct mahram relations
    const result = await query(
      `SELECT COUNT(*) as count
       FROM family_relations fr
       WHERE ((fr.jamaah_id = $1 AND fr.related_jamaah_id = $2) 
           OR (fr.jamaah_id = $2 AND fr.related_jamaah_id = $1))
         AND fr.relation_type IN ('spouse', 'parent', 'child', 'sibling', 'mahram')`,
      [jamaahId1, jamaahId2]
    );

    return parseInt(result.rows[0].count) > 0;
  }

  // Get relation statistics
  static async getStatistics() {
    const result = await query(`
      SELECT 
        COUNT(*) as total_relations,
        COUNT(CASE WHEN relation_type = 'spouse' THEN 1 END) as spouse_relations,
        COUNT(CASE WHEN relation_type = 'parent' THEN 1 END) as parent_relations,
        COUNT(CASE WHEN relation_type = 'child' THEN 1 END) as child_relations,
        COUNT(CASE WHEN relation_type = 'sibling' THEN 1 END) as sibling_relations,
        COUNT(CASE WHEN relation_type = 'mahram' THEN 1 END) as mahram_relations
      FROM family_relations fr
      LEFT JOIN jamaah j1 ON fr.jamaah_id = j1.id
      LEFT JOIN jamaah j2 ON fr.related_jamaah_id = j2.id
      WHERE j1.is_deleted = false AND j2.is_deleted = false
    `);

    return result.rows[0];
  }

  // Get jamaah without family relations
  static async findJamaahWithoutFamily() {
    const result = await query(`
      SELECT j.id, j.full_name, j.nik, j.gender
      FROM jamaah j
      WHERE j.is_deleted = false
        AND j.id NOT IN (
          SELECT DISTINCT jamaah_id FROM family_relations
          UNION
          SELECT DISTINCT related_jamaah_id FROM family_relations
        )
      ORDER BY j.full_name
    `);

    return result.rows;
  }

  // Get families (groups of related jamaah)
  static async getFamilies() {
    const result = await query(`
      WITH family_groups AS (
        SELECT fr.jamaah_id, fr.related_jamaah_id,
               j1.full_name as jamaah_name,
               j2.full_name as related_jamaah_name
        FROM family_relations fr
        LEFT JOIN jamaah j1 ON fr.jamaah_id = j1.id
        LEFT JOIN jamaah j2 ON fr.related_jamaah_id = j2.id
        WHERE j1.is_deleted = false AND j2.is_deleted = false
      )
      SELECT jamaah_id, jamaah_name, 
             COUNT(*) as family_size,
             ARRAY_AGG(related_jamaah_name) as family_members
      FROM family_groups
      GROUP BY jamaah_id, jamaah_name
      ORDER BY family_size DESC, jamaah_name
    `);

    return result.rows;
  }
}

module.exports = FamilyRelation;