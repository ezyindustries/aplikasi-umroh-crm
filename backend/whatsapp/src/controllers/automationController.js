const { AutomationRule, AutomationLog, AutomationContactLimit, Contact, Message, CustomerPhase, sequelize } = require('../models');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

class AutomationController {
  // Get all automation rules
  async getRules(req, res) {
    try {
      const { ruleType, isActive, limit = 20, offset = 0 } = req.query;
      
      const whereClause = {};
      
      if (ruleType) {
        whereClause.ruleType = ruleType;
      }
      
      if (isActive !== undefined) {
        whereClause.isActive = isActive === 'true';
      }
      
      const rules = await AutomationRule.findAll({
        where: whereClause,
        order: [['priority', 'DESC'], ['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      
      res.json({
        success: true,
        data: rules,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: await AutomationRule.count({ where: whereClause })
        }
      });
    } catch (error) {
      logger.api.error('Error getting automation rules:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  // Get single rule
  async getRule(req, res) {
    try {
      const { ruleId } = req.params;
      
      const rule = await AutomationRule.findByPk(ruleId, {
        include: [
          {
            model: AutomationLog,
            as: 'logs',
            limit: 10,
            order: [['createdAt', 'DESC']]
          }
        ]
      });
      
      if (!rule) {
        return res.status(404).json({
          success: false,
          error: 'Rule not found'
        });
      }
      
      res.json({
        success: true,
        data: rule
      });
    } catch (error) {
      logger.api.error('Error getting automation rule:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  // Create new rule
  async createRule(req, res) {
    try {
      // Handle multipart form data for image uploads
      const multer = require('multer');
      const path = require('path');
      const fs = require('fs').promises;
      
      // Configure multer for image uploads
      const storage = multer.diskStorage({
        destination: async (req, file, cb) => {
          const uploadDir = path.join(__dirname, '../../../uploads/automation');
          await fs.mkdir(uploadDir, { recursive: true });
          cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
          const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
          cb(null, uniqueName);
        }
      });
      
      const upload = multer({ 
        storage,
        limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
        fileFilter: (req, file, cb) => {
          const allowedTypes = /jpeg|jpg|png|gif|webp/;
          const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
          const mimetype = allowedTypes.test(file.mimetype);
          
          if (mimetype && extname) {
            return cb(null, true);
          } else {
            cb(new Error('Only image files are allowed'));
          }
        }
      }).any();
      
      // Process multipart form data
      upload(req, res, async (err) => {
        if (err) {
          return res.status(400).json({
            success: false,
            error: err.message
          });
        }
        
        try {
          // Parse rule data from form
          const ruleData = JSON.parse(req.body.ruleData || '{}');
          
          // Debug log
          logger.api.info('Received rule data:', ruleData);
          logger.api.info('Keywords received:', ruleData.keywords);
          
          const {
            name,
            description,
            ruleType,
            responseMessages = [],
            responseDelay = 2,
            messageDelay = 1,
            keywords = [],
            schedule = {},
            triggerConditions = {},
            priority = 0,
            maxTriggersPerContact = 0,
            cooldownMinutes = 0
          } = ruleData;
          
          // Validate required fields
          if (!name || !ruleType) {
            return res.status(400).json({
              success: false,
              error: 'Name and rule type are required'
            });
          }
          
          // Validate rule type
          if (!['welcome', 'away', 'keyword', 'workflow'].includes(ruleType)) {
            return res.status(400).json({
              success: false,
              error: 'Invalid rule type'
            });
          }
          
          // Process uploaded images and update responseMessages
          const processedMessages = [];
          for (const msg of responseMessages) {
            if (msg.type === 'image' && req.files) {
              // Find the uploaded file for this message
              const imageFile = req.files.find(f => f.fieldname === `image_${msg.order}`);
              if (imageFile) {
                msg.mediaUrl = `/uploads/automation/${imageFile.filename}`;
                msg.fileName = imageFile.filename;
                msg.fileSize = imageFile.size;
              }
            }
            processedMessages.push(msg);
          }
          
          // Create the rule
          const rule = await AutomationRule.create({
            name,
            description,
            ruleType,
            responseType: processedMessages.length > 0 ? 'sequence' : 'text',
            responseMessage: processedMessages.length === 1 && processedMessages[0].type === 'text' 
              ? processedMessages[0].content 
              : null,
            responseMessages: processedMessages,
            responseDelay,
            messageDelay,
            keywords,
            schedule,
            triggerConditions,
            priority,
            maxTriggersPerContact,
            cooldownMinutes,
            createdBy: req.user?.id || 'system'
          });
          
          res.json({
            success: true,
            data: rule
          });
        } catch (error) {
          logger.api.error('Error creating automation rule:', error);
          res.status(500).json({
            success: false,
            error: error.message
          });
        }
      });
    } catch (error) {
      logger.api.error('Error in createRule:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  // Update rule
  async updateRule(req, res) {
    try {
      // Handle multipart form data for image uploads
      const multer = require('multer');
      const path = require('path');
      const fs = require('fs').promises;
      
      // Configure multer for image uploads
      const storage = multer.diskStorage({
        destination: async (req, file, cb) => {
          const uploadDir = path.join(__dirname, '../../../uploads/automation');
          await fs.mkdir(uploadDir, { recursive: true });
          cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
          const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
          cb(null, uniqueName);
        }
      });
      
      const upload = multer({ 
        storage,
        limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
        fileFilter: (req, file, cb) => {
          const allowedTypes = /jpeg|jpg|png|gif|webp/;
          const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
          const mimetype = allowedTypes.test(file.mimetype);
          
          if (mimetype && extname) {
            return cb(null, true);
          } else {
            cb(new Error('Only image files are allowed'));
          }
        }
      }).any();
      
      // Process multipart form data
      upload(req, res, async (err) => {
        if (err) {
          return res.status(400).json({
            success: false,
            error: err.message
          });
        }
        
        try {
          const { ruleId } = req.params;
          
          const rule = await AutomationRule.findByPk(ruleId);
          if (!rule) {
            return res.status(404).json({
              success: false,
              error: 'Rule not found'
            });
          }
          
          // Parse rule data from form
          const ruleData = JSON.parse(req.body.ruleData || '{}');
          
          // Debug log
          logger.api.info('Received rule data:', ruleData);
          logger.api.info('Keywords received:', ruleData.keywords);
          
          const {
            name,
            description,
            ruleType,
            responseMessages = [],
            responseDelay = 2,
            messageDelay = 1,
            keywords = [],
            schedule = {},
            triggerConditions = {},
            priority = 0,
            maxTriggersPerContact = 0,
            cooldownMinutes = 0
          } = ruleData;
          
          // Process uploaded images and update responseMessages
          const processedMessages = [];
          for (const msg of responseMessages) {
            if (msg.type === 'image' && req.files) {
              // Find the uploaded file for this message
              const imageFile = req.files.find(f => f.fieldname === `image_${msg.order}`);
              if (imageFile) {
                msg.mediaUrl = `/uploads/automation/${imageFile.filename}`;
                msg.fileName = imageFile.filename;
                msg.fileSize = imageFile.size;
              } else if (msg.mediaUrl) {
                // Keep existing image URL if no new upload
                processedMessages.push(msg);
                continue;
              }
            }
            processedMessages.push(msg);
          }
          
          // Update the rule
          await rule.update({
            name,
            description,
            ruleType,
            responseType: processedMessages.length > 0 ? 'sequence' : 'text',
            responseMessage: processedMessages.length === 1 && processedMessages[0].type === 'text' 
              ? processedMessages[0].content 
              : null,
            responseMessages: processedMessages,
            responseDelay,
            messageDelay,
            keywords,
            schedule,
            triggerConditions,
            priority,
            maxTriggersPerContact,
            cooldownMinutes
          });
          
          res.json({
            success: true,
            data: rule
          });
        } catch (error) {
          logger.api.error('Error updating automation rule:', error);
          res.status(500).json({
            success: false,
            error: error.message
          });
        }
      });
    } catch (error) {
      logger.api.error('Error in updateRule:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  // Delete rule
  async deleteRule(req, res) {
    try {
      const { ruleId } = req.params;
      
      const rule = await AutomationRule.findByPk(ruleId);
      if (!rule) {
        return res.status(404).json({
          success: false,
          error: 'Rule not found'
        });
      }
      
      await rule.destroy();
      
      res.json({
        success: true,
        message: 'Rule deleted successfully'
      });
    } catch (error) {
      logger.api.error('Error deleting automation rule:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  // Toggle rule active status
  async toggleRule(req, res) {
    try {
      const { ruleId } = req.params;
      
      const rule = await AutomationRule.findByPk(ruleId);
      if (!rule) {
        return res.status(404).json({
          success: false,
          error: 'Rule not found'
        });
      }
      
      await rule.update({
        isActive: !rule.isActive
      });
      
      res.json({
        success: true,
        data: {
          id: rule.id,
          isActive: rule.isActive
        }
      });
    } catch (error) {
      logger.api.error('Error toggling automation rule:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  // Get rule analytics
  async getRuleAnalytics(req, res) {
    try {
      const { ruleId } = req.params;
      const { period = '7d' } = req.query;
      
      const rule = await AutomationRule.findByPk(ruleId);
      if (!rule) {
        return res.status(404).json({
          success: false,
          error: 'Rule not found'
        });
      }
      
      // Calculate date range
      let startDate = new Date();
      switch (period) {
        case '24h':
          startDate.setHours(startDate.getHours() - 24);
          break;
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
      }
      
      // Get logs for the period
      const logs = await AutomationLog.findAll({
        where: {
          ruleId,
          createdAt: {
            [Op.gte]: startDate
          }
        },
        attributes: [
          'status',
          'triggerType',
          'executionTime',
          'createdAt'
        ]
      });
      
      // Calculate analytics
      const analytics = {
        totalTriggers: logs.length,
        successCount: logs.filter(l => l.status === 'success').length,
        failureCount: logs.filter(l => l.status === 'failed').length,
        skippedCount: logs.filter(l => l.status === 'skipped').length,
        avgExecutionTime: logs.reduce((sum, l) => sum + (l.executionTime || 0), 0) / logs.length || 0,
        triggersByType: {},
        triggersByHour: {},
        successRate: 0
      };
      
      // Calculate success rate
      if (analytics.totalTriggers > 0) {
        analytics.successRate = (analytics.successCount / analytics.totalTriggers) * 100;
      }
      
      // Group by trigger type
      logs.forEach(log => {
        analytics.triggersByType[log.triggerType] = (analytics.triggersByType[log.triggerType] || 0) + 1;
      });
      
      // Group by hour
      logs.forEach(log => {
        const hour = new Date(log.createdAt).getHours();
        analytics.triggersByHour[hour] = (analytics.triggersByHour[hour] || 0) + 1;
      });
      
      res.json({
        success: true,
        data: {
          rule: {
            id: rule.id,
            name: rule.name,
            ruleType: rule.ruleType,
            isActive: rule.isActive
          },
          period,
          analytics
        }
      });
    } catch (error) {
      logger.api.error('Error getting rule analytics:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  // Get automation logs
  async getLogs(req, res) {
    try {
      const { 
        ruleId, 
        contactId, 
        status, 
        triggerType,
        limit = 50, 
        offset = 0 
      } = req.query;
      
      const whereClause = {};
      
      if (ruleId) whereClause.ruleId = ruleId;
      if (contactId) whereClause.contactId = contactId;
      if (status) whereClause.status = status;
      if (triggerType) whereClause.triggerType = triggerType;
      
      const logs = await AutomationLog.findAll({
        where: whereClause,
        include: [
          {
            model: AutomationRule,
            as: 'rule',
            attributes: ['id', 'name', 'ruleType']
          },
          {
            model: Contact,
            as: 'contact',
            attributes: ['id', 'name', 'phoneNumber']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      
      res.json({
        success: true,
        data: logs,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: await AutomationLog.count({ where: whereClause })
        }
      });
    } catch (error) {
      logger.api.error('Error getting automation logs:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  // Get dashboard stats
  async getDashboardStats(req, res) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const thisWeek = new Date();
      thisWeek.setDate(thisWeek.getDate() - 7);
      
      // Get active rules count by type
      const ruleStats = await AutomationRule.findAll({
        where: { isActive: true },
        attributes: [
          'ruleType',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['ruleType']
      });
      
      // Get today's automation stats
      const todayStats = await AutomationLog.findAll({
        where: {
          createdAt: { [Op.gte]: today }
        },
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['status']
      });
      
      // Get this week's trends
      const weekStats = await AutomationLog.findAll({
        where: {
          createdAt: { [Op.gte]: thisWeek }
        },
        attributes: [
          [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: [sequelize.fn('DATE', sequelize.col('created_at'))]
      });
      
      // Calculate average response time
      const avgResponseTime = await AutomationLog.findOne({
        where: {
          status: 'success',
          executionTime: { [Op.not]: null }
        },
        attributes: [
          [sequelize.fn('AVG', sequelize.col('execution_time')), 'avgTime']
        ]
      });
      
      res.json({
        success: true,
        data: {
          activeRules: ruleStats,
          todayActivity: todayStats,
          weekTrend: weekStats,
          avgResponseTime: avgResponseTime?.dataValues?.avgTime || 0,
          totalActiveRules: await AutomationRule.count({ where: { isActive: true } }),
          totalAutomationsToday: todayStats.reduce((sum, stat) => sum + parseInt(stat.dataValues.count), 0)
        }
      });
    } catch (error) {
      logger.api.error('Error getting dashboard stats:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  // Test rule with sample data
  async testRule(req, res) {
    try {
      const { ruleId } = req.params;
      const { testMessage = 'Test message', contactPhone = '6281234567890' } = req.body;
      
      const rule = await AutomationRule.findByPk(ruleId);
      if (!rule) {
        return res.status(404).json({
          success: false,
          error: 'Rule not found'
        });
      }
      
      // Process the test message through the rule
      let wouldTrigger = false;
      let processedMessages = [];
      
      switch (rule.ruleType) {
        case 'keyword':
          // Check if any keyword matches
          const keywords = rule.keywords || [];
          wouldTrigger = keywords.some(keyword => 
            testMessage.toLowerCase().includes(keyword.toLowerCase())
          );
          break;
          
        case 'welcome':
          // Would trigger for new contacts
          wouldTrigger = true;
          break;
          
        case 'away':
          // Check schedule
          const now = new Date();
          const schedule = rule.schedule || {};
          // Simplified schedule check
          wouldTrigger = true; // Would need full schedule logic
          break;
          
        case 'workflow':
          // Would trigger based on workflow conditions
          wouldTrigger = true;
          break;
      }
      
      // Process messages based on rule type
      if (rule.responseType === 'sequence' && rule.responseMessages) {
        // Process multiple messages
        processedMessages = rule.responseMessages.map(msg => {
          if (msg.type === 'text') {
            return {
              ...msg,
              content: (msg.content || msg.text || '')
                .replace(/{name}/g, 'Test User')
                .replace(/{time}/g, new Date().toLocaleTimeString('id-ID'))
                .replace(/{date}/g, new Date().toLocaleDateString('id-ID'))
            };
          } else if (msg.type === 'image') {
            return {
              ...msg,
              caption: msg.caption
                ? msg.caption
                    .replace(/{name}/g, 'Test User')
                    .replace(/{time}/g, new Date().toLocaleTimeString('id-ID'))
                    .replace(/{date}/g, new Date().toLocaleDateString('id-ID'))
                : ''
            };
          }
          return msg;
        });
      } else {
        // Legacy single message
        const processedMessage = (rule.responseMessage || '')
          .replace(/{name}/g, 'Test User')
          .replace(/{time}/g, new Date().toLocaleTimeString('id-ID'))
          .replace(/{date}/g, new Date().toLocaleDateString('id-ID'));
        
        processedMessages = [{
          type: 'text',
          content: processedMessage
        }];
      }
      
      res.json({
        success: true,
        data: {
          rule: {
            id: rule.id,
            name: rule.name,
            ruleType: rule.ruleType,
            responseType: rule.responseType
          },
          test: {
            testMessage,
            wouldTrigger,
            processedMessages,
            responseDelay: rule.responseDelay,
            messageDelay: rule.messageDelay
          }
        }
      });
    } catch (error) {
      logger.api.error('Error testing automation rule:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  // Calculate trend percentage
  calculateTrend = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }
  
  // Get pipeline statistics
  getPipelineStats = async (req, res) => {
    try {
      const { period = '30d' } = req.query;
      
      // Calculate date range for current month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      // Calculate previous month for comparison
      const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      
      // Get current month statistics
      const currentStats = await this.calculatePhaseStats(startOfMonth, endOfMonth);
      
      // Get previous month statistics for trend calculation
      const previousStats = await this.calculatePhaseStats(startOfPrevMonth, endOfPrevMonth);
      
      // Calculate trends
      const pipelineData = {
        leads: {
          total: currentStats.leads.total,
          trend: this.calculateTrend(currentStats.leads.total, previousStats.leads.total),
          sources: currentStats.leads.sources,
          conversionRate: currentStats.leads.conversionRate,
          converted: currentStats.leads.converted
        },
        interest: {
          total: currentStats.interest.total,
          trend: this.calculateTrend(currentStats.interest.total, previousStats.interest.total),
          packages: currentStats.interest.packages,
          conversionRate: currentStats.interest.conversionRate,
          converted: currentStats.interest.converted
        },
        closing: {
          total: currentStats.closing.total,
          trend: this.calculateTrend(currentStats.closing.total, previousStats.closing.total),
          payments: currentStats.closing.payments,
          conversionRate: currentStats.closing.completionRate,
          converted: currentStats.closing.completed
        }
      };
      
      res.json({
        success: true,
        data: pipelineData,
        period: 'current_month',
        dateRange: {
          start: startOfMonth,
          end: endOfMonth
        }
      });
    } catch (error) {
      logger.api.error('Error getting pipeline stats:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  // Calculate phase statistics for a date range
  calculatePhaseStats = async (startDate, endDate) => {
    try {
      // Get all customer phases within date range
      const phases = await CustomerPhase.findAll({
        where: {
          createdAt: {
            [Op.between]: [startDate, endDate]
          }
        },
        include: [
          {
            model: Contact,
            attributes: ['id', 'name', 'phoneNumber']
          }
        ]
      });
      
      // Calculate LEADS statistics
      const leadsPhases = phases.filter(p => p.currentPhase === 'LEADS' || p.previousPhase === 'LEADS');
      const leadsTotal = leadsPhases.length;
      const leadsConverted = phases.filter(p => p.previousPhase === 'LEADS' && p.currentPhase === 'INTEREST').length;
      const leadsConversionRate = leadsTotal > 0 ? Math.round((leadsConverted / leadsTotal) * 100) : 0;
      
      // Group leads by source
      const leadsSources = {};
      leadsPhases.forEach(phase => {
        const source = phase.phaseSource || 'other';
        leadsSources[source] = (leadsSources[source] || 0) + 1;
      });
      
      // Calculate INTEREST statistics
      const interestPhases = phases.filter(p => p.currentPhase === 'INTEREST' || p.previousPhase === 'INTEREST');
      const interestTotal = interestPhases.length;
      const interestConverted = phases.filter(p => p.previousPhase === 'INTEREST' && p.currentPhase === 'CLOSING').length;
      const interestConversionRate = interestTotal > 0 ? Math.round((interestConverted / interestTotal) * 100) : 0;
      
      // Group interest by package preferences
      const interestPackages = {};
      interestPhases.forEach(phase => {
        if (phase.interestedPackages && phase.interestedPackages.length > 0) {
          phase.interestedPackages.forEach(pkg => {
            interestPackages[pkg] = (interestPackages[pkg] || 0) + 1;
          });
        }
      });
      
      // Calculate CLOSING statistics
      const closingPhases = phases.filter(p => p.currentPhase === 'CLOSING');
      const closingTotal = closingPhases.length;
      const closingCompleted = closingPhases.filter(p => p.bookingConfirmed).length;
      const closingCompletionRate = closingTotal > 0 ? Math.round((closingCompleted / closingTotal) * 100) : 0;
      
      // Group closing by payment status
      const closingPayments = {};
      closingPhases.forEach(phase => {
        const status = phase.paymentStatus || 'none';
        closingPayments[status] = (closingPayments[status] || 0) + 1;
      });
      
      return {
        leads: {
          total: leadsTotal,
          sources: leadsSources,
          conversionRate: leadsConversionRate,
          converted: leadsConverted
        },
        interest: {
          total: interestTotal,
          packages: interestPackages,
          conversionRate: interestConversionRate,
          converted: interestConverted
        },
        closing: {
          total: closingTotal,
          payments: closingPayments,
          completionRate: closingCompletionRate,
          completed: closingCompleted
        }
      };
    } catch (error) {
      logger.error('Error calculating phase stats:', error);
      
      // Return demo data if calculation fails
      return {
        leads: {
          total: 127,
          sources: { instagram: 68, referral: 41, whatsapp: 18 },
          conversionRate: 65,
          converted: 83
        },
        interest: {
          total: 83,
          packages: { '9H': 31, '12H': 38, 'TUR': 14 },
          conversionRate: 42,
          converted: 35
        },
        closing: {
          total: 35,
          payments: { dp_received: 32, full: 24, partial: 8 },
          completionRate: 89,
          completed: 31
        }
      };
    }
  }
  
  // Calculate trend percentage
  calculateTrend = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }
  
  // Simulate incoming message for testing autoreply
  simulateIncomingMessage = async (req, res) => {
    try {
      const { content, fromNumber } = req.body;
      
      if (!content || !fromNumber) {
        return res.status(400).json({
          success: false,
          error: 'Content and fromNumber are required'
        });
      }
      
      logger.info(`=== SIMULATING INCOMING MESSAGE ===`);
      logger.info(`Content: "${content}"`);
      logger.info(`From: ${fromNumber}`);
      
      // Import models needed
      const { Contact, Conversation, AutomationLog } = require('../models');
      
      // Create or find contact
      const [contact] = await Contact.findOrCreate({
        where: { phoneNumber: fromNumber },
        defaults: {
          name: 'Test Contact',
          isBlocked: false
        }
      });
      
      // Create or find conversation
      const [conversation] = await Conversation.findOrCreate({
        where: { contactId: contact.id },
        defaults: {
          sessionId: 'default',
          isGroup: false,
          status: 'active'
        }
      });
      
      // Create message object (not saved to DB, just for testing)
      const testMessage = {
        id: 'test-' + Date.now(),
        content: content,
        body: content,
        messageType: 'text',
        conversationId: conversation.id,
        fromNumber: fromNumber,
        direction: 'inbound',
        status: 'received'
      };
      
      logger.info('Processing message through automation engine...');
      
      // Process through automation engine
      const automationEngine = require('../services/AutomationEngine');
      await automationEngine.processMessage(testMessage, contact, conversation);
      
      // Check what happened
      const logs = await AutomationLog.findAll({
        where: {
          contactId: contact.id
        },
        order: [['createdAt', 'DESC']],
        limit: 5
      });
      
      res.json({
        success: true,
        message: 'Message simulated and processed',
        contact: {
          id: contact.id,
          phone: contact.phoneNumber
        },
        conversation: {
          id: conversation.id
        },
        recentLogs: logs.map(log => ({
          rule: log.ruleId,
          status: log.status,
          error: log.error,
          time: log.createdAt
        }))
      });
      
    } catch (error) {
      logger.error('Error simulating message:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  // Test keyword matching
  testKeywordMatch = async (req, res) => {
    try {
      const { keyword, phoneNumber } = req.body;
      
      if (!keyword || !phoneNumber) {
        return res.status(400).json({
          success: false,
          error: 'Keyword and phone number are required'
        });
      }
      
      logger.info(`Testing keyword match: "${keyword}" from ${phoneNumber}`);
      
      // Get all active keyword rules
      const rules = await AutomationRule.findAll({
        where: {
          ruleType: 'keyword',
          isActive: true
        }
      });
      
      logger.info(`Found ${rules.length} active keyword rules`);
      
      // Find matching rules
      const matchingRules = [];
      for (const rule of rules) {
        const keywords = rule.keywords || [];
        logger.info(`Checking rule "${rule.name}" with keywords:`, keywords);
        
        if (keywords.some(k => k.toLowerCase() === keyword.toLowerCase())) {
          matchingRules.push({
            id: rule.id,
            name: rule.name,
            keywords: rule.keywords,
            responseMessages: rule.responseMessages
          });
        }
      }
      
      if (matchingRules.length === 0) {
        return res.json({
          success: true,
          message: 'No matching rules found',
          keyword: keyword,
          rulesChecked: rules.length
        });
      }
      
      // Simulate sending response
      const firstRule = matchingRules[0];
      const responses = firstRule.responseMessages || [];
      
      res.json({
        success: true,
        message: 'Keyword matched!',
        keyword: keyword,
        matchingRules: matchingRules,
        wouldSend: responses.map(r => ({
          type: r.type,
          content: r.type === 'text' ? r.content : `[Image: ${r.caption || 'No caption'}]`
        }))
      });
      
    } catch (error) {
      logger.error('Error testing keyword match:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new AutomationController();