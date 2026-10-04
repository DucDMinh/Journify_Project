import Router from '@koa/router';
import { createUpload } from '../helpers/uploadHelper.js';
import * as provinceController from '../controllers/provinceController.js';
import { verifyToken, requireAdmin } from '../middleware/auth.middleware.js';

const router = new Router({ prefix: '/provinces' });
const upload = createUpload();

router.get('/', provinceController.getAllProvinces);
router.get('/regions', provinceController.getRegions);
router.get('/:id', provinceController.getProvinceById);
router.post('/', verifyToken, requireAdmin, upload.single('image'), provinceController.createProvince);
router.patch('/:id', verifyToken, requireAdmin, upload.single('image'), provinceController.updateProvince);
router.delete('/:id', verifyToken, requireAdmin, provinceController.deleteProvince);

export default router;
