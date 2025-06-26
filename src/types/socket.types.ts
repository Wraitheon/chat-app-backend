/* eslint-disable @typescript-eslint/no-empty-object-type */
import { MessageWithSender } from './messages.types';

type AuthPayload = {
  id: string;
  email: string;
};

export interface SocketData {
  user: AuthPayload;
}

export interface ServerToClientEvents {
  new_message: (message: MessageWithSender) => void;
  user_typing: (data: { chat_id: string; user: { id: string, display_name: string } }) => void;
  user_stopped_typing: (data: { chat_id: string; user: { id: string } }) => void;
  error: (data: { message: string }) => void;

  online_status_response: (onlineUserIds: string[]) => void;
}

export interface ClientToServerEvents {
  join_room: (chat_id: string) => void;
  send_message: (data: {
    chat_id: string;
    text_content?: string;
    image_data_url?: string;
  }) => void;
  start_typing: (data: { chat_id: string }) => void;
  stop_typing: (data: { chat_id: string }) => void;
  check_online_status: (userIds: string[]) => void;
}

export interface InterServerEvents { }