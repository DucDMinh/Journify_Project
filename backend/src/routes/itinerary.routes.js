import Router from '@koa/router';
import * as itineraryController from '../controllers/itineraryController.js';
import { verifyToken, optionalAuth } from '../middleware/auth.middleware.js';

const router = new Router({ prefix: '/itineraries' });

router.get('/me', verifyToken, itineraryController.getItinerariesByMe);
router.get('/', optionalAuth, itineraryController.getAllItineraries);
router.get('/:id', optionalAuth, itineraryController.getItineraryById);
router.post('/', verifyToken, itineraryController.createItinerary);
router.patch('/:id', verifyToken, itineraryController.updateItinerary);
router.delete('/:id', verifyToken, itineraryController.deleteItinerary);

export default router;
