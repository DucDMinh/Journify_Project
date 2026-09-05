import Router from '@koa/router';
import * as aiController from '../controllers/aiController.js';
import { verifyToken, requirePremium } from '../middleware/auth.middleware.js';

const router = new Router({ prefix: '/ai' });

router.post('/planner', verifyToken, requirePremium, aiController.generateItinerary);

export default router;