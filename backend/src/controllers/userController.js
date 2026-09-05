import { BaseController } from './baseController.js';
import { userRepo } from '../repositories/userRepository.js';
import { uploadImageToStorage, deleteImageFromStorage } from '../helpers/uploadHelper.js';
import bcrypt from 'bcryptjs';

class UserController extends BaseController {
    constructor() {
        super(userRepo, "Người dùng");
    }

    create = async (ctx) => {
        try {
            const payload = { ...ctx.request.body };
            const file = ctx.file || (ctx.request && ctx.request.file);

            if (await this.repository.checkExistEmail(payload.email)) {
                ctx.throw(400, 'Email đã được sử dụng!');
            }

            if (file) {
                const imageUrl = await uploadImageToStorage(file, 'user_avatars');
                payload.avatar = imageUrl;
            }

            if (payload.password) {
                const salt = await bcrypt.genSalt(10);
                const password_hash = await bcrypt.hash(payload.password, salt);
                payload.password_hash = password_hash;
                delete payload.password;
            }

            const { data: newUser, error } = await this.repository.create(payload);
            if (error) throw error;

            ctx.status = 201;
            ctx.body = {
                success: true,
                message: `Tạo mới ${this.itemName} thành công`,
                data: newUser
            };

        } catch (error) {
            if (error.status === 400 || error.statusCode === 400 || error.code === '23505') {
                ctx.status = 400;
                ctx.body = {
                    success: false,
                    message: error.code === '23505' ? 'Email này đã được đăng ký trong hệ thống!' : error.message
                };
            } else {
                console.error("Lỗi hệ thống khi tạo user:", error);
                ctx.status = 500;
                ctx.body = {
                    success: false,
                    message: `Lỗi hệ thống khi tạo ${this.itemName}`,
                    error_detail: error.message || "Unknown error"
                };
            }
        }
    }

    delete = async (ctx) => {
        try {
            const id = ctx.params.id;
            const response = await this.repository.getById(id);
            if (!response) {
                ctx.status = 400;
                ctx.body = {
                    success: false,
                    message: 'Người dùng không tồn tại'
                }
                return;
            }
            const data = await this.repository.delete(id);
            if (data && response.avatar) {
                await deleteImageFromStorage(response.avatar)
            }
            ctx.status = 200;
            ctx.body = { success: true, message: `Xóa ${this.itemName} và dọn dẹp ảnh thành công`, data };
        } catch (error) {
            ctx.status = 500;
            ctx.body = { success: false, message: `Lỗi hệ thống khi xóa ${this.itemName}`, error_detail: error.message };
        }
    }
    update = async (ctx) => {
        try {
            const targetId = ctx.params.id;
            const currentUser = ctx.state.user;
            if (currentUser.id !== targetId && currentUser.role !== 'ADMIN') {
                ctx.status = 403;
                ctx.body = {
                    success: false,
                    message: 'Bảo mật: Bạn không có quyền chỉnh sửa thông tin của người khác!'
                };
                return;
            }
            const response = await this.repository.getById(targetId);
            if (!response) {
                ctx.status = 400;
                ctx.body = {
                    success: false,
                    message: 'Người dùng không tồn tại'
                }
                return;
            }
            const payload = { ...ctx.request.body };
            const files = ctx.files || (ctx.request && ctx.request.files) || {};
            let avatarFile = files.avatar ? (Array.isArray(files.avatar) ? files.avatar[0] : files.avatar) : null;
            let bgFile = files.background_image ? (Array.isArray(files.background_image) ? files.background_image[0] : files.background_image) : null;
            if (!avatarFile && !bgFile && (ctx.file || (ctx.request && ctx.request.file))) {
                const singleFile = ctx.file || (ctx.request && ctx.request.file);
                if (singleFile.fieldname === 'background_image') {
                    bgFile = singleFile;
                } else if (singleFile.fieldname === 'avatar') {
                    avatarFile = singleFile;
                }
            }
            if (avatarFile) {
                payload.avatar = await uploadImageToStorage(avatarFile, 'user_avatars');
                if (response.avatar) {
                    await deleteImageFromStorage(response.avatar);
                }
            }
            if (bgFile) {
                payload.background_image = await uploadImageToStorage(bgFile, 'user_backgrounds');
                if (response.background_image) {
                    await deleteImageFromStorage(response.background_image);
                }
            }
            if (payload.password) {
                if (!payload.oldPassword) {
                    ctx.status = 400;
                    ctx.body = { success: false, message: "Vui lòng nhập mật khẩu hiện tại để đổi mật khẩu mới" };
                    return;
                }
                const isOldPasswordCorrect = await bcrypt.compare(payload.oldPassword, response.password_hash);
                if (!isOldPasswordCorrect) {
                    ctx.status = 400;
                    ctx.body = { success: false, message: "Mật khẩu hiện tại không chính xác" };
                    return;
                }
                const isNewPasswordSameAsOld = await bcrypt.compare(payload.password, response.password_hash);
                if (isNewPasswordSameAsOld) {
                    ctx.status = 400;
                    ctx.body = { success: false, message: "Mật khẩu mới phải khác mật khẩu hiện tại" };
                    return;
                }
                const salt = await bcrypt.genSalt(10);
                payload.password_hash = await bcrypt.hash(payload.password, salt);
            }

            if (payload.email && payload.email !== response.email) {
                const isExist = await this.repository.checkExistEmail(payload.email);
                if (isExist) {
                    ctx.status = 400;
                    ctx.body = {
                        success: false,
                        message: "Email này đã được người khác sử dụng, vui lòng chọn email khác!"
                    };
                    return;
                }
            }
            delete payload.password;
            delete payload.oldPassword;
            const data = await this.repository.update(targetId, payload);
            ctx.status = 200;
            ctx.body = {
                success: true,
                message: `Sửa thông tin thành công user ${payload.name || response.name}`
            }

        } catch (error) {
            ctx.status = 500;
            ctx.body = {
                success: false,
                message: `Lỗi hệ thống khi cập nhật người dùng`,
                error_detail: error.message
            };
        }
    }
}

const userController = new UserController();

export const getAllUser = userController.getAll;
export const getUserById = userController.getById;
export const createUser = userController.create;
export const updateUser = userController.update;
export const deleteUser = userController.delete;