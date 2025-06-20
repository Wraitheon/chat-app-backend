import { Request, Response, NextFunction } from 'express';
import * as messages_service from '../../services/messages.service';
import { get_member_role } from '../../services/chat.service';
import { GetMessagesParams } from '../../schemas/message.schema';

/**
 * Handles the request to fetch messages for a chat.
 */
export const get_messages_handler = async (
  // The request is only typed with Params now
  req: Request<GetMessagesParams>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user_id = req.user!.id;
    const { chat_id } = req.params;

    const role = await get_member_role(user_id, chat_id);
    if (!role) {
      res.status(403).json({
        status: 'fail',
        message: "Forbidden: You are not a member of this chat and cannot view its messages.",
      });

      return;
    }

    const messages = await messages_service.get_chat_messages(chat_id);

    res.status(200).json({
      status: 'success',
      data: {
        messages,
      },

    });
  } catch (error) {
    next(error);
  }
};