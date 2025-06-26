import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import config from '../config';
import {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from '../types/socket.types';
import { create_message } from '../services/messages.service';
import { is_user_member_of_chat } from '../services/chat.service';
import { get_user_details } from '../services/users.services';
import { add_user, remove_user, is_user_online } from './presence';

type IoServer = SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type IoSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type JwtPayload = { id: string; email: string };

export const setup_socket_io = (io: IoServer) => {
  io.use((socket: IoSocket, next) => {
    const cookie_string = socket.handshake.headers.cookie;
    if (!cookie_string) { return next(new Error('Authentication error: Missing cookies.')); }
    const token = cookie_string.split(';').find(c => c.trim().startsWith('token='))?.split('=')[1];
    if (!token) { return next(new Error('Authentication error: Missing token.')); }
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      const socket_data = socket.data;
      if (typeof decoded === 'object' && 'id' in decoded && 'email' in decoded) {
        socket_data.user = decoded as JwtPayload;
        return next();
      }
      return next(new Error('Authentication error: Malformed token.'));
    } catch (err) {
      console.error("Socket Auth Error:", err);
      return next(new Error('Authentication error: Invalid token.'));
    }
  });

  io.on('connection', (socket: IoSocket) => {
    const user_id = socket.data.user.id;
    console.log(`[Socket.IO] User connected: ${user_id} (Socket ID: ${socket.id})`);

    add_user(user_id, socket.id);

    socket.on('join_room', async (chat_id) => {
      const is_member = await is_user_member_of_chat(chat_id, user_id);
      if (is_member) {
        socket.join(chat_id);
        console.log(`User ${user_id} joined room: ${chat_id}`);
      } else {
        socket.emit('error', { message: 'You do not have access to this chat.' });
      }
    });

    socket.on('send_message', async (data) => {
      console.log('[SERVER] Received "send_message" with data:', data);
      const { chat_id, text_content, image_data_url } = data;
      const is_member = await is_user_member_of_chat(chat_id, user_id);
      if (!is_member) return;
      try {
        const new_message = await create_message(user_id, chat_id, text_content, image_data_url);
        io.to(chat_id).emit('new_message', new_message);
      } catch (error) {
        console.error(error);
        socket.emit('error', { message: 'Failed to send message.' });
      }
    });

    socket.on('start_typing', async (data) => {
      const { chat_id } = data;
      const is_member = await is_user_member_of_chat(chat_id, user_id);
      if (is_member) {
        const user_details = await get_user_details(user_id);
        if (user_details) {
          socket.to(chat_id).emit('user_typing', {
            chat_id,
            user: { id: user_details.id, display_name: user_details.display_name },
          });
        }
      }
    });

    socket.on('stop_typing', async (data) => {
      const { chat_id } = data;
      const is_member = await is_user_member_of_chat(chat_id, user_id);
      if (is_member) {
        socket.to(chat_id).emit('user_stopped_typing', { chat_id, user: { id: user_id } });
      }
    });

    socket.on('check_online_status', (user_ids: string[]) => {
      console.log(`[Presence] User ${user_id} is checking status for:`, user_ids);
      const online_user_ids = user_ids.filter(id => is_user_online(id));
      console.log(`[Presence] Responding with online users:`, online_user_ids);
      socket.emit('online_status_response', online_user_ids);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] User disconnected: ${user_id} (Socket ID: ${socket.id})`);
      remove_user(user_id, socket.id);
    });
  });
};