import express from 'express';
import { get_messages_handler } from '../controllers/messages.controller';

// eslint-disable-next-line @typescript-eslint/naming-convention
const router = express.Router({ mergeParams: true });

router.get('/', get_messages_handler);

export default router;