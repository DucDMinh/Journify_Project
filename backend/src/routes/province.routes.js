import Router from '@koa/router';
import multer from '@koa/multer';
import * as provinceController from '../controllers/provinceController.js';
import { verifyToken, requireAdmin } from "../middleware/auth.middleware.js";

const router = new Router({ prefix: '/provinces' });
const upload = multer();

router.get('/', provinceController.getAllProvinces);
router.get('/:id', provinceController.getProvinceById);
router.post('/', verifyToken, requireAdmin, upload.single('image'), provinceController.createProvince);
router.put('/:id', verifyToken, requireAdmin, upload.single('image_url'), provinceController.updateProvince);
router.delete('/:id', verifyToken, requireAdmin, provinceController.deleteProvince);

export default router;