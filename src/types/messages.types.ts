export type MessageWithSender = {
  id: string;
  chat_id: string;
  sender_id: string;
  text_content: string;
  created_at: Date;
  sender_username: string;
  sender_display_name: string;
  sender_display_picture_url: string | null;
};