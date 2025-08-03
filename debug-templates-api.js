// Debug template API
const express = require('express');
const { CustomTemplate } = require('./backend/whatsapp/src/models');

const app = express();
app.use(express.json());

// Enable CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// Template routes
app.get('/api/templates', async (req, res) => {
    try {
        const templates = await CustomTemplate.findAll({
            order: [['priority', 'DESC']]
        });
        res.json({
            success: true,
            data: templates
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.get('/api/templates/categories', async (req, res) => {
    try {
        const categories = [
            { value: 'greeting', label: 'Greeting Messages', icon: 'waving_hand' },
            { value: 'package', label: 'Package Information', icon: 'inventory_2' },
            { value: 'faq', label: 'FAQ Responses', icon: 'help' },
            { value: 'followup', label: 'Follow Up Messages', icon: 'follow_the_signs' },
            { value: 'document', label: 'Document Templates', icon: 'description' }
        ];
        
        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Serve frontend
app.use(express.static(__dirname + '/frontend'));

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Debug server running on port ${PORT}`);
    console.log(`Access template manager at: http://localhost:${PORT}/template-manager.html`);
});