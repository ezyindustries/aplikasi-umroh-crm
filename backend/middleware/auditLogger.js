const { query } = require('../config/database');

async function auditLogger(req, res, next) {
  // Skip audit logging for certain endpoints
  const skipPaths = ['/health', '/api/auth/verify-token'];
  if (skipPaths.some(path => req.path.includes(path))) {
    return next();
  }

  // Store original res.json
  const originalJson = res.json;
  
  // Override res.json to capture response
  res.json = function(data) {
    // Determine action based on method and response
    let action = 'unknown';
    if (req.method === 'GET') action = 'view';
    if (req.method === 'POST') action = 'create';
    if (req.method === 'PUT' || req.method === 'PATCH') action = 'update';
    if (req.method === 'DELETE') action = 'delete';
    
    // Extract table name from URL
    let tableName = 'unknown';
    if (req.path.includes('/jamaah')) tableName = 'jamaah';
    if (req.path.includes('/packages')) tableName = 'packages';
    if (req.path.includes('/payments')) tableName = 'payments';
    if (req.path.includes('/documents')) tableName = 'documents';
    if (req.path.includes('/users')) tableName = 'users';
    
    // Extract record ID from URL params
    const recordId = req.params.id ? parseInt(req.params.id) : null;
    
    // Log the audit entry (async, don't wait for it)
    logAuditEntry({
      userId: req.user?.id || null,
      action,
      tableName,
      recordId,
      oldValues: req.body || {},
      newValues: data || {},
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    }).catch(error => {
      console.error('Audit logging error:', error);
    });

    // Call original res.json
    return originalJson.call(this, data);
  };

  next();
}

async function logAuditEntry(auditData) {
  try {
    await query(
      `INSERT INTO audit_logs 
       (user_id, action, table_name, record_id, old_values, new_values, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        auditData.userId,
        auditData.action,
        auditData.tableName,
        auditData.recordId,
        JSON.stringify(auditData.oldValues),
        JSON.stringify(auditData.newValues),
        auditData.ipAddress,
        auditData.userAgent
      ]
    );
  } catch (error) {
    console.error('Failed to log audit entry:', error);
  }
}

module.exports = { auditLogger, logAuditEntry };