import express from 'express';
import {
  get_me_handler,
  update_profile_handler,
  search_users_handler,
} from '../controllers/users.controller';

const router = express.Router();

router.get('/me', get_me_handler);

router.put('/me', update_profile_handler);

router.get('/', search_users_handler);

export default router;