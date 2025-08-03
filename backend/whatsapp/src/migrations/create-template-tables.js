'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create automation_templates table
    await queryInterface.createTable('automation_templates', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      template_name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      category: {
        type: Sequelize.ENUM('greeting', 'package', 'faq', 'followup', 'document'),
        allowNull: false
      },
      template_content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      variables: {
        type: Sequelize.JSON,
        defaultValue: {}
      },
      keywords: {
        type: Sequelize.TEXT,
        comment: 'Comma separated keywords for matching'
      },
      priority: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      usage_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      success_rate: {
        type: Sequelize.FLOAT,
        defaultValue: 0
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Create template_variations table
    await queryInterface.createTable('template_variations', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      template_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'automation_templates',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      variation_text: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      usage_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Create template_analytics table
    await queryInterface.createTable('template_analytics', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      template_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'automation_templates',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      usage_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      success_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      avg_response_time: {
        type: Sequelize.INTEGER,
        comment: 'Average response time in milliseconds'
      },
      customer_satisfaction: {
        type: Sequelize.FLOAT,
        comment: 'Rating from 1-5'
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Add template_id to automation_rules table
    await queryInterface.addColumn('automation_rules', 'template_id', {
      type: Sequelize.INTEGER,
      references: {
        model: 'automation_templates',
        key: 'id'
      },
      onDelete: 'SET NULL'
    });

    // Add indexes for performance
    await queryInterface.addIndex('automation_templates', ['category', 'is_active']);
    await queryInterface.addIndex('automation_templates', ['keywords']);
    await queryInterface.addIndex('template_analytics', ['template_id', 'date']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('automation_rules', 'template_id');
    await queryInterface.dropTable('template_analytics');
    await queryInterface.dropTable('template_variations');
    await queryInterface.dropTable('automation_templates');
  }
};