import { provinceRepo } from '../repositories/provinceRepository.js';
import { BaseController } from './baseController.js';
import { uploadImageToStorage, deleteImageFromStorage } from '../helpers/uploadHelper.js';
import { pick } from '../helpers/object.js';
import { ok, created } from '../helpers/response.js';

const EDITABLE_FIELDS = ['name', 'description', 'best_time_to_visit', 'height', 'image_url'];
const STORAGE_FOLDER = 'provinces';

class ProvinceController extends BaseController {
    constructor() {
        super(provinceRepo, 'Tỉnh thành');
    }

    create = async (ctx) => {
        const payload = pick(ctx.request.body ?? {}, EDITABLE_FIELDS);
        ctx.assert(payload.name, 400, 'Tên tỉnh thành là bắt buộc');
        if (ctx.request.file) payload.image_url = await uploadImageToStorage(ctx.request.file, STORAGE_FOLDER);
        created(ctx, await provinceRepo.create(payload), `Tạo mới ${this.itemName} thành công`);
    };

    update = async (ctx) => {
        const { id } = ctx.params;
        const existing = await this.findOr404(id);
        const payload = pick(ctx.request.body ?? {}, EDITABLE_FIELDS);
        if (ctx.request.file) {
            payload.image_url = await uploadImageToStorage(ctx.request.file, STORAGE_FOLDER);
            await deleteImageFromStorage(existing.image_url);
        }
        ctx.assert(Object.keys(payload).length > 0, 400, 'Không có trường dữ liệu nào được thay đổi');
        ok(ctx, await provinceRepo.update(id, payload), `Cập nhật ${this.itemName} thành công`);
    };

    delete = async (ctx) => {
        const { id } = ctx.params;
        const existing = await this.findOr404(id);
        const deleted = await provinceRepo.delete(id);
        await deleteImageFromStorage(existing.image_url);
        ok(ctx, deleted, `Xóa ${this.itemName} thành công`);
    };
}

const provinceController = new ProvinceController();

export const getAllProvinces = provinceController.getAll;
export const getProvinceById = provinceController.getById;
export const createProvince = provinceController.create;
export const updateProvince = provinceController.update;
export const deleteProvince = provinceController.delete;
