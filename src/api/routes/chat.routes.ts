import express from 'express';
import { require_auth } from '../../middleware/auth.middleware';
import validate from '../../middleware/validate.request';
import {
  create_chat_schema,
  update_chat_schema,
  add_member_schema,
  remove_member_schema,
  mark_as_read_schema,
} from '../../schemas/chat.schema';
import {
  create_chat_handler,
  get_chats_handler,
  update_chat_handler,
  add_member_handler,
  remove_member_handler,
  mark_as_read_handler,
} from '../controllers/chat.controller';

const router = express.Router();

router.use(require_auth);

router.post('/', validate(create_chat_schema), create_chat_handler);

router.get('/', get_chats_handler);

router.put('/:chatId', validate(update_chat_schema), update_chat_handler);

router.post('/:chatId/members', validate(add_member_schema), add_member_handler);

router.delete('/:chatId/members/:userId', validate(remove_member_schema), remove_member_handler);

router.post('/:chatId/read', validate(mark_as_read_schema), mark_as_read_handler);

export default router;