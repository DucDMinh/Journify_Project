
import jwt from 'jsonwebtoken';

export const verifyToken = async (ctx, next) => {
    let token;
    const authHeader = ctx.request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    }
    else if (ctx.cookies.get('accessToken')) {
        token = ctx.cookies.get('accessToken');
    }
    if (!token) {
        ctx.status = 401;
        ctx.body = { success: false, message: "Không tìm thấy Token, vui lòng đăng nhập!" };
        return;
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        ctx.state.user = decoded;
        await next();
    } catch (error) {
        console.log("CHI TIẾT LỖI JWT:", error.name, error.message);
        ctx.status = 401;
        if (error.name === 'TokenExpiredError') {
            ctx.body = {
                success: false,
                code: 'TOKEN_EXPIRED',
                message: 'Token đã hết hạn, vui lòng làm mới token!',
                expiredAt: error.expiredAt
            };
            return;
        }
        ctx.body = {
            success: false,
            code: 'INVALID_TOKEN',
            message: 'Token không hợp lệ!'
        };
    }
};

export const requireAdmin = async (ctx, next) => {
    const user = ctx.state.user;
    if (!user || user.role !== 'ADMIN') {
        ctx.status = 403;
        ctx.body = {
            success: false,
            message: "Từ chối truy cập: Bạn không có quyền Quản trị viên!"
        };
        return;
    }
    await next();
};

export const requirePremium = async (ctx, next) => {
    const user = ctx.state.user;
    if (!user || !user.is_premium) {
        ctx.status = 403;
        ctx.body = {
            success: false,
            message: "Từ chối truy cập: Tính năng dành riêng cho hội viên Premium!",
            user: user
        };
        return;
    }
    await next();
}