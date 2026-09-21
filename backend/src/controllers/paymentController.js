import { createPremiumPaymentLink, handlePaymentWebhook } from '../services/paymentService.js';
import { ok } from '../helpers/response.js';

export const createPremiumPayment = async (ctx) => {
    const { planId, returnUrl } = ctx.request.body ?? {};
    const result = await createPremiumPaymentLink({
        userId: ctx.state.user.id,
        planId: Number(planId),
        returnUrl,
    });
    ok(ctx, undefined, undefined, 200, result);
};

export const receiveWebhook = async (ctx) => {
    const result = await handlePaymentWebhook(ctx.request.body);
    if (result.processed) console.log(`Đã cấp Premium cho user ${result.userId} (order ${result.orderId})`);
    ok(ctx, result, 'Webhook processed');
};
