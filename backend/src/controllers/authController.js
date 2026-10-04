import { userRepo } from '../repositories/userRepository.js';
import { hashPassword, verifyPassword, signAccessToken, sanitizeUser, MAX_PASSWORD_LENGTH } from '../helpers/auth.js';
import { normalizeEmail, isValidEmail, MIN_PASSWORD_LENGTH, MAX_NAME_LENGTH } from '../helpers/validators.js';
import { ok } from '../helpers/response.js';
import { invalidateSession } from '../middleware/auth.middleware.js';

const respondWithSession = (ctx, user, message, status = 200) => {
    invalidateSession(user.id);
    ok(ctx, undefined, message, status, { token: signAccessToken(user), user: sanitizeUser(user) });
};

export const register = async (ctx) => {
    const { name, email, password } = ctx.request.body ?? {};
    ctx.assert(name && email && password, 400, 'Thiếu thông tin bắt buộc (name, email, password)!');
    const cleanName = String(name).trim();
    const cleanEmail = normalizeEmail(email);
    ctx.assert(cleanName && cleanName.length <= MAX_NAME_LENGTH, 400, `Họ tên không được để trống và tối đa ${MAX_NAME_LENGTH} ký tự!`);
    ctx.assert(isValidEmail(cleanEmail), 400, 'Email không hợp lệ!');
    ctx.assert(typeof password === 'string' && password.length >= MIN_PASSWORD_LENGTH, 400, `Mật khẩu phải có ít nhất ${MIN_PASSWORD_LENGTH} ký tự!`);
    ctx.assert(password.length <= MAX_PASSWORD_LENGTH, 400, `Mật khẩu không được vượt quá ${MAX_PASSWORD_LENGTH} ký tự!`);
    ctx.assert(!(await userRepo.existsByEmail(cleanEmail)), 409, 'Email đã được sử dụng!');

    const user = await userRepo.create({
        name: cleanName,
        email: cleanEmail,
        password_hash: await hashPassword(password),
        role: 'USER',
    });
    respondWithSession(ctx, user, 'Đăng ký thành công!', 201);
};

export const login = async (ctx) => {
    const { email, password } = ctx.request.body ?? {};
    ctx.assert(email && password, 400, 'Vui lòng nhập email và mật khẩu!');

    const user = await userRepo.getByEmailWithSecret(normalizeEmail(email));
    const passwordMatches = user && typeof password === 'string' ? await verifyPassword(password, user.password_hash) : false;
    ctx.assert(user && passwordMatches, 401, 'Email hoặc mật khẩu không đúng!');
    ctx.assert(user.status !== 'inactive', 403, 'Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ Quản trị viên!');

    respondWithSession(ctx, user, 'Đăng nhập thành công!');
};

export const refreshToken = async (ctx) => {
    const user = await userRepo.getAccount(ctx.state.user.id);
    ctx.assert(user, 401, 'Tài khoản không còn tồn tại');
    ctx.assert(user.status !== 'inactive', 403, 'Tài khoản đã bị vô hiệu hóa');
    respondWithSession(ctx, user);
};
