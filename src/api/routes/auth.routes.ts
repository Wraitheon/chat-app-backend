import express from 'express';
import { register_handler } from '../controllers/auth.controller';
import validate from '../../middleware/validate.request';
import { registerSchema } from '../../schemas/auth.schema';

const router = express.Router();

router.post('/register', validate(registerSchema), register_handler);

export default router;
