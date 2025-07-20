// Simple audit service for development
class AuditService {
  static async logAction(userId, action, tableName, recordId, oldValues, newValues) {
    // For development, just log to console
    console.log('Audit Log:', {
      userId,
      action,
      tableName,
      recordId,
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = AuditService;