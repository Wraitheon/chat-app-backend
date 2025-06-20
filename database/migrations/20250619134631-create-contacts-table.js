'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'contacts',
        {
          // Composite primary key is defined below
          user_one_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: 'users',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE', // If a user is deleted, their contact entries are removed
          },
          user_two_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: 'users',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE', // If a user is deleted, their contact entries are removed
          },
          status: {
            type: Sequelize.ENUM('pending', 'accepted', 'blocked'),
            allowNull: false,
          },
          action_user_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: 'users',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE', // If the action-taker is deleted, the relationship is removed
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

      // Add the composite primary key to ensure a user pair is unique.
      await queryInterface.addConstraint('contacts', {
        fields: ['user_one_id', 'user_two_id'],
        type: 'primary key',
        transaction,
      });

      // CRITICAL: Add a CHECK constraint to ensure canonical ordering of IDs.
      // This prevents duplicate entries like (userA, userB) and (userB, userA).
      // Your application logic MUST always store the user with the smaller ID in user_one_id.
      await queryInterface.sequelize.query(
        `ALTER TABLE "contacts" ADD CONSTRAINT "user_one_id_before_user_two_id" CHECK ("user_one_id" < "user_two_id")`,
        { transaction }
      );
    });
  },

  async down(queryInterface) {
    // The primary key and check constraints will be dropped automatically with the table.
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('contacts', { transaction });
    });
  },
};