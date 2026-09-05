import { itineraryRepo } from "../repositories/itineraryRepository.js";
import { BaseController } from "./baseController.js";

class ItineraryController extends BaseController {
    constructor() {
        super(itineraryRepo, "Lộ trình");
    }

    create = async (ctx) => {
        try {
            const payload = { ...ctx.request.body };

            if (payload.itinerary_days && typeof payload.itinerary_days === 'string') {
                payload.itinerary_days = JSON.parse(payload.itinerary_days);
            }
            if (payload.itinerary_provinces && typeof payload.itinerary_provinces === 'string') {
                payload.itinerary_provinces = JSON.parse(payload.itinerary_provinces);
            }
            if (payload.estimated_cost) {
                payload.estimated_cost = Number(payload.estimated_cost);
            }
            if (payload.nights) payload.nights = Number(payload.nights);
            if (payload.days) payload.days = Number(payload.days);
            if (payload.share !== undefined) {
                payload.share = payload.share === 'true';
            }
            console.log(JSON.stringify(payload, null, 2));
            const data = await this.repository.create(payload);

            ctx.status = 201;
            ctx.body = { success: true, message: `Tạo mới ${this.itemName} thành công`, data };
        } catch (error) {
            console.error("Lỗi tạo lộ trình:", error);
            ctx.status = 500;
            ctx.body = { success: false, message: `Lỗi hệ thống khi tạo ${this.itemName}`, error_detail: error.message };
        }
    }
    update = async (ctx) => {
        try {
            if (!ctx.request.body || Object.keys(ctx.request.body).length === 0) {
                ctx.status = 400;
                ctx.body = { success: false, message: "Dữ liệu cập nhật không được để trống" };
                return;
            }

            const payload = { ...ctx.request.body };
            const id = ctx.params.id || payload.id;
            if (!id) {
                ctx.status = 400;
                ctx.body = { success: false, message: "Thiếu ID để cập nhật lộ trình" };
                return;
            }
            delete payload.id;
            if (Object.keys(payload).length === 0) {
                ctx.status = 400;
                ctx.body = { success: false, message: "Không có trường dữ liệu nào được thay đổi" };
                return;
            }
            try {
                if (payload.itinerary_days && typeof payload.itinerary_days === 'string') {
                    payload.itinerary_days = JSON.parse(payload.itinerary_days);
                }
                if (payload.itinerary_provinces && typeof payload.itinerary_provinces === 'string') {
                    payload.itinerary_provinces = JSON.parse(payload.itinerary_provinces);
                }
            } catch (e) {
                ctx.status = 400;
                ctx.body = { success: false, message: "Định dạng JSON của lộ trình không hợp lệ" };
                return;
            }
            if (payload.estimated_cost !== undefined) payload.estimated_cost = Number(payload.estimated_cost);
            if (payload.nights !== undefined) payload.nights = Number(payload.nights);
            if (payload.days !== undefined) payload.days = Number(payload.days);

            if (payload.share !== undefined) {
                payload.share = payload.share === 'true' || payload.share === true;
            }

            console.log("Payload chuẩn bị update:", JSON.stringify({ id, ...payload }, null, 2));
            const data = await this.repository.update(id, payload);

            ctx.status = 200;
            ctx.body = { success: true, message: `Cập nhật ${this.itemName} thành công`, data };

        } catch (error) {
            console.error("Lỗi cập nhật lộ trình:", error);
            ctx.status = 500;
            ctx.body = {
                success: false,
                message: `Lỗi hệ thống khi cập nhật ${this.itemName}`,
                error_detail: error.message
            };
        }
    }
    getAll = async (ctx) => {
        try {
            const { trending, is_public } = ctx.query;
            if (trending === 'weekly') {
                const { data, error } = await this.repository.getTrending();
                if (error) throw error;
                ctx.status = 200;
                ctx.body = { success: true, data: data };
                return;
            }
            const { data, error } = await this.repository.getAll(is_public);
            if (error) throw error;
            ctx.status = 200;
            ctx.body = { success: true, data: data };

        } catch (error) {
            console.error("Lỗi khi lấy lộ trình:", error);
            ctx.status = 500;
            ctx.body = { success: false, message: `Lỗi hệ thống khi lấy danh sách lộ trình`, error_detail: error.message };
        }
    }
    getItinerariesByMe = async (ctx) => {
        try {
            const userId = ctx.state.user.id;
            const { data, error } = await this.repository.getItinerariesByUserId(userId);
            if (error) throw error;
            ctx.status = 200;
            ctx.body = { success: true, data: data, userId: userId };
        } catch (error) {
            console.error("Lỗi khi lấy lộ trình của người dùng:", error);
            ctx.status = 500;
            ctx.body = { success: false, message: `Lỗi hệ thống khi lấy danh sách lộ trình của người dùng`, error_detail: error.message };
        }
    }
}

const itineraryController = new ItineraryController();

export const getAllItineraries = itineraryController.getAll;
export const getItineraryById = itineraryController.getById;
export const createItinerary = itineraryController.create;
export const updateItinerary = itineraryController.update;
export const deleteItinerary = itineraryController.delete;
export const getItinerariesByMe = itineraryController.getItinerariesByMe;