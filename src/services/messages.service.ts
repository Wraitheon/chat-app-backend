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