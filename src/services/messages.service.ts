import { QueryTypes } from 'sequelize';
import sequelize from '../lib/sequelize';
import { MessageWithSender } from '../types/messages.types';

export const get_chat_messages = async (chat_id: string): Promise<MessageWithSender[]> => {
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