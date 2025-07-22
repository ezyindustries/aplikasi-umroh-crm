const jwt = require('jsonwebtoken');
const { models } = require('../config/database');

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token akses diperlukan'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user still exists and is active
    const user = await models.User.findByPk(decoded.userId);
    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Token tidak valid atau user tidak aktif'
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token sudah kadaluarsa'
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token tidak valid'
      });
    } else {
      console.error('Auth middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  }
};

// Role-based authorization middleware
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak: role tidak mencukupi'
      });
    }

    next();
  };
};

// Activity logging middleware
const logActivity = (action) => {
  return async (req, res, next) => {
    try {
      // Log user activity
      console.log(`User ${req.user?.username} performed action: ${action}`, {
        userId: req.user?.userId,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date()
      });
      
      // Here you could also save to database if needed
      next();
    } catch (error) {
      console.error('Activity logging error:', error);
      next(); // Continue even if logging fails
    }
  };
};

module.exports = {
  authenticateToken,
  authorizeRoles,
  logActivity
};