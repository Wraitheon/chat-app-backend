'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'messages',
        {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.fn('gen_random_uuid'),
            primaryKey: true,
            allowNull: false,
          },
          chat_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: 'chats',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE', // If the chat is deleted, all its messages should be deleted too.
          },
          sender_id: {
            type: Sequelize.UUID,
            allowNull: false, // In a real-world scenario, you might allow NULL if the user is deleted. See note below.
            references: {
              model: 'users',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL', // If the sender is deleted, keep the message but nullify the sender.
          },
          text_content: {
            type: Sequelize.TEXT,
            allowNull: true, // Nullable to allow for media-only messages.
          },
          created_at: {
            allowNull: false,
            type: Sequelize.DATE,
            defaultValue: Sequelize.fn('now'),
          },
        },
        { transaction }
      );

      // Add indexes for faster queries, which is critical for a high-traffic messages table.
      await queryInterface.addIndex('messages', ['chat_id'], { transaction });
      await queryInterface.addIndex('messages', ['sender_id'], { transaction });
    });
  },

  async down(queryInterface) {
    // Indexes are dropped automatically when the table is dropped.
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('messages', { transaction });
    });
  },
};