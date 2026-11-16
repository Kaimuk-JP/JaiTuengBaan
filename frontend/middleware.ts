import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PREFIXES = [
    '/elderly',
    '/caregiver',
    '/volunteer',
    '/staff',
    '/admin',
    '/select-role',
];

const PUBLIC_PATHS = [
    '/login',
    '/auth',
    '/api',
    '/server-error',
    '/debug',
    '/map',
];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/Assets') ||
        pathname.includes('.')
    ) {
        return NextResponse.next();
    }

    const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
    if (isPublic || pathname === '/') {
        return NextResponse.next();
    }

    const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
    if (!isProtected) {
        return NextResponse.next();
    }

    const accessToken = request.cookies.get('access_token')?.value;
    const refreshToken = request.cookies.get('refresh_token')?.value;

    const isValidJwt = (token: string | undefined): boolean => {
        if (!token) return false;
        const parts = token.split('.');
        if (parts.length !== 3) return false;

        try {
            const payload = JSON.parse(atob(parts[1]));
            if (payload.exp && payload.exp * 1000 < Date.now()) {
                return false;
            }
            return true;
        } catch {
            return false;
        }
    };

    const isAccessTokenValid = isValidJwt(accessToken);
    const isRefreshTokenValid = isValidJwt(refreshToken);

    if (!isAccessTokenValid && !isRefreshTokenValid) {
        const loginUrl = new URL('/login', request.url);
        const response = NextResponse.redirect(loginUrl);
        response.cookies.delete('access_token');
        response.cookies.delete('refresh_token');
        return response;
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
