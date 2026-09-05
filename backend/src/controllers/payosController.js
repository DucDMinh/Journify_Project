import { PayOS } from "@payos/node";
import dotenv from 'dotenv';
import { orderRepo } from "../repositories/orderRepository.js";
import { supabase } from "../config/supabaseClient.js"
dotenv.config();

const payOS = new PayOS({
    clientId: process.env.PAYOS_CLIENT_ID,
    apiKey: process.env.PAYOS_API_KEY,
    checksumKey: process.env.PAYOS_CHECKSUM_KEY,
});

export async function CreateEmbeddedPaymentLink(ctx) {
    try {
        const { selectedPlan, userId, returnUrl } = ctx.request.body;
        const amount = selectedPlan * 1000;
        const orderCode = Number(String(Date.now()).slice(-6));
        const { data: order, error: dbError } = await supabase
            .from('orders')
            .insert([{
                user_id: userId,
                amount: amount,
                order_code: orderCode,
                status: 'PENDING'
            }])
            .select()
            .single();

        if (dbError) throw new Error("Lỗi khi lưu đơn hàng vào CSDL");
        const body = {
            orderCode: orderCode,
            amount: amount,
            description: 'Nang cap Premium',
            returnUrl: returnUrl,
            cancelUrl: returnUrl,
        };

        const paymentLinkResponse = await payOS.paymentRequests.create(body);
        ctx.status = 200;
        ctx.body = {
            success: true,
            checkoutUrl: paymentLinkResponse.checkoutUrl,
            orderId: order.id
        };

    } catch (error) {
        console.error("Lỗi:", error);
        ctx.status = 500;
        ctx.body = { success: false, message: error.message };
    }
}

export async function ReceiveWebhook(ctx) {
    const webhookData = ctx.request.body;
    try {
        const paymentData = await payOS.webhooks.verify(webhookData);
        console.log('paymentData: ', paymentData);
        if (webhookData.code === '00') {
            const orderCode = paymentData.orderCode;
            const { data: order, error: fetchError } = await supabase
                .from('orders')
                .select('*')
                .eq('order_code', orderCode)
                .single();
            if (fetchError) throw new Error("Không tìm thấy đơn hàng trong DB");
            if (order && order.status === 'PENDING') {
                await supabase
                    .from('orders')
                    .update({ status: 'PAID', description: paymentData.description, counterAccountNumber: paymentData.counterAccountNumber })
                    .eq('id', order.id);
                await supabase
                    .from('users')
                    .update({ is_premium: true })
                    .eq('id', order.user_id);
                console.log(`Đã cấp Premium thành công cho user: ${order.user_id}`);
            } else {
                console.log(`Đơn hàng ${orderCode} đã được xử lý trước đó.`);
            }
        }
        ctx.status = 200;
        ctx.body = {
            success: true,
            message: "Webhook processed successfully"
        };

    } catch (error) {
        console.error("Lỗi xác thực hoặc xử lý Webhook:", error);
        ctx.status = 200;
        ctx.body = {
            success: false,
            message: "Invalid webhook or processing error"
        };
    }
}