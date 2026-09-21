import { BaseController } from './baseController.js';
import { blogRepo } from '../repositories/blogRepository.js';
import { uploadImageToStorage, deleteImageFromStorage } from '../helpers/uploadHelper.js';
import { isOwnerOrAdmin } from '../middleware/auth.middleware.js';
import { pick } from '../helpers/object.js';
import { ok, created } from '../helpers/response.js';

const EDITABLE_FIELDS = ['content', 'location', 'emotion'];
const STORAGE_FOLDER = 'blogs';

class BlogController extends BaseController {
    constructor() {
        super(blogRepo, 'Bài viết');
    }

    async findOwnedOr404(ctx, id) {
        const blog = await this.findOr404(id);
        ctx.assert(isOwnerOrAdmin(ctx.state.user, blog.user_id), 403, 'Bạn không có quyền thao tác trên bài viết này');
        return blog;
    }

    getAll = async (ctx) => {
        ok(ctx, await blogRepo.getAll(ctx.state.user?.id ?? null));
    };

    create = async (ctx) => {
        const payload = pick(ctx.request.body ?? {}, EDITABLE_FIELDS);
        ctx.assert(payload.content?.trim(), 400, 'Nội dung bài viết không được để trống');
        payload.user_id = ctx.state.user.id;
        if (ctx.request.file) payload.blog_image = await uploadImageToStorage(ctx.request.file, STORAGE_FOLDER);
        created(ctx, await blogRepo.create(payload), `Tạo mới ${this.itemName} thành công`);
    };

    update = async (ctx) => {
        const { id } = ctx.params;
        const existing = await this.findOwnedOr404(ctx, id);
        const payload = pick(ctx.request.body ?? {}, EDITABLE_FIELDS);
        if (ctx.request.file) {
            payload.blog_image = await uploadImageToStorage(ctx.request.file, STORAGE_FOLDER);
            await deleteImageFromStorage(existing.blog_image);
        }
        ctx.assert(Object.keys(payload).length > 0, 400, 'Không có trường dữ liệu nào được thay đổi');
        ok(ctx, await blogRepo.update(id, payload), `Cập nhật ${this.itemName} thành công`);
    };

    delete = async (ctx) => {
        const { id } = ctx.params;
        const existing = await this.findOwnedOr404(ctx, id);
        const deleted = await blogRepo.delete(id);
        await deleteImageFromStorage(existing.blog_image);
        ok(ctx, deleted, `Xóa ${this.itemName} thành công`);
    };

    like = async (ctx) => {
        await this.findOr404(ctx.params.id);
        await blogRepo.like(ctx.params.id, ctx.state.user.id);
        ok(ctx, null, 'Đã thích bài viết');
    };

    unlike = async (ctx) => {
        await this.findOr404(ctx.params.id);
        await blogRepo.unlike(ctx.params.id, ctx.state.user.id);
        ok(ctx, null, 'Đã bỏ thích bài viết');
    };
}

const blogController = new BlogController();

export const getAllBlogs = blogController.getAll;
export const getBlogById = blogController.getById;
export const createBlog = blogController.create;
export const updateBlog = blogController.update;
export const deleteBlog = blogController.delete;
export const likeBlog = blogController.like;
export const unlikeBlog = blogController.unlike;
