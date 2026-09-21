import Router from '@koa/router';
import * as authController from '../controllers/authController.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = new Router({ prefix: '/auth' });

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/refresh-token', verifyToken, authController.refreshToken);

export default router;
