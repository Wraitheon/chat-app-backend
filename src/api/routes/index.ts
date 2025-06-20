import express from 'express';
import auth_routes from './auth.routes';
import user_routes from './user.routes'
import chat_routes from './chat.routes'
import messages_routes from './messages.routes';

const router = express.Router();

router.use('/auth', auth_routes);
router.use('/users', user_routes);
router.use('/chats', chat_routes);
router.use('/:chat_id/messages', messages_routes);

export default router;
