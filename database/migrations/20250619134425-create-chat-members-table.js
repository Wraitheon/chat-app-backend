'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'chat_members',
        {
          // This is a composite primary key, defined below with addConstraint
          chat_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: 'chats',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE', // If a chat is deleted, the memberships are removed
          },
          user_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: 'users',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE', // If a user is deleted, their memberships are removed
          },
          role: {
            type: Sequelize.ENUM('admin', 'member'),
            allowNull: false,
          },
          last_read_message_id: {
            type: Sequelize.UUID,
            allowNull: true, // Can be null if no messages have been read
            references: {
              model: 'messages', // IMPORTANT: This table must exist first!
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL', // If a message is deleted, we don't want to break the membership
          },
          is_muted: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
          },
          joined_at: {
            allowNull: false,
            type: Sequelize.DATE,
            defaultValue: Sequelize.fn('now'),
          },
        },
        { transaction }
      );

      // Create the composite primary key
      await queryInterface.addConstraint('chat_members', {
        fields: ['chat_id', 'user_id'],
        type: 'primary key',
        transaction,
      });
    });
  },

  async down(queryInterface) {
    // No need to drop the constraint separately; dropTable handles it
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('chat_members', { transaction });
    });
  },
};