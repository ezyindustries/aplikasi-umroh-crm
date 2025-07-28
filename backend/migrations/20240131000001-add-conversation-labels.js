'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create conversation labels table
    await queryInterface.createTable('conversation_labels', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      color: {
        type: Sequelize.STRING(7), // Hex color code
        allowNull: false,
        defaultValue: '#3b82f6'
      },
      icon: {
        type: Sequelize.STRING(50),
        allowNull: true // Material icon name
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      created_by: {
        type: Sequelize.UUID,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create junction table for conversation-label many-to-many relationship
    await queryInterface.createTable('conversation_label_mappings', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      conversation_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'wa_conversations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      label_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'conversation_labels',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      assigned_by: {
        type: Sequelize.UUID,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      assigned_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes
    await queryInterface.addIndex('conversation_label_mappings', ['conversation_id']);
    await queryInterface.addIndex('conversation_label_mappings', ['label_id']);
    await queryInterface.addIndex('conversation_label_mappings', ['conversation_id', 'label_id'], {
      unique: true,
      name: 'unique_conversation_label'
    });

    // Add labels column to wa_conversations for quick access (denormalized)
    await queryInterface.addColumn('wa_conversations', 'labels_cache', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: []
    });

    // Insert default labels
    const { v4: uuidv4 } = require('uuid');
    await queryInterface.bulkInsert('conversation_labels', [
      {
        id: uuidv4(),
        name: 'Hot Lead',
        color: '#ef4444',
        icon: 'local_fire_department',
        description: 'High priority leads ready to convert',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'Follow Up',
        color: '#f59e0b',
        icon: 'schedule',
        description: 'Needs follow up action',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'Qualified',
        color: '#10b981',
        icon: 'verified',
        description: 'Qualified and interested leads',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'Info Request',
        color: '#3b82f6',
        icon: 'info',
        description: 'Requesting information about packages',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'Payment',
        color: '#8b5cf6',
        icon: 'payment',
        description: 'Payment related conversations',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'Complaint',
        color: '#dc2626',
        icon: 'report_problem',
        description: 'Customer complaints or issues',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'VIP',
        color: '#fbbf24',
        icon: 'star',
        description: 'VIP customers or repeat clients',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'Spam',
        color: '#6b7280',
        icon: 'block',
        description: 'Spam or unwanted messages',
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    // Remove column from wa_conversations
    await queryInterface.removeColumn('wa_conversations', 'labels_cache');
    
    // Drop indexes
    await queryInterface.removeIndex('conversation_label_mappings', 'unique_conversation_label');
    await queryInterface.removeIndex('conversation_label_mappings', ['label_id']);
    await queryInterface.removeIndex('conversation_label_mappings', ['conversation_id']);
    
    // Drop tables
    await queryInterface.dropTable('conversation_label_mappings');
    await queryInterface.dropTable('conversation_labels');
  }
};