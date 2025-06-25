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
// FIX: Import the missing service function
import { get_user_details } from '../services/users.services';

// Type aliases for our fully-configured server and socket
type IoServer = SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type IoSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type JwtPayload = { id: string; email: string };

/**
 * Main function to set up all Socket.IO logic
 */
export const setup_socket_io = (io: IoServer) => {
  // --- AUTHENTICATION MIDDLEWARE ---
  io.use((socket: IoSocket, next) => {
    const cookie_string = socket.handshake.headers.cookie;
    if (!cookie_string) {
      return next(new Error('Authentication error: Missing cookies.'));
    }

    const token = cookie_string.split(';').find(c => c.trim().startsWith('token='))?.split('=')[1];
    if (!token) {
      return next(new Error('Authentication error: Missing token.'));
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      if (typeof decoded === 'object' && 'id' in decoded && 'email' in decoded) {
        // FIX: Disable the ESLint rule for this specific, intentional line.
        // eslint-disable-next-line no-param-reassign
        socket.data.user = decoded as JwtPayload;
        return next();
      }
      return next(new Error('Authentication error: Malformed token.'));
    } catch (err) {
      // FIX: Log the actual error for debugging and use an underscore to satisfy the linter.
      console.error("Socket Auth Error:", err);
      return next(new Error('Authentication error: Invalid token.'));
    }
  });

  // --- MAIN CONNECTION HANDLER ---
  io.on('connection', (socket: IoSocket) => {
    console.log(`User connected: ${socket.data.user.id} (Socket ID: ${socket.id})`);

    // --- EVENT LISTENERS ---

    socket.on('join_room', async (chat_id) => {
      const is_member = await is_user_member_of_chat(chat_id, socket.data.user.id);
      if (is_member) {
        socket.join(chat_id);
        console.log(`User ${socket.data.user.id} joined room: ${chat_id}`);
      } else {
        socket.emit('error', { message: 'You do not have access to this chat.' });
      }
    });

    socket.on('send_message', async (data) => {
      const { chat_id, text_content } = data;
      const sender_id = socket.data.user.id;

      console.log(`[DEBUG] Checking membership for user ${sender_id} in chat ${chat_id}.`);

      const is_member = await is_user_member_of_chat(chat_id, sender_id);
      console.log(`[DEBUG] Is member? --> ${is_member}`);
      if (!is_member) {
        // FIX: Satisfy the 'consistent-return' rule by explicitly returning.
        return;
      }

      try {
        const new_message = await create_message(sender_id, chat_id, text_content);
        io.to(chat_id).emit('new_message', new_message);
      } catch (error) {
        console.error(error);
        socket.emit('error', { message: 'Failed to send message.' });
      }
    });

    socket.on('start_typing', async (data) => {
      const { chat_id } = data;
      if (await is_user_member_of_chat(chat_id, socket.data.user.id)) {
        // FIX: Call the correct, imported function and handle a null result.
        const user_details = await get_user_details(socket.data.user.id);
        if (user_details) {
          socket.to(chat_id).emit('user_typing', {
            chat_id,
            // Map to the camelCase `display_name` expected by the frontend/types
            user: { id: user_details.id, display_name: user_details.display_name },
          });
        }
      }
    });

    socket.on('stop_typing', async (data) => {
      const { chat_id } = data;
      if (await is_user_member_of_chat(chat_id, socket.data.user.id)) {
        socket.to(chat_id).emit('user_stopped_typing', { chat_id, user: { id: socket.data.user.id } });
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.data.user.id}`);
    });
  });
};