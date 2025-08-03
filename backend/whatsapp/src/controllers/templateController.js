const { CustomTemplate } = require('../models');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

class TemplateController {
  // Get all templates
  async getTemplates(req, res) {
    try {
      const { category, active } = req.query;
      
      const where = {};
      if (category) where.category = category;
      if (active !== undefined) where.isActive = active === 'true';
      
      const templates = await CustomTemplate.findAll({
        where,
        order: [['priority', 'DESC'], ['usageCount', 'DESC']]
      });
      
      res.json({
        success: true,
        data: templates
      });
    } catch (error) {
      logger.error('Error fetching templates:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  // Get template by ID
  async getTemplate(req, res) {
    try {
      const { id } = req.params;
      
      const template = await CustomTemplate.findByPk(id);
      
      if (!template) {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }
      
      res.json({
        success: true,
        data: template
      });
    } catch (error) {
      logger.error('Error fetching template:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  // Create new template
  async createTemplate(req, res) {
    try {
      const {
        templateName,
        category,
        templateContent,
        keywords,
        variables,
        priority
      } = req.body;
      
      const template = await CustomTemplate.create({
        templateName,
        category,
        templateContent,
        keywords,
        variables: variables || {},
        priority: priority || 0
      });
      
      res.json({
        success: true,
        data: template
      });
    } catch (error) {
      logger.error('Error creating template:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  // Update template
  async updateTemplate(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const template = await CustomTemplate.findByPk(id);
      
      if (!template) {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }
      
      await template.update(updates);
      
      res.json({
        success: true,
        data: template
      });
    } catch (error) {
      logger.error('Error updating template:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  // Delete template
  async deleteTemplate(req, res) {
    try {
      const { id } = req.params;
      
      const template = await CustomTemplate.findByPk(id);
      
      if (!template) {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }
      
      await template.destroy();
      
      res.json({
        success: true,
        message: 'Template deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting template:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  // Test template with sample data
  async testTemplate(req, res) {
    try {
      const { message, templateId, variables } = req.body;
      
      // Import required services
      const IntentDetectionService = require('../services/IntentDetectionService');
      const EntityExtractionService = require('../services/EntityExtractionService');
      
      const intentService = new IntentDetectionService();
      const entityService = new EntityExtractionService();
      
      // Step 1: Detect intent if message provided
      let intent = null;
      let entities = {};
      
      if (message) {
        intent = await intentService.detectIntent(message);
        entities = await entityService.extractEntities(message, intent.intent);
      }
      
      // Step 2: Find matching template
      let matchedTemplate = null;
      let matchType = 'none';
      let filledTemplate = '';
      
      if (templateId) {
        // Test specific template
        matchedTemplate = await CustomTemplate.findByPk(templateId);
        if (matchedTemplate) {
          matchType = 'specified';
          filledTemplate = matchedTemplate.fillTemplate({
            ...entities,
            ...variables,
            nama: entities.nama || variables?.nama || 'Bapak/Ibu',
            waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            hari: new Date().toLocaleDateString('id-ID', { weekday: 'long' })
          });
        }
      } else if (message) {
        // Find best matching template
        const category = intent ? intentService.mapIntentToCategory(intent.intent) : null;
        matchedTemplate = await CustomTemplate.findBestMatch(message, category, intent?.intent);
        
        if (matchedTemplate) {
          matchType = matchedTemplate.matchedBy || 'keyword';
          filledTemplate = matchedTemplate.fillTemplate({
            ...entities,
            nama: entities.nama || 'Bapak/Ibu',
            waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            hari: new Date().toLocaleDateString('id-ID', { weekday: 'long' })
          });
        }
      }
      
      res.json({
        success: true,
        intent: intent,
        entities: entities,
        matched: !!matchedTemplate,
        matchedTemplate: matchedTemplate ? {
          id: matchedTemplate.id,
          name: matchedTemplate.templateName,
          category: matchedTemplate.category,
          priority: matchedTemplate.priority
        } : null,
        matchType: matchType,
        filledTemplate: filledTemplate,
        variables: variables
      });
    } catch (error) {
      logger.error('Error testing template:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  // Match template based on message
  async matchTemplate(req, res) {
    try {
      const { message, category } = req.body;
      
      const template = await CustomTemplate.findBestMatch(message, category);
      
      res.json({
        success: true,
        data: template
      });
    } catch (error) {
      logger.error('Error matching template:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  // Get template categories
  async getCategories(req, res) {
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
      logger.error('Error fetching categories:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  // Import templates from chat history
  async importFromChats(req, res) {
    try {
      const { chatContent } = req.body;
      
      // Analyze chat content to extract repeated messages
      // This is a placeholder - implement actual logic based on chat format
      const extractedTemplates = [];
      
      // Simple pattern matching for repeated messages
      const lines = chatContent.split('\n');
      const messageCount = {};
      
      lines.forEach(line => {
        // Skip timestamps and metadata
        if (line.includes('Vauza Tamma Abadi:')) {
          const message = line.split('Vauza Tamma Abadi:')[1].trim();
          if (message.length > 50) { // Only consider substantial messages
            messageCount[message] = (messageCount[message] || 0) + 1;
          }
        }
      });
      
      // Extract messages that appear more than 3 times
      Object.entries(messageCount).forEach(([message, count]) => {
        if (count >= 3) {
          extractedTemplates.push({
            content: message,
            count: count,
            suggestedCategory: this.guessCategory(message)
          });
        }
      });
      
      res.json({
        success: true,
        data: extractedTemplates
      });
    } catch (error) {
      logger.error('Error importing from chats:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  // Helper method to guess category
  guessCategory(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('assalamu') || lowerMessage.includes('terima kasih telah menghubungi')) {
      return 'greeting';
    } else if (lowerMessage.includes('paket') || lowerMessage.includes('harga') || lowerMessage.includes('hotel')) {
      return 'package';
    } else if (lowerMessage.includes('syarat') || lowerMessage.includes('dokumen') || lowerMessage.includes('paspor')) {
      return 'document';
    } else if (lowerMessage.includes('jangan sungkan') || lowerMessage.includes('ada yang bisa')) {
      return 'followup';
    } else {
      return 'faq';
    }
  }
}

module.exports = new TemplateController();