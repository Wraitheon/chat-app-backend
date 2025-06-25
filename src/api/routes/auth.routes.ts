import express from 'express';
import { register_handler, login_handler, logout_handler } from '../controllers/auth.controller';

const router = express.Router();

router.post('/register', register_handler);
router.post('/login', login_handler);
router.post('/logout', logout_handler);

export default router;