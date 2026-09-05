import { provinceRepo } from '../repositories/provinceRepository.js';
import { BaseController } from './baseController.js';
import { uploadImageToStorage, deleteImageFromStorage } from '../helpers/uploadHelper.js';

class ProvinceController extends BaseController {
    constructor() {
        super(provinceRepo, "Tỉnh thành");
    }
    create = async (ctx) => {
        try {
            const payload = { ...ctx.request.body };
            const file = ctx.request.file;
            if (file) {
                const imageUrl = await uploadImageToStorage(file, 'provinces');
                payload.image_url = imageUrl;
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

            const oldProvince = await this.repository.getById(id);
            if (!oldProvince) {
                ctx.status = 404;
                ctx.body = { success: false, message: `Không tìm thấy ${this.itemName} để cập nhật!` };
                return;
            }
            if (file) {
                payload.image_url = await uploadImageToStorage(file);
                if (oldProvince.image_url) {
                    await deleteImageFromStorage(oldProvince.image_url);
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
            const oldProvince = await this.repository.getById(id);
            if (!oldProvince) {
                ctx.status = 404;
                ctx.body = { success: false, message: `Không tìm thấy ${this.itemName} để xóa!` };
                return;
            }
            const data = await this.repository.delete(id);
            if (data && oldProvince.img) {
                await deleteImageFromStorage(oldProvince.img);
            }
            ctx.status = 200;
            ctx.body = { success: true, message: `Xóa ${this.itemName} và dọn dẹp ảnh thành công`, data };
        } catch (error) {
            ctx.status = 500;
            ctx.body = { success: false, message: `Lỗi hệ thống khi xóa ${this.itemName}`, error_detail: error.message };
        }
    }
}

const provinceController = new ProvinceController();

export const getAllProvinces = provinceController.getAll;
export const getProvinceById = provinceController.getById;
export const createProvince = provinceController.create;
export const updateProvince = provinceController.update;
export const deleteProvince = provinceController.delete;