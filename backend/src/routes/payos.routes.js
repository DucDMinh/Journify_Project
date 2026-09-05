import Router from '@koa/router';
import * as payosController from "../controllers/payosController.js";
import { verifyToken } from "../middleware/auth.middleware.js"
const router = new Router();

router.post('/create-embedded-payment-link', verifyToken, payosController.CreateEmbeddedPaymentLink);
router.post('/webhook', payosController.ReceiveWebhook);

export default router;