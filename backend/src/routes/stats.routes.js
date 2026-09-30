import Router from '@koa/router';
import * as statsController from '../controllers/statsController.js';
import { verifyToken, requireAdmin } from '../middleware/auth.middleware.js';

const router = new Router({ prefix: '/stats' });

router.get('/overview', verifyToken, requireAdmin, statsController.overview);
router.get('/community', statsController.community);

export default router;
