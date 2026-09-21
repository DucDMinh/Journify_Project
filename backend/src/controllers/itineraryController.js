import { itineraryRepo } from '../repositories/itineraryRepository.js';
import { BaseController } from './baseController.js';
import { isAdmin, isOwnerOrAdmin } from '../middleware/auth.middleware.js';
import { pick, toNumber, toBoolean, parseJsonField } from '../helpers/object.js';
import { ok, created } from '../helpers/response.js';

const EDITABLE_FIELDS = [
    'title', 'theme', 'summary', 'start_date', 'end_date', 'days', 'nights',
    'estimated_cost', 'image_url', 'share', 'itinerary_days', 'itinerary_provinces', 'cloned_from_id',
];

const normalizePayload = (ctx) => {
    const payload = pick(ctx.request.body ?? {}, EDITABLE_FIELDS);
    try {
        if (payload.itinerary_days !== undefined) payload.itinerary_days = parseJsonField(payload.itinerary_days);
        if (payload.itinerary_provinces !== undefined) payload.itinerary_provinces = parseJsonField(payload.itinerary_provinces);
    } catch {
        ctx.throw(400, 'Định dạng JSON của lộ trình không hợp lệ');
    }
    for (const field of ['estimated_cost', 'nights', 'days']) {
        if (payload[field] !== undefined) payload[field] = toNumber(payload[field]);
    }
    if (payload.share !== undefined) payload.share = toBoolean(payload.share);
    return payload;
};

class ItineraryController extends BaseController {
    constructor() {
        super(itineraryRepo, 'Lộ trình');
    }

    async assertOwner(ctx, id) {
        const ownerId = await itineraryRepo.getOwnerId(id);
        ctx.assert(ownerId !== null, 404, `Không tìm thấy ${this.itemName}!`);
        ctx.assert(isOwnerOrAdmin(ctx.state.user, ownerId), 403, 'Bạn không có quyền thao tác trên lộ trình này');
    }

    getAll = async (ctx) => {
        const { trending, is_public } = ctx.query;
        if (trending === 'weekly') {
            ok(ctx, await itineraryRepo.getTrending());
            return;
        }
        const publicOnly = !isAdmin(ctx.state.user) || is_public === 'true';
        ok(ctx, await itineraryRepo.getAll({ publicOnly }));
    };

    getById = async (ctx) => {
        const itinerary = await this.findOr404(ctx.params.id);
        const canView = itinerary.share === true || isOwnerOrAdmin(ctx.state.user, itinerary.user_id);
        ctx.assert(canView, 403, 'Lộ trình này không được chia sẻ công khai');
        ok(ctx, itinerary);
    };

    getMine = async (ctx) => {
        ok(ctx, await itineraryRepo.getByUserId(ctx.state.user.id));
    };

    create = async (ctx) => {
        const payload = normalizePayload(ctx);
        ctx.assert(payload.title, 400, 'Tiêu đề lộ trình là bắt buộc');
        payload.user_id = ctx.state.user.id;
        created(ctx, await itineraryRepo.create(payload), `Tạo mới ${this.itemName} thành công`);
    };

    update = async (ctx) => {
        const { id } = ctx.params;
        await this.assertOwner(ctx, id);
        const payload = normalizePayload(ctx);
        ctx.assert(Object.keys(payload).length > 0, 400, 'Không có trường dữ liệu nào được thay đổi');
        ok(ctx, await itineraryRepo.update(id, payload), `Cập nhật ${this.itemName} thành công`);
    };

    delete = async (ctx) => {
        const { id } = ctx.params;
        await this.assertOwner(ctx, id);
        ok(ctx, await itineraryRepo.delete(id), `Xóa ${this.itemName} thành công`);
    };
}

const itineraryController = new ItineraryController();

export const getAllItineraries = itineraryController.getAll;
export const getItineraryById = itineraryController.getById;
export const createItinerary = itineraryController.create;
export const updateItinerary = itineraryController.update;
export const deleteItinerary = itineraryController.delete;
export const getItinerariesByMe = itineraryController.getMine;
