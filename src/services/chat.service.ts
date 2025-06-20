import { QueryTypes } from 'sequelize';
import sequelize from '../lib/sequelize';
import {
  CreateChatInput,
  UpdateChatInput,
  AddMemberInput,
} from '../schemas/chat.schema';

type ChatListItem = {
  id: string;
  type: 'direct' | 'group';
  group_name: string | null;
  group_avatar_url: string | null;
  // Details about the other member in a direct chat
  other_member_id?: string;
  other_member_username?: string;
  other_member_display_name?: string;
  other_member_avatar?: string | null;
  // Last message details
  last_message_content: string | null;
  last_message_sender: string | null;
  last_message_at: Date | null;
  // Unread count for the current user
  unread_count: number;
};

type Chat = {
  id: string;
  type: 'direct' | 'group';
  group_name: string | null;
  group_avatar_url: string | null;
  creator_id: string | null;
  created_at: Date;
  updated_at: Date;
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
      throw new Error('Failed to create chat');
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
  // Fetches chats for a given user (:user_id)
  // Gets the last message for each chat
  // Computes how many messages are unread
  // If it’s a direct message (DM), also gets details of the other participant
  // Orders chats by latest activity
  const query = `
    WITH LastMessages AS (
      -- This CTE finds the latest message for each chat.
      SELECT
        chat_id,
        content,
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
      lm.content AS last_message_content,
      us.username AS last_message_sender,
      lm.created_at AS last_message_at,
      -- For DMs, we need to find the details of the "other" person in the chat.
      other_member.id AS other_member_id,
      other_member.username AS other_member_username,
      other_member.display_name AS other_member_display_name,
      other_member.display_picture_url AS other_member_avatar,
      -- This subquery calculates the number of unread messages for the current user.
      (SELECT COUNT(*) FROM messages m WHERE m.chat_id = c.id AND m.created_at > COALESCE(cm.last_read_at, '1970-01-01')) AS unread_count
    FROM chats c
    -- Join to get the current user's membership details (like last_read_at)
    INNER JOIN chat_members cm ON c.id = cm.chat_id
    -- Join to get the last message details from our CTE
    LEFT JOIN LastMessages lm ON c.id = lm.chat_id AND lm.rn = 1
    -- Join to get the sender's username for the last message
    LEFT JOIN users us ON lm.sender_id = us.id
    -- This double join is to find the other member in a DM
    LEFT JOIN chat_members other_cm ON c.id = other_cm.chat_id AND other_cm.user_id != :user_id AND c.type = 'direct'
    LEFT JOIN users other_member ON other_cm.user_id = other_member.id
    WHERE cm.user_id = :user_id
    ORDER BY lm.created_at DESC NULLS LAST;
  `;
  return sequelize.query<ChatListItem>(query, {
    replacements: { user_id },
    type: QueryTypes.SELECT,
  });
};

export const update_group_chat = async (chat_id: string, input: UpdateChatInput): Promise<Chat> => {
  // This logic is identical to update_user_profile, just for a different table
  const fields_to_update: string[] = [];

  const replacements: Partial<Record<keyof UpdateChatInput | 'chat_id', string | null>> = {
    chat_id,
  };
  if (input.group_name) {
    fields_to_update.push('group_name = :group_name');
    replacements.group_name = input.group_name;
  }
  if (input.group_avatar_url) {
    fields_to_update.push('group_avatar_url = :group_avatar_url');
    replacements.group_avatar_url = input.group_avatar_url;
  }

  const query = `
        UPDATE "chats" SET ${fields_to_update.join(', ')}, updated_at = NOW()
        WHERE id = :chat_id RETURNING *;
    `;
  const [updated_chat] = await sequelize.query<Chat>(query, { replacements, type: QueryTypes.SELECT });

  return updated_chat;
};

export const add_chat_member = async (chat_id: string, input: AddMemberInput): Promise<void> => {
  const { user_id } = input;
  const query = `
        INSERT INTO "chat_members" (chat_id, user_id, role)
        VALUES (:chat_id, :user_id, 'member')
        ON CONFLICT (chat_id, user_id) DO NOTHING; -- Prevents errors if the user is already a member
    `;
  await sequelize.query(query, { replacements: { chat_id, user_id }, type: QueryTypes.INSERT });
};

export const remove_chat_member = async (chat_id: string, user_id: string): Promise<void> => {
  const query = `DELETE FROM "chat_members" WHERE chat_id = :chat_id AND user_id = :user_id;`;
  await sequelize.query(query, { replacements: { chat_id, user_id }, type: QueryTypes.DELETE });
};

export const mark_chat_as_read = async (chat_id: string, user_id: string): Promise<void> => {
  const query = `
      UPDATE "chat_members"
      SET last_read_at = NOW()
      WHERE chat_id = :chat_id AND user_id = :user_id;
    `;
  await sequelize.query(query, { replacements: { chat_id, user_id }, type: QueryTypes.UPDATE });
};

export const get_member_role = async (user_id: string, chat_id: string): Promise<'admin' | 'member' | null> => {
  const query = `SELECT role FROM "chat_members" WHERE user_id = :user_id AND chat_id = :chat_id;`;
  const [result] = await sequelize.query<{ role: 'admin' | 'member' }>(query, {
    replacements: { user_id, chat_id },
    type: QueryTypes.SELECT
  });
  return result ? result.role : null;
};