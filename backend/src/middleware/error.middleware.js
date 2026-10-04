import { env } from '../config/env.js';

const POSTGRES_ERRORS = {
    '23505': { status: 409, message: 'Dữ liệu đã tồn tại trong hệ thống' },
    '23503': { status: 400, message: 'Dữ liệu tham chiếu không hợp lệ hoặc đang được sử dụng ở nơi khác' },
    '23502': { status: 400, message: 'Thiếu dữ liệu bắt buộc' },
    '23514': { status: 400, message: 'Dữ liệu không thỏa điều kiện cho phép' },
    '22P02': { status: 400, message: 'Dữ liệu gửi lên không đúng định dạng' },
    '22003': { status: 400, message: 'Giá trị số vượt quá giới hạn cho phép' },
    '22001': { status: 400, message: 'Dữ liệu văn bản quá dài' },
    '22007': { status: 400, message: 'Ngày giờ không hợp lệ' },
    '22008': { status: 400, message: 'Ngày giờ không hợp lệ' },
    'PGRST116': { status: 404, message: 'Không tìm thấy dữ liệu' },
};

const UPLOAD_ERRORS = {
    LIMIT_FILE_SIZE: 'Ảnh không được vượt quá 5MB',
    LIMIT_FILE_COUNT: 'Gửi quá nhiều file trong một lần',
    LIMIT_UNEXPECTED_FILE: 'Trường file không hợp lệ',
    LIMIT_PART_COUNT: 'Biểu mẫu có quá nhiều trường',
};

const BODY_ERRORS = {
    'entity.parse.failed': { status: 400, message: 'Dữ liệu JSON gửi lên không hợp lệ' },
    'entity.too.large': { status: 413, message: 'Dữ liệu gửi lên quá lớn' },
};

const knownError = (err) => {
    if (err.name === 'MulterError') return { status: 400, message: UPLOAD_ERRORS[err.code] ?? 'File tải lên không hợp lệ' };
    return BODY_ERRORS[err.type] ?? POSTGRES_ERRORS[err.code];
};

export const errorHandler = async (ctx, next) => {
    try {
        await next();
        if (ctx.status === 404 && ctx.body === undefined) {
            ctx.status = 404;
            ctx.body = { success: false, message: 'Không tìm thấy đường dẫn API' };
        }
    } catch (err) {
        const pgError = knownError(err);
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
