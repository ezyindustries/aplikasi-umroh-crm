'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add queue-related fields to wa_messages
    await queryInterface.addColumn('wa_messages', 'status', {
      type: Sequelize.ENUM('queued', 'sending', 'sent', 'failed'),
      defaultValue: 'sent',
      allowNull: true
    });

    await queryInterface.addColumn('wa_messages', 'queue_id', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('wa_messages', 'sent_at', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('wa_messages', 'error_message', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    // Add message log table for tracking all attempts
    await queryInterface.createTable('message_logs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      phone_number: {
        type: Sequelize.STRING,
        allowNull: false
      },
      message_content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('sent', 'failed', 'blocked'),
        allowNull: false
      },
      error_message: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      queue_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      attempts: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      sent_at: {
        type: Sequelize.DATE,
        allowNull: true
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

    // Add opt-out field to leads
    await queryInterface.addColumn('leads', 'opted_out', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false
    });

    await queryInterface.addColumn('leads', 'opted_out_at', {
      type: Sequelize.DATE,
      allowNull: true
    });

    // Add tier field to users for rate limiting
    await queryInterface.addColumn('users', 'tier', {
      type: Sequelize.ENUM('basic', 'premium', 'enterprise'),
      defaultValue: 'basic',
      allowNull: false
    });

    // Create consent records table
    await queryInterface.createTable('consent_records', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      phone_number: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      lead_id: {
        type: Sequelize.UUID,
        references: {
          model: 'leads',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        allowNull: true
      },
      opt_in_date: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      opt_in_method: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      opt_out_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('active', 'opted_out', 'blocked'),
        defaultValue: 'active'
      },
      consent_text: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      ip_address: {
        type: Sequelize.STRING(45),
        allowNull: true
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

    // Add indexes
    await queryInterface.addIndex('wa_messages', ['queue_id']);
    await queryInterface.addIndex('wa_messages', ['status']);
    await queryInterface.addIndex('message_logs', ['phone_number']);
    await queryInterface.addIndex('message_logs', ['queue_id']);
    await queryInterface.addIndex('consent_records', ['phone_number']);
    await queryInterface.addIndex('consent_records', ['status']);
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes
    await queryInterface.removeIndex('consent_records', ['status']);
    await queryInterface.removeIndex('consent_records', ['phone_number']);
    await queryInterface.removeIndex('message_logs', ['queue_id']);
    await queryInterface.removeIndex('message_logs', ['phone_number']);
    await queryInterface.removeIndex('wa_messages', ['status']);
    await queryInterface.removeIndex('wa_messages', ['queue_id']);

    // Drop tables
    await queryInterface.dropTable('consent_records');
    await queryInterface.dropTable('message_logs');

    // Remove columns
    await queryInterface.removeColumn('users', 'tier');
    await queryInterface.removeColumn('leads', 'opted_out_at');
    await queryInterface.removeColumn('leads', 'opted_out');
    await queryInterface.removeColumn('wa_messages', 'error_message');
    await queryInterface.removeColumn('wa_messages', 'sent_at');
    await queryInterface.removeColumn('wa_messages', 'queue_id');
    await queryInterface.removeColumn('wa_messages', 'status');
  }
};