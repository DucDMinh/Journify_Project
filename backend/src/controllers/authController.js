import { userRepo } from '../repositories/userRepository.js';
import { hashPassword, verifyPassword, signAccessToken, sanitizeUser, MAX_PASSWORD_LENGTH } from '../helpers/auth.js';
import { ok } from '../helpers/response.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const respondWithSession = (ctx, user, message, status = 200) => {
    ok(ctx, undefined, message, status, { token: signAccessToken(user), user: sanitizeUser(user) });
};

export const register = async (ctx) => {
    const { name, email, password } = ctx.request.body ?? {};
    ctx.assert(name && email && password, 400, 'Thiếu thông tin bắt buộc (name, email, password)!');
    ctx.assert(EMAIL_PATTERN.test(email), 400, 'Email không hợp lệ!');
    ctx.assert(password.length >= 6, 400, 'Mật khẩu phải có ít nhất 6 ký tự!');
    ctx.assert(password.length <= MAX_PASSWORD_LENGTH, 400, `Mật khẩu không được vượt quá ${MAX_PASSWORD_LENGTH} ký tự!`);
    ctx.assert(!(await userRepo.existsByEmail(email)), 409, 'Email đã được sử dụng!');

    const user = await userRepo.create({
        name: String(name).trim(),
        email: String(email).trim().toLowerCase(),
        password_hash: await hashPassword(password),
        role: 'USER',
    });
    respondWithSession(ctx, user, 'Đăng ký thành công!', 201);
};

export const login = async (ctx) => {
    const { email, password } = ctx.request.body ?? {};
    ctx.assert(email && password, 400, 'Vui lòng nhập email và mật khẩu!');

    const user = await userRepo.getByEmailWithSecret(String(email).trim().toLowerCase());
    const passwordMatches = user ? await verifyPassword(password, user.password_hash) : false;
    ctx.assert(user && passwordMatches, 401, 'Email hoặc mật khẩu không đúng!');
    ctx.assert(user.status !== 'inactive', 403, 'Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ Quản trị viên!');

    respondWithSession(ctx, user, 'Đăng nhập thành công!');
};

export const refreshToken = async (ctx) => {
    const user = await userRepo.getById(ctx.state.user.id);
    ctx.assert(user, 401, 'Tài khoản không còn tồn tại');
    ctx.assert(user.status !== 'inactive', 403, 'Tài khoản đã bị vô hiệu hóa');
    respondWithSession(ctx, user);
};
