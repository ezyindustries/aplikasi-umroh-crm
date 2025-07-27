const express = require('express');
const { User } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

// Login
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username dan password wajib diisi'
      });
    }

    // Find user by username
    const user = await User.findOne({ where: { username } });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Username atau password salah'
      });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        error: 'Username atau password salah'
      });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        error: 'Akun tidak aktif'
      });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const result = {
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        role_id: user.role_id
      },
      token
    };

    res.json({
      success: true,
      message: 'Login berhasil',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// Get current user profile
router.get('/profile', authenticate, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    
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

// Update current user profile
router.put('/profile', authenticate, async (req, res, next) => {
  try {
    const { full_name, email } = req.body;
    
    const updateData = {};
    if (full_name) updateData.full_name = full_name;
    if (email) updateData.email = email;

    const updatedUser = await User.update(req.user.id, updateData);

    res.json({
      success: true,
      message: 'Profile berhasil diperbarui',
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
});

// Change password
router.put('/change-password', authenticate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Semua field password wajib diisi'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Password baru dan konfirmasi password tidak sama'
      });
    }

    await User.changePassword(req.user.id, currentPassword, newPassword);

    res.json({
      success: true,
      message: 'Password berhasil diubah'
    });
  } catch (error) {
    next(error);
  }
});

// Verify token (for frontend to check if token is still valid)
router.get('/verify-token', authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'Token valid',
    data: {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role_name
    }
  });
});

// Logout (client-side token removal, but we can track it)
router.post('/logout', authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'Logout berhasil'
  });
});

module.exports = router;