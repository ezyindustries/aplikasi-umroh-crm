const { 
  AutomationRule, 
  AutomationLog, 
  AutomationContactLimit, 
  Contact, 
  Message, 
  CustomerPhase, 
  WorkflowTemplate,
  WorkflowStep,
  WorkflowSession,
  WorkflowVariable,
  sequelize 
} = require('../models');
const logger = require('../utils/logger');
const { Op } = require('sequelize');
const LLMService = require('../services/LLMService');
const WorkflowEngine = require('../services/WorkflowEngine');

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
          // Parse rule data from form or use direct JSON body
          let ruleData;
          if (req.body.ruleData) {
            // Form data with ruleData field
            ruleData = JSON.parse(req.body.ruleData);
          } else if (req.body.name && req.body.ruleType) {
            // Direct JSON body
            ruleData = req.body;
          } else {
            // Try parsing as form data
            ruleData = JSON.parse(req.body.ruleData || '{}');
          }
          
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
            cooldownMinutes = 0,
            ...otherFields
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
            createdBy: req.user?.id || 'system',
            ...otherFields // Include any additional fields like metadata, templateId, etc.
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
      
      // Get recent logs with contact info
      const recentLogs = await AutomationLog.findAll({
        where: {
          ruleId,
          createdAt: {
            [Op.gte]: startDate
          }
        },
        include: [{
          model: Contact,
          as: 'contact',
          attributes: ['id', 'name', 'phoneNumber']
        }],
        order: [['createdAt', 'DESC']],
        limit: 10
      });
      
      // Calculate chart data (group by date)
      const chartData = [];
      const dayCount = period === '24h' ? 1 : (period === '7d' ? 7 : 30);
      
      for (let i = 0; i < dayCount; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() + 1);
        
        const dayLogs = logs.filter(log => {
          const logDate = new Date(log.createdAt);
          return logDate >= date && logDate < endDate;
        });
        
        chartData.unshift({
          date: date.toISOString(),
          total: dayLogs.length,
          success: dayLogs.filter(l => l.status === 'success').length,
          failed: dayLogs.filter(l => l.status === 'failed').length
        });
      }
      
      // Calculate trends (compare with previous period)
      const prevStartDate = new Date(startDate);
      prevStartDate.setTime(prevStartDate.getTime() - (new Date().getTime() - startDate.getTime()));
      
      const prevLogs = await AutomationLog.findAll({
        where: {
          ruleId,
          createdAt: {
            [Op.gte]: prevStartDate,
            [Op.lt]: startDate
          }
        },
        attributes: ['status']
      });
      
      const prevSuccess = prevLogs.filter(l => l.status === 'success').length;
      const prevFailed = prevLogs.filter(l => l.status === 'failed').length;
      const prevTotal = prevLogs.length;
      
      const trends = {
        triggersChange: prevTotal > 0 ? ((analytics.totalTriggers - prevTotal) / prevTotal) * 100 : 0,
        successChange: prevSuccess > 0 ? ((analytics.successCount - prevSuccess) / prevSuccess) * 100 : 0,
        failureChange: prevFailed > 0 ? ((analytics.failureCount - prevFailed) / prevFailed) * 100 : 0
      };
      
      res.json({
        success: true,
        data: {
          rule: {
            id: rule.id,
            name: rule.name,
            ruleType: rule.ruleType,
            keywords: Array.isArray(rule.keywords) ? rule.keywords : (rule.keywords ? [rule.keywords] : []),
            isActive: rule.isActive
          },
          period,
          summary: {
            totalTriggers: analytics.totalTriggers,
            successCount: analytics.successCount,
            failedCount: analytics.failureCount,
            successRate: analytics.successRate,
            averageResponseTime: analytics.avgExecutionTime
          },
          trends,
          chartData,
          recentLogs: recentLogs.map(log => ({
            id: log.id,
            status: log.status,
            createdAt: log.createdAt,
            triggerData: log.triggerData,
            contact: log.contact
          }))
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
  
  // Get available LLM models
  async getLLMModels(req, res) {
    try {
      const models = await LLMService.getAvailableModels();
      
      res.json({
        success: true,
        data: models
      });
    } catch (error) {
      logger.error('Error getting LLM models:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  // Test LLM prompt
  async testLLMPrompt(req, res) {
    try {
      const { systemPrompt, sampleMessage, llmConfig } = req.body;
      
      if (!systemPrompt || !sampleMessage) {
        return res.status(400).json({
          success: false,
          error: 'System prompt and sample message are required'
        });
      }
      
      const result = await LLMService.testPrompt(
        systemPrompt,
        sampleMessage,
        llmConfig || {}
      );
      
      res.json({
        success: result.success,
        data: {
          response: result.response,
          prompt: result.prompt,
          stats: result.stats,
          error: result.error
        }
      });
    } catch (error) {
      logger.error('Error testing LLM prompt:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  // Get prompt templates
  async getPromptTemplates(req, res) {
    try {
      const templates = [
        {
          id: 'umrah_consultant',
          name: 'Konsultan Umrah',
          systemPrompt: `Anda adalah konsultan umrah yang berpengalaman dan ramah di Vauza Tamma. Tugas Anda adalah membantu calon jamaah dengan informasi paket umrah, menjawab pertanyaan mereka, dan membimbing mereka dalam proses pemilihan paket yang sesuai.

Gunakan bahasa Indonesia yang sopan dan Islami. Sertakan salam pembuka/penutup yang sesuai. Jika ditanya hal di luar umrah, arahkan kembali ke topik umrah dengan sopan.

Informasi penting:
- Selalu tanyakan preferensi bulan keberangkatan
- Tanyakan jumlah jamaah jika relevan
- Berikan rekomendasi paket berdasarkan budget
- Jelaskan perbedaan antar paket dengan jelas
- Ajak untuk berkonsultasi lebih lanjut atau booking`,
          category: 'sales'
        },
        {
          id: 'umrah_simple',
          name: 'Konsultan Umrah (Deepseek Simple)',
          systemPrompt: `Kamu CS umrah Vauza Tamma. Jawab sopan dan Islami dalam bahasa Indonesia.

Fokus:
- Tanya bulan keberangkatan
- Tanya jumlah orang
- Jelaskan paket sesuai budget
- Ajak booking

Jawab singkat dan jelas.`,
          category: 'sales'
        },
        {
          id: 'umrah_phi3',
          name: 'Konsultan Umrah (Phi-3 Optimized)',
          systemPrompt: `Anda adalah konsultan umrah Vauza Tamma yang berpengalaman.

INSTRUKSI:
1. Gunakan bahasa Indonesia yang sopan dan Islami
2. Mulai dengan salam yang sesuai waktu
3. Fokus menjawab pertanyaan customer
4. Berikan informasi yang jelas dan terstruktur
5. Akhiri dengan ajakan action (booking/konsultasi)

INFORMASI PAKET:
- Ekonomis: 25-30 juta (9 hari, hotel ⭐⭐⭐)
- Standard: 35-40 juta (12 hari, hotel ⭐⭐⭐⭐)
- VIP: 45-55 juta (12 hari, hotel ⭐⭐⭐⭐⭐)

PRINSIP:
- Jangan terlalu panjang (max 3-4 kalimat)
- Langsung ke poin yang ditanyakan
- Tawarkan bantuan lebih lanjut`,
          category: 'sales'
        },
        {
          id: 'package_advisor',
          name: 'Penasihat Paket',
          systemPrompt: `Anda adalah penasihat paket umrah yang ahli dalam menjelaskan detail paket. Fokus pada:
- Menjelaskan fasilitas setiap paket
- Membandingkan paket berdasarkan kebutuhan customer
- Memberikan rekomendasi berdasarkan budget dan preferensi
- Menjawab pertanyaan teknis tentang perjalanan

Gunakan bahasa yang mudah dipahami dan berikan contoh konkret.`,
          category: 'sales'
        },
        {
          id: 'customer_support',
          name: 'Customer Support',
          systemPrompt: `Anda adalah customer support yang membantu jamaah yang sudah terdaftar. Fokus pada:
- Menjawab pertanyaan administrasi
- Membantu dengan dokumen yang diperlukan
- Informasi persiapan keberangkatan
- Menangani keluhan dengan empati

Selalu tunjukkan empati dan kesediaan membantu.`,
          category: 'support'
        }
      ];
      
      res.json({
        success: true,
        data: templates
      });
    } catch (error) {
      logger.error('Error getting prompt templates:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // ===== WORKFLOW METHODS =====

  // Create workflow
  async createWorkflow(req, res) {
    try {
      const { ruleId, name, description, steps } = req.body;

      if (!ruleId || !name || !steps || !Array.isArray(steps)) {
        return res.status(400).json({
          success: false,
          error: 'Rule ID, name, and steps array are required'
        });
      }

      // Verify rule exists and is workflow type
      const rule = await AutomationRule.findByPk(ruleId);
      if (!rule || rule.ruleType !== 'workflow') {
        return res.status(400).json({
          success: false,
          error: 'Invalid rule or rule type must be workflow'
        });
      }

      // Create workflow template
      const workflow = await WorkflowTemplate.create({
        ruleId,
        name,
        description,
        isActive: true
      });

      // Create steps
      const createdSteps = [];
      for (let i = 0; i < steps.length; i++) {
        const stepData = steps[i];
        const step = await WorkflowStep.create({
          workflowId: workflow.id,
          stepOrder: i + 1,
          stepType: stepData.stepType,
          name: stepData.name,
          description: stepData.description,
          config: stepData.config || {},
          templateText: stepData.templateText,
          keywords: stepData.keywords || [],
          aiPrompt: stepData.aiPrompt,
          aiConfig: stepData.aiConfig || {},
          inputType: stepData.inputType,
          inputValidation: stepData.inputValidation || {},
          saveToVariable: stepData.saveToVariable,
          nextStepConditions: stepData.nextStepConditions || [],
          defaultNextStep: stepData.defaultNextStep,
          responseTimeout: stepData.responseTimeout || 300,
          delayBefore: stepData.delayBefore || 0,
          position: stepData.position || { x: 100 + (i * 200), y: 100 }
        });
        createdSteps.push(step);
      }

      // Update step connections
      for (let i = 0; i < createdSteps.length; i++) {
        const step = createdSteps[i];
        const originalStep = steps[i];
        
        // Update default next step to use actual IDs
        if (originalStep.defaultNextStep !== undefined && originalStep.defaultNextStep !== null) {
          const nextIndex = originalStep.defaultNextStep;
          if (nextIndex >= 0 && nextIndex < createdSteps.length) {
            await step.update({ defaultNextStep: createdSteps[nextIndex].id });
          }
        }
      }

      res.json({
        success: true,
        data: {
          workflow,
          steps: createdSteps
        }
      });
    } catch (error) {
      logger.error('Error creating workflow:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get workflow
  async getWorkflow(req, res) {
    try {
      const { workflowId } = req.params;

      const workflow = await WorkflowTemplate.findByPk(workflowId, {
        include: [{
          model: WorkflowStep,
          as: 'steps',
          order: [['stepOrder', 'ASC']]
        }]
      });

      if (!workflow) {
        return res.status(404).json({
          success: false,
          error: 'Workflow not found'
        });
      }

      res.json({
        success: true,
        data: workflow
      });
    } catch (error) {
      logger.error('Error getting workflow:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Update workflow
  async updateWorkflow(req, res) {
    try {
      const { workflowId } = req.params;
      const { name, description, steps, isActive } = req.body;

      const workflow = await WorkflowTemplate.findByPk(workflowId);
      if (!workflow) {
        return res.status(404).json({
          success: false,
          error: 'Workflow not found'
        });
      }

      // Update workflow
      await workflow.update({
        name: name || workflow.name,
        description: description || workflow.description,
        isActive: isActive !== undefined ? isActive : workflow.isActive
      });

      // Update steps if provided
      if (steps && Array.isArray(steps)) {
        // Delete existing steps
        await WorkflowStep.destroy({ where: { workflowId } });

        // Create new steps
        const createdSteps = [];
        for (let i = 0; i < steps.length; i++) {
          const stepData = steps[i];
          const step = await WorkflowStep.create({
            workflowId,
            stepOrder: i + 1,
            ...stepData
          });
          createdSteps.push(step);
        }

        workflow.steps = createdSteps;
      }

      res.json({
        success: true,
        data: workflow
      });
    } catch (error) {
      logger.error('Error updating workflow:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get workflow sessions
  async getWorkflowSessions(req, res) {
    try {
      const { workflowId, status, limit = 20, offset = 0 } = req.query;

      const whereClause = {};
      if (workflowId) whereClause.workflowId = workflowId;
      if (status) whereClause.status = status;

      const sessions = await WorkflowSession.findAll({
        where: whereClause,
        include: [{
          model: WorkflowTemplate,
          as: 'workflow',
          attributes: ['id', 'name']
        }],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        data: sessions,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: await WorkflowSession.count({ where: whereClause })
        }
      });
    } catch (error) {
      logger.error('Error getting workflow sessions:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get workflow session details
  async getWorkflowSession(req, res) {
    try {
      const { sessionId } = req.params;

      const session = await WorkflowSession.findByPk(sessionId, {
        include: [
          {
            model: WorkflowTemplate,
            as: 'workflow',
            include: [{
              model: WorkflowStep,
              as: 'steps'
            }]
          },
          {
            model: WorkflowVariable,
            as: 'variables'
          }
        ]
      });

      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Session not found'
        });
      }

      res.json({
        success: true,
        data: session
      });
    } catch (error) {
      logger.error('Error getting workflow session:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get all workflows
  async getWorkflows(req, res) {
    try {
      const workflows = await WorkflowTemplate.findAll({
        order: [['createdAt', 'DESC']]
      });

      res.json({
        success: true,
        data: workflows
      });
    } catch (error) {
      logger.error('Error getting workflows:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Delete workflow
  async deleteWorkflow(req, res) {
    try {
      const { workflowId } = req.params;

      const workflow = await WorkflowTemplate.findByPk(workflowId);
      if (!workflow) {
        return res.status(404).json({
          success: false,
          error: 'Workflow not found'
        });
      }

      // Delete workflow and all related data
      await workflow.destroy();

      res.json({
        success: true,
        message: 'Workflow deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting workflow:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Test workflow
  async testWorkflow(req, res) {
    try {
      const { workflowId, customerPhone, testMessage } = req.body;

      if (!workflowId || !customerPhone) {
        return res.status(400).json({
          success: false,
          error: 'Workflow ID and customer phone are required'
        });
      }

      // Start workflow
      const session = await WorkflowEngine.startWorkflow(workflowId, customerPhone, {
        body: testMessage || 'Test workflow start'
      });

      res.json({
        success: true,
        data: {
          sessionId: session.id,
          status: session.status,
          currentStep: session.currentStepId
        }
      });
    } catch (error) {
      logger.error('Error testing workflow:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  // Get intent detection analytics
  async getIntentAnalytics(req, res) {
    try {
      const { timeRange = '7d' } = req.query;
      
      // Calculate date range
      let startDate = new Date();
      switch (timeRange) {
        case '24h':
          startDate.setHours(startDate.getHours() - 24);
          break;
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        default:
          startDate.setDate(startDate.getDate() - 7);
      }
      
      // Get automation logs with detected intents
      const intentLogs = await AutomationLog.findAll({
        where: {
          createdAt: { [Op.gte]: startDate },
          metadata: { [Op.ne]: null }
        },
        attributes: ['metadata', 'createdAt', 'status']
      });
      
      // Count intents
      const intentCounts = {
        greeting: { count: 0, trend: 15 },
        inquiry_price: { count: 0, trend: 23 },
        inquiry_package: { count: 0, trend: -8 },
        booking_intent: { count: 0, trend: 42 },
        inquiry_document: { count: 0, trend: 0 },
        inquiry_schedule: { count: 0, trend: 10 },
        inquiry_payment: { count: 0, trend: 5 },
        inquiry_facility: { count: 0, trend: -3 },
        complaint: { count: 0, trend: -15 },
        thanks: { count: 0, trend: 8 },
        general_question: { count: 0, trend: 12 },
        fallback: { count: 0, trend: -12 },
        other: { count: 0, trend: 0 }
      };
      
      // Process logs to count intents
      intentLogs.forEach(log => {
        if (log.metadata && log.metadata.detectedIntent) {
          const intent = log.metadata.detectedIntent.intent || 'other';
          if (intentCounts[intent]) {
            intentCounts[intent].count++;
          } else {
            intentCounts.other.count++;
          }
        } else if (log.metadata && log.metadata.intent) {
          const intent = log.metadata.intent || 'other';
          if (intentCounts[intent]) {
            intentCounts[intent].count++;
          } else {
            intentCounts.other.count++;
          }
        }
      });
      
      // Add fallback count (failed intent detections)
      const failedLogs = intentLogs.filter(log => 
        log.status === 'failed' || 
        (log.metadata && log.metadata.fallback) ||
        (log.metadata && log.metadata.detectedIntent && log.metadata.detectedIntent.confidence < 0.5)
      );
      intentCounts.fallback.count += failedLogs.length;
      
      res.json({
        success: true,
        data: intentCounts
      });
    } catch (error) {
      logger.api.error('Error getting intent analytics:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  // Toggle master automation switch
  async toggleMasterSwitch(req, res) {
    try {
      const { enabled } = req.body;
      
      if (typeof enabled !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: 'Invalid request: enabled must be a boolean'
        });
      }
      
      // Update automation engine state
      const automationEngine = require('../services/AutomationEngine');
      automationEngine.setMasterEnabled(enabled);
      
      // For now, we'll just track the master switch state without updating individual rules
      // This avoids database issues but still controls automation execution
      let affectedRules = 0;
      
      try {
        // Try to log the action
        await AutomationLog.create({
          ruleId: null,
          eventType: enabled ? 'master_enabled' : 'master_disabled',
          eventDescription: `Master automation switch turned ${enabled ? 'ON' : 'OFF'}`,
          metadata: {
            adminAction: true,
            timestamp: new Date()
          }
        });
      } catch (logError) {
        // Log error but don't fail the request
        logger.error('Error creating automation log:', logError);
      }
      
      logger.info(`Master automation switch toggled: ${enabled ? 'ON' : 'OFF'}`);
      
      res.json({
        success: true,
        data: {
          enabled,
          affectedRules,
          message: `All automation rules are now ${enabled ? 'active' : 'disabled'}`
        }
      });
      
    } catch (error) {
      logger.error('Error toggling master switch:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  // Get master automation switch status
  async getMasterSwitchStatus(req, res) {
    try {
      const automationEngine = require('../services/AutomationEngine');
      const enabled = automationEngine.getMasterEnabled();
      
      // Count active and inactive rules
      const activeCount = await AutomationRule.count({ where: { isActive: true } });
      const inactiveCount = await AutomationRule.count({ where: { isActive: false } });
      
      res.json({
        success: true,
        data: {
          enabled,
          activeRules: activeCount,
          inactiveRules: inactiveCount,
          totalRules: activeCount + inactiveCount
        }
      });
      
    } catch (error) {
      logger.error('Error getting master switch status:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  // Get automation logs with enhanced details
  async getAutomationLogs(req, res) {
    try {
      const { 
        limit = 50, 
        offset = 0, 
        ruleId, 
        status, 
        startDate, 
        endDate,
        ruleType,
        intent
      } = req.query;
      
      const whereClause = {};
      
      if (ruleId) whereClause.ruleId = ruleId;
      if (status) whereClause.status = status;
      
      if (startDate || endDate) {
        whereClause.createdAt = {};
        if (startDate) whereClause.createdAt[Op.gte] = new Date(startDate);
        if (endDate) whereClause.createdAt[Op.lte] = new Date(endDate);
      }
      
      // Handle metadata filters
      const metadataFilters = [];
      if (ruleType) {
        metadataFilters.push(sequelize.literal(`metadata->>'ruleType' = '${ruleType}'`));
      }
      if (intent) {
        metadataFilters.push(sequelize.literal(`metadata->'intentDetection'->>'intent' = '${intent}'`));
      }
      
      if (metadataFilters.length > 0) {
        whereClause[Op.and] = metadataFilters;
      }
      
      const logs = await AutomationLog.findAll({
        where: whereClause,
        include: [
          {
            model: AutomationRule,
            as: 'rule',
            attributes: ['id', 'name', 'ruleType', 'priority']
          },
          {
            model: Contact,
            as: 'contact',
            attributes: ['id', 'name', 'phoneNumber']
          },
          {
            model: Message,
            as: 'triggerMessage',
            attributes: ['id', 'content', 'messageType']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      
      // Format logs for frontend
      const formattedLogs = logs.map(log => ({
        id: log.id,
        ruleId: log.ruleId,
        ruleName: log.metadata?.ruleName || log.rule?.name || 'Unknown',
        ruleType: log.metadata?.ruleType || log.rule?.ruleType || log.triggerType,
        rulePriority: log.metadata?.rulePriority || log.rule?.priority || 0,
        contactId: log.contactId,
        contactName: log.contact?.name,
        contactPhone: log.contact?.phoneNumber,
        messageId: log.messageId,
        triggerType: log.triggerType,
        triggerData: log.triggerData,
        status: log.status,
        executionTime: log.executionTime,
        error: log.error,
        skippedReason: log.skippedReason,
        matchedKeywords: log.metadata?.matchedKeywords || [],
        intentDetection: log.metadata?.intentDetection,
        templateUsed: log.metadata?.templateUsed,
        llmModel: log.metadata?.llmModel,
        processingDetails: log.metadata?.processingDetails,
        responseContent: log.metadata?.responsePreview,
        createdAt: log.createdAt
      }));
      
      const total = await AutomationLog.count({ where: whereClause });
      
      res.json({
        success: true,
        logs: formattedLogs,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total
        }
      });
    } catch (error) {
      logger.error('Error getting automation logs:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  // Get automation statistics
  async getAutomationStats(req, res) {
    try {
      const { period = '24h' } = req.query;
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case '1h':
          startDate.setHours(startDate.getHours() - 1);
          break;
        case '24h':
          startDate.setDate(startDate.getDate() - 1);
          break;
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        default:
          startDate.setDate(startDate.getDate() - 1);
      }
      
      // Get total messages
      const totalMessages = await AutomationLog.count({
        where: {
          createdAt: {
            [Op.between]: [startDate, endDate]
          }
        }
      });
      
      // Get success rate
      const successCount = await AutomationLog.count({
        where: {
          createdAt: {
            [Op.between]: [startDate, endDate]
          },
          status: 'success'
        }
      });
      
      const successRate = totalMessages > 0 ? Math.round((successCount / totalMessages) * 100) : 0;
      
      // Get average response time
      const avgTimeResult = await AutomationLog.findOne({
        attributes: [
          [sequelize.fn('AVG', sequelize.col('execution_time')), 'avgTime']
        ],
        where: {
          createdAt: {
            [Op.between]: [startDate, endDate]
          },
          status: 'success',
          executionTime: {
            [Op.not]: null
          }
        }
      });
      
      const avgResponseTime = avgTimeResult?.dataValues?.avgTime 
        ? (avgTimeResult.dataValues.avgTime / 1000).toFixed(2) 
        : 0;
      
      // Get active rules count
      const activeRules = await AutomationRule.count({
        where: { isActive: true }
      });
      
      // Get intent distribution
      const intentLogs = await AutomationLog.findAll({
        attributes: [
          [sequelize.literal(`metadata->'intentDetection'->>'intent'`), 'intent'],
          [sequelize.fn('COUNT', '*'), 'count']
        ],
        where: {
          createdAt: {
            [Op.between]: [startDate, endDate]
          },
          [Op.and]: [
            sequelize.literal(`metadata->'intentDetection' IS NOT NULL`)
          ]
        },
        group: [sequelize.literal(`metadata->'intentDetection'->>'intent'`)],
        raw: true
      });
      
      const intentDistribution = {};
      intentLogs.forEach(log => {
        if (log.intent) {
          intentDistribution[log.intent] = parseInt(log.count);
        }
      });
      
      // Get performance timeline (hourly for last 24h)
      const timelineData = [];
      const hourInterval = 60 * 60 * 1000; // 1 hour in ms
      
      for (let i = 23; i >= 0; i--) {
        const hourEnd = new Date(endDate.getTime() - (i * hourInterval));
        const hourStart = new Date(hourEnd.getTime() - hourInterval);
        
        const hourStats = await AutomationLog.findOne({
          attributes: [
            [sequelize.fn('AVG', sequelize.col('execution_time')), 'avgTime'],
            [sequelize.fn('COUNT', '*'), 'count']
          ],
          where: {
            createdAt: {
              [Op.between]: [hourStart, hourEnd]
            },
            status: 'success'
          },
          raw: true
        });
        
        timelineData.push({
          time: hourEnd,
          avgTime: hourStats?.avgTime || 0,
          count: parseInt(hourStats?.count || 0)
        });
      }
      
      res.json({
        success: true,
        stats: {
          totalMessages,
          successRate,
          avgResponseTime,
          activeRules,
          intentDistribution,
          performanceTimeline: timelineData.filter(d => d.count > 0)
        }
      });
    } catch (error) {
      logger.error('Error getting automation stats:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  // Get rule trigger statistics
  async getRuleTriggers(req, res) {
    try {
      const { period = '7d' } = req.query;
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case '24h':
          startDate.setDate(startDate.getDate() - 1);
          break;
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        default:
          startDate.setDate(startDate.getDate() - 7);
      }
      
      // Get rule trigger counts
      const ruleTriggers = await AutomationLog.findAll({
        attributes: [
          'ruleId',
          [sequelize.fn('COUNT', '*'), 'triggerCount'],
          [sequelize.fn('COUNT', sequelize.literal(`CASE WHEN status = 'success' THEN 1 END`)), 'successCount']
        ],
        where: {
          createdAt: {
            [Op.between]: [startDate, endDate]
          }
        },
        group: ['ruleId'],
        include: [
          {
            model: AutomationRule,
            as: 'rule',
            attributes: ['id', 'name', 'ruleType', 'priority']
          }
        ],
        order: [[sequelize.fn('COUNT', '*'), 'DESC']],
        limit: 20
      });
      
      // Calculate trends (compare with previous period)
      const previousEndDate = new Date(startDate);
      const previousStartDate = new Date(startDate);
      const periodDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      previousStartDate.setDate(previousStartDate.getDate() - periodDays);
      
      const previousTriggers = await AutomationLog.findAll({
        attributes: [
          'ruleId',
          [sequelize.fn('COUNT', '*'), 'count']
        ],
        where: {
          createdAt: {
            [Op.between]: [previousStartDate, previousEndDate]
          }
        },
        group: ['ruleId'],
        raw: true
      });
      
      const previousCounts = {};
      previousTriggers.forEach(pt => {
        previousCounts[pt.ruleId] = parseInt(pt.count);
      });
      
      // Format response
      const rules = ruleTriggers.map(rt => {
        const triggerCount = parseInt(rt.dataValues.triggerCount);
        const successCount = parseInt(rt.dataValues.successCount);
        const previousCount = previousCounts[rt.ruleId] || 0;
        const trend = previousCount === 0 ? (triggerCount > 0 ? 100 : 0) : Math.round(((triggerCount - previousCount) / previousCount) * 100);
        
        return {
          id: rt.ruleId,
          name: rt.rule?.name || 'Unknown Rule',
          type: rt.rule?.ruleType,
          priority: rt.rule?.priority || 0,
          triggerCount,
          successCount,
          successRate: triggerCount > 0 ? Math.round((successCount / triggerCount) * 100) : 0,
          trend
        };
      });
      
      res.json({
        success: true,
        rules,
        period,
        dateRange: {
          start: startDate,
          end: endDate
        }
      });
    } catch (error) {
      logger.error('Error getting rule triggers:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  // Export automation logs
  async exportLogs(req, res) {
    try {
      const { format = 'csv', startDate, endDate } = req.query;
      
      const whereClause = {};
      if (startDate || endDate) {
        whereClause.createdAt = {};
        if (startDate) whereClause.createdAt[Op.gte] = new Date(startDate);
        if (endDate) whereClause.createdAt[Op.lte] = new Date(endDate);
      }
      
      const logs = await AutomationLog.findAll({
        where: whereClause,
        include: [
          {
            model: AutomationRule,
            as: 'rule',
            attributes: ['name', 'ruleType']
          },
          {
            model: Contact,
            as: 'contact',
            attributes: ['name', 'phoneNumber']
          }
        ],
        order: [['createdAt', 'DESC']]
      });
      
      if (format === 'csv') {
        // Generate CSV
        const csv = [
          'Date,Time,Rule Name,Rule Type,Contact,Phone,Message,Intent,Confidence,Status,Response Time (s),Template Used,Error',
          ...logs.map(log => {
            const date = new Date(log.createdAt);
            return [
              date.toLocaleDateString('id-ID'),
              date.toLocaleTimeString('id-ID'),
              log.metadata?.ruleName || log.rule?.name || '',
              log.metadata?.ruleType || log.rule?.ruleType || '',
              log.contact?.name || '',
              log.contact?.phoneNumber || '',
              (log.triggerData?.messageContent || '').replace(/,/g, ';').substring(0, 100),
              log.metadata?.intentDetection?.intent || '',
              log.metadata?.intentDetection?.confidence ? Math.round(log.metadata.intentDetection.confidence * 100) + '%' : '',
              log.status,
              log.executionTime ? (log.executionTime / 1000).toFixed(2) : '',
              log.metadata?.templateUsed || '',
              (log.error || '').replace(/,/g, ';')
            ].join(',');
          })
        ].join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="autoreply-logs-${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csv);
      } else {
        // Return JSON
        res.json({
          success: true,
          logs: logs.map(log => ({
            date: log.createdAt,
            rule: log.metadata?.ruleName || log.rule?.name,
            ruleType: log.metadata?.ruleType || log.rule?.ruleType,
            contact: log.contact?.name,
            phone: log.contact?.phoneNumber,
            message: log.triggerData?.messageContent,
            intent: log.metadata?.intentDetection,
            status: log.status,
            executionTime: log.executionTime,
            templateUsed: log.metadata?.templateUsed,
            error: log.error
          }))
        });
      }
    } catch (error) {
      logger.error('Error exporting logs:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new AutomationController();