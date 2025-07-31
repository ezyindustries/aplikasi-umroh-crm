const { Contact, Conversation, GroupParticipant, Message } = require('../models');
const wahaService = require('../services/RealWAHAService');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

class GroupController {
  // Get all groups
  async getGroups(req, res) {
    try {
      const { sessionId = 'default', status = 'active' } = req.query;

      const groups = await Contact.findAll({
        where: {
          isGroup: true,
          status: status !== 'all' ? status : { [Op.ne]: null }
        },
        include: [{
          model: Conversation,
          as: 'conversations',
          where: { sessionId },
          required: false
        }],
        order: [['name', 'ASC']]
      });

      res.json({
        success: true,
        data: groups
      });
    } catch (error) {
      logger.api.error('Error getting groups:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get group details
  async getGroup(req, res) {
    try {
      const { groupId } = req.params;
      const { sessionId = 'default' } = req.query;

      const group = await Contact.findOne({
        where: {
          groupId: groupId,
          isGroup: true
        },
        include: [{
          model: Conversation,
          as: 'conversations',
          where: { sessionId },
          required: false
        }]
      });

      if (!group) {
        return res.status(404).json({
          success: false,
          error: 'Group not found'
        });
      }

      // Get participants
      const participants = await GroupParticipant.findAll({
        where: {
          groupId: groupId,
          leftAt: null
        },
        include: [{
          model: Contact,
          as: 'contact'
        }]
      });

      res.json({
        success: true,
        data: {
          ...group.toJSON(),
          participants
        }
      });
    } catch (error) {
      logger.api.error('Error getting group:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Create a new group
  async createGroup(req, res) {
    try {
      const { name, participants = [], sessionId = 'default' } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          error: 'Group name is required'
        });
      }

      // Create group via WAHA
      const result = await wahaService.createGroup(sessionId, {
        name,
        participants: participants.map(p => ({ id: p + '@c.us' }))
      });

      if (result.success && result.data) {
        // Group will be automatically added to database via webhook
        res.json({
          success: true,
          data: result.data,
          message: 'Group created successfully'
        });
      } else {
        throw new Error(result.error || 'Failed to create group');
      }
    } catch (error) {
      logger.api.error('Error creating group:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Add participants to group
  async addParticipants(req, res) {
    try {
      const { groupId } = req.params;
      const { participants = [], sessionId = 'default' } = req.body;

      if (participants.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No participants provided'
        });
      }

      const result = await wahaService.addGroupParticipants(
        sessionId, 
        groupId,
        participants.map(p => p + '@c.us')
      );

      res.json({
        success: result.success,
        data: result.data,
        message: result.success ? 'Participants added successfully' : result.error
      });
    } catch (error) {
      logger.api.error('Error adding participants:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Remove participants from group
  async removeParticipants(req, res) {
    try {
      const { groupId } = req.params;
      const { participants = [], sessionId = 'default' } = req.body;

      if (participants.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No participants provided'
        });
      }

      const result = await wahaService.removeGroupParticipants(
        sessionId,
        groupId,
        participants.map(p => p + '@c.us')
      );

      res.json({
        success: result.success,
        data: result.data,
        message: result.success ? 'Participants removed successfully' : result.error
      });
    } catch (error) {
      logger.api.error('Error removing participants:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Promote participants to admin
  async promoteParticipants(req, res) {
    try {
      const { groupId } = req.params;
      const { participants = [], sessionId = 'default' } = req.body;

      if (participants.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No participants provided'
        });
      }

      const result = await wahaService.promoteGroupParticipants(
        sessionId,
        groupId,
        participants.map(p => p + '@c.us')
      );

      res.json({
        success: result.success,
        data: result.data,
        message: result.success ? 'Participants promoted successfully' : result.error
      });
    } catch (error) {
      logger.api.error('Error promoting participants:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Demote participants from admin
  async demoteParticipants(req, res) {
    try {
      const { groupId } = req.params;
      const { participants = [], sessionId = 'default' } = req.body;

      if (participants.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No participants provided'
        });
      }

      const result = await wahaService.demoteGroupParticipants(
        sessionId,
        groupId,
        participants.map(p => p + '@c.us')
      );

      res.json({
        success: result.success,
        data: result.data,
        message: result.success ? 'Participants demoted successfully' : result.error
      });
    } catch (error) {
      logger.api.error('Error demoting participants:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Update group info
  async updateGroup(req, res) {
    try {
      const { groupId } = req.params;
      const { name, description, sessionId = 'default' } = req.body;

      const updates = {};
      if (name) updates.subject = name;
      if (description !== undefined) updates.description = description;

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No updates provided'
        });
      }

      const result = await wahaService.updateGroupInfo(
        sessionId,
        groupId,
        updates
      );

      res.json({
        success: result.success,
        data: result.data,
        message: result.success ? 'Group updated successfully' : result.error
      });
    } catch (error) {
      logger.api.error('Error updating group:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Leave group
  async leaveGroup(req, res) {
    try {
      const { groupId } = req.params;
      const { sessionId = 'default' } = req.body;

      const result = await wahaService.leaveGroup(sessionId, groupId);

      res.json({
        success: result.success,
        message: result.success ? 'Left group successfully' : result.error
      });
    } catch (error) {
      logger.api.error('Error leaving group:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get group messages
  async getGroupMessages(req, res) {
    try {
      const { groupId } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      // Find group conversation
      const conversation = await Conversation.findOne({
        where: { groupId },
        include: [{
          model: Contact,
          as: 'contact'
        }]
      });

      if (!conversation) {
        return res.status(404).json({
          success: false,
          error: 'Group conversation not found'
        });
      }

      const messages = await Message.findAll({
        where: { conversationId: conversation.id },
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        data: messages.reverse(),
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: await Message.count({ where: { conversationId: conversation.id } })
        }
      });
    } catch (error) {
      logger.api.error('Error getting group messages:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get group invite link
  async getInviteLink(req, res) {
    try {
      const { groupId } = req.params;
      const { sessionId = 'default' } = req.query;

      const result = await wahaService.getGroupInviteLink(sessionId, groupId);

      res.json({
        success: result.success,
        data: result.data,
        message: result.success ? 'Invite link retrieved successfully' : result.error
      });
    } catch (error) {
      logger.api.error('Error getting invite link:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Revoke group invite link
  async revokeInviteLink(req, res) {
    try {
      const { groupId } = req.params;
      const { sessionId = 'default' } = req.body;

      const result = await wahaService.revokeGroupInviteLink(sessionId, groupId);

      res.json({
        success: result.success,
        data: result.data,
        message: result.success ? 'Invite link revoked successfully' : result.error
      });
    } catch (error) {
      logger.api.error('Error revoking invite link:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new GroupController();