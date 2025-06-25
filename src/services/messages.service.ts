import { QueryTypes } from 'sequelize';
import sequelize from '../lib/sequelize';
import { MessageWithSender } from '../types/messages.types';
import { AppError } from '../utils/AppError';

export const get_chat_messages = async (chat_id: string, current_user_id: string): Promise<MessageWithSender[]> => {
  const check_access_query = `
    SELECT 1
    FROM chat_members
    WHERE chat_id = :chat_id AND user_id = :current_user_id
    LIMIT 1;
  `;

  const [access_result] = await sequelize.query(check_access_query, {
    replacements: { chat_id, current_user_id },
    type: QueryTypes.SELECT,
  })

  if (!access_result) {
    throw new AppError(
      'Chat not found or you do not have permission to view it.',
      404,
      'CHAT_NOT_FOUND_OR_NO_ACCESS'
    );
  }

  const get_messages_query = `
    SELECT
      m.id,
      m.chat_id,
      m.sender_id,
      m.text_content,
      m.created_at,
      u.username AS sender_username,
      u.display_name AS sender_display_name,
      u.display_picture_url AS sender_display_picture_url
    FROM messages AS m
    INNER JOIN users AS u ON m.sender_id = u.id
    WHERE m.chat_id = :chat_id
    ORDER BY m.created_at ASC;
  `;

  const messages = await sequelize.query<MessageWithSender>(get_messages_query, {
    replacements: { chat_id },
    type: QueryTypes.SELECT,
  });

  return messages;
};

type SenderDetails = {
  sender_username: string;
  sender_display_name: string;
  sender_display_picture_url: string | null;
}

export const create_message = async (
  sender_id: string,
  chat_id: string,
  text_content: string
): Promise<MessageWithSender> => {
  // Use a transaction to ensure all or nothing is committed to the database.
  const t = await sequelize.transaction();
  try {
    // --- THE FIX IS HERE ---
    // Removed 'updated_at' from the column list and the VALUES list.
    const insert_query = `
      INSERT INTO messages (sender_id, chat_id, text_content, created_at)
      VALUES (:sender_id, :chat_id, :text_content, NOW())
      RETURNING id, created_at;
    `;

    const new_message_rows = await sequelize.query<{ id: string, created_at: Date }>(insert_query, {
      replacements: { sender_id, chat_id, text_content },
      type: QueryTypes.SELECT,
      transaction: t,
    });

    if (!new_message_rows || new_message_rows.length === 0) {
      throw new Error("Message creation failed, did not return new message ID.");
    }
    const { id: new_message_id, created_at: new_message_created_at } = new_message_rows[0];

    // The rest of the function remains the same
    const select_query = `
      SELECT
        u.username AS sender_username,
        u.display_name AS sender_display_name,
        u.display_picture_url AS sender_display_picture_url
      FROM users AS u
      WHERE u.id = :sender_id;
    `;

    const [sender_details] = await sequelize.query<SenderDetails>(select_query, {
      replacements: { sender_id },
      type: QueryTypes.SELECT,
      transaction: t,
    });

    if (!sender_details) {
      throw new Error("Could not retrieve sender details after message creation.");
    }

    await t.commit();

    return {
      id: new_message_id,
      chat_id,
      sender_id,
      text_content,
      created_at: new_message_created_at,
      ...sender_details,
    };

  } catch (error) {
    await t.rollback();
    console.error("Error creating message:", error);
    throw new AppError('Failed to create message', 500, 'MESSAGE_CREATION_FAILED');
  }
};