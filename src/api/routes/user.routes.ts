import express from 'express';
import { require_auth } from '../../middleware/auth.middleware';
import validate from '../../middleware/validate.request';
import { update_user_schema, search_user_schema } from '../../schemas/user.schema';
import {
  get_me_handler,
  update_profile_handler,
  search_users_handler,
} from '../controllers/users.controller';

const router = express.Router();

router.get('/me', require_auth, get_me_handler);

router.put(
  '/me',
  require_auth,
  validate(update_user_schema),
  update_profile_handler
);

router.get(
  '/',
  require_auth,
  validate(search_user_schema),
  search_users_handler
);

export default router;