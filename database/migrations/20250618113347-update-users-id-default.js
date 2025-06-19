'use strict';

const { DataTypes } = require('sequelize');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.changeColumn(
        'users',
        'id',
        {
          type: DataTypes.UUID,
          defaultValue: Sequelize.fn('gen_random_uuid'),
          primaryKey: true,
          allowNull: false,
        },
        { transaction }
      );
    })
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.changeColumn(
        'users',
        'id',
        {
          // Revert to the original state
          type: DataTypes.UUID,
          defaultValue: null,
          primaryKey: true,
          allowNull: false,
        },
        { transaction }
      );
    });
  }
};
