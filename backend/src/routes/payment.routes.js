import Router from '@koa/router';
import * as paymentController from '../controllers/paymentController.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = new Router({ prefix: '/payments' });

router.post('/premium', verifyToken, paymentController.createPremiumPayment);
router.post('/webhook', paymentController.receiveWebhook);

export default router;
