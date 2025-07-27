const express = require('express');
const { User } = require('../models');
const bcrypt = require('bcryptjs');
const { authenticate, checkPermission } = require('../middleware/auth');
const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Get all users
router.get('/', checkPermission('users', 'read'), async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    
    const offset = (page - 1) * limit;
    
    const { count, rows } = await User.findAndCountAll({
      limit,
      offset,
      order: [['created_at', 'DESC']],
      attributes: { exclude: ['password_hash'] }
    });
    
    const result = {
      data: rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    };
    
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
});

// Get user by ID
router.get('/:id', checkPermission('users', 'read'), async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password_hash'] }
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User tidak ditemukan'
      });
    }

    // Remove password hash
    delete user.password_hash;

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
});

// Create new user
router.post('/', checkPermission('users', 'create'), async (req, res, next) => {
  try {
    const user = await User.create(req.body);
    
    res.status(201).json({
      success: true,
      message: 'User berhasil dibuat',
      data: user
    });
  } catch (error) {
    next(error);
  }
});

// Update user
router.put('/:id', checkPermission('users', 'update'), async (req, res, next) => {
  try {
    const user = await User.update(req.params.id, req.body);
    
    res.json({
      success: true,
      message: 'User berhasil diperbarui',
      data: user
    });
  } catch (error) {
    next(error);
  }
});

// Get user statistics
router.get('/statistics/overview', checkPermission('users', 'read'), async (req, res, next) => {
  try {
    const stats = await User.getStatistics();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;