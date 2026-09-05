import dotenv from 'dotenv';
dotenv.config();
import Router from '@koa/router';
import bcrypt from 'bcryptjs';
import { userRepo } from '../repositories/userRepository.js';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabaseClient.js';

export async function createUser(ctx) {
    try {
        const { name, email, password } = ctx.request.body;
        if (!email || !password || !name) {
            ctx.throw(400, 'Thiếu thông tin bắt buộc (name, email, password)!');
        }
        if (password.length > 72) {
            ctx.throw(400, 'Mật khẩu không được vượt quá 72 ký tự!');
        }
        if (await userRepo.checkExistEmail(email)) {
            ctx.throw(400, 'Email đã được sử dụng!');
        }
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);
        const payload = {
            name,
            email,
            password_hash,
            role: "USER"
        };
        const newUser = await userRepo.create(payload);
        const token = jwt.sign(
            {
                id: newUser.id,
                email: newUser.email,
                role: newUser.role || 'USER',
                is_premium: false
            },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        delete newUser.password_hash;

        ctx.status = 200;
        ctx.body = { success: true, message: "Đăng nhập thành công!", token, user: newUser };

    } catch (error) {
        if (error.status === 400 || error.statusCode === 400 || error.code === '23505') {
            ctx.status = 400;
            ctx.body = {
                success: false,
                message: error.code === '23505' ? 'Email này đã được đăng ký trong hệ thống!' : error.message
            };
        } else {
            console.error("Lỗi hệ thống khi tạo user:", error);
            ctx.status = 500;
            ctx.body = {
                success: false,
                message: `Lỗi hệ thống khi tạo người dùng`,
                error_detail: error.message || "Unknown error"
            };
        }
    }
}

export async function login(ctx) {
    const { email, password } = ctx.request.body;

    if (!email || !password) {
        ctx.status = 400;
        ctx.body = { success: false, message: "Vui lòng nhập email và mật khẩu!" };
        return;
    }

    try {
        const { data: user, error } = await supabase.from('users').select('id, name, avatar, is_premium, password_hash, role').eq('email', email).single();
        if (error || !user) {
            ctx.status = 401;
            ctx.body = { success: false, message: "Email hoặc mật khẩu không đúng!" };
            return;
        }
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            ctx.status = 401;
            ctx.body = { success: false, message: "Email hoặc mật khẩu không đúng!" };
            return;
        }
        if (user.status === 'inactive') {
            ctx.status = 403;
            ctx.body = {
                success: false,
                message: "Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ Quản trị viên!"
            };
            return;
        }
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role || 'USER',
                is_premium: user.is_premium,
            },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        delete user.password_hash;

        ctx.status = 200;
        ctx.body = { success: true, message: "Đăng nhập thành công!", token, user };
    } catch (error) {
        console.error(error);
        ctx.status = 500;
        ctx.body = { success: false, message: "Lỗi máy chủ!" };
    }
}

export async function refreshToken(ctx) {
    try {
        const userId = ctx.state.user.id;
        const { data: user, error } = await supabase
            .from('users')
            .select('id, name, avatar, is_premium, role')
            .eq('id', userId)
            .single();
        if (error || !user) throw new Error("User not found");
        const newToken = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role || 'USER',
                is_premium: user.is_premium,
            },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );
        delete user.password_hash;
        ctx.status = 200;
        ctx.body = {
            success: true,
            token: newToken,
            user: user
        };
    } catch (error) {
        console.error("Lỗi tại refreshToken:", error);
        ctx.status = 500;
        ctx.body = { success: false, message: "Lỗi máy chủ!" };
    }
}