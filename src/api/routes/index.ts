import express from 'express';
import auth_routes from './auth.routes';

const router = express.Router();

router.use('/auth', auth_routes);

export default router;
