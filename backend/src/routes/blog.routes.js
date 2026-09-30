import Router from '@koa/router';
import multer from '@koa/multer';
import * as blogController from '../controllers/blogController.js';
import { verifyToken, optionalAuth } from '../middleware/auth.middleware.js';

const router = new Router({ prefix: '/blogs' });
const upload = multer();

router.get('/', optionalAuth, blogController.getAllBlogs);
router.get('/:id', optionalAuth, blogController.getBlogById);
router.post('/', verifyToken, upload.single('blog_image'), blogController.createBlog);
router.patch('/:id', verifyToken, upload.single('blog_image'), blogController.updateBlog);
router.delete('/:id', verifyToken, blogController.deleteBlog);
router.post('/:id/like', verifyToken, blogController.likeBlog);
router.post('/:id/unlike', verifyToken, blogController.unlikeBlog);
router.get('/:id/comments', blogController.getBlogComments);
router.post('/:id/comments', verifyToken, blogController.addBlogComment);
router.delete('/:id/comments/:commentId', verifyToken, blogController.deleteBlogComment);

export default router;
