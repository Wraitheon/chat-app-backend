import express from 'express';
import {
  create_chat_handler,
  get_chats_handler,
  update_chat_handler,
  add_member_handler,
  remove_member_handler,
  mark_as_read_handler,
  get_chat_details_handler,
} from '../controllers/chat.controller';
import messages_routes from './messages.routes';
import { upload_picture } from '../../middleware/upload.middleware';
import { conditional_body_parser } from '../../middleware/conditionalBodyParser.middleware';

const router = express.Router();

router.get('/:chat_id', get_chat_details_handler);
router.post('/', conditional_body_parser, create_chat_handler);
router.get('/', get_chats_handler);
router.patch('/:chat_id', upload_picture.single('group_avatar'), update_chat_handler);
router.patch('/:chat_id/members', add_member_handler);
router.delete('/:chat_id/members/:user_id', remove_member_handler);
router.post('/:chat_id/read', mark_as_read_handler);

router.use('/:chat_id/messages', messages_routes);

export default router;