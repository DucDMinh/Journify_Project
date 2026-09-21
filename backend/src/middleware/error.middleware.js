import { env } from '../config/env.js';

const POSTGRES_ERRORS = {
    '23505': { status: 409, message: 'Dữ liệu đã tồn tại trong hệ thống' },
    '23503': { status: 400, message: 'Dữ liệu tham chiếu không hợp lệ' },
    '22P02': { status: 400, message: 'Định dạng ID không hợp lệ' },
    'PGRST116': { status: 404, message: 'Không tìm thấy dữ liệu' },
};

export const errorHandler = async (ctx, next) => {
    try {
        await next();
    } catch (err) {
        const pgError = POSTGRES_ERRORS[err.code];
        const status = err.status || pgError?.status || 500;
        const message = status >= 500
            ? 'Lỗi hệ thống, vui lòng thử lại sau'
            : (pgError?.message || err.message);

        ctx.status = status;
        ctx.body = { success: false, message };
        if (err.code && typeof err.code === 'string' && !pgError) ctx.body.code = err.code;
        if (status >= 500) {
            if (!env.isProduction) ctx.body.error_detail = err.message;
            console.error(`[${ctx.method} ${ctx.path}]`, err);
        }
    }
};
