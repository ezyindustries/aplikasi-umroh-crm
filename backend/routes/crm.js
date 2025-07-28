const express = require('express');
const router = express.Router();
const axios = require('axios');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { authenticate, authorize } = require('../middleware/auth');
const whatsappBot = require('../services/whatsappBot');
const messageQueue = require('../services/messageQueue');
const {
  messageLimiter,
  globalMessageLimiter,
  dailyLimitMiddleware,
  spamDetectionMiddleware,
  businessHoursMiddleware,
  getRateLimitInfo
} = require('../middleware/simpleRateLimiter');
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
  ConversationLabel,
  ConversationLabelMapping,
  sequelize,
  Op 
} = require('../models');

// All CRM routes require authentication
router.use(authenticate);

// Configure multer for file uploads
const uploadDir = path.join(__dirname, '../../uploads/whatsapp');
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `wa-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB max
  },
  fileFilter: (req, file, cb) => {
    // Allowed file types
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'video/mp4', 'video/mpeg',
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'));
    }
  }
});

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

// Label management endpoints
router.get('/labels', async (req, res) => {
  try {
    const labels = await ConversationLabel.findAll({
      where: { is_active: true },
      include: [
        { 
          model: User, 
          as: 'creator', 
          attributes: ['id', 'full_name'] 
        }
      ],
      order: [['name', 'ASC']]
    });
    
    res.json({ success: true, data: labels });
  } catch (error) {
    console.error('Get labels error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/labels', authorize(['admin', 'marketing']), async (req, res) => {
  try {
    const { name, color, icon, description } = req.body;
    
    const label = await ConversationLabel.create({
      name,
      color,
      icon,
      description,
      created_by: req.user.id
    });
    
    res.json({ success: true, data: label });
  } catch (error) {
    console.error('Create label error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/labels/:id', authorize(['admin', 'marketing']), async (req, res) => {
  try {
    const label = await ConversationLabel.findByPk(req.params.id);
    
    if (!label) {
      return res.status(404).json({ success: false, message: 'Label not found' });
    }
    
    await label.update(req.body);
    res.json({ success: true, data: label });
  } catch (error) {
    console.error('Update label error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/labels/:id', authorize(['admin']), async (req, res) => {
  try {
    const label = await ConversationLabel.findByPk(req.params.id);
    
    if (!label) {
      return res.status(404).json({ success: false, message: 'Label not found' });
    }
    
    // Soft delete
    await label.update({ is_active: false });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete label error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Assign/remove labels to conversation
router.post('/conversations/:id/labels', async (req, res) => {
  try {
    const { labelIds } = req.body; // Array of label IDs
    const conversation = await WaConversation.findByPk(req.params.id);
    
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }
    
    // Remove all existing labels
    await ConversationLabelMapping.destroy({
      where: { conversation_id: conversation.id }
    });
    
    // Add new labels
    if (labelIds && labelIds.length > 0) {
      const mappings = labelIds.map(labelId => ({
        conversation_id: conversation.id,
        label_id: labelId,
        assigned_by: req.user.id,
        assigned_at: new Date()
      }));
      
      await ConversationLabelMapping.bulkCreate(mappings);
      
      // Update labels cache
      const labels = await ConversationLabel.findAll({
        where: { id: labelIds },
        attributes: ['id', 'name', 'color', 'icon']
      });
      
      await conversation.update({
        labels_cache: labels.map(l => l.toJSON())
      });
    } else {
      await conversation.update({ labels_cache: [] });
    }
    
    // Fetch updated conversation with labels
    const updatedConversation = await WaConversation.findByPk(conversation.id, {
      include: [
        { 
          model: ConversationLabel, 
          as: 'labels',
          through: { attributes: [] }
        }
      ]
    });
    
    // Emit update via WebSocket
    if (req.app.locals.io) {
      req.app.locals.io.emit('conversation:labels_updated', {
        conversationId: conversation.id,
        labels: updatedConversation.labels
      });
    }
    
    res.json({ success: true, data: updatedConversation });
  } catch (error) {
    console.error('Assign labels error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get CRM statistics for new dashboard
router.get('/stats', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get total leads
    const totalLeads = await Lead.count();

    // Get active conversations
    const activeConversations = await WaConversation.count({
      where: {
        status: 'active',
        last_message_at: {
          [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    });

    // Get bot responses today
    const botResponsesToday = await WaMessage.count({
      where: {
        direction: 'outbound',
        is_bot_response: true,
        created_at: { [Op.gte]: today }
      }
    });

    // Calculate conversion rate
    const customers = await Lead.count({ where: { status: 'customer' } });
    const conversionRate = totalLeads > 0 ? Math.round((customers / totalLeads) * 100) : 0;

    // Get funnel data
    const funnel = {
      visitors: await Lead.count({ where: { status: 'visitor' } }),
      leads: await Lead.count({ where: { status: 'lead' } }),
      qualified: await Lead.count({ where: { status: 'qualified' } }),
      customers: customers
    };

    res.json({
      success: true,
      data: {
        totalLeads,
        activeConversations,
        botResponsesToday,
        conversionRate,
        funnel
      }
    });
  } catch (error) {
    console.error('Error fetching CRM stats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch statistics' 
    });
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
    const { status = 'active', page = 1, limit = 20, labelId } = req.query;
    
    // Build where clause
    const where = status === 'all' ? {} : { status };
    
    // Filter by label if provided
    let conversationIds = null;
    if (labelId) {
      const labelMappings = await ConversationLabelMapping.findAll({
        where: { label_id: labelId },
        attributes: ['conversation_id']
      });
      conversationIds = labelMappings.map(m => m.conversation_id);
      
      if (conversationIds.length > 0) {
        where.id = { [Op.in]: conversationIds };
      } else {
        // No conversations with this label
        return res.json({
          success: true,
          data: {
            items: [],
            pagination: {
              total: 0,
              page: parseInt(page),
              limit: parseInt(limit),
              totalPages: 0
            }
          }
        });
      }
    }
    
    const conversations = await WaConversation.findAndCountAll({
      where,
      include: [
        { model: Lead, as: 'lead' },
        { model: Jamaah, as: 'jamaah' },
        {
          model: WaMessage,
          as: 'messages',
          limit: 1,
          order: [['created_at', 'DESC']]
        },
        {
          model: ConversationLabel,
          as: 'labels',
          through: { attributes: [] },
          attributes: ['id', 'name', 'color', 'icon']
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

// Upload and send media message
router.post('/conversations/:id/media',
  upload.single('file'),
  messageLimiter,
  globalMessageLimiter,
  dailyLimitMiddleware,
  businessHoursMiddleware,
  async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }

    const { caption = '', isReply = false } = req.body;
    const conversation = await WaConversation.findByPk(req.params.id);
    
    if (!conversation) {
      // Delete uploaded file
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(404).json({ 
        success: false, 
        message: 'Conversation not found' 
      });
    }

    // Determine message type based on file
    let messageType = 'document';
    if (req.file.mimetype.startsWith('image/')) {
      messageType = 'image';
    } else if (req.file.mimetype.startsWith('video/')) {
      messageType = 'video';
    } else if (req.file.mimetype.startsWith('audio/')) {
      messageType = 'audio';
    } else if (req.file.mimetype === 'application/pdf') {
      messageType = 'document';
    }

    // Add to queue with file info
    const queueResult = await messageQueue.addMedia(
      conversation.phone_number,
      {
        filePath: req.file.path,
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
        caption: caption
      },
      {
        conversationId: conversation.id,
        userId: req.user.id,
        type: messageType,
        isReply,
        priority: isReply ? 'high' : 'normal'
      }
    );

    // Create message record
    const message = await conversation.addMessage({
      direction: 'outbound',
      type: messageType,
      content: caption || req.file.originalname,
      media_url: `/uploads/whatsapp/${req.file.filename}`,
      handled_by: req.user.id,
      status: 'queued',
      queue_id: queueResult.queueId
    });

    // Emit to websocket
    if (req.app.locals.io) {
      req.app.locals.io.emit('message_queued', {
        conversationId: conversation.id,
        message: message.toJSON(),
        queuePosition: queueResult.position
      });
    }

    res.json({
      success: true,
      data: message,
      queue: {
        id: queueResult.queueId,
        position: queueResult.position,
        estimatedTime: queueResult.position * 3 // Media takes longer
      }
    });
  } catch (error) {
    console.error('Send media error:', error);
    
    // Clean up uploaded file on error
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Send WhatsApp message with rate limiting and queue
router.post('/conversations/:id/messages', 
  // Apply rate limiting middleware in order
  messageLimiter,                // Per-user per-phone rate limit
  globalMessageLimiter,         // Global system rate limit
  dailyLimitMiddleware,         // Daily message limits
  spamDetectionMiddleware,      // Anti-spam detection
  businessHoursMiddleware,      // Business hours check
  async (req, res) => {
  try {
    const { content, type = 'text', isReply = false } = req.body;
    const conversation = await WaConversation.findByPk(req.params.id);
    
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }
    
    // Add phone number to request body for rate limiting
    req.body.phoneNumber = conversation.phone_number;
    
    // Queue the message instead of sending directly
    const queueResult = await messageQueue.add(
      conversation.phone_number, 
      content, 
      {
        conversationId: conversation.id,
        userId: req.user.id,
        type,
        isReply,
        priority: isReply ? 'high' : 'normal'
      }
    );
    
    // Create pending message record
    const message = await conversation.addMessage({
      direction: 'outbound',
      type,
      content,
      handled_by: req.user.id,
      status: 'queued',
      queue_id: queueResult.queueId
    });
    
    // Emit to websocket for real-time update
    if (req.app.locals.io) {
      req.app.locals.io.emit('message_queued', {
        conversationId: conversation.id,
        message: message.toJSON(),
        queuePosition: queueResult.position
      });
    }
    
    res.json({ 
      success: true, 
      data: message,
      queue: {
        id: queueResult.queueId,
        position: queueResult.position,
        estimatedTime: queueResult.position * 2 // seconds
      }
    });
  } catch (error) {
    console.error('Send message error:', error);
    
    // Check if it's a rate limit error
    if (error.message.includes('limit')) {
      return res.status(429).json({ 
        success: false, 
        error: 'Rate limit exceeded',
        message: error.message 
      });
    }
    
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

router.post('/bot/config', async (req, res) => {
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
      const messageId = payload.id || '';
      const timestamp = payload.timestamp || Date.now();
      
      // Skip if it's our own message
      if (payload.fromMe) {
        console.log('Skipping own message');
        res.json({ success: true });
        return;
      }
      
      // Check if it's a media message
      let messageType = 'text';
      let messageContent = payload.body || '';
      let mediaUrl = null;
      let mimeType = null;
      
      if (payload.hasMedia || payload.type !== 'text') {
        // Handle different media types
        if (payload.type === 'image') {
          messageType = 'image';
          mediaUrl = payload.mediaUrl || payload.url;
          mimeType = payload.mimetype || 'image/jpeg';
          messageContent = payload.caption || 'Image';
        } else if (payload.type === 'document') {
          messageType = 'document';
          mediaUrl = payload.mediaUrl || payload.url;
          mimeType = payload.mimetype || 'application/pdf';
          messageContent = payload.filename || payload.caption || 'Document';
        } else if (payload.type === 'video') {
          messageType = 'video';
          mediaUrl = payload.mediaUrl || payload.url;
          mimeType = payload.mimetype || 'video/mp4';
          messageContent = payload.caption || 'Video';
        } else if (payload.type === 'audio' || payload.type === 'ptt') {
          messageType = 'audio';
          mediaUrl = payload.mediaUrl || payload.url;
          mimeType = payload.mimetype || 'audio/mpeg';
          messageContent = payload.caption || 'Audio';
        }
        
        // Download and save media if URL is provided
        if (mediaUrl && mediaUrl.startsWith('http')) {
          try {
            const mediaResponse = await axios.get(mediaUrl, {
              responseType: 'arraybuffer',
              headers: {
                'X-Api-Key': process.env.WAHA_API_KEY || 'your-secret-api-key'
              }
            });
            
            // Save to uploads directory
            const fileName = `wa-incoming-${Date.now()}-${Math.random().toString(36).substring(7)}`;
            const ext = mimeType.split('/')[1] || 'bin';
            const filePath = path.join(__dirname, `../../uploads/whatsapp/${fileName}.${ext}`);
            
            await fs.writeFile(filePath, mediaResponse.data);
            mediaUrl = `/uploads/whatsapp/${fileName}.${ext}`;
          } catch (error) {
            console.error('Failed to download media:', error);
          }
        }
      }
      
      // Process message through bot (for text messages or media with caption)
      const response = await whatsappBot.processMessage(
        phoneNumber,
        messageContent,
        messageId,
        {
          type: messageType,
          mediaUrl: mediaUrl,
          mimeType: mimeType
        }
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

// Get rate limit info for current user
router.get('/rate-limits', authenticate, getRateLimitInfo);

// Get message queue status
router.get('/queue/status', authenticate, async (req, res) => {
  try {
    const status = messageQueue.getStatus();
    res.json({ success: true, data: status });
  } catch (error) {
    console.error('Queue status error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Listen to message queue events
messageQueue.on('message:sent', async (item) => {
  try {
    // Update message status in database
    const message = await WaMessage.findOne({ 
      where: { queue_id: item.id } 
    });
    
    if (message) {
      await message.update({ 
        status: 'sent',
        sent_at: new Date()
      });
      
      // Update conversation last message time
      await WaConversation.update(
        { last_message_at: new Date() },
        { where: { id: item.options.conversationId } }
      );
    }
  } catch (error) {
    console.error('Error updating sent message:', error);
  }
});

messageQueue.on('message:failed', async ({ item, error }) => {
  try {
    // Update message status in database
    const message = await WaMessage.findOne({ 
      where: { queue_id: item.id } 
    });
    
    if (message) {
      await message.update({ 
        status: 'failed',
        error_message: error
      });
    }
  } catch (error) {
    console.error('Error updating failed message:', error);
  }
});

module.exports = router;