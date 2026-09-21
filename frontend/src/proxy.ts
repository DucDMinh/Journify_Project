import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify, type JWTPayload } from 'jose';

const ADMIN_HOST = process.env.NEXT_PUBLIC_ADMIN_HOST ?? 'admin.localhost';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
const PROTECTED_USER_ROUTES = ['/my-itinerary', '/settings', '/blog', '/profile'];
const FLASH_COOKIE_MAX_AGE = 10;

type TokenState =
    | { valid: true; payload: JWTPayload & { role?: string } }
    | { valid: false; reason: 'MISSING_TOKEN' | 'EXPIRED' | 'INVALID' };

async function verifyAuthToken(token: string | undefined): Promise<TokenState> {
    if (!token) return { valid: false, reason: 'MISSING_TOKEN' };
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        console.error('JWT_SECRET chưa được cấu hình cho frontend proxy');
        return { valid: false, reason: 'INVALID' };
    }
    try {
        const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
        return { valid: true, payload };
    } catch (error) {
        const code = (error as { code?: string }).code;
        return { valid: false, reason: code === 'ERR_JWT_EXPIRED' ? 'EXPIRED' : 'INVALID' };
    }
}

const clearSession = (response: NextResponse, toastError?: string) => {
    response.cookies.delete('accessToken');
    response.cookies.set('clear_storage', 'true', { path: '/', maxAge: FLASH_COOKIE_MAX_AGE });
    if (toastError) response.cookies.set('toast_error', toastError, { path: '/', maxAge: FLASH_COOKIE_MAX_AGE });
    return response;
};

export async function proxy(request: NextRequest) {
    const url = request.nextUrl;
    const hostname = (request.headers.get('host') ?? '').split(':')[0];
    const auth = await verifyAuthToken(request.cookies.get('accessToken')?.value);

    if (hostname === ADMIN_HOST) {
        if (url.pathname.startsWith('/auth/signin')) {
            return NextResponse.rewrite(new URL(`/admin${url.pathname}`, request.url));
        }
        if (!auth.valid) {
            const toastError = auth.reason === 'EXPIRED' ? 'TOKEN_EXPIRED' : 'unauthorized';
            return clearSession(NextResponse.redirect(new URL('/auth/signin', request.url)), toastError);
        }
        if (auth.payload.role !== 'ADMIN') {
            return NextResponse.redirect(new URL('/', APP_URL));
        }
        const targetPath = url.pathname === '/' ? '/admin' : `/admin${url.pathname}`;
        return NextResponse.rewrite(new URL(targetPath, request.url));
    }

    if (url.pathname.startsWith('/admin')) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    const isProtectedRoute = PROTECTED_USER_ROUTES.some((route) => url.pathname.startsWith(route));

    if (!auth.valid && (auth.reason !== 'MISSING_TOKEN' || isProtectedRoute)) {
        const response = isProtectedRoute
            ? NextResponse.redirect(new URL('/auth/signin', request.url))
            : NextResponse.next();
        const toastError = auth.reason === 'EXPIRED' ? 'TOKEN_EXPIRED' : isProtectedRoute ? 'unauthorized' : undefined;
        return clearSession(response, toastError);
    }

    if (!url.pathname.startsWith('/user')) {
        const targetPath = url.pathname === '/' ? '/user' : `/user${url.pathname}`;
        return NextResponse.rewrite(new URL(targetPath, request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
