const { query } = require('../config/database');

const activityLogger = {
  async log(userId, action, details = {}) {
    try {
      await query(
        `INSERT INTO activity_logs (user_id, action, details, ip_address, user_agent, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          userId,
          action,
          JSON.stringify(details),
          details.ip || null,
          details.userAgent || null
        ]
      );
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  },

  async getActivities(filters = {}) {
    try {
      let sql = `
        SELECT 
          al.*,
          u.username,
          u.full_name
        FROM activity_logs al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE 1=1
      `;
      const params = [];

      if (filters.userId) {
        params.push(filters.userId);
        sql += ` AND al.user_id = $${params.length}`;
      }

      if (filters.action) {
        params.push(`%${filters.action}%`);
        sql += ` AND al.action ILIKE $${params.length}`;
      }

      if (filters.startDate) {
        params.push(filters.startDate);
        sql += ` AND al.created_at >= $${params.length}`;
      }

      if (filters.endDate) {
        params.push(filters.endDate);
        sql += ` AND al.created_at <= $${params.length}`;
      }

      sql += ` ORDER BY al.created_at DESC`;

      if (filters.limit) {
        params.push(filters.limit);
        sql += ` LIMIT $${params.length}`;
      }

      const result = await query(sql, params);
      return result.rows;
    } catch (error) {
      console.error('Failed to get activities:', error);
      throw error;
    }
  }
};

module.exports = activityLogger;