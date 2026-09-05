import Router from "@koa/router";
import * as userController from "../controllers/userController.js";
import multer from '@koa/multer';
import { verifyToken, requireAdmin } from "../middleware/auth.middleware.js";

const router = new Router({ prefix: '/users' });
const upload = multer();

router.post('/', upload.single('avatar'), userController.createUser);
router.get('/', verifyToken, requireAdmin, userController.getAllUser);
router.get('/:id', verifyToken, userController.getUserById);
router.delete('/:id', verifyToken, requireAdmin, userController.deleteUser);

const cpUpload = upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'background_image', maxCount: 1 }
]);

router.patch('/:id', verifyToken, cpUpload, userController.updateUser);

export default router;