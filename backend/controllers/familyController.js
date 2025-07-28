const { FamilyRelation } = require('../models');

class FamilyController {

  // Create new family relation
  static async create(req, res, next) {
    try {
      const relation = await FamilyRelation.create(req.body, req.user.id);
      
      res.status(201).json({
        success: true,
        message: 'Hubungan keluarga berhasil ditambahkan',
        data: relation
      });
    } catch (error) {
      next(error);
    }
  }

  // Get all family relations with filters
  static async getAll(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      
      const filters = {};
      if (req.query.jamaah_id) filters.jamaah_id = parseInt(req.query.jamaah_id);
      if (req.query.relation_type) filters.relation_type = req.query.relation_type;
      if (req.query.search) filters.search = req.query.search;

      const result = await FamilyRelation.findAll(filters, page, limit);
      
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  // Get family relations by jamaah ID
  static async getByJamaah(req, res, next) {
    try {
      const { jamaah_id } = req.params;
      const relations = await FamilyRelation.findByJamaah(jamaah_id);
      
      res.json({
        success: true,
        data: relations
      });
    } catch (error) {
      next(error);
    }
  }

  // Get family tree for jamaah
  static async getFamilyTree(req, res, next) {
    try {
      const { jamaah_id } = req.params;
      const familyTree = await FamilyRelation.getFamilyTree(jamaah_id);
      
      res.json({
        success: true,
        data: familyTree
      });
    } catch (error) {
      next(error);
    }
  }

  // Get mahram relations for jamaah
  static async getMahramRelations(req, res, next) {
    try {
      const { jamaah_id } = req.params;
      const mahramRelations = await FamilyRelation.getMahramRelations(jamaah_id);
      
      res.json({
        success: true,
        data: mahramRelations
      });
    } catch (error) {
      next(error);
    }
  }

  // Check if two jamaah are mahram
  static async checkMahram(req, res, next) {
    try {
      const { jamaah_id1, jamaah_id2 } = req.params;
      const areMahram = await FamilyRelation.areMahram(jamaah_id1, jamaah_id2);
      
      res.json({
        success: true,
        data: {
          jamaah_id1: parseInt(jamaah_id1),
          jamaah_id2: parseInt(jamaah_id2),
          are_mahram: areMahram
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get relation by ID
  static async getById(req, res, next) {
    try {
      const relation = await FamilyRelation.findById(req.params.id);
      
      if (!relation) {
        return res.status(404).json({
          success: false,
          error: 'Hubungan keluarga tidak ditemukan'
        });
      }

      res.json({
        success: true,
        data: relation
      });
    } catch (error) {
      next(error);
    }
  }

  // Update family relation
  static async update(req, res, next) {
    try {
      const relation = await FamilyRelation.update(req.params.id, req.body);
      
      res.json({
        success: true,
        message: 'Hubungan keluarga berhasil diperbarui',
        data: relation
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete family relation
  static async delete(req, res, next) {
    try {
      await FamilyRelation.delete(req.params.id);
      
      res.json({
        success: true,
        message: 'Hubungan keluarga berhasil dihapus'
      });
    } catch (error) {
      next(error);
    }
  }

  // Get family relation statistics
  static async getStatistics(req, res, next) {
    try {
      const stats = await FamilyRelation.getStatistics();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  // Get jamaah without family relations
  static async getJamaahWithoutFamily(req, res, next) {
    try {
      const jamaah = await FamilyRelation.findJamaahWithoutFamily();
      
      res.json({
        success: true,
        data: jamaah
      });
    } catch (error) {
      next(error);
    }
  }

  // Get families (groups of related jamaah)
  static async getFamilies(req, res, next) {
    try {
      const families = await FamilyRelation.getFamilies();
      
      res.json({
        success: true,
        data: families
      });
    } catch (error) {
      next(error);
    }
  }

  // Bulk create family relations
  static async bulkCreate(req, res, next) {
    try {
      const { relations } = req.body;
      
      if (!relations || !Array.isArray(relations)) {
        return res.status(400).json({
          success: false,
          error: 'relations harus berupa array'
        });
      }

      const results = [];
      const errors = [];

      for (const relationData of relations) {
        try {
          const relation = await FamilyRelation.create(relationData, req.user.id);
          results.push(relation);
        } catch (error) {
          errors.push({
            data: relationData,
            error: error.message
          });
        }
      }

      res.json({
        success: true,
        message: `${results.length} hubungan keluarga berhasil ditambahkan`,
        data: results,
        errors: errors
      });
    } catch (error) {
      next(error);
    }
  }

  // Get relation types list
  static async getRelationTypes(req, res, next) {
    try {
      const relationTypes = [
        { value: 'spouse', label: 'Suami/Istri', description: 'Pasangan resmi' },
        { value: 'parent', label: 'Orang Tua', description: 'Ayah atau Ibu' },
        { value: 'child', label: 'Anak', description: 'Anak kandung' },
        { value: 'sibling', label: 'Saudara Kandung', description: 'Kakak atau Adik' },
        { value: 'mahram', label: 'Mahram', description: 'Hubungan mahram lainnya' },
        { value: 'guardian', label: 'Wali', description: 'Wali atau yang diwali' },
        { value: 'other', label: 'Lainnya', description: 'Hubungan keluarga lainnya' }
      ];
      
      res.json({
        success: true,
        data: relationTypes
      });
    } catch (error) {
      next(error);
    }
  }

  // Validate mahram for group travel
  static async validateGroupMahram(req, res, next) {
    try {
      const { jamaah_ids } = req.body;
      
      if (!jamaah_ids || !Array.isArray(jamaah_ids)) {
        return res.status(400).json({
          success: false,
          error: 'jamaah_ids harus berupa array'
        });
      }

      const validationResults = [];
      const warnings = [];

      // Check mahram relationships for female jamaah
      for (const jamaahId of jamaah_ids) {
        const jamaahResult = await FamilyRelation.query(
          'SELECT id, full_name, gender FROM jamaah WHERE id = $1 AND is_deleted = false',
          [jamaahId]
        );

        if (jamaahResult.rows.length === 0) continue;

        const jamaah = jamaahResult.rows[0];
        
        if (jamaah.gender === 'F') {
          // Check if female jamaah has mahram in the group
          const mahramInGroup = [];
          
          for (const otherJamaahId of jamaah_ids) {
            if (otherJamaahId !== jamaahId) {
              const areMahram = await FamilyRelation.areMahram(jamaahId, otherJamaahId);
              if (areMahram) {
                const otherJamaahResult = await FamilyRelation.query(
                  'SELECT full_name FROM jamaah WHERE id = $1',
                  [otherJamaahId]
                );
                if (otherJamaahResult.rows.length > 0) {
                  mahramInGroup.push(otherJamaahResult.rows[0].full_name);
                }
              }
            }
          }

          validationResults.push({
            jamaah_id: jamaahId,
            jamaah_name: jamaah.full_name,
            gender: jamaah.gender,
            has_mahram: mahramInGroup.length > 0,
            mahram_in_group: mahramInGroup
          });

          if (mahramInGroup.length === 0) {
            warnings.push(`${jamaah.full_name} (perempuan) tidak memiliki mahram dalam grup ini`);
          }
        } else {
          validationResults.push({
            jamaah_id: jamaahId,
            jamaah_name: jamaah.full_name,
            gender: jamaah.gender,
            has_mahram: true, // Male jamaah don't need mahram
            mahram_in_group: []
          });
        }
      }

      res.json({
        success: true,
        data: {
          validation_results: validationResults,
          warnings: warnings,
          is_valid: warnings.length === 0
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = FamilyController;
