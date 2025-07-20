const express = require('express');
const User = require('../models/User');
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

    const result = await User.authenticate(username, password);

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
    const user = await User.findById(req.user.id);
    
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