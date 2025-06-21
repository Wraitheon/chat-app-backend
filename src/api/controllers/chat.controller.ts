import { Request, Response, NextFunction } from 'express';
import { ParsedQs } from 'qs';
import * as chat_service from '../../services/chat.service';
import {
  CreateChatInput,
  UpdateChatInput,
  AddMemberInput,
} from '../../schemas/chat.schema';
import { send_success } from '../../utils/response.handler';
import { AppError } from '../../utils/AppError';

export const create_chat_handler = async (
  req: Request<Record<string, never>, unknown, CreateChatInput, ParsedQs>,
  res: Response,
  next: NextFunction
) => {
  try {
    const creator_id = req.user!.id; // From require_auth middleware
    const chat_data = req.body;

    const new_chat = await chat_service.create_chat(creator_id, chat_data);

    send_success(res, 201, new_chat);
  } catch (error) {
    next(error);
  }
};

export const get_chats_handler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user_id = req.user!.id;
    const chats = await chat_service.get_user_chats(user_id);

    send_success(res, 200, chats);
  } catch (error) {
    next(error);
  }
};

export const update_chat_handler = async (
  req: Request<{ chat_id: string }, undefined, UpdateChatInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const requester_id = req.user!.id;
    const { chat_id } = req.params;
    const update_data = req.body;

    // Check if there is anything to update to avoid an unnecessary service call
    if (Object.keys(update_data).length === 0) {
      next(new AppError('No update data provided.', 400, 'BAD_REQUEST'));
      return;
    }

    const updated_chat = await chat_service.update_group_chat(chat_id, requester_id, update_data);

    send_success(res, 200, updated_chat);
  } catch (error) {
    next(error);
  }
};

export const add_member_handler = async (
  req: Request<{ chat_id: string }, undefined, AddMemberInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const requester_id = req.user!.id;
    const { chat_id } = req.params;

    await chat_service.add_chat_member(chat_id, requester_id, req.body);

    send_success(res, 200, { message: 'User added to chat successfully.' });
  } catch (error) {
    next(error);
  }
};

export const remove_member_handler = async (
  req: Request<{ chat_id: string; user_id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const requester_id = req.user!.id;
    const { chat_id, user_id: member_to_remove_id } = req.params;

    await chat_service.remove_chat_member(chat_id, requester_id, member_to_remove_id);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const mark_as_read_handler = async (
  req: Request<{ chat_id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const user_id = req.user!.id;
    const { chat_id } = req.params;

    await chat_service.mark_chat_as_read(chat_id, user_id);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};