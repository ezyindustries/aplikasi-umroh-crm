const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CustomTemplate = sequelize.define('CustomTemplate', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  templateName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'template_name'
  },
  category: {
    type: DataTypes.ENUM('greeting', 'package', 'faq', 'followup', 'document'),
    allowNull: false
  },
  templateContent: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'template_content'
  },
  variables: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Variables used in template like {{name}}, {{date}}, {{price}}'
  },
  keywords: {
    type: DataTypes.TEXT,
    comment: 'Comma separated keywords for matching'
  },
  intent: {
    type: DataTypes.STRING(50),
    comment: 'Associated intent for AI-based matching'
  },
  minConfidence: {
    type: DataTypes.FLOAT,
    defaultValue: 0.7,
    field: 'min_confidence',
    comment: 'Minimum confidence score for intent matching'
  },
  priority: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Higher priority templates are checked first'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  usageCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'usage_count'
  },
  successRate: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    field: 'success_rate'
  },
  mediaFiles: {
    type: DataTypes.JSON,
    defaultValue: [],
    field: 'media_files',
    comment: 'Array of local file paths for media attachments'
  }
}, {
  tableName: 'custom_templates',
  timestamps: true,
  underscored: true
});

// Instance methods
CustomTemplate.prototype.incrementUsage = async function() {
  this.usageCount += 1;
  await this.save();
};

CustomTemplate.prototype.fillTemplate = function(variables = {}) {
  let content = this.templateContent;
  
  // Replace variables in template
  Object.keys(variables).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    content = content.replace(regex, variables[key]);
  });
  
  return content;
};

CustomTemplate.prototype.matchesKeywords = function(message) {
  if (!this.keywords) return false;
  
  const keywords = this.keywords.toLowerCase().split(',').map(k => k.trim());
  const messageLower = message.toLowerCase();
  
  return keywords.some(keyword => messageLower.includes(keyword));
};

// Class methods
CustomTemplate.findBestMatch = async function(message, category = null, detectedIntent = null) {
  const where = { isActive: true };
  if (category) where.category = category;
  
  const templates = await this.findAll({
    where,
    order: [['priority', 'DESC'], ['usageCount', 'DESC']]
  });
  
  // First try exact keyword match
  for (const template of templates) {
    if (template.matchesKeywords(message)) {
      return template;
    }
  }
  
  // If intent is provided, try intent-based matching
  if (detectedIntent) {
    const intentTemplates = templates.filter(t => 
      t.intent === detectedIntent.intent && 
      (!t.minConfidence || detectedIntent.confidence >= t.minConfidence)
    );
    
    if (intentTemplates.length > 0) {
      return intentTemplates[0]; // Return highest priority match
    }
  }
  
  // If no match and category specified, return most used in category
  if (category && templates.length > 0) {
    return templates[0];
  }
  
  return null;
};

// Find templates by intent
CustomTemplate.findByIntent = async function(intent, minConfidence = 0.7) {
  return await this.findAll({
    where: {
      intent: intent,
      isActive: true,
      minConfidence: {
        [require('sequelize').Op.lte]: minConfidence
      }
    },
    order: [['priority', 'DESC']]
  });
};

CustomTemplate.getByCategory = async function(category) {
  return await this.findAll({
    where: {
      category,
      isActive: true
    },
    order: [['priority', 'DESC'], ['templateName', 'ASC']]
  });
};

module.exports = CustomTemplate;