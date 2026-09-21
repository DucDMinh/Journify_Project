import { PayOS } from '@payos/node';
import { randomInt } from 'node:crypto';
import { env } from '../config/env.js';
import { HttpError } from '../helpers/httpError.js';
import { orderRepo } from '../repositories/orderRepository.js';
import { userRepo } from '../repositories/userRepository.js';

export const PREMIUM_PLANS = {
    1: { months: 1, amount: 10000 },
    3: { months: 3, amount: 25000 },
    6: { months: 6, amount: 40000 },
    12: { months: 12, amount: 60000 },
};

export const ORDER_STATUS = { PENDING: 'PENDING', PAID: 'PAID', CANCEL: 'CANCEL' };

let payOS;
const getPayOS = () => {
    const { clientId, apiKey, checksumKey } = env.payos;
    if (!clientId || !apiKey || !checksumKey) {
        throw new HttpError(503, 'Cổng thanh toán chưa được cấu hình');
    }
    payOS ??= new PayOS({ clientId, apiKey, checksumKey });
    return payOS;
};

// PayOS yêu cầu orderCode là số nguyên dương duy nhất, tối đa 2^53
const generateOrderCode = () => Date.now() * 1000 + randomInt(0, 1000);

const isValidReturnUrl = (url) => {
    try {
        const parsed = new URL(url);
        return env.corsOrigins.includes(parsed.origin);
    } catch {
        return false;
    }
};

export const createPremiumPaymentLink = async ({ userId, planId, returnUrl }) => {
    const plan = PREMIUM_PLANS[planId];
    if (!plan) throw new HttpError(400, 'Gói Premium không hợp lệ');
    if (!isValidReturnUrl(returnUrl)) throw new HttpError(400, 'returnUrl không hợp lệ');

    const orderCode = generateOrderCode();
    const order = await orderRepo.create({
        user_id: userId,
        amount: plan.amount,
        order_code: orderCode,
        status: ORDER_STATUS.PENDING,
    });

    const paymentLink = await getPayOS().paymentRequests.create({
        orderCode,
        amount: plan.amount,
        description: `Premium ${plan.months} thang`,
        returnUrl,
        cancelUrl: returnUrl,
    });

    return { checkoutUrl: paymentLink.checkoutUrl, orderId: order.id };
};

export const handlePaymentWebhook = async (body) => {
    let payment;
    try {
        payment = await getPayOS().webhooks.verify(body);
    } catch {
        throw new HttpError(400, 'Chữ ký webhook không hợp lệ');
    }

    if (payment.code !== '00') return { processed: false, reason: 'payment_failed' };

    const order = await orderRepo.getByOrderCode(payment.orderCode);
    if (!order) return { processed: false, reason: 'order_not_found' };
    if (Number(payment.amount) !== Number(order.amount)) {
        console.error(`Webhook lệch số tiền: order ${order.id} mong đợi ${order.amount}, nhận ${payment.amount}`);
        return { processed: false, reason: 'amount_mismatch' };
    }

    const paidOrder = await orderRepo.markPaid(order.id, {
        description: payment.description,
        counterAccountNumber: payment.counterAccountNumber,
    });
    if (!paidOrder) return { processed: false, reason: 'already_processed' };

    await userRepo.setPremium(order.user_id, true);
    return { processed: true, orderId: order.id, userId: order.user_id };
};

export const cancelOwnOrder = async ({ orderId, user }) => {
    const order = await orderRepo.getById(orderId);
    if (!order) throw new HttpError(404, 'Không tìm thấy đơn hàng');
    if (String(order.user_id) !== String(user.id)) throw new HttpError(403, 'Bạn không có quyền thao tác đơn hàng này');
    if (order.status !== ORDER_STATUS.PENDING) throw new HttpError(400, 'Chỉ có thể hủy đơn hàng đang chờ thanh toán');
    return orderRepo.update(orderId, { status: ORDER_STATUS.CANCEL });
};
