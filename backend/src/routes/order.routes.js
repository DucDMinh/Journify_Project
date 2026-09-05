import Router from '@koa/router'
import * as orderController from '../controllers/orderController.js'
import { verifyToken } from '../middleware/auth.middleware.js';

const router = new Router({ prefix: '/orders' });
router.get('/', orderController.getAllOrders);
router.post('/', orderController.createOrder);
router.patch('/:id', orderController.updateOrder)

export default router;