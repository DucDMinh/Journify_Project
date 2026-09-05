import Router from '@koa/router';
import locationRoutes from './location.routes.js';
import provinceRoutes from './province.routes.js';
import itineraryRoutes from './itinerary.routes.js';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import aiRoutes from './ai.routes.js';
import payosRouter from './payos.routes.js';
import orderRouter from './order.routes.js'
import blogRoutes from './blog.routes.js'
const router = new Router();

router.use(locationRoutes.routes(), locationRoutes.allowedMethods());
router.use(provinceRoutes.routes(), provinceRoutes.allowedMethods());
router.use(itineraryRoutes.routes(), itineraryRoutes.allowedMethods());
router.use(blogRoutes.routes(), blogRoutes.allowedMethods());
router.use(authRoutes.routes(), authRoutes.allowedMethods());
router.use(userRoutes.routes(), userRoutes.allowedMethods())
router.use(aiRoutes.routes(), aiRoutes.allowedMethods());
router.use(payosRouter.routes(), payosRouter.allowedMethods());
router.use(orderRouter.routes(), orderRouter.allowedMethods())
export default router;