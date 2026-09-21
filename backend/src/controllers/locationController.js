import { locationRepo } from '../repositories/locationRepository.js';
import { BaseController } from './baseController.js';
import { uploadImageToStorage, deleteImageFromStorage } from '../helpers/uploadHelper.js';
import { pick } from '../helpers/object.js';
import { ok, created } from '../helpers/response.js';

const EDITABLE_FIELDS = ['name', 'description', 'note', 'lat', 'lng', 'province_id', 'difficulty_level', 'img'];
const STORAGE_FOLDER = 'locations';
const MAX_PAGE_SIZE = 1000;

class LocationController extends BaseController {
    constructor() {
        super(locationRepo, 'Địa điểm');
    }

    getAll = async (ctx) => {
        const { trending, search = '', province_id: provinceId = '' } = ctx.query;
        const page = Math.max(1, parseInt(ctx.query.page, 10) || 1);
        const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(ctx.query.limit, 10) || 5));

        if (trending === 'true') {
            ok(ctx, await locationRepo.getMostSaved(limit));
            return;
        }
        const { data, count } = await locationRepo.getPaginated({ page, limit, search, provinceId });
        ok(ctx, data, undefined, 200, {
            total: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
        });
    };

    create = async (ctx) => {
        const payload = pick(ctx.request.body ?? {}, EDITABLE_FIELDS);
        ctx.assert(payload.name, 400, 'Tên địa điểm là bắt buộc');
        if (ctx.request.file) payload.img = await uploadImageToStorage(ctx.request.file, STORAGE_FOLDER);
        created(ctx, await locationRepo.create(payload), `Tạo mới ${this.itemName} thành công`);
    };

    update = async (ctx) => {
        const { id } = ctx.params;
        const existing = await this.findOr404(id);
        const payload = pick(ctx.request.body ?? {}, EDITABLE_FIELDS);
        if (ctx.request.file) {
            payload.img = await uploadImageToStorage(ctx.request.file, STORAGE_FOLDER);
            await deleteImageFromStorage(existing.img);
        }
        ctx.assert(Object.keys(payload).length > 0, 400, 'Không có trường dữ liệu nào được thay đổi');
        ok(ctx, await locationRepo.update(id, payload), `Cập nhật ${this.itemName} thành công`);
    };

    delete = async (ctx) => {
        const { id } = ctx.params;
        const existing = await this.findOr404(id);
        const deleted = await locationRepo.delete(id);
        await deleteImageFromStorage(existing.img);
        ok(ctx, deleted, `Xóa ${this.itemName} thành công`);
    };
}

const locationController = new LocationController();

export const getAllLocations = locationController.getAll;
export const getLocationById = locationController.getById;
export const createLocation = locationController.create;
export const updateLocation = locationController.update;
export const deleteLocation = locationController.delete;
