// Minimal test for template routes
const express = require('express');
const app = express();

// Mock templateController
const templateController = {
    getTemplates: (req, res) => res.json({ success: true, data: [] }),
    getCategories: (req, res) => res.json({ success: true, data: [] })
};

// Create router
const router = express.Router();

// Add template routes
router.get('/templates', templateController.getTemplates);
router.get('/templates/categories', templateController.getCategories);

// Mount router
app.use('/api', router);

// Start server
const PORT = 3002;
app.listen(PORT, () => {
    console.log(`Test server running on port ${PORT}`);
    console.log('Try: curl http://localhost:3002/api/templates');
    console.log('Try: curl http://localhost:3002/api/templates/categories');
});