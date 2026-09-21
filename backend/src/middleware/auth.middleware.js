import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

const extractToken = (ctx) => {
    const authHeader = ctx.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);
    return ctx.cookies.get('accessToken') || null;
};

const decodeToken = (token) => {
    try {
        return { user: jwt.verify(token, env.jwtSecret) };
    } catch (error) {
        return { error };
    }
};

export const verifyToken = async (ctx, next) => {
    const token = extractToken(ctx);
    ctx.assert(token, 401, 'Không tìm thấy Token, vui lòng đăng nhập!');

    const { user, error } = decodeToken(token);
    if (error?.name === 'TokenExpiredError') {
        ctx.throw(401, 'Token đã hết hạn, vui lòng đăng nhập lại!', { code: 'TOKEN_EXPIRED' });
    }
    if (error) {
        ctx.throw(401, 'Token không hợp lệ!', { code: 'INVALID_TOKEN' });
    }
    ctx.state.user = user;
    await next();
};

export const optionalAuth = async (ctx, next) => {
    const token = extractToken(ctx);
    if (token) {
        const { user } = decodeToken(token);
        if (user) ctx.state.user = user;
    }
    await next();
};

export const requireAdmin = async (ctx, next) => {
    ctx.assert(ctx.state.user?.role === 'ADMIN', 403, 'Từ chối truy cập: Bạn không có quyền Quản trị viên!');
    await next();
};

export const requirePremium = async (ctx, next) => {
    ctx.assert(ctx.state.user?.is_premium, 403, 'Tính năng dành riêng cho hội viên Premium!');
    await next();
};

export const isAdmin = (user) => user?.role === 'ADMIN';

export const isOwnerOrAdmin = (user, ownerId) =>
    Boolean(user) && (isAdmin(user) || String(user.id) === String(ownerId));
