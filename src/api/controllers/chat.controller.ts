import { Request, Response, NextFunction } from 'express';
import { ParsedQs } from 'qs';
import * as chat_service from '../../services/chat.service';
import {
  CreateChatInput,
  create_chat_schema,
  update_chat_schema,
  add_member_schema,
  remove_member_schema,
  mark_as_read_schema,
  get_chat_details_schema,
} from '../../schemas/chat.schema';
import { send_success } from '../../utils/response.handler';
import { AppError } from '../../utils/AppError';
import { ChatUpdatePayload } from '../../types/chats.types';

export const create_chat_handler = async (
  req: Request<Record<string, never>, unknown, CreateChatInput, ParsedQs>,
  res: Response,
  next: NextFunction
) => {
  try {

    const { body: chat_data } = await create_chat_schema.parseAsync({
      body: req.body,
    });

    const creator_id = req.user!.id; // From require_auth middleware
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
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { params, body } = await update_chat_schema.parseAsync({
      params: req.params,
      body: req.body,
    });

    // --- THE FIX ---
    // Create an object that matches the `ChatUpdatePayload` type.
    // It starts with the text fields from the validated body.
    const payload_for_service: ChatUpdatePayload = {
      ...body
    };

    // If a file was uploaded, add its path to the payload.
    if (req.file) {
      payload_for_service.group_avatar_url = `/images/profiles/${req.file.filename}`;
    }
    // ----------------

    // Now check if the final payload object is empty.
    if (Object.keys(payload_for_service).length === 0) {
      next(new AppError('No update data provided.', 400, 'BAD_REQUEST'));
    }

    const requester_id = req.user!.id;

    // Call the service with the correctly typed payload object.
    const updated_chat = await chat_service.update_group_chat(
      params.chat_id,
      requester_id,
      payload_for_service, // This now matches what the service expects
    );

    send_success(res, 200, updated_chat);
  } catch (error) {
    next(error);
  }
};

export const add_member_handler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { params, body } = await add_member_schema.parseAsync({
      params: req.params,
      body: req.body,
    });

    const requester_id = req.user!.id;
    await chat_service.add_chat_member(params.chat_id, requester_id, body);

    send_success(res, 200, { message: 'User added to chat successfully.' });
  } catch (error) {
    next(error);
  }
};

export const remove_member_handler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { params } = await remove_member_schema.parseAsync({
      params: req.params,
    });

    const requester_id = req.user!.id;
    await chat_service.remove_chat_member(
      params.chat_id,
      requester_id,
      params.user_id
    );

    send_success(res, 200, { message: 'User removed from chat successfully.' });
  } catch (error) {
    next(error);
  }
};

export const mark_as_read_handler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { params } = await mark_as_read_schema.parseAsync({
      params: req.params,
    });

    const user_id = req.user!.id;
    await chat_service.mark_chat_as_read(params.chat_id, user_id);

    send_success(res, 200, { message: 'Chat marked as read.' });
  } catch (error) {
    next(error);
  }
};

export const get_chat_details_handler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { params } = await get_chat_details_schema.parseAsync({
      params: req.params,
    });

    const user_id = req.user!.id;
    const chat_details = await chat_service.get_chat_details(params.chat_id, user_id);

    send_success(res, 200, chat_details);
  } catch (error) {
    next(error);
  }
};