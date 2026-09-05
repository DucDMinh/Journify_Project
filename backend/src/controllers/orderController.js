import { BaseController } from "./baseController.js"
import { orderRepo } from "../repositories/orderRepository.js"
class OrderController extends BaseController {
    constructor() {
        super(orderRepo, "Đơn hàng");
    }
}

const orderController = new OrderController();

export const getAllOrders = orderController.getAll;
export const getOrderById = orderController.getById;
export const createOrder = orderController.create;
export const updateOrder = orderController.update;
export const deleteOrder = orderController.delete;