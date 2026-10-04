import { BaseController } from './baseController.js';
import { userRepo } from '../repositories/userRepository.js';
import { uploadImageToStorage, deleteImageFromStorage } from '../helpers/uploadHelper.js';
import { hashPassword, verifyPassword, MAX_PASSWORD_LENGTH } from '../helpers/auth.js';
import { normalizeEmail, isValidEmail, normalizePhone, isValidPhone, MIN_PASSWORD_LENGTH, MAX_NAME_LENGTH } from '../helpers/validators.js';
import { isAdmin, isOwnerOrAdmin, invalidateSession } from '../middleware/auth.middleware.js';
import { pick, toBoolean } from '../helpers/object.js';
import { ok, created } from '../helpers/response.js';

const SELF_EDITABLE_FIELDS = ['name', 'email', 'phone_number'];
const ADMIN_EDITABLE_FIELDS = [...SELF_EDITABLE_FIELDS, 'role', 'status', 'is_premium'];
const VALID_ROLES = ['ADMIN', 'USER'];
const VALID_STATUSES = ['active', 'inactive'];

const firstFile = (files, field) => {
    const value = files?.[field];
    return Array.isArray(value) ? value[0] : value || null;
};

const normalizeUserFields = (ctx, payload) => {
    if (payload.name !== undefined) {
        payload.name = String(payload.name ?? '').trim();
        ctx.assert(payload.name && payload.name.length <= MAX_NAME_LENGTH, 400, `Họ tên không được để trống và tối đa ${MAX_NAME_LENGTH} ký tự!`);
    }
    if (payload.email !== undefined) {
        payload.email = normalizeEmail(payload.email);
        ctx.assert(isValidEmail(payload.email), 400, 'Email không hợp lệ!');
    }
    if (payload.phone_number !== undefined) {
        payload.phone_number = normalizePhone(payload.phone_number);
        ctx.assert(isValidPhone(payload.phone_number), 400, 'Số điện thoại không hợp lệ (VD: 0912345678)');
    }
    if (payload.role !== undefined) ctx.assert(VALID_ROLES.includes(payload.role), 400, 'Role không hợp lệ');
    if (payload.status !== undefined) ctx.assert(VALID_STATUSES.includes(payload.status), 400, 'Trạng thái không hợp lệ');
    if (payload.is_premium !== undefined) payload.is_premium = toBoolean(payload.is_premium);
    return payload;
};

const assertPasswordRules = (ctx, password) => {
    ctx.assert(typeof password === 'string' && password.length >= MIN_PASSWORD_LENGTH, 400, `Mật khẩu phải có ít nhất ${MIN_PASSWORD_LENGTH} ký tự!`);
    ctx.assert(password.length <= MAX_PASSWORD_LENGTH, 400, `Mật khẩu không được vượt quá ${MAX_PASSWORD_LENGTH} ký tự!`);
};

class UserController extends BaseController {
    constructor() {
        super(userRepo, 'Người dùng');
    }

    getById = async (ctx) => {
        ctx.assert(isOwnerOrAdmin(ctx.state.user, ctx.params.id), 403, 'Bạn không có quyền xem thông tin người dùng này');
        ok(ctx, await this.findOr404(ctx.params.id));
    };

    create = async (ctx) => {
        const body = ctx.request.body ?? {};
        ctx.assert(body.name && body.email && body.password, 400, 'Thiếu thông tin bắt buộc (name, email, password)!');
        assertPasswordRules(ctx, body.password);

        const payload = normalizeUserFields(ctx, pick(body, ADMIN_EDITABLE_FIELDS));
        ctx.assert(!(await userRepo.existsByEmail(payload.email)), 409, 'Email đã được sử dụng!');
        payload.role ??= 'USER';
        payload.password_hash = await hashPassword(body.password);

        const avatar = ctx.request.file;
        if (avatar) payload.avatar = await uploadImageToStorage(avatar, 'user_avatars');

        created(ctx, await userRepo.create(payload), `Tạo mới ${this.itemName} thành công`);
    };

    update = async (ctx) => {
        const targetId = ctx.params.id;
        const actor = ctx.state.user;
        ctx.assert(isOwnerOrAdmin(actor, targetId), 403, 'Bạn không có quyền chỉnh sửa thông tin của người khác!');

        const existing = await userRepo.getByIdWithSecret(targetId);
        ctx.assert(existing, 404, 'Người dùng không tồn tại');

        const body = ctx.request.body ?? {};
        const isSelf = String(actor.id) === String(targetId);
        const payload = normalizeUserFields(ctx, pick(body, isAdmin(actor) ? ADMIN_EDITABLE_FIELDS : SELF_EDITABLE_FIELDS));
        if (isSelf) {
            ctx.assert(payload.role === undefined || payload.role === existing.role, 400, 'Không thể tự thay đổi vai trò của chính mình');
            ctx.assert(payload.status === undefined || payload.status === existing.status, 400, 'Không thể tự khóa tài khoản của chính mình');
        }

        if (payload.email && payload.email !== normalizeEmail(existing.email)) {
            ctx.assert(!(await userRepo.existsByEmail(payload.email)), 409, 'Email này đã được người khác sử dụng!');
        }

        if (body.password) {
            assertPasswordRules(ctx, body.password);
            if (isSelf) {
                ctx.assert(body.oldPassword, 400, 'Vui lòng nhập mật khẩu hiện tại để đổi mật khẩu mới');
                ctx.assert(await verifyPassword(String(body.oldPassword), existing.password_hash), 400, 'Mật khẩu hiện tại không chính xác');
                ctx.assert(!(await verifyPassword(body.password, existing.password_hash)), 400, 'Mật khẩu mới phải khác mật khẩu hiện tại');
            }
            payload.password_hash = await hashPassword(body.password);
        }

        const files = ctx.request.files ?? {};
        const avatarFile = firstFile(files, 'avatar');
        const backgroundFile = firstFile(files, 'background_image');
        if (avatarFile) payload.avatar = await uploadImageToStorage(avatarFile, 'user_avatars');
        if (backgroundFile) payload.background_image = await uploadImageToStorage(backgroundFile, 'user_backgrounds');

        ctx.assert(Object.keys(payload).length > 0, 400, 'Không có trường dữ liệu nào được thay đổi');
        const updated = await userRepo.update(targetId, payload);
        invalidateSession(targetId);
        if (avatarFile) await deleteImageFromStorage(existing.avatar);
        if (backgroundFile) await deleteImageFromStorage(existing.background_image);
        ok(ctx, updated, 'Cập nhật thông tin thành công');
    };

    delete = async (ctx) => {
        const existing = await this.findOr404(ctx.params.id);
        ctx.assert(String(existing.id) !== String(ctx.state.user.id), 400, 'Không thể tự xóa tài khoản của chính mình');
        const deleted = await userRepo.delete(ctx.params.id);
        invalidateSession(existing.id);
        await deleteImageFromStorage(existing.avatar);
        await deleteImageFromStorage(existing.background_image);
        ok(ctx, deleted, `Xóa ${this.itemName} thành công`);
    };
}

const userController = new UserController();

export const getAllUser = userController.getAll;
export const getUserById = userController.getById;
export const createUser = userController.create;
export const updateUser = userController.update;
export const deleteUser = userController.delete;
