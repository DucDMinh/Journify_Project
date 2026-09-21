import Router from '@koa/router';
import * as orderController from '../controllers/orderController.js';
import { verifyToken, requireAdmin } from '../middleware/auth.middleware.js';

const router = new Router({ prefix: '/orders' });

router.get('/', verifyToken, requireAdmin, orderController.getAllOrders);
router.get('/:id', verifyToken, requireAdmin, orderController.getOrderById);
router.patch('/:id', verifyToken, orderController.updateOrder);

export default router;
