import { Request, Response, NextFunction } from 'express';
import { ParsedQs } from 'qs';
import * as chat_service from '../../services/chat.service';
import {
  CreateChatInput,
  UpdateChatInput,
  AddMemberInput,
} from '../../schemas/chat.schema';

export const create_chat_handler = async (
  req: Request<Record<string, never>, unknown, CreateChatInput, ParsedQs>,
  res: Response,
  next: NextFunction
) => {
  try {
    const creator_id = req.user!.id; // From require_auth middleware
    const chat_data = req.body;

    const new_chat = await chat_service.create_chat(creator_id, chat_data);

    res.status(201).json({
      status: 'success',
      data: {
        chat: new_chat,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const get_chats_handler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user_id = req.user!.id;
    const chats = await chat_service.get_user_chats(user_id);

    res.status(200).json({
      status: 'success',
      results: chats.length,
      data: {
        chats,
      },
    });
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
    const user_id = req.user!.id;
    const { chat_id } = req.params;
    const update_data = req.body;

    // --- Authorization Check ---
    const role = await chat_service.get_member_role(user_id, chat_id);
    if (role !== 'admin') {
      res.status(403).json({
        status: 'fail',
        message: 'Forbidden: You do not have admin rights to modify this chat.',
      });
      return;
    }

    const updated_chat = await chat_service.update_group_chat(chat_id, update_data);

    res.status(200).json({
      status: 'success',
      data: {
        chat: updated_chat,
      },
    });
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
    const user_id = req.user!.id;
    const { chat_id } = req.params;

    // --- Authorization Check ---
    const role = await chat_service.get_member_role(user_id, chat_id);
    if (role !== 'admin') {
      res.status(403).json({
        status: 'fail',
        message: 'Forbidden: You do not have admin rights to add members to this chat.',
      });

      return;
    }

    await chat_service.add_chat_member(chat_id, req.body);

    res.status(200).json({
      status: 'success',
      message: 'User added to chat successfully.',
    });
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

    // --- Authorization Check ---
    const requester_role = await chat_service.get_member_role(requester_id, chat_id);

    // Allow removal if:
    // 1. The requester is an admin.
    // 2. The requester is trying to remove themselves (leaving the chat).
    const is_admin = requester_role === 'admin';
    const is_self_removal = requester_id === member_to_remove_id;

    if (!is_admin && !is_self_removal) {
      res.status(403).json({
        status: 'fail',
        message: 'Forbidden: You can only remove yourself or be removed by an admin.',
      });
      return;
    }

    await chat_service.remove_chat_member(chat_id, member_to_remove_id);

    // 204 No Content is the standard response for a successful DELETE with no body.
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

    // Optional: You could verify the user is a member of the chat first, but it's low-risk.
    // The UPDATE query will just affect 0 rows if they aren't a member.
    await chat_service.mark_chat_as_read(chat_id, user_id);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};