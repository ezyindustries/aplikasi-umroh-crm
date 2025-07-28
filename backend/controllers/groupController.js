const { Group } = require('../models');
const { query } = require('../config/database');
const { logActivity } = require('../utils/activityLogger');

class GroupController {

  // Get all groups with filters and pagination
  static async getAll(req, res, next) {
    try {
      const filters = {
        package_id: req.query.package_id ? parseInt(req.query.package_id) : undefined,
        departure_date_from: req.query.departure_date_from,
        departure_date_to: req.query.departure_date_to,
        search: req.query.search
      };

      const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20
      };

      const result = await Group.getAll(filters, pagination);

      await logActivity(req.user.id, 'groups', 'read', 'Melihat daftar grup', req.ip);

      res.json({
        success: true,
        data: result.groups,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  // Get group by ID
  static async getById(req, res, next) {
    try {
      const { id } = req.params;
      const group = await Group.getById(id);

      if (!group) {
        return res.status(404).json({
          success: false,
          error: 'Grup tidak ditemukan'
        });
      }

      await logActivity(req.user.id, 'groups', 'read', `Melihat detail grup: ${group.name}`, req.ip);

      res.json({
        success: true,
        data: group
      });
    } catch (error) {
      next(error);
    }
  }

  // Create new group
  static async create(req, res, next) {
    try {
      const group = await Group.create(req.body, req.user.id);

      await logActivity(req.user.id, 'groups', 'create', `Membuat grup baru: ${group.name}`, req.ip);

      res.status(201).json({
        success: true,
        data: group,
        message: 'Grup berhasil dibuat'
      });
    } catch (error) {
      next(error);
    }
  }

  // Update group
  static async update(req, res, next) {
    try {
      const { id } = req.params;
      const group = await Group.update(id, req.body, req.user.id);

      await logActivity(req.user.id, 'groups', 'update', `Mengupdate grup: ${group.name}`, req.ip);

      res.json({
        success: true,
        data: group,
        message: 'Grup berhasil diupdate'
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete group
  static async delete(req, res, next) {
    try {
      const { id } = req.params;
      const group = await Group.delete(id, req.user.id);

      await logActivity(req.user.id, 'groups', 'delete', `Menghapus grup: ${group.name}`, req.ip);

      res.json({
        success: true,
        message: 'Grup berhasil dihapus'
      });
    } catch (error) {
      next(error);
    }
  }

  // Add member to group
  static async addMember(req, res, next) {
    try {
      const { groupId } = req.params;
      const { jamaah_id, role, room_number, seat_number } = req.body;

      if (!jamaah_id) {
        return res.status(400).json({
          success: false,
          error: 'Jamaah ID wajib diisi'
        });
      }

      const memberData = { role, room_number, seat_number };
      const member = await Group.addMember(groupId, jamaah_id, memberData, req.user.id);

      await logActivity(req.user.id, 'groups', 'update', `Menambah anggota ke grup ID: ${groupId}`, req.ip);

      res.status(201).json({
        success: true,
        data: member,
        message: 'Anggota berhasil ditambahkan ke grup'
      });
    } catch (error) {
      next(error);
    }
  }

  // Remove member from group
  static async removeMember(req, res, next) {
    try {
      const { groupId, jamaahId } = req.params;
      await Group.removeMember(groupId, jamaahId, req.user.id);

      await logActivity(req.user.id, 'groups', 'update', `Menghapus anggota dari grup ID: ${groupId}`, req.ip);

      res.json({
        success: true,
        message: 'Anggota berhasil dihapus dari grup'
      });
    } catch (error) {
      next(error);
    }
  }

  // Update member data
  static async updateMember(req, res, next) {
    try {
      const { groupId, jamaahId } = req.params;
      const member = await Group.updateMember(groupId, jamaahId, req.body, req.user.id);

      await logActivity(req.user.id, 'groups', 'update', `Mengupdate anggota grup ID: ${groupId}`, req.ip);

      res.json({
        success: true,
        data: member,
        message: 'Data anggota berhasil diupdate'
      });
    } catch (error) {
      next(error);
    }
  }

  // Bulk add members
  static async bulkAddMembers(req, res, next) {
    try {
      const { groupId } = req.params;
      const { jamaah_ids } = req.body;

      if (!Array.isArray(jamaah_ids) || jamaah_ids.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'jamaah_ids harus berupa array dan tidak boleh kosong'
        });
      }

      const result = await Group.bulkAddMembers(groupId, jamaah_ids, req.user.id);

      await logActivity(req.user.id, 'groups', 'update', `Bulk add ${jamaah_ids.length} anggota ke grup ID: ${groupId}`, req.ip);

      res.json({
        success: true,
        data: result,
        message: `${result.results.length} anggota berhasil ditambahkan, ${result.errors.length} gagal`
      });
    } catch (error) {
      next(error);
    }
  }

  // Get group statistics
  static async getStatistics(req, res, next) {
    try {
      const stats = await Group.getStatistics();

      await logActivity(req.user.id, 'groups', 'read', 'Melihat statistik grup', req.ip);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  // Generate manifest
  static async generateManifest(req, res, next) {
    try {
      const { id } = req.params;
      const manifest = await Group.generateManifest(id);

      await logActivity(req.user.id, 'groups', 'read', `Generate manifest grup: ${manifest.name}`, req.ip);

      res.json({
        success: true,
        data: manifest
      });
    } catch (error) {
      next(error);
    }
  }

  // Get available jamaah for group (not in any group for the package)
  static async getAvailableJamaah(req, res, next) {
    try {
      const { package_id } = req.query;
      
      if (!package_id) {
        return res.status(400).json({
          success: false,
          error: 'Package ID wajib diisi'
        });
      }

      const result = await query(`
        SELECT 
          j.id,
          j.full_name,
          j.nik,
          j.gender,
          j.phone,
          j.jamaah_status,
          j.visa_status,
          j.payment_status
        FROM jamaah j
        WHERE j.package_id = $1 
          AND j.is_deleted = false
          AND j.id NOT IN (
            SELECT gm.jamaah_id 
            FROM group_members gm
            JOIN groups g ON gm.group_id = g.id
            WHERE g.package_id = $1
          )
        ORDER BY j.full_name
      `, [package_id]);

      await logActivity(req.user.id, 'groups', 'read', 'Melihat jamaah tersedia untuk grup', req.ip);

      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      next(error);
    }
  }

  // Auto-assign jamaah to groups
  static async autoAssignJamaah(req, res, next) {
    try {
      const { package_id, max_members_per_group = 45 } = req.body;

      if (!package_id) {
        return res.status(400).json({
          success: false,
          error: 'Package ID wajib diisi'
        });
      }

      // Get all jamaah without groups for this package
      const availableJamaah = await query(`
        SELECT j.id, j.full_name, j.gender
        FROM jamaah j
        WHERE j.package_id = $1 
          AND j.is_deleted = false
          AND j.jamaah_status IN ('registered', 'confirmed')
          AND j.id NOT IN (
            SELECT gm.jamaah_id 
            FROM group_members gm
            JOIN groups g ON gm.group_id = g.id
            WHERE g.package_id = $1
          )
        ORDER BY j.created_at
      `, [package_id]);

      if (availableJamaah.rows.length === 0) {
        return res.json({
          success: true,
          data: { groups_created: 0, jamaah_assigned: 0 },
          message: 'Tidak ada jamaah yang perlu di-assign ke grup'
        });
      }

      // Calculate number of groups needed
      const totalJamaah = availableJamaah.rows.length;
      const groupsNeeded = Math.ceil(totalJamaah / max_members_per_group);

      const createdGroups = [];
      let assignedCount = 0;

      // Create groups and assign jamaah
      for (let i = 0; i < groupsNeeded; i++) {
        const groupName = `Grup ${String.fromCharCode(65 + i)}`; // A, B, C, etc.
        
        // Create group
        const group = await Group.create({
          name: groupName,
          package_id: package_id
        }, req.user.id);

        createdGroups.push(group);

        // Assign jamaah to this group
        const startIndex = i * max_members_per_group;
        const endIndex = Math.min(startIndex + max_members_per_group, totalJamaah);
        
        for (let j = startIndex; j < endIndex; j++) {
          try {
            await Group.addMember(group.id, availableJamaah.rows[j].id, {}, req.user.id);
            assignedCount++;
          } catch (error) {
            console.error(`Error assigning jamaah ${availableJamaah.rows[j].id}:`, error.message);
          }
        }
      }

      await logActivity(req.user.id, 'groups', 'create', `Auto-assign: ${groupsNeeded} grup dibuat, ${assignedCount} jamaah di-assign`, req.ip);

      res.json({
        success: true,
        data: {
          groups_created: groupsNeeded,
          jamaah_assigned: assignedCount,
          created_groups: createdGroups
        },
        message: `Berhasil membuat ${groupsNeeded} grup dan assign ${assignedCount} jamaah`
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = GroupController;
