'use strict';

import { DataTypes } from 'sequelize';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'users',
        {
          id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false,
          },
          username: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
          },
          email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
          },
          password_hash: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          display_picture_url: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          display_name: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          status_message: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          last_seen_at: {
            type: DataTypes.DATE,
            defaultValue: Sequelize.fn('now'),
            allowNull: false,
          },
          created_at: {
            allowNull: false,
            type: DataTypes.DATE,
            defaultValue: Sequelize.fn('now'),
          },
          updated_at: {
            allowNull: false,
            type: DataTypes.DATE,
            defaultValue: Sequelize.fn('now'),
          },
        },
        { transaction }
      );
    });
  },

  async down(queryInterface) {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('users', { transaction });
    });
  }
}
