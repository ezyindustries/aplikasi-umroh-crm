const OpenAI = require('openai');
const axios = require('axios');
const { WaConversation, WaMessage, BotTemplate, BotConfig, Lead } = require('../models');

class WhatsAppBotService {
  constructor() {
    this.openai = null;
    this.config = {};
    this.templates = [];
    this.initializeBot();
  }

  async initializeBot() {
    // Load bot configuration
    await this.loadConfig();
    
    // Initialize LLM (Ollama or OpenAI)
    if (this.config.use_ollama === 'true') {
      this.useOllama = true;
      this.ollamaUrl = this.config.ollama_url || 'http://localhost:11434';
      this.ollamaModel = this.config.ollama_model || 'mistral:7b-instruct';
    } else if (this.config.openai_api_key) {
      this.openai = new OpenAI({
        apiKey: this.config.openai_api_key
      });
    }
    
    // Load templates
    await this.loadTemplates();
  }

  async loadConfig() {
    const configs = await BotConfig.findAll();
    configs.forEach(config => {
      this.config[config.parameter] = config.value;
    });
  }

  async loadTemplates() {
    this.templates = await BotTemplate.findAll({
      where: { is_active: true },
      order: [['usage_count', 'DESC']]
    });
  }

  async processMessage(phoneNumber, message, waMessageId = null) {
    try {
      // Get or create conversation
      const conversation = await WaConversation.getOrCreateForPhone(phoneNumber);
      
      // Save incoming message
      const incomingMessage = await conversation.addMessage({
        wa_message_id: waMessageId,
        direction: 'inbound',
        type: 'text',
        content: message
      });
      
      // Check if it's office hours
      if (!this.isOfficeHours() && this.config.after_hours_mode === 'bot_only') {
        return await this.generateBotResponse(conversation, message);
      }
      
      // Check for escalation keywords
      if (this.shouldEscalate(message)) {
        return await this.escalateToHuman(conversation, message);
      }
      
      // Generate bot response
      const response = await this.generateBotResponse(conversation, message);
      
      // Save bot response
      await conversation.addMessage({
        direction: 'outbound',
        type: 'text',
        content: response.text,
        is_from_bot: true,
        bot_confidence: response.confidence,
        intent_detected: response.intent
      });
      
      return response;
    } catch (error) {
      console.error('Error processing message:', error);
      return {
        text: 'Maaf, terjadi kesalahan. Silakan coba lagi atau hubungi kami di jam kerja.',
        error: true
      };
    }
  }

  async generateBotResponse(conversation, message) {
    // First, try to match with templates
    const templateResponse = await this.matchTemplate(message);
    if (templateResponse) {
      return templateResponse;
    }
    
    // If no template matches, use LLM
    if (this.openai) {
      return await this.generateLLMResponse(conversation, message);
    }
    
    // Fallback response
    return {
      text: this.config.fallback_message || 'Terima kasih atas pesan Anda. Tim kami akan segera merespons.',
      confidence: 0,
      intent: 'unknown'
    };
  }

  async matchTemplate(message) {
    const lowerMessage = message.toLowerCase();
    
    for (const template of this.templates) {
      // Check if any trigger keyword matches
      const keywordMatch = template.trigger_keywords.some(keyword => 
        lowerMessage.includes(keyword.toLowerCase())
      );
      
      if (keywordMatch) {
        // Update template usage
        template.usage_count += 1;
        template.last_used_at = new Date();
        await template.save();
        
        // Process template variables
        let response = template.response_template;
        
        // Replace variables like {greeting}
        const hour = new Date().getHours();
        let greeting = 'Selamat';
        if (hour < 11) greeting = 'Selamat pagi';
        else if (hour < 15) greeting = 'Selamat siang';
        else if (hour < 19) greeting = 'Selamat sore';
        else greeting = 'Selamat malam';
        
        response = response.replace('{greeting}', greeting);
        
        return {
          text: response,
          confidence: 0.9,
          intent: template.category,
          template_used: template.id
        };
      }
    }
    
    return null;
  }

  async generateLLMResponse(conversation, message) {
    try {
      // Get conversation history
      const history = await this.getConversationHistory(conversation.id);
      
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
      
      Berikan respons yang ramah, sopan, dan informatif dalam bahasa Indonesia.
      Jika ditanya hal di luar umroh, arahkan kembali ke topik umroh dengan sopan.`;
      
      const messages = [
        { role: 'system', content: systemPrompt },
        ...history.map(msg => ({
          role: msg.direction === 'inbound' ? 'user' : 'assistant',
          content: msg.content
        })),
        { role: 'user', content: message }
      ];
      
      let response;
      
      if (this.useOllama) {
        // Call Ollama
        const ollamaResponse = await axios.post(`${this.ollamaUrl}/api/chat`, {
          model: this.ollamaModel,
          messages: messages,
          stream: false,
          options: {
            temperature: parseFloat(this.config.llm_temperature || 0.7),
            num_predict: parseInt(this.config.llm_max_tokens || 150)
          }
        });
        
        response = ollamaResponse.data.message.content;
      } else {
        // Call OpenAI
        const completion = await this.openai.chat.completions.create({
          model: this.config.llm_model || 'gpt-3.5-turbo',
          messages: messages,
          temperature: parseFloat(this.config.llm_temperature || 0.7),
          max_tokens: parseInt(this.config.llm_max_tokens || 150)
        });
        
        response = completion.choices[0].message.content;
      }
      
      // Detect intent
      const intent = await this.detectIntent(message);
      
      return {
        text: response,
        confidence: 0.8,
        intent: intent,
        llm_used: true
      };
    } catch (error) {
      console.error('LLM Error:', error);
      return null;
    }
  }

  async detectIntent(message) {
    const lowerMessage = message.toLowerCase();
    
    const intents = {
      'greeting': ['halo', 'hai', 'assalamualaikum', 'pagi', 'siang', 'sore', 'malam'],
      'package_inquiry': ['paket', 'harga', 'biaya', 'program', 'fasilitas'],
      'schedule_inquiry': ['jadwal', 'keberangkatan', 'berangkat', 'kapan', 'tanggal'],
      'registration': ['daftar', 'pendaftaran', 'cara', 'syarat', 'dokumen'],
      'payment': ['bayar', 'dp', 'cicilan', 'transfer', 'pembayaran'],
      'complaint': ['komplain', 'masalah', 'keluhan', 'tidak puas'],
      'general_inquiry': ['tanya', 'info', 'informasi', 'bagaimana']
    };
    
    for (const [intent, keywords] of Object.entries(intents)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        return intent;
      }
    }
    
    return 'unknown';
  }

  async getConversationHistory(conversationId, limit = 10) {
    return await WaMessage.findAll({
      where: { conversation_id: conversationId },
      order: [['created_at', 'DESC']],
      limit: limit
    });
  }

  shouldEscalate(message) {
    const escalationKeywords = (this.config.escalation_keywords || '').split(',');
    const lowerMessage = message.toLowerCase();
    
    return escalationKeywords.some(keyword => 
      lowerMessage.includes(keyword.trim().toLowerCase())
    );
  }

  async escalateToHuman(conversation, message) {
    // Update conversation status
    conversation.status = 'human_handled';
    await conversation.save();
    
    // Notify available agents
    await this.notifyAgents(conversation, message);
    
    return {
      text: 'Saya akan menghubungkan Anda dengan tim kami. Mohon tunggu sebentar.',
      escalated: true,
      confidence: 1,
      intent: 'escalation'
    };
  }

  async notifyAgents(conversation, message) {
    // TODO: Implement notification to agents
    // Could use WebSocket, push notification, or internal messaging
    console.log('Notifying agents about escalation:', {
      conversation_id: conversation.id,
      phone: conversation.phone_number,
      message: message
    });
  }

  isOfficeHours() {
    const now = new Date();
    const hours = now.getHours();
    const day = now.getDay();
    
    // Skip weekends
    if (day === 0 || day === 6) return false;
    
    const officeHours = this.config.office_hours || '08:00-17:00';
    const [startHour, endHour] = officeHours.split('-').map(time => 
      parseInt(time.split(':')[0])
    );
    
    return hours >= startHour && hours < endHour;
  }

  async sendMessage(phoneNumber, message, mediaUrl = null) {
    // This will be implemented with WAHA API
    try {
      const wahaEndpoint = this.config.waha_endpoint || 'http://localhost:3001';
      const sessionId = this.config.waha_session || 'default';
      
      const response = await fetch(`${wahaEndpoint}/api/sendText`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          session: sessionId,
          phone: phoneNumber,
          text: message
        })
      });
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      throw error;
    }
  }
}

module.exports = new WhatsAppBotService();