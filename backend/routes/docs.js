const express = require('express');
const DocsController = require('../controllers/docsController');
const { optionalAuth } = require('../middleware/auth');
const router = express.Router();

// API Documentation (public access)
router.get('/', DocsController.getApiDocs);

// OpenAPI schema (public access)
router.get('/schema', DocsController.getApiSchema);

// API status and endpoints summary (public access)
router.get('/status', DocsController.getApiStatus);

module.exports = router;