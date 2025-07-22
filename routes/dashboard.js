const express = require('express'); const router = express.Router(); router.get('/', (req, res) => { res.json({ message: 'dashboard route working' }); }); module.exports = router;
