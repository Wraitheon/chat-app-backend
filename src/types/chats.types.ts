export type ChatListItem = {
  id: string;
  type: 'direct' | 'group';
  group_name: string | null;
  group_avatar_url: string | null;
  other_member_id?: string;
  other_member_username?: string;
  other_member_display_name?: string;
  other_member_avatar?: string | null;
  last_message_content: string | null;
  last_message_sender: string | null;
  last_message_at: Date | null;
  unread_count: number;
};

export type Chat = {
  id: string;
  type: 'direct' | 'group';
  group_name: string | null;
  group_avatar_url: string | null;
  creator_id: string | null;
  created_at: Date;
  updated_at: Date;
};

export type ChatMemberInfo = {
  id: string;
  display_name: string;
  display_picture_url: string;
};

export type ChatWithMembers = Chat & {
  members: ChatMemberInfo[];
};

export type ChatUpdatePayload = {
  group_name?: string;
  group_avatar_url?: string;
};