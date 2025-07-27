const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User } = require('../models');
const { auditLog } = require('../services/auditService');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Token blacklist for logged out tokens (in production, use Redis)
const tokenBlacklist = new Set();

// Session tracking for suspicious activity
const sessionTracker = new Map();

// Enhanced JWT token verification
async function authenticate(req, res, next) {
  try {
    const authHeader = req.header('Authorization');
    const clientIP = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || '';
    
    if (!authHeader) {
      await auditLog({
        action: 'auth_failed',
        details: 'No token provided',
        ip: clientIP,
        userAgent
      });
      
      return res.status(401).json({ 
        success: false, 
        error: 'Access denied. No token provided.' 
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      await auditLog({
        action: 'auth_failed',
        details: 'Invalid token format',
        ip: clientIP,
        userAgent
      });
      
      return res.status(401).json({ 
        success: false, 
        error: 'Access denied. Invalid token format.' 
      });
    }

    // Check if token is blacklisted
    if (tokenBlacklist.has(token)) {
      await auditLog({
        action: 'auth_failed',
        details: 'Blacklisted token used',
        ip: clientIP,
        userAgent
      });
      
      return res.status(401).json({ 
        success: false, 
        error: 'Token has been invalidated.' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get fresh user data
    const user = await User.findByPk(decoded.id);
    if (!user) {
      await auditLog({
        action: 'auth_failed',
        details: 'User not found for token',
        userId: decoded.id,
        ip: clientIP,
        userAgent
      });
      
      return res.status(401).json({ 
        success: false, 
        error: 'User not found.' 
      });
    }

    if (!user.is_active) {
      await auditLog({
        action: 'auth_failed',
        details: 'Inactive user attempted access',
        userId: user.id,
        ip: clientIP,
        userAgent
      });
      
      return res.status(401).json({ 
        success: false, 
        error: 'Account is inactive.' 
      });
    }

    // Session security checks
    const sessionKey = `${user.id}_${clientIP}`;
    const currentTime = Date.now();
    const session = sessionTracker.get(sessionKey);
    
    if (session) {
      // Check for suspicious activity patterns
      const timeDiff = currentTime - session.lastAccess;
      const locationChanged = session.ip !== clientIP;
      const deviceChanged = session.userAgent !== userAgent;
      
      if (locationChanged || deviceChanged) {
        await auditLog({
          action: 'suspicious_activity',
          details: 'Session characteristics changed',
          userId: user.id,
          ip: clientIP,
          userAgent,
          previousIP: session.ip,
          previousUserAgent: session.userAgent
        });
        
        // In production, you might want to require re-authentication
        if (process.env.NODE_ENV === 'production' && locationChanged) {
          return res.status(401).json({
            success: false,
            error: 'Please re-authenticate due to security policy.',
            code: 'LOCATION_CHANGED'
          });
        }
      }
      
      // Update session tracking
      session.lastAccess = currentTime;
      session.ip = clientIP;
      session.userAgent = userAgent;
      session.requestCount = (session.requestCount || 0) + 1;
    } else {
      // Create new session tracking
      sessionTracker.set(sessionKey, {
        lastAccess: currentTime,
        ip: clientIP,
        userAgent,
        requestCount: 1
      });
    }

    // Add token and session info to request
    req.user = user;
    req.token = token;
    req.sessionKey = sessionKey;
    
    next();
  } catch (error) {
    const clientIP = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || '';
    
    await auditLog({
      action: 'auth_error',
      details: error.message,
      ip: clientIP,
      userAgent
    });
    
    return res.status(401).json({ 
      success: false, 
      error: 'Invalid token.' 
    });
  }
}

// Enhanced authorization with audit logging
function authorize(allowedRoles) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required.' 
      });
    }

    // Convert single role to array
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    
    // Admin has access to everything
    if (req.user.role_name === 'Admin' || roles.includes(req.user.role_name)) {
      await auditLog({
        action: 'access_granted',
        userId: req.user.id,
        resource: req.originalUrl,
        method: req.method,
        userRole: req.user.role_name,
        requiredRoles: roles,
        ip: req.ip || req.connection.remoteAddress
      });
      
      return next();
    }

    await auditLog({
      action: 'access_denied',
      userId: req.user.id,
      resource: req.originalUrl,
      method: req.method,
      userRole: req.user.role_name,
      requiredRoles: roles,
      ip: req.ip || req.connection.remoteAddress
    });

    return res.status(403).json({ 
      success: false, 
      error: 'Access denied. Insufficient permissions.' 
    });
  };
}

// Optional authentication (sets user if token is valid, but doesn't block if not)
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.header('Authorization');
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.id);
        if (user && user.is_active) {
          req.user = user;
        }
      }
    }
  } catch (error) {
    // Silently fail for optional auth
  }
  
  next();
}

// Token blacklist management
function addToBlacklist(token) {
  tokenBlacklist.add(token);
  
  // In production, persist to Redis or database
  if (process.env.NODE_ENV === 'production') {
    // TODO: Add to Redis blacklist with TTL equal to token expiry
  }
}

function removeFromBlacklist(token) {
  tokenBlacklist.delete(token);
  
  // In production, remove from Redis or database
  if (process.env.NODE_ENV === 'production') {
    // TODO: Remove from Redis blacklist
  }
}

// Session management
function invalidateSession(sessionKey) {
  sessionTracker.delete(sessionKey);
}

function getActiveSessionsForUser(userId) {
  const sessions = [];
  for (let [key, session] of sessionTracker.entries()) {
    if (key.startsWith(`${userId}_`)) {
      sessions.push({
        sessionKey: key,
        ip: session.ip,
        userAgent: session.userAgent,
        lastAccess: new Date(session.lastAccess),
        requestCount: session.requestCount
      });
    }
  }
  return sessions;
}

// Logout functionality
async function logout(req, res, next) {
  try {
    if (req.token) {
      addToBlacklist(req.token);
    }
    
    if (req.sessionKey) {
      invalidateSession(req.sessionKey);
    }
    
    await auditLog({
      action: 'user_logout',
      userId: req.user?.id,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent') || ''
    });
    
    next();
  } catch (error) {
    next(error);
  }
}

// Role-based permissions for specific operations
const permissions = {
  jamaah: {
    create: ['Admin', 'Marketing'],
    read: ['Admin', 'Marketing', 'Keuangan', 'Operator Keberangkatan', 'Tim Visa', 'Tim Ticketing', 'Tim Hotel'],
    update: ['Admin', 'Marketing', 'Tim Visa'],
    delete: ['Admin']
  },
  payments: {
    create: ['Admin', 'Keuangan'],
    read: ['Admin', 'Keuangan', 'Marketing'],
    update: ['Admin', 'Keuangan'],
    delete: ['Admin']
  },
  packages: {
    create: ['Admin'],
    read: ['Admin', 'Marketing', 'Keuangan', 'Operator Keberangkatan', 'Tim Visa', 'Tim Ticketing', 'Tim Hotel'],
    update: ['Admin'],
    delete: ['Admin']
  },
  users: {
    create: ['Admin'],
    read: ['Admin'],
    update: ['Admin'],
    delete: ['Admin']
  },
  documents: {
    create: ['Admin', 'Marketing', 'Tim Visa'],
    read: ['Admin', 'Marketing', 'Tim Visa', 'Operator Keberangkatan'],
    update: ['Admin', 'Tim Visa'],
    delete: ['Admin']
  },
  reports: {
    read: ['Admin', 'Marketing', 'Keuangan', 'Operator Keberangkatan']
  },
  groups: {
    create: ['Admin', 'Operator Keberangkatan'],
    read: ['Admin', 'Marketing', 'Operator Keberangkatan', 'Tim Ticketing', 'Tim Hotel'],
    update: ['Admin', 'Operator Keberangkatan'],
    delete: ['Admin', 'Operator Keberangkatan']
  },
  backup: {
    create: ['Admin'],
    read: ['Admin'],
    restore: ['Admin'],
    delete: ['Admin']
  },
  export: {
    read: ['Admin', 'Marketing', 'Keuangan'],
    delete: ['Admin']
  },
  import: {
    create: ['Admin', 'Marketing']
  },
  monitoring: {
    read: ['Admin'],
    update: ['Admin']
  }
};

// Check permission for specific resource and operation
function checkPermission(resource, operation) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required.' 
      });
    }

    const allowedRoles = permissions[resource] && permissions[resource][operation];
    
    if (!allowedRoles) {
      return res.status(403).json({ 
        success: false, 
        error: 'Operation not defined.' 
      });
    }

    if (allowedRoles.includes(req.user.role_name)) {
      return next();
    }

    return res.status(403).json({ 
      success: false, 
      error: `Access denied. Role '${req.user.role_name}' cannot ${operation} ${resource}.` 
    });
  };
}

module.exports = {
  authenticate,
  authorize,
  optionalAuth,
  checkPermission,
  logout,
  addToBlacklist,
  removeFromBlacklist,
  invalidateSession,
  getActiveSessionsForUser,
  permissions
};