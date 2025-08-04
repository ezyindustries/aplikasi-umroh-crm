'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add media_files column to custom_templates table
    await queryInterface.addColumn('custom_templates', 'media_files', {
      type: Sequelize.JSON,
      defaultValue: [],
      allowNull: true,
      comment: 'Array of local file paths for media attachments'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove media_files column
    await queryInterface.removeColumn('custom_templates', 'media_files');
  }
};