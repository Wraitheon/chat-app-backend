import { Request, Response, NextFunction } from 'express';
import { get_messages_schema } from '../../schemas/message.schema';
import * as messages_service from '../../services/messages.service';
import { send_success } from '../../utils/response.handler';

export const get_messages_handler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { params } = await get_messages_schema.parseAsync({
      params: req.params,
    });

    const user_id = req.user!.id;
    const messages = await messages_service.get_chat_messages(params.chat_id, user_id);

    send_success(res, 200, messages);
  } catch (error) {
    next(error);
  }
};