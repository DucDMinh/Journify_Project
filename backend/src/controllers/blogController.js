import { BaseController } from './baseController.js';
import { blogRepo } from '../repositories/blogRepository.js'
import { uploadImageToStorage, deleteImageFromStorage } from '../helpers/uploadHelper.js';

class BlogController extends BaseController {
    constructor() {
        super(blogRepo, "Blogs");
    }
    getAll = async (ctx) => {
        try {
            const user_id = ctx.state.user.id;
            const { data, error } = await this.repository.getAll(user_id);
            if (error) throw new Error(error);
            ctx.status = 200;
            ctx.body = {
                success: true,
                data: data
            }
        } catch (error) {
            ctx.status = 500;
            ctx.body = { success: false, message: `Lỗi hệ thống`, error_detail: error.message };
        }
    }
    create = async (ctx) => {
        try {
            const payload = { ...ctx.request.body };
            const file = ctx.request.file;
            if (file) {
                const imageUrl = await uploadImageToStorage(file, 'blogs');
                payload.blog_image = imageUrl;
            }
            const data = await this.repository.create(payload);
            ctx.status = 201;
            ctx.body = { success: true, message: `Tạo mới ${this.itemName} thành công`, data };
        } catch (error) {
            ctx.status = 500;
            ctx.body = { success: false, message: `Lỗi hệ thống khi tạo ${this.itemName}`, error_detail: error.message };
        }
    }
    update = async (ctx) => {
        try {
            const id = ctx.params.id;
            const payload = { ...ctx.request.body };
            const file = ctx.request.file;

            const oldBlog = await this.repository.getById(id);
            if (!oldBlog) {
                ctx.status = 404;
                ctx.body = { success: false, message: `Không tìm thấy ${this.itemName} để cập nhật!` };
                return;
            }

            if (file) {
                payload.blog_image = await uploadImageToStorage(file);

                if (oldBlog.blog_image) {
                    await deleteImageFromStorage(oldBlog.blog_image);
                }
            }

            const data = await this.repository.update(id, payload);

            ctx.status = 200;
            ctx.body = { success: true, message: `Cập nhật ${this.itemName} thành công`, data };
        } catch (error) {
            ctx.status = 500;
            ctx.body = { success: false, message: `Lỗi hệ thống khi cập nhật ${this.itemName}`, error_detail: error.message };
        }
    }
    delete = async (ctx) => {
        try {
            const id = ctx.params.id;

            const oldBlog = await this.repository.getById(id);
            if (!oldBlog) {
                ctx.status = 404;
                ctx.body = { success: false, message: `Không tìm thấy ${this.itemName} để xóa!` };
                return;
            }

            const data = await this.repository.delete(id);

            if (data && oldBlog.blog_image) {
                await deleteImageFromStorage(oldBlog.blog_image);
            }

            ctx.status = 200;
            ctx.body = { success: true, message: `Xóa ${this.itemName} và dọn dẹp ảnh thành công`, data };
        } catch (error) {
            ctx.status = 500;
            ctx.body = { success: false, message: `Lỗi hệ thống khi xóa ${this.itemName}`, error_detail: error.message };
        }
    }
    likeBlog = async (ctx) => {
        try {
            const blog_id = ctx.params.id;
            const user_id = ctx.state.user.id;
            const payload = {
                p_user_id: user_id,
                p_blog_id: blog_id
            }
            const data = await this.repository.likeBlog(payload)
            ctx.status = 201;
            ctx.body = {
                success: true
            }
        } catch (error) {
            ctx.status = 500;
            ctx.body = {
                success: false,
                message: `${error}`
            }
        }
    }
    unlikeBlog = async (ctx) => {
        try {
            const blog_id = ctx.params.id;
            const user_id = ctx.state.user.id;
            await this.repository.unlikeBlog(blog_id, user_id);
            ctx.status = 201;
            ctx.body = {
                success: true
            }
        } catch (error) {
            ctx.status = 500;
            ctx.body = {
                success: false,
                message: error
            }
        }
    }
}

const blogController = new BlogController();
export const getAllBlogs = blogController.getAll;
export const createBlog = blogController.create;
export const deleteBlog = blogController.delete;
export const updateBlog = blogController.update;
export const getBlogById = blogController.getById;
export const likeBlog = blogController.likeBlog;
export const unlikeBlog = blogController.unlikeBlog;