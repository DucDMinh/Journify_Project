import Router from '@koa/router';
import multer from '@koa/multer';
import * as blogController from '../controllers/blogController.js';
import { verifyToken, requireAdmin } from "../middleware/auth.middleware.js";

const router = new Router({ prefix: '/blogs' });
const upload = multer();

router.get('/', verifyToken, blogController.getAllBlogs);
router.get('/:id', verifyToken, blogController.getBlogById);
router.post('/', verifyToken, upload.single('blog_image'), blogController.createBlog);
router.patch('/:id', verifyToken, upload.single('blog_image'), blogController.updateBlog);
router.delete('/:id', verifyToken, blogController.deleteBlog);

router.post('/:id/like', verifyToken, blogController.likeBlog);
router.post('/:id/unlike', verifyToken, blogController.unlikeBlog)

export default router;