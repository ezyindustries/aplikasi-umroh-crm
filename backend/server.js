const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Simple health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'WhatsApp CRM Backend - Minimal Server',
    status: 'running'
  });
});

// WhatsApp backend runs on separate port (3001)
// This server is kept for future use if needed

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Minimal backend server running on port ${PORT}`);
  console.log('WhatsApp CRM backend runs on port 3001');
});