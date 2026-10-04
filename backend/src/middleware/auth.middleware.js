import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { userRepo } from '../repositories/userRepository.js';

const SESSION_TTL_MS = 30_000;
const sessionCache = new Map();

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

const loadSession = async (userId) => {
    const key = String(userId);
    const cached = sessionCache.get(key);
    if (cached && cached.expiresAt > Date.now()) return cached.session;
    const session = await userRepo.getSessionInfo(key);
    sessionCache.set(key, { session, expiresAt: Date.now() + SESSION_TTL_MS });
    return session;
};

export const invalidateSession = (userId) => {
    sessionCache.delete(String(userId));
};

const withFreshClaims = (user, session) => ({ ...user, role: session.role || 'USER', is_premium: Boolean(session.is_premium) });

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
    const session = await loadSession(user.id);
    if (!session) ctx.throw(401, 'Tài khoản không còn tồn tại!', { code: 'ACCOUNT_NOT_FOUND' });
    if (session.status === 'inactive') {
        ctx.throw(403, 'Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ Quản trị viên!', { code: 'ACCOUNT_DISABLED' });
    }
    ctx.state.user = withFreshClaims(user, session);
    await next();
};

export const optionalAuth = async (ctx, next) => {
    const token = extractToken(ctx);
    if (token) {
        const { user } = decodeToken(token);
        const session = user ? await loadSession(user.id) : null;
        if (session && session.status !== 'inactive') ctx.state.user = withFreshClaims(user, session);
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
