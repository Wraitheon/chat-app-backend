import { Request, Response, NextFunction } from 'express';
import * as messages_service from '../../services/messages.service';
import { GetMessagesParams } from '../../schemas/message.schema';
import { send_success } from '../../utils/response.handler';

export const get_messages_handler = async (
  req: Request<GetMessagesParams>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user_id = req.user!.id;
    const { chat_id } = req.params;

    const messages = await messages_service.get_chat_messages(chat_id, user_id);

    send_success(res, 200, { messages });

  } catch (error) {
    next(error);
  }
};