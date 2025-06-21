import express from 'express';
import { require_auth } from '../../middleware/auth.middleware';
import validate from '../../utils/validate.request';
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
import messages_routes from './messages.routes';

const router = express.Router();

router.use(require_auth);

router.post('/', validate(create_chat_schema), create_chat_handler);

router.get('/', get_chats_handler);

router.put('/:chat_id', validate(update_chat_schema), update_chat_handler);

router.put('/:chat_id/members', validate(add_member_schema), add_member_handler);

router.delete('/:chat_id/members/:user_id', validate(remove_member_schema), remove_member_handler);

router.post('/:chat_id/read', validate(mark_as_read_schema), mark_as_read_handler);

router.use('/:chat_id/messages', messages_routes);

export default router;