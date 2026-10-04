import { locationRepo } from '../repositories/locationRepository.js';
import { BaseController } from './baseController.js';
import { uploadImageToStorage, deleteImageFromStorage } from '../helpers/uploadHelper.js';
import { pick } from '../helpers/object.js';
import { isUuid, toCoordinate } from '../helpers/validators.js';
import { ok, created } from '../helpers/response.js';

const EDITABLE_FIELDS = ['name', 'description', 'note', 'lat', 'lng', 'province_id', 'difficulty_level', 'img'];
const STORAGE_FOLDER = 'locations';
const MAX_PAGE_SIZE = 1000;

const normalizeLocation = (ctx, payload) => {
    if (payload.name !== undefined) {
        payload.name = String(payload.name ?? '').trim();
        ctx.assert(payload.name, 400, 'Tên địa điểm là bắt buộc');
    }
    payload.lat = toCoordinate(payload.lat, 90);
    payload.lng = toCoordinate(payload.lng, 180);
    ctx.assert(!Number.isNaN(payload.lat), 400, 'Vĩ độ (lat) phải là số trong khoảng -90 đến 90');
    ctx.assert(!Number.isNaN(payload.lng), 400, 'Kinh độ (lng) phải là số trong khoảng -180 đến 180');
    if (payload.province_id === '') payload.province_id = null;
    if (payload.province_id) ctx.assert(isUuid(payload.province_id), 400, 'Tỉnh/thành không hợp lệ');
    return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
};

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
        if (provinceId) ctx.assert(isUuid(provinceId), 400, 'Tỉnh/thành không hợp lệ');
        const { data, count } = await locationRepo.getPaginated({ page, limit, search: String(search).trim(), provinceId });
        ok(ctx, data, undefined, 200, {
            total: count,
            totalPages: Math.max(1, Math.ceil(count / limit)),
            currentPage: page,
        });
    };

    create = async (ctx) => {
        const payload = normalizeLocation(ctx, pick(ctx.request.body ?? {}, EDITABLE_FIELDS));
        ctx.assert(payload.name, 400, 'Tên địa điểm là bắt buộc');
        if (ctx.request.file) payload.img = await uploadImageToStorage(ctx.request.file, STORAGE_FOLDER);
        created(ctx, await locationRepo.create(payload), `Tạo mới ${this.itemName} thành công`);
    };

    update = async (ctx) => {
        const { id } = ctx.params;
        const existing = await this.findOr404(id);
        const payload = normalizeLocation(ctx, pick(ctx.request.body ?? {}, EDITABLE_FIELDS));
        ctx.assert(Object.keys(payload).length > 0 || ctx.request.file, 400, 'Không có trường dữ liệu nào được thay đổi');
        if (ctx.request.file) payload.img = await uploadImageToStorage(ctx.request.file, STORAGE_FOLDER);
        const updated = await locationRepo.update(id, payload);
        if (ctx.request.file) await deleteImageFromStorage(existing.img);
        ok(ctx, updated, `Cập nhật ${this.itemName} thành công`);
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
