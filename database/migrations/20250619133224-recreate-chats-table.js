'use strict';

const { Sequelize } = require('sequelize');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'chats',
        {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.fn('gen_random_uuid'),
            primaryKey: true,
            allowNull: false,
          },
          type: {
            type: Sequelize.ENUM('direct', 'group'),
            allowNull: false,
          },
          group_name: {
            type: Sequelize.STRING(100),
            allowNull: true, // Null for DMs
          },
          group_avatar_url: {
            type: Sequelize.TEXT, // Using TEXT for longer URLs
            allowNull: true, // Null for DMs
          },
          creator_id: {
            type: Sequelize.UUID,
            allowNull: true, // Null for DMs
            references: {
              model: 'users', // This is the table name
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL', // If a user is deleted, we don't want to lose the chat history
          },
          created_at: {
            allowNull: false,
            type: Sequelize.DATE,
            defaultValue: Sequelize.fn('now'),
          },
          updated_at: {
            allowNull: false,
            type: Sequelize.DATE,
            defaultValue: Sequelize.fn('now'),
          },
        },
        { transaction }
      );
    });
  },

  async down(queryInterface) {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('chats', { transaction });
    });
  },
};