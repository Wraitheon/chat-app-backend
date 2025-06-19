import express from 'express';
import { register_handler, login_handler } from '../controllers/auth.controller';
import validate from '../../middleware/validate.request';
import { register_schema, login_schema } from '../../schemas/auth.schema';

const router = express.Router();

router.post('/register', validate(register_schema), register_handler);
router.post('/login', validate(login_schema), login_handler);

export default router;
