import Router from '@koa/router';
import multer from '@koa/multer';
import * as itineraryController from '../controllers/itineraryController.js';
import { verifyToken } from "../middleware/auth.middleware.js";

const router = new Router({ prefix: '/itineraries' });
const upload = multer();

//custom routes for itineraries
router.get('/me', verifyToken, itineraryController.getItinerariesByMe);


//standard CRUD routes for itineraries
router.get('/', itineraryController.getAllItineraries);
router.get('/:id', itineraryController.getItineraryById);
router.post('/', verifyToken, upload.single('image'), itineraryController.createItinerary);
router.patch('/:id', verifyToken, upload.single('image'), itineraryController.updateItinerary);
router.delete('/:id', verifyToken, itineraryController.deleteItinerary);

export default router;