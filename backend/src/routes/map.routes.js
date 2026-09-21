import Router from '@koa/router';
import * as mapController from '../controllers/mapController.js';
import { verifyToken, requireAdmin } from '../middleware/auth.middleware.js';

const router = new Router({ prefix: '/map' });

router.get('/geocode', verifyToken, mapController.searchPlace);
router.get('/reverse', verifyToken, mapController.reversePlace);
router.get('/province-from-coords', verifyToken, requireAdmin, mapController.provinceFromCoords);
router.get('/extract', verifyToken, requireAdmin, mapController.extractMap);

export default router;
