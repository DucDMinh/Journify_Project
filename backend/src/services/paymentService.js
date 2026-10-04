import { PayOS } from '@payos/node';
import { randomInt } from 'node:crypto';
import { env } from '../config/env.js';
import { HttpError } from '../helpers/httpError.js';
import { orderRepo } from '../repositories/orderRepository.js';
import { userRepo } from '../repositories/userRepository.js';
import { invalidateSession, isOwnerOrAdmin } from '../middleware/auth.middleware.js';

export const PREMIUM_PLANS = {
    1: { months: 1, amount: 10000 },
    3: { months: 3, amount: 25000 },
    6: { months: 6, amount: 40000 },
    12: { months: 12, amount: 60000 },
};

export const ORDER_STATUS = { PENDING: 'PENDING', PAID: 'PAID', CANCEL: 'CANCEL' };

const CLOSED_LINK_STATUSES = new Set(['CANCELLED', 'EXPIRED', 'FAILED']);

let payOS;
const getPayOS = () => {
    const { clientId, apiKey, checksumKey } = env.payos;
    if (!clientId || !apiKey || !checksumKey) {
        throw new HttpError(503, 'Cổng thanh toán chưa được cấu hình');
    }
    payOS ??= new PayOS({ clientId, apiKey, checksumKey });
    return payOS;
};

const generateOrderCode = () => Date.now() * 1000 + randomInt(0, 1000);

const isValidReturnUrl = (url) => {
    try {
        const parsed = new URL(url);
        return env.corsOrigins.includes(parsed.origin);
    } catch {
        return false;
    }
};

const grantPremium = async (order, details) => {
    const paidOrder = await orderRepo.markPaid(order.id, details);
    if (!paidOrder) return false;
    await userRepo.setPremium(order.user_id, true);
    invalidateSession(order.user_id);
    return true;
};

export const createPremiumPaymentLink = async ({ userId, planId, returnUrl }) => {
    const plan = PREMIUM_PLANS[planId];
    if (!plan) throw new HttpError(400, 'Gói Premium không hợp lệ');
    if (!isValidReturnUrl(returnUrl)) throw new HttpError(400, 'returnUrl không hợp lệ');

    const client = getPayOS();
    const orderCode = generateOrderCode();
    const order = await orderRepo.create({
        user_id: userId,
        amount: plan.amount,
        order_code: orderCode,
        status: ORDER_STATUS.PENDING,
    });

    try {
        const paymentLink = await client.paymentRequests.create({
            orderCode,
            amount: plan.amount,
            description: `Premium ${plan.months} thang`,
            returnUrl,
            cancelUrl: returnUrl,
        });
        return { checkoutUrl: paymentLink.checkoutUrl, orderId: order.id };
    } catch (error) {
        await orderRepo.update(order.id, { status: ORDER_STATUS.CANCEL });
        throw new HttpError(502, `Không tạo được link thanh toán PayOS: ${error.message}`);
    }
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

    const granted = await grantPremium(order, {
        description: payment.description,
        counterAccountNumber: payment.counterAccountNumber,
    });
    if (!granted) return { processed: false, reason: 'already_processed' };
    return { processed: true, orderId: order.id, userId: order.user_id };
};

export const verifyOrderPayment = async ({ orderId, user }) => {
    const order = await orderRepo.getById(orderId);
    if (!order) throw new HttpError(404, 'Không tìm thấy đơn hàng');
    if (!isOwnerOrAdmin(user, order.user_id)) throw new HttpError(403, 'Bạn không có quyền thao tác đơn hàng này');

    if (order.status !== ORDER_STATUS.PAID) {
        const link = await getPayOS().paymentRequests.get(Number(order.order_code));
        if (link.status === 'PAID' && Number(link.amountPaid) >= Number(order.amount)) {
            const transaction = link.transactions?.at(-1);
            await grantPremium(order, {
                description: transaction?.description ?? order.description,
                counterAccountNumber: transaction?.counterAccountNumber ?? order.counterAccountNumber,
            });
        } else if (CLOSED_LINK_STATUSES.has(link.status) && order.status === ORDER_STATUS.PENDING) {
            await orderRepo.update(order.id, { status: ORDER_STATUS.CANCEL });
        }
    }

    const [latest, account] = await Promise.all([orderRepo.getById(order.id), userRepo.getAccount(order.user_id)]);
    return { orderId: latest.id, status: latest.status, is_premium: Boolean(account?.is_premium) };
};

export const cancelOwnOrder = async ({ orderId, user }) => {
    const order = await orderRepo.getById(orderId);
    if (!order) throw new HttpError(404, 'Không tìm thấy đơn hàng');
    if (String(order.user_id) !== String(user.id)) throw new HttpError(403, 'Bạn không có quyền thao tác đơn hàng này');
    if (order.status !== ORDER_STATUS.PENDING) throw new HttpError(400, 'Chỉ có thể hủy đơn hàng đang chờ thanh toán');
    try {
        await getPayOS().paymentRequests.cancel(Number(order.order_code), 'Người dùng hủy giao dịch');
    } catch (error) {
        console.warn(`[paymentService] Không hủy được link PayOS của đơn ${order.id}:`, error.message);
    }
    return orderRepo.update(orderId, { status: ORDER_STATUS.CANCEL });
};
