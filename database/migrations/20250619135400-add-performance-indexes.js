'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction(async (transaction) => {
      // --- users table ---
      // For case-insensitive, fast lookups of username and email.
      // We use raw queries because addIndex doesn't support functions like LOWER().
      await queryInterface.sequelize.query(
        'CREATE UNIQUE INDEX "users_lower_username_idx" ON "users" (LOWER("username"))',
        { transaction }
      );
      await queryInterface.sequelize.query(
        'CREATE UNIQUE INDEX "users_lower_email_idx" ON "users" (LOWER("email"))',
        { transaction }
      );

      // --- chat_members table ---
      // To quickly find all chats a user belongs to.
      await queryInterface.addIndex('chat_members', ['user_id'], {
        transaction,
      });

      // --- messages table ---
      // This is the most important index for fetching chat history efficiently.
      // It allows the DB to find messages for a chat and return them in the
      // correct reverse-chronological order without a separate sorting step.
      await queryInterface.sequelize.query(
        'CREATE INDEX "messages_chat_id_created_at_desc_idx" ON "messages" ("chat_id", "created_at" DESC)',
        { transaction }
      );

      // --- contacts table ---
      // To quickly find all of a user's relationships (friends, pending, blocked)
      // by their status. We need two indexes to cover both columns where a user's ID can appear.
      await queryInterface.addIndex('contacts', ['user_one_id', 'status'], {
        transaction,
      });
      await queryInterface.addIndex('contacts', ['user_two_id', 'status'], {
        transaction,
      });
    });
  },

  async down(queryInterface, Sequelize) {
    // We remove the indexes in the reverse order of creation.
    return queryInterface.sequelize.transaction(async (transaction) => {
      // --- contacts table ---
      await queryInterface.removeIndex('contacts', ['user_one_id', 'status'], {
        transaction,
      });
      await queryInterface.removeIndex('contacts', ['user_two_id', 'status'], {
        transaction,
      });

      // --- messages table ---
      await queryInterface.removeIndex(
        'messages',
        'messages_chat_id_created_at_desc_idx',
        { transaction }
      );

      // --- chat_members table ---
      await queryInterface.removeIndex('chat_members', ['user_id'], {
        transaction,
      });

      // --- users table ---
      await queryInterface.removeIndex('users', 'users_lower_username_idx', {
        transaction,
      });
      await queryInterface.removeIndex('users', 'users_lower_email_idx', {
        transaction,
      });
    });
  },
};