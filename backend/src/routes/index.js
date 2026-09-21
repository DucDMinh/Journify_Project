import Router from '@koa/router';
import locationRoutes from './location.routes.js';
import provinceRoutes from './province.routes.js';
import itineraryRoutes from './itinerary.routes.js';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import aiRoutes from './ai.routes.js';
import paymentRoutes from './payment.routes.js';
import orderRoutes from './order.routes.js';
import blogRoutes from './blog.routes.js';
import mapRoutes from './map.routes.js';

const router = new Router();

for (const routes of [
    authRoutes, userRoutes, provinceRoutes, locationRoutes, itineraryRoutes,
    blogRoutes, aiRoutes, paymentRoutes, orderRoutes, mapRoutes,
]) {
    router.use(routes.routes(), routes.allowedMethods());
}

export default router;
