import express from 'express';
import { require_auth } from '../../middleware/auth.middleware';
import validate from '../../middleware/validate.request';
import { get_messages_schema } from '../../schemas/message.schema';
import { get_messages_handler } from '../controllers/messages.controller';

// eslint-disable-next-line @typescript-eslint/naming-convention
const router = express.Router({ mergeParams: true });


router.get('/', require_auth, validate(get_messages_schema), get_messages_handler);

export default router;