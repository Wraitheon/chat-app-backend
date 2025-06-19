import express from 'express';
import { register_handler } from '../controllers/auth.controller';
import validate from '../../middleware/validate.request';
import { register_schema } from '../../schemas/auth.schema';

const router = express.Router();

router.post('/register', validate(register_schema), register_handler);

export default router;
