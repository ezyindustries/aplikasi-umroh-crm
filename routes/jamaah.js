const express = require('express');
const router = express.Router();

// Dummy routes for testing
router.get('/', (req, res) => {
  res.json({ message: 'Jamaah route working' });
});

module.exports = router;