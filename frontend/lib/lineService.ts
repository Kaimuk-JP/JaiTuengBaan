import { fetchWithAuth } from './auth';
import { getApiUrl } from './api';

export interface LineProfile {
    lineUserId: string;
    displayName: string;
    pictureUrl?: string;
}

export interface LineStatusResponse {
    isLinked: boolean;
    lineUserId: string | null;
    lineDisplayName: string | null;
    linePictureUrl: string | null;
    lineConnectedAt: string | null;
    lineNotificationEnabled?: boolean;
    lineUseCustomOa?: boolean;
    lineBotBasicId?: string | null;
    customLiffId?: string | null;
    organizationName?: string | null;
    organizationId?: string | null;
}

export interface OrganizationLineOaConfig {
    lineUseCustomOa: boolean;
    lineChannelId: string;
    lineLiffId: string;
    lineBotBasicId: string;
    hasChannelSecret: boolean;
    hasChannelAccessToken: boolean;
    systemDefaults: {
        channelId: string;
        liffId: string;
        botBasicId: string;
    };
}

const RAW_LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID || '';
export const LIFF_ID = RAW_LIFF_ID.replace('https://liff.line.me/', '').trim();

export function isLineBrowser(): boolean {
    if (typeof window === 'undefined') return false;
    const ua = navigator.userAgent || '';
    return /Line\//i.test(ua);
}

export async function getLineConnectionStatus(): Promise<LineStatusResponse> {
    try {
        const res = await fetchWithAuth('/line-messaging/status');
        if (!res.ok) {
            return {
                isLinked: false,
                lineUserId: null,
                lineDisplayName: null,
                linePictureUrl: null,
                lineConnectedAt: null,
            };
        }
        return await res.json();
    } catch (e) {
        console.error('Failed to get LINE status:', e);
        return {
            isLinked: false,
            lineUserId: null,
            lineDisplayName: null,
            linePictureUrl: null,
            lineConnectedAt: null,
        };
    }
}

export async function getLineOAuthUrl(returnPath?: string, orgId?: string): Promise<string> {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const redirectUri = `${origin}/auth/line-callback`;
    const stateObj = {
        returnUrl: returnPath || (typeof window !== 'undefined' ? window.location.pathname : '/'),
        nonce: Math.random().toString(36).substring(2, 10),
    };
    const state = btoa(JSON.stringify(stateObj));

    const url = new URL(`${getApiUrl()}/line-messaging/auth-url`);
    url.searchParams.set('redirectUri', redirectUri);
    url.searchParams.set('state', state);
    if (orgId) {
        url.searchParams.set('orgId', orgId);
    }

    const res = await fetch(url.toString());

    if (!res.ok) {
        throw new Error('ไม่สามารถสร้าง URL สำหรับเข้าสู่ระบบ LINE ได้');
    }

    const data = await res.json();
    return data.authUrl;
}

const LINE_LOGIN_NONCE_KEY = 'line_login_nonce';
const LINE_LOGIN_NONCE_TTL_MS = 10 * 60 * 1000;

export async function startLineLogin(returnPath = '/'): Promise<void> {
    const redirectUri = `${window.location.origin}/auth/line-callback`;
    const bytes = new Uint8Array(16);
    window.crypto.getRandomValues(bytes);
    const nonce = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    localStorage.setItem(LINE_LOGIN_NONCE_KEY, JSON.stringify({ nonce, exp: Date.now() + LINE_LOGIN_NONCE_TTL_MS }));
    const state = btoa(JSON.stringify({ mode: 'login', returnUrl: returnPath, nonce }));

    const url = new URL(`${getApiUrl()}/line-messaging/auth-url`);
    url.searchParams.set('redirectUri', redirectUri);
    url.searchParams.set('state', state);
    const res = await fetch(url.toString());
    if (!res.ok) {
        throw new Error('ไม่สามารถสร้าง URL สำหรับเข้าสู่ระบบ LINE ได้');
    }
    const data = await res.json();
    window.location.href = data.authUrl;
}

export function consumeLineLoginNonce(nonce?: string): boolean {
    const raw = localStorage.getItem(LINE_LOGIN_NONCE_KEY);
    localStorage.removeItem(LINE_LOGIN_NONCE_KEY);
    if (!raw || !nonce) return false;
    try {
        const saved = JSON.parse(raw);
        return saved?.nonce === nonce && typeof saved?.exp === 'number' && Date.now() < saved.exp;
    } catch {
        return false;
    }
}

export async function loginViaLine(code: string, redirectUri: string): Promise<{ success: boolean; message?: string; user?: any }> {
    const res = await fetch(`${getApiUrl()}/auth/line-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code, redirectUri }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        return { success: false, message: data?.message || 'เข้าสู่ระบบด้วย LINE ไม่สำเร็จ' };
    }
    return { success: true, user: data.user };
}

export async function connectViaLiff(customLiffId?: string): Promise<{ success: boolean; message: string; user?: any }> {
    const activeLiffId = (customLiffId || LIFF_ID).replace('https://liff.line.me/', '').trim();
    if (!activeLiffId) {
        throw new Error('LIFF ID is not configured');
    }

    const liff = (await import('@line/liff')).default;
    await liff.init({ liffId: activeLiffId });

    if (!liff.isLoggedIn()) {
        liff.login({ redirectUri: window.location.href });
        return { success: false, message: 'กำลังเปลี่ยนทางไปยังหน้ายืนยันตัวตน LINE' };
    }

    const profile = await liff.getProfile();
    const idToken = liff.getIDToken();

    const res = await fetchWithAuth('/line-messaging/link-liff', {
        method: 'POST',
        body: JSON.stringify({
            idToken: idToken || undefined,
            lineUserId: profile.userId,
            displayName: profile.displayName,
            pictureUrl: profile.pictureUrl,
        }),
    });

    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.message || 'เชื่อมต่อ LINE ผ่าน LIFF ไม่สำเร็จ');
    }

    return data;
}

export async function connectViaOauth(code: string, redirectUri: string): Promise<{ success: boolean; message: string; user?: any }> {
    const res = await fetchWithAuth('/line-messaging/link-oauth', {
        method: 'POST',
        body: JSON.stringify({ code, redirectUri }),
    });

    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.message || 'เชื่อมต่อ LINE ไม่สำเร็จ');
    }

    return data;
}

export async function unlinkLineAccount(): Promise<{ success: boolean; message: string }> {
    const res = await fetchWithAuth('/line-messaging/unlink', {
        method: 'POST',
    });

    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.message || 'ยกเลิกการผูกบัญชีไม่สำเร็จ');
    }

    return data;
}

export async function getOrganizationLineOa(): Promise<OrganizationLineOaConfig> {
    const res = await fetchWithAuth('/settings/organization/line-oa');
    if (!res.ok) {
        throw new Error('ไม่สามารถโหลดการตั้งค่า LINE OA ของเทศบาลได้');
    }
    return res.json();
}

export async function updateOrganizationLineOa(data: {
    lineUseCustomOa: boolean;
    lineChannelId?: string;
    lineChannelSecret?: string;
    lineChannelAccessToken?: string;
    lineLiffId?: string;
    lineBotBasicId?: string;
}): Promise<OrganizationLineOaConfig> {
    const res = await fetchWithAuth('/settings/organization/line-oa', {
        method: 'PUT',
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'บันทึกการตั้งค่า LINE OA ไม่สำเร็จ');
    }
    return res.json();
}

export async function testOrganizationLineOaToken(accessToken: string): Promise<{
    success: boolean;
    bot?: {
        userId: string;
        basicId: string;
        displayName: string;
        pictureUrl?: string;
        chatMode?: string;
        markAsReadMode?: string;
    };
    error?: string;
}> {
    const res = await fetchWithAuth('/settings/organization/line-oa/test', {
        method: 'POST',
        body: JSON.stringify({ accessToken }),
    });
    return res.json();
}
