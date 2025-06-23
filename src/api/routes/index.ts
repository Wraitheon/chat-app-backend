import express from 'express';
import { require_auth } from '../../middleware/auth.middleware';

import auth_routes from './auth.routes';
import user_routes from './user.routes';
import chat_routes from './chat.routes';

const api_router = express.Router();

api_router.use('/auth', auth_routes);

api_router.use(require_auth);

api_router.use('/users', user_routes);
api_router.use('/chats', chat_routes);

export default api_router;