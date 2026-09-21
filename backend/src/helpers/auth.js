import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const MAX_PASSWORD_LENGTH = 72;

export const hashPassword = (password) => bcrypt.hash(password, 10);

export const verifyPassword = (password, hash) => bcrypt.compare(password, hash);

export const signAccessToken = (user) =>
    jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role || 'USER',
            is_premium: Boolean(user.is_premium),
        },
        env.jwtSecret,
        { expiresIn: env.jwtExpiresIn },
    );

export const sanitizeUser = (user) => {
    if (!user) return user;
    const { password_hash, ...safe } = user;
    return safe;
};
