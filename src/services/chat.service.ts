import { QueryTypes } from 'sequelize';
import sequelize from '../lib/sequelize';
import {
  CreateChatInput,
  AddMemberInput,
} from '../schemas/chat.schema';
import {
  ChatListItem,
  Chat,
  ChatWithMembers,
  ChatMemberInfo,
  ChatUpdatePayload
} from '../types/chats.types';
import { AppError } from '../utils/AppError';

export const get_member_role = async (user_id: string, chat_id: string): Promise<'admin' | 'member' | null> => {
  const query = `SELECT role FROM "chat_members" WHERE user_id = :user_id AND chat_id = :chat_id;`;
  const [result] = await sequelize.query<{ role: 'admin' | 'member' }>(query, {
    replacements: { user_id, chat_id },
    type: QueryTypes.SELECT
  });
  return result ? result.role : null;
};

export const create_chat = async (creator_id: string, input: CreateChatInput): Promise<Chat> => {
  const { members, group_name } = input;
  const all_member_ids = Array.from(new Set([creator_id, ...members]));

  // --- Logic for Direct Messages (DM) ---
  // A DM is defined by having exactly 2 members and no group name.
  if (all_member_ids.length === 2 && !group_name) {
    const [user1_id, user2_id] = all_member_ids;

    const find_existing_dm_query = `
      SELECT t1.chat_id FROM chat_members AS t1
      INNER JOIN chat_members AS t2 ON t1.chat_id = t2.chat_id
      INNER JOIN chats AS c ON t1.chat_id = c.id
      WHERE t1.user_id = :user1_id AND t2.user_id = :user2_id AND c.type = 'direct';
    `;

    const [existing_chat] = await sequelize.query<{ chat_id: string }>(find_existing_dm_query, {
      replacements: { user1_id, user2_id },
      type: QueryTypes.SELECT,
    });

    if (existing_chat) {
      // If a DM already exists, fetch its details and return it to avoid duplicates.
      const [chat_details] = await sequelize.query<Chat>(`SELECT * FROM chats WHERE id = :chat_id`, {
        replacements: { chat_id: existing_chat.chat_id },
        type: QueryTypes.SELECT
      });
      return chat_details;
    }
  }

  // --- Logic for Group Chat or New DM Creation ---
  // Use a transaction to ensure all or nothing is committed to the database.
  return sequelize.transaction(async (t) => {
    const create_chat_query = `
      INSERT INTO "chats" (type, group_name, creator_id, updated_at)
      VALUES (:type, :group_name, :creator_id, NOW())
      RETURNING *;
    `;
    const [new_chat] = await sequelize.query<Chat>(create_chat_query, {
      replacements: {
        type: group_name ? 'group' : 'direct',
        group_name: group_name || null,
        creator_id: group_name ? creator_id : null,
      },
      type: QueryTypes.SELECT,
      transaction: t,
    });

    if (!new_chat) {
      throw new AppError('Failed to create chat due to a server error.', 500, 'CHAT_CREATION_FAILED');
    }

    // 2. Prepare the data for adding all members to the 'chat_members' table.
    const member_values = all_member_ids.map(user_id => ({
      chat_id: new_chat.id,
      user_id,
      // In a group chat, the creator is automatically assigned the 'admin' role.
      role: group_name && user_id === creator_id ? 'admin' : 'member',
    }));

    // 3. Use bulkInsert for efficiently adding multiple members.
    await sequelize.getQueryInterface().bulkInsert('chat_members', member_values, { transaction: t });

    return new_chat;
  });
}

export const get_user_chats = async (user_id: string): Promise<ChatListItem[]> => {
  // The query:
  // All chats for the user
  // Last message content and sender info
  // For direct chats: other participant's details
  // Unread message count per chat
  // Ordered by most recent activity first
  const query = `
    WITH LastMessages AS (
    SELECT
      chat_id,
      text_content,
      sender_id,
      created_at,
      ROW_NUMBER() OVER(PARTITION BY chat_id ORDER BY created_at DESC) as rn
    FROM messages
  )
  SELECT
    c.id,
    c.type,
    c.group_name,
    c.group_avatar_url,
    lm.text_content AS last_message_content,
    sender.username AS last_message_sender,
    lm.created_at AS last_message_at,
    other_member.id AS other_member_id,
    other_member.username AS other_member_username,
    other_member.display_name AS other_member_display_name,
    other_member.display_picture_url AS other_member_avatar,
    
    (
      SELECT COUNT(*)
      FROM messages m
      WHERE m.chat_id = c.id 
      AND (
        cm.last_read_message_id IS NULL 
        OR m.created_at > (
          SELECT created_at 
          FROM messages 
          WHERE id = cm.last_read_message_id
        )
      )
    ) AS unread_count

  FROM chats c
  INNER JOIN chat_members cm ON c.id = cm.chat_id
  LEFT JOIN LastMessages lm ON c.id = lm.chat_id AND lm.rn = 1
  LEFT JOIN users sender ON lm.sender_id = sender.id
  LEFT JOIN chat_members other_cm ON c.id = other_cm.chat_id 
    AND other_cm.user_id != :user_id 
    AND c.type = 'direct'
  LEFT JOIN users other_member ON other_cm.user_id = other_member.id
  WHERE cm.user_id = :user_id
  ORDER BY lm.created_at DESC NULLS LAST;
  `;
  return sequelize.query<ChatListItem>(query, {
    replacements: { user_id },
    type: QueryTypes.SELECT,
  });
};

export const update_group_chat = async (
  chat_id: string,
  requester_id: string,
  update_payload: ChatUpdatePayload): Promise<Chat> => {
  // --- Authorization Check ---
  const requester_role = await get_member_role(requester_id, chat_id);
  if (requester_role !== 'admin') {
    throw new AppError('Forbidden: You do not have admin rights to modify this chat.', 403, 'FORBIDDEN');
  }

  const fields_to_update: string[] = [];
  const replacements: Partial<Record<keyof ChatUpdatePayload | 'chat_id', string | null>> = { chat_id };

  if (update_payload.group_name) {
    fields_to_update.push('group_name = :group_name');
    replacements.group_name = update_payload.group_name;
  }
  if (update_payload.group_avatar_url) {
    fields_to_update.push('group_avatar_url = :group_avatar_url');
    replacements.group_avatar_url = update_payload.group_avatar_url;
  }

  if (fields_to_update.length === 0) {
    const [current_chat] = await sequelize.query<Chat>('SELECT * FROM chats WHERE id = :chat_id', { replacements: { chat_id }, type: QueryTypes.SELECT });
    if (!current_chat) throw new AppError('Chat not found with the provided ID.', 404, 'CHAT_NOT_FOUND');
    return current_chat;
  }

  const query = `
    UPDATE "chats" SET ${fields_to_update.join(', ')}, updated_at = NOW()
    WHERE id = :chat_id RETURNING *;
  `;
  const [updated_chat] = await sequelize.query<Chat>(query, { replacements, type: QueryTypes.SELECT });

  if (!updated_chat) {
    throw new AppError('Chat not found with the provided ID.', 404, 'CHAT_NOT_FOUND');
  }

  return updated_chat;
};

export const add_chat_member = async (chat_id: string, requester_id: string, input: AddMemberInput): Promise<void> => {
  // --- Authorization Check ---
  const requester_role = await get_member_role(requester_id, chat_id);
  if (requester_role !== 'admin') {
    throw new AppError('Forbidden: You do not have admin rights to add members to this chat.', 403, 'FORBIDDEN');
  }

  const { user_id } = input;
  const query = `
    INSERT INTO "chat_members" (chat_id, user_id, role)
    VALUES (:chat_id, :user_id, 'member')
    ON CONFLICT (chat_id, user_id) DO NOTHING;
  `;
  await sequelize.query(query, { replacements: { chat_id, user_id }, type: QueryTypes.INSERT });
};

export const remove_chat_member = async (chat_id: string, requester_id: string, member_to_remove_id: string): Promise<void> => {
  // --- Authorization Check ---
  const is_self_removal = requester_id === member_to_remove_id;

  // Avoid a DB call if it's a self-removal, otherwise check role
  if (!is_self_removal) {
    const requester_role = await get_member_role(requester_id, chat_id);
    if (requester_role !== 'admin') {
      throw new AppError('Forbidden: You can only remove yourself or be removed by an admin.', 403, 'FORBIDDEN');
    }
  }

  const query = `DELETE FROM "chat_members" WHERE chat_id = :chat_id AND user_id = :user_id;`;
  await sequelize.query(query, { replacements: { chat_id, user_id: member_to_remove_id }, type: QueryTypes.DELETE });
};

export const mark_chat_as_read = async (chat_id: string, user_id: string): Promise<void> => {
  const query = `
    UPDATE "chat_members"
    SET last_read_message_id = (
      SELECT id 
      FROM messages 
      WHERE chat_id = :chat_id 
      ORDER BY created_at DESC 
      LIMIT 1
    )
    WHERE chat_id = :chat_id AND user_id = :user_id;
  `;
  await sequelize.query(query, { replacements: { chat_id, user_id }, type: QueryTypes.UPDATE });
};

export const get_chat_details = async (
  chat_id: string,
  user_id: string
): Promise<ChatWithMembers> => {
  const role = await get_member_role(user_id, chat_id);
  if (!role) {
    throw new AppError('Chat not found or you do not have permission to view it.', 404, 'CHAT_NOT_FOUND_OR_NO_ACCESS');
  }

  const get_chat_query = 'SELECT * FROM "chats" WHERE id = :chat_id;';
  const [chat] = await sequelize.query<Chat>(get_chat_query, {
    replacements: { chat_id },
    type: QueryTypes.SELECT,
  });

  if (!chat) { throw new AppError('Chat not found.', 404, 'CHAT_NOT_FOUND'); }

  const get_members_query = `
    SELECT u.id, u.display_name, u.display_picture_url
    FROM users AS u
    INNER JOIN chat_members AS cm ON u.id = cm.user_id
    WHERE cm.chat_id = :chat_id;
  `;
  const members = await sequelize.query<ChatMemberInfo>(get_members_query, {
    replacements: { chat_id },
    type: QueryTypes.SELECT,
  });

  return { ...chat, members };
};

export const is_user_member_of_chat = async (chat_id: string, user_id: string): Promise<boolean> => {
  const query = `
    SELECT 1 
    FROM "chat_members" 
    WHERE chat_id = :chat_id AND user_id = :user_id 
    LIMIT 1;
  `;

  const [result] = await sequelize.query(query, {
    replacements: { chat_id, user_id },
    type: QueryTypes.SELECT,
  });

  // If a row is found, the result will be an object like [{ '?column?': 1 }].
  // The !! operator converts this truthy value to `true`, and a falsy `undefined` to `false`.
  return !!result;
};