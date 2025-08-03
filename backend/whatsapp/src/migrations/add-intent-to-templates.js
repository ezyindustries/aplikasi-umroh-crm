'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Add intent column
      await queryInterface.addColumn('custom_templates', 'intent', {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Associated intent for AI-based matching'
      });
      
      // Add min_confidence column
      await queryInterface.addColumn('custom_templates', 'min_confidence', {
        type: Sequelize.FLOAT,
        defaultValue: 0.7,
        allowNull: false,
        comment: 'Minimum confidence score for intent matching'
      });
      
      console.log('✅ Added intent and min_confidence columns to custom_templates table');
      
    } catch (error) {
      console.error('Error adding columns:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('custom_templates', 'intent');
      await queryInterface.removeColumn('custom_templates', 'min_confidence');
      
      console.log('✅ Removed intent and min_confidence columns from custom_templates table');
      
    } catch (error) {
      console.error('Error removing columns:', error);
      throw error;
    }
  }
};