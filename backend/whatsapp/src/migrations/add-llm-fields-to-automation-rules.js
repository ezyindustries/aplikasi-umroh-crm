'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // For SQLite, we need to check if columns exist before adding
    const tableInfo = await queryInterface.describeTable('automation_rules');
    
    // Add new columns if they don't exist
    if (!tableInfo.llm_config) {
      await queryInterface.addColumn('automation_rules', 'llm_config', {
        type: Sequelize.JSON,
        defaultValue: '{}',
        allowNull: true
      });
    }
    
    if (!tableInfo.system_prompt) {
      await queryInterface.addColumn('automation_rules', 'system_prompt', {
        type: Sequelize.TEXT,
        allowNull: true
      });
    }
    
    if (!tableInfo.context_mode) {
      await queryInterface.addColumn('automation_rules', 'context_mode', {
        type: Sequelize.STRING,
        defaultValue: 'conversation',
        allowNull: true
      });
    }
    
    if (!tableInfo.knowledge_base) {
      await queryInterface.addColumn('automation_rules', 'knowledge_base', {
        type: Sequelize.JSON,
        defaultValue: '[]',
        allowNull: true
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove columns
    const tableInfo = await queryInterface.describeTable('automation_rules');
    
    if (tableInfo.llm_config) {
      await queryInterface.removeColumn('automation_rules', 'llm_config');
    }
    if (tableInfo.system_prompt) {
      await queryInterface.removeColumn('automation_rules', 'system_prompt');
    }
    if (tableInfo.context_mode) {
      await queryInterface.removeColumn('automation_rules', 'context_mode');
    }
    if (tableInfo.knowledge_base) {
      await queryInterface.removeColumn('automation_rules', 'knowledge_base');
    }
  }
};