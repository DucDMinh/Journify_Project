import { locationRepo } from '../repositories/locationRepository.js';
import { BaseController } from './baseController.js';
import { uploadImageToStorage, deleteImageFromStorage } from '../helpers/uploadHelper.js';

class LocationController extends BaseController {
    constructor() {
        super(locationRepo, "Địa điểm");
    }
    create = async (ctx) => {
        try {
            const payload = { ...ctx.request.body };
            const file = ctx.request.file;
            console.log("Received file:", file);
            if (file) {
                const imageUrl = await uploadImageToStorage(file, 'locations');
                payload.img = imageUrl;
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

            const oldLocation = await this.repository.getById(id);
            if (!oldLocation) {
                ctx.status = 404;
                ctx.body = { success: false, message: `Không tìm thấy ${this.itemName} để cập nhật!` };
                return;
            }

            if (file) {
                payload.img = await uploadImageToStorage(file);

                if (oldLocation.img) {
                    await deleteImageFromStorage(oldLocation.img);
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

            const oldLocation = await this.repository.getById(id);
            if (!oldLocation) {
                ctx.status = 404;
                ctx.body = { success: false, message: `Không tìm thấy ${this.itemName} để xóa!` };
                return;
            }

            const data = await this.repository.delete(id);

            if (data && oldLocation.img) {
                await deleteImageFromStorage(oldLocation.img);
            }

            ctx.status = 200;
            ctx.body = { success: true, message: `Xóa ${this.itemName} và dọn dẹp ảnh thành công`, data };
        } catch (error) {
            ctx.status = 500;
            ctx.body = { success: false, message: `Lỗi hệ thống khi xóa ${this.itemName}`, error_detail: error.message };
        }
    }
    getAll = async (ctx) => {
        try {
            const page = parseInt(ctx.query.page) || 1;
            const limit = parseInt(ctx.query.limit) || 5;
            const { trending, search } = ctx.query;
            const province_id = ctx.query.province_id || '';
            if (trending === 'true') {
                const { data, error } = await this.repository.getFavor(limit);
                if (error) console.log('error', error);
                ctx.status = 200;
                ctx.body = {
                    success: true,
                    data: data,
                };
            } else {
                const { data, count, error } = await this.repository.getAll(page, limit, search, province_id);
                if (error) throw error;
                ctx.status = 200;
                ctx.body = {
                    success: true,
                    data: data,
                    total: count,
                    totalPages: Math.ceil(count / limit),
                    currentPage: page
                };
            }
        } catch (error) {
            ctx.status = 500;
            ctx.body = { success: false, message: `Lỗi hệ thống khi lấy danh sách ${this.itemName}`, error_detail: error.message };
        }
    }
}

const locationController = new LocationController();

export const getAllLocations = locationController.getAll;
export const getLocationById = locationController.getById;
export const createLocation = locationController.create;
export const updateLocation = locationController.update;
export const deleteLocation = locationController.delete;