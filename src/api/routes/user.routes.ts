import express from 'express';
import {
  get_me_handler,
  update_profile_handler,
  search_users_handler,
} from '../controllers/users.controller';
import { upload_picture } from '../../middleware/upload.middleware';

const router = express.Router();

router.get('/me', get_me_handler);

router.patch('/me', upload_picture.single('profile_picture'), update_profile_handler);

router.get('/', search_users_handler);

export default router;