const express = require('express');
const router = express.Router();
const axios = require('axios');
const { authenticate, authorize } = require('../middleware/auth');
const whatsappBot = require('../services/whatsappBot');
const { 
  Lead, 
  WaConversation, 
  WaMessage, 
  BotTemplate,
  BotConfig,
  LeadActivity,
  Campaign,
  LeadSource,
  LeadTag,
  Package,
  Jamaah,
  User,
  MessageTemplate,
  sequelize,
  Op 
} = require('../models');

// All CRM routes require authentication
router.use(authenticate);

// Dashboard metrics
router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    
    // Get lead statistics
    const totalLeads = await Lead.count();
    const monthlyLeads = await Lead.count({
      where: {
        created_at: { [Op.gte]: startOfMonth }
      }
    });
    
    const leadsByStatus = await Lead.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status']
    });
    
    // Get conversation statistics
    const activeConversations = await WaConversation.count({
      where: { status: 'active' }
    });
    
    const botHandledConversations = await WaConversation.count({
      where: {
        status: 'bot_handled',
        created_at: { [Op.gte]: startOfMonth }
      }
    });
    
    // Calculate conversion rate
    const conversions = await Lead.count({
      where: {
        status: 'won',
        converted_at: { [Op.gte]: startOfMonth }
      }
    });
    
    const conversionRate = monthlyLeads > 0 ? (conversions / monthlyLeads * 100).toFixed(1) : 0;
    
    // Get average response time
    const avgResponseTime = await sequelize.query(`
      SELECT AVG(EXTRACT(EPOCH FROM (m2.created_at - m1.created_at))) as avg_seconds
      FROM wa_messages m1
      JOIN wa_messages m2 ON m1.conversation_id = m2.conversation_id
      WHERE m1.direction = 'inbound' 
      AND m2.direction = 'outbound'
      AND m2.created_at > m1.created_at
      AND m1.created_at >= :startDate
    `, {
      replacements: { startDate: startOfMonth },
      type: sequelize.QueryTypes.SELECT
    });
    
    // Get revenue pipeline
    const pipeline = await Lead.findAll({
      where: {
        status: ['qualified', 'negotiation'],
        interested_package_id: { [Op.ne]: null }
      },
      include: [{
        model: Package,
        as: 'interestedPackage',
        attributes: ['price']
      }]
    });
    
    const pipelineValue = pipeline.reduce((sum, lead) => 
      sum + (lead.interestedPackage?.price || 0), 0
    );
    
    res.json({
      success: true,
      data: {
        leads: {
          total: totalLeads,
          monthly: monthlyLeads,
          byStatus: leadsByStatus
        },
        conversations: {
          active: activeConversations,
          botHandled: botHandledConversations
        },
        metrics: {
          conversionRate: parseFloat(conversionRate),
          avgResponseTime: avgResponseTime[0]?.avg_seconds || 0,
          pipelineValue: pipelineValue
        }
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Lead management
router.get('/leads', async (req, res) => {
  try {
    const { status, source, assignedTo, search, page = 1, limit = 20 } = req.query;
    const where = {};
    
    if (status) where.status = status;
    if (source) where.source_id = source;
    if (assignedTo) where.assigned_to = assignedTo;
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    const leads = await Lead.findAndCountAll({
      where,
      include: [
        { model: LeadSource, as: 'source' },
        { model: Package, as: 'interestedPackage' },
        { model: User, as: 'assignedUser', attributes: ['id', 'full_name'] },
        { model: LeadTag, as: 'tags', through: { attributes: [] } }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });
    
    res.json({
      success: true,
      data: {
        items: leads.rows,
        pagination: {
          total: leads.count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(leads.count / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Leads error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/leads', async (req, res) => {
  try {
    const lead = await Lead.create({
      ...req.body,
      created_by: req.user.id
    });
    
    // Add creation activity
    await lead.addActivity('created', 'Lead created', req.user.id);
    
    res.json({ success: true, data: lead });
  } catch (error) {
    console.error('Create lead error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/leads/:id', async (req, res) => {
  try {
    const lead = await Lead.findByPk(req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }
    
    const oldStatus = lead.status;
    await lead.update(req.body);
    
    // Add status change activity
    if (oldStatus !== lead.status) {
      await lead.addActivity(
        'status_change', 
        `Status changed from ${oldStatus} to ${lead.status}`,
        req.user.id,
        { old_status: oldStatus, new_status: lead.status }
      );
    }
    
    res.json({ success: true, data: lead });
  } catch (error) {
    console.error('Update lead error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// WhatsApp conversations
router.get('/conversations', async (req, res) => {
  try {
    const { status = 'active', page = 1, limit = 20 } = req.query;
    
    const conversations = await WaConversation.findAndCountAll({
      where: status === 'all' ? {} : { status },
      include: [
        { model: Lead, as: 'lead' },
        { model: Jamaah, as: 'jamaah' },
        {
          model: WaMessage,
          as: 'messages',
          limit: 1,
          order: [['created_at', 'DESC']]
        }
      ],
      order: [['last_message_at', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });
    
    res.json({
      success: true,
      data: {
        items: conversations.rows,
        pagination: {
          total: conversations.count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(conversations.count / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Conversations error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/conversations/:id/messages', async (req, res) => {
  try {
    const messages = await WaMessage.findAll({
      where: { conversation_id: req.params.id },
      include: [
        { model: User, as: 'handler', attributes: ['id', 'full_name'] }
      ],
      order: [['created_at', 'ASC']]
    });
    
    res.json({ success: true, data: messages });
  } catch (error) {
    console.error('Messages error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Send WhatsApp message
router.post('/conversations/:id/messages', async (req, res) => {
  try {
    const { content, type = 'text' } = req.body;
    const conversation = await WaConversation.findByPk(req.params.id);
    
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }
    
    // Send via WhatsApp bot service
    const result = await whatsappBot.sendMessage(conversation.phone_number, content);
    
    // Save message
    const message = await conversation.addMessage({
      direction: 'outbound',
      type,
      content,
      handled_by: req.user.id,
      wa_message_id: result.messageId
    });
    
    res.json({ success: true, data: message });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Bot configuration
router.get('/bot/config', authorize(['admin', 'marketing']), async (req, res) => {
  try {
    const configs = await BotConfig.findAll();
    const configMap = {};
    configs.forEach(config => {
      configMap[config.parameter] = config.value;
    });
    
    res.json({ success: true, data: configMap });
  } catch (error) {
    console.error('Bot config error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/bot/config', authorize(['admin', 'marketing']), async (req, res) => {
  try {
    const updates = req.body;
    
    for (const [parameter, value] of Object.entries(updates)) {
      await BotConfig.upsert({
        parameter,
        value,
        updated_by: req.user.id,
        updated_at: new Date()
      });
    }
    
    // Reload bot configuration
    await whatsappBot.loadConfig();
    
    res.json({ success: true, message: 'Configuration updated' });
  } catch (error) {
    console.error('Update bot config error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Bot templates
router.get('/bot/templates', async (req, res) => {
  try {
    const templates = await BotTemplate.findAll({
      order: [['usage_count', 'DESC']]
    });
    
    res.json({ success: true, data: templates });
  } catch (error) {
    console.error('Templates error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/bot/templates', authorize(['admin', 'marketing']), async (req, res) => {
  try {
    const template = await BotTemplate.create({
      ...req.body,
      created_by: req.user.id
    });
    
    // Reload templates
    await whatsappBot.loadTemplates();
    
    res.json({ success: true, data: template });
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Campaign management
router.get('/campaigns', async (req, res) => {
  try {
    const campaigns = await Campaign.findAll({
      include: [
        { model: MessageTemplate, as: 'template' },
        { model: User, as: 'creator', attributes: ['id', 'full_name'] }
      ],
      order: [['created_at', 'DESC']]
    });
    
    res.json({ success: true, data: campaigns });
  } catch (error) {
    console.error('Campaigns error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/campaigns', authorize(['admin', 'marketing']), async (req, res) => {
  try {
    const campaign = await Campaign.create({
      ...req.body,
      created_by: req.user.id
    });
    
    res.json({ success: true, data: campaign });
  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// WhatsApp webhook for incoming messages
router.post('/webhook', async (req, res) => {
  try {
    console.log('Webhook received:', JSON.stringify(req.body, null, 2));
    
    // WAHA webhook format
    const event = req.body;
    
    // Handle different event types
    if (event.event === 'message') {
      const payload = event.payload;
      const phoneNumber = payload.from || '';
      const messageText = payload.body || '';
      const messageId = payload.id || '';
      const timestamp = payload.timestamp || Date.now();
      
      // Skip if it's our own message
      if (payload.fromMe) {
        console.log('Skipping own message');
        res.json({ success: true });
        return;
      }
      
      // Process message through bot
      const response = await whatsappBot.processMessage(
        phoneNumber,
        messageText,
        messageId
      );
      
      // Send bot response if available
      if (response && !response.error && !response.escalated) {
        // Send via WAHA API
        const wahaResponse = await axios.post(
          `http://waha:3000/api/sendText`,
          {
            session: 'default',
            chatId: phoneNumber.includes('@') ? phoneNumber : `${phoneNumber}@c.us`,
            text: response.text
          },
          {
            headers: {
              'X-Api-Key': process.env.WAHA_API_KEY || 'your-secret-api-key',
              'Content-Type': 'application/json'
            }
          }
        ).catch(async (error) => {
          // Fallback to localhost if container name fails
          console.log('Trying localhost for WAHA...');
          return axios.post(
            `http://localhost:3001/api/sendText`,
            {
              session: 'default',
              chatId: phoneNumber.includes('@') ? phoneNumber : `${phoneNumber}@c.us`,
              text: response.text
            },
            {
              headers: {
                'X-Api-Key': process.env.WAHA_API_KEY || 'your-secret-api-key',
                'Content-Type': 'application/json'
              }
            }
          );
        });
        console.log('Bot response sent:', wahaResponse.data);
      }
      
      // Emit websocket event for real-time updates
      if (req.app.locals.io) {
        req.app.locals.io.emit('new_message', {
          leadId: response?.leadId,
          conversationId: response?.conversationId,
          phone: phoneNumber,
          message: messageText,
          timestamp: timestamp
        });
      }
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;