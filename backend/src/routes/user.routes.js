import Router from '@koa/router';
import multer from '@koa/multer';
import * as userController from '../controllers/userController.js';
import { verifyToken, requireAdmin } from '../middleware/auth.middleware.js';

const router = new Router({ prefix: '/users' });
const upload = multer();
const profileImages = upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'background_image', maxCount: 1 },
]);

router.get('/', verifyToken, requireAdmin, userController.getAllUser);
router.post('/', verifyToken, requireAdmin, upload.single('avatar'), userController.createUser);
router.get('/:id', verifyToken, userController.getUserById);
router.patch('/:id', verifyToken, profileImages, userController.updateUser);
router.delete('/:id', verifyToken, requireAdmin, userController.deleteUser);

export default router;
