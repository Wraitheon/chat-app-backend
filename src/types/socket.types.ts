/* eslint-disable @typescript-eslint/no-empty-object-type */
import { MessageWithSender } from './messages.types'; // Assuming this is defined

// The payload of your JWT, which we'll attach to each socket
type AuthPayload = {
  id: string;
  email: string;
};

// Interface for the data you'll attach to each socket instance
export interface SocketData {
  user: AuthPayload;
}

// Events the server sends to the client
export interface ServerToClientEvents {
  new_message: (message: MessageWithSender) => void;
  user_typing: (data: { chat_id: string; user: { id: string, display_name: string } }) => void;
  user_stopped_typing: (data: { chat_id: string; user: { id: string } }) => void;
  error: (data: { message: string }) => void;
}

// Events the client sends to the server
export interface ClientToServerEvents {
  join_room: (chat_id: string) => void;
  send_message: (data: { chat_id: string; text_content: string }) => void;
  start_typing: (data: { chat_id: string }) => void;
  stop_typing: (data: { chat_id: string }) => void;
}

// For server-to-server communication (not needed for this setup)
export interface InterServerEvents { }