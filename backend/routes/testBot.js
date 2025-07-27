const express = require('express');
const router = express.Router();
const axios = require('axios');
const { authenticate } = require('../middleware/auth');
const { BotConfig } = require('../models');

// Test endpoint for bot (no auth required for testing)
router.post('/test', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ 
        success: false, 
        error: 'Message is required' 
      });
    }

    // Get bot configuration
    const configs = await BotConfig.findAll();
    const config = {};
    configs.forEach(c => {
      config[c.parameter] = c.value;
    });

    // Check if using Ollama
    if (config.use_ollama === 'true') {
      const ollamaUrl = config.ollama_url || 'http://localhost:11434';
      const ollamaModel = config.ollama_model || 'mistral:7b-instruct';
      
      // Build prompt
      const systemPrompt = `Anda adalah asisten customer service untuk Vauza Tamma Travel, 
      sebuah travel umroh terpercaya. Tugas Anda adalah membantu calon jamaah dengan informasi 
      tentang paket umroh, jadwal keberangkatan, persyaratan, dan proses pendaftaran.
      
      Informasi penting:
      - Paket Reguler 12 Hari: Rp 25 juta
      - Paket Plus Turki 15 Hari: Rp 35 juta  
      - Paket VIP 9 Hari: Rp 45 juta
      - Syarat: KTP, Paspor (masa berlaku min 7 bulan), Pas foto, KK, Buku Nikah
      - DP minimal Rp 10 juta
      - Kantor: Jl. Contoh No. 123, Jakarta
      
      Berikan respons yang ramah, sopan, dan informatif dalam bahasa Indonesia.`;

      try {
        // For container access, use host.docker.internal
        const apiUrl = ollamaUrl.includes('localhost') 
          ? ollamaUrl.replace('localhost', 'host.docker.internal')
          : ollamaUrl;

        const response = await axios.post(`${apiUrl}/api/chat`, {
          model: ollamaModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ],
          stream: false,
          options: {
            temperature: parseFloat(config.llm_temperature || 0.7),
            num_predict: parseInt(config.llm_max_tokens || 300)
          }
        }, {
          timeout: 30000 // 30 second timeout
        });

        return res.json({
          success: true,
          response: response.data.message.content,
          model: ollamaModel,
          confidence: 0.85,
          provider: 'ollama'
        });
      } catch (ollamaError) {
        console.error('Ollama error:', ollamaError.message);
        
        // Fallback to template response
        return res.json({
          success: true,
          response: `Assalamualaikum! Selamat datang di Vauza Tamma Travel 🕌

Saya siap membantu informasi seputar umroh. Silakan tanyakan tentang:
- Paket umroh yang tersedia
- Jadwal keberangkatan
- Persyaratan dokumen
- Proses pendaftaran
- Harga dan cicilan

Ada yang bisa saya bantu? 😊`,
          model: 'template',
          confidence: 1.0,
          provider: 'fallback',
          error: ollamaError.message
        });
      }
    } else {
      // OpenAI implementation would go here
      return res.json({
        success: false,
        error: 'OpenAI not configured. Please use Ollama.',
        hint: 'Set use_ollama=true in bot_configs'
      });
    }
  } catch (error) {
    console.error('Test bot error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get bot configuration (requires auth)
router.get('/config', authenticate, async (req, res) => {
  try {
    const configs = await BotConfig.findAll();
    const configMap = {};
    configs.forEach(config => {
      configMap[config.parameter] = config.value;
    });
    
    res.json({ 
      success: true, 
      data: configMap 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;