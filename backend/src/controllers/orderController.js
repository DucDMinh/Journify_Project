import { BaseController } from './baseController.js';
import { orderRepo } from '../repositories/orderRepository.js';
import { userRepo } from '../repositories/userRepository.js';
import { isAdmin, invalidateSession } from '../middleware/auth.middleware.js';
import { cancelOwnOrder, ORDER_STATUS } from '../services/paymentService.js';
import { ok } from '../helpers/response.js';

const ADMIN_EDITABLE_FIELDS = ['status', 'description'];

class OrderController extends BaseController {
    constructor() {
        super(orderRepo, 'Đơn hàng');
    }

    update = async (ctx) => {
        const { id } = ctx.params;
        const body = ctx.request.body ?? {};

        if (!isAdmin(ctx.state.user)) {
            ctx.assert(body.status === ORDER_STATUS.CANCEL, 403, 'Bạn chỉ có thể hủy đơn hàng của mình');
            ok(ctx, await cancelOwnOrder({ orderId: id, user: ctx.state.user }), 'Đã hủy đơn hàng');
            return;
        }

        const existing = await this.findOr404(id);
        const payload = Object.fromEntries(Object.entries(body).filter(([k]) => ADMIN_EDITABLE_FIELDS.includes(k)));
        if (payload.status) ctx.assert(Object.values(ORDER_STATUS).includes(payload.status), 400, 'Trạng thái không hợp lệ');
        ctx.assert(Object.keys(payload).length > 0, 400, 'Không có trường dữ liệu nào được thay đổi');
        const updated = await orderRepo.update(id, payload);
        if (payload.status === ORDER_STATUS.PAID && existing.status !== ORDER_STATUS.PAID && existing.user_id) {
            await userRepo.setPremium(existing.user_id, true);
            invalidateSession(existing.user_id);
        }
        ok(ctx, updated, `Cập nhật ${this.itemName} thành công`);
    };
}

const orderController = new OrderController();

export const getAllOrders = orderController.getAll;
export const getOrderById = orderController.getById;
export const updateOrder = orderController.update;
