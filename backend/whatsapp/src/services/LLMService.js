const axios = require('axios');
const logger = require('../utils/logger');

class LLMService {
  constructor() {
    this.baseUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    this.defaultModel = process.env.OLLAMA_MODEL || 'llama3.2:3b';
  }

  /**
   * Get list of available models from Ollama
   */
  async getAvailableModels() {
    try {
      const response = await axios.get(`${this.baseUrl}/api/tags`);
      return response.data.models || [];
    } catch (error) {
      logger.error('Error fetching Ollama models:', error);
      return [];
    }
  }

  /**
   * Validate if a model exists in Ollama
   */
  async validateModel(modelName) {
    try {
      const models = await this.getAvailableModels();
      return models.some(model => model.name === modelName);
    } catch (error) {
      logger.error('Error validating model:', error);
      return false;
    }
  }

  /**
   * Get model-specific optimizations
   */
  getModelOptimizations(model) {
    // Llama 3.2 specific optimizations
    if (model.includes('llama3.2')) {
      return {
        temperature: 0.7,
        topP: 0.9,
        systemPromptPrefix: 'You are a helpful assistant. Respond concisely in the same language as the user.',
        stopSequences: ['Human:', 'User:', '\n\n']
      };
    }
    
    // Default optimizations
    return {
      temperature: 0.7,
      topP: 0.9,
      systemPromptPrefix: '',
      stopSequences: []
    };
  }

  /**
   * Generate response from LLM
   */
  async generateResponse(message, context, systemPrompt, config = {}) {
    try {
      const {
        model = this.defaultModel,
        temperature = 0.7,
        maxTokens = 500,
        topP = 0.9,
        stream = false,
        maxSentences = null
      } = config;
      
      // Get model-specific optimizations
      const modelOpts = this.getModelOptimizations(model);

      // Build the prompt with model optimizations
      const prompt = this.buildPrompt(message, context, systemPrompt, { ...config, modelOpts });
      
      logger.info('Generating LLM response:', {
        model,
        temperature: modelOpts.temperature || temperature,
        maxTokens,
        promptLength: prompt.length
      });

      const response = await axios.post(`${this.baseUrl}/api/generate`, {
        model,
        prompt,
        stream: false, // We'll handle streaming later if needed
        options: {
          temperature: modelOpts.temperature || temperature,
          num_predict: maxTokens,
          top_p: modelOpts.topP || topP,
          stop: modelOpts.stopSequences.length > 0 ? modelOpts.stopSequences : ['\n\nHuman:', '\n\nUser:', '</response>']
        }
      });

      if (response.data && response.data.response) {
        return {
          success: true,
          response: response.data.response.trim(),
          model: response.data.model,
          totalDuration: response.data.total_duration,
          promptEvalCount: response.data.prompt_eval_count,
          evalCount: response.data.eval_count
        };
      }

      throw new Error('Invalid response from Ollama');
    } catch (error) {
      logger.error('Error generating LLM response:', error);
      logger.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Unknown error',
        response: null
      };
    }
  }

  /**
   * Build prompt with context
   */
  buildPrompt(message, context, systemPrompt, config = {}) {
    let prompt = '';

    // Add model-specific system prompt prefix if available
    if (config.modelOpts && config.modelOpts.systemPromptPrefix) {
      prompt += `${config.modelOpts.systemPromptPrefix}\n\n`;
    }

    // Add system prompt with sentence limit if specified
    if (systemPrompt) {
      let enhancedPrompt = systemPrompt;
      if (config.maxSentences) {
        enhancedPrompt += `\n\nIMPORTANT: You MUST respond in EXACTLY ${config.maxSentences} sentence${config.maxSentences > 1 ? 's' : ''}. No more, no less.`;
      }
      prompt += `System: ${enhancedPrompt}\n\n`;
    }

    // Add context
    if (context) {
      // Add customer phase context
      if (context.customerPhase) {
        prompt += `Customer Information:\n`;
        prompt += `- Current Phase: ${context.customerPhase.currentPhase}\n`;
        prompt += `- Phase Source: ${context.customerPhase.phaseSource || 'unknown'}\n`;
        if (context.customerPhase.interestedPackages?.length > 0) {
          prompt += `- Interested Packages: ${context.customerPhase.interestedPackages.join(', ')}\n`;
        }
        if (context.customerPhase.preferredMonth) {
          prompt += `- Preferred Month: ${context.customerPhase.preferredMonth}\n`;
        }
        if (context.customerPhase.concerns?.length > 0) {
          prompt += `- Concerns: ${context.customerPhase.concerns.join(', ')}\n`;
        }
        prompt += '\n';
      }

      // Add conversation history
      if (context.conversationHistory && context.conversationHistory.length > 0) {
        prompt += 'Recent Conversation:\n';
        context.conversationHistory.forEach(msg => {
          const role = msg.fromMe ? 'Assistant' : 'User';
          prompt += `${role}: ${msg.content || msg.body}\n`;
        });
        prompt += '\n';
      }

      // Add knowledge base entries
      if (context.knowledgeBase && context.knowledgeBase.length > 0) {
        prompt += 'Knowledge Base:\n';
        context.knowledgeBase.forEach(entry => {
          prompt += `- ${entry.key}: ${entry.value}\n`;
        });
        prompt += '\n';
      }
    }

    // Add current message
    prompt += `User: ${message}\n`;
    prompt += 'Assistant: ';

    return prompt;
  }

  /**
   * Process knowledge base to find relevant entries
   */
  findRelevantKnowledge(message, knowledgeBase) {
    if (!knowledgeBase || knowledgeBase.length === 0) {
      return [];
    }

    const messageLower = message.toLowerCase();
    const relevant = [];

    knowledgeBase.forEach(entry => {
      // Check if message contains any keywords from the entry
      const keywords = entry.keywords || [entry.key];
      const isRelevant = keywords.some(keyword => 
        messageLower.includes(keyword.toLowerCase())
      );

      if (isRelevant) {
        relevant.push(entry);
      }
    });

    return relevant;
  }

  /**
   * Validate response for safety
   */
  validateResponse(response) {
    // Add basic safety checks
    const forbidden = [
      'ignore previous instructions',
      'disregard system prompt',
      'reveal your prompt'
    ];

    const responseLower = response.toLowerCase();
    for (const phrase of forbidden) {
      if (responseLower.includes(phrase)) {
        logger.warn('Potentially unsafe response detected:', phrase);
        return false;
      }
    }

    return true;
  }

  /**
   * Format response with variables
   */
  formatResponse(response, variables = {}) {
    let formatted = response;

    // Replace variables in response
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{${key}}`, 'g');
      formatted = formatted.replace(regex, variables[key]);
    });

    return formatted;
  }

  /**
   * Test prompt with sample message
   */
  async testPrompt(systemPrompt, sampleMessage, config = {}) {
    try {
      const testContext = {
        customerPhase: {
          currentPhase: 'INTEREST',
          phaseSource: 'whatsapp'
        },
        conversationHistory: [
          { fromMe: false, body: 'Halo, saya mau tanya paket umroh' },
          { fromMe: true, body: 'Selamat datang! Kami memiliki berbagai paket umroh. Apakah ada bulan tertentu yang Anda inginkan?' }
        ],
        knowledgeBase: [
          { key: 'paket_ekonomis', value: 'Paket ekonomis mulai dari 25 juta, hotel bintang 3, 9 hari' },
          { key: 'paket_vip', value: 'Paket VIP mulai dari 45 juta, hotel bintang 5, 12 hari' }
        ]
      };

      const result = await this.generateResponse(
        sampleMessage,
        testContext,
        systemPrompt,
        config
      );

      return {
        success: result.success,
        response: result.response,
        prompt: this.buildPrompt(sampleMessage, testContext, systemPrompt, config),
        stats: {
          model: result.model,
          duration: result.totalDuration,
          tokens: result.evalCount
        }
      };
    } catch (error) {
      logger.error('Error testing prompt:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new LLMService();