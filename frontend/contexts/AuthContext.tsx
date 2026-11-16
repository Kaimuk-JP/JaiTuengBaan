'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { getApiUrl } from '@/lib/api';
import { refreshToken } from '@/lib/auth';
import type { User } from '@/types/user';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    refreshUser: () => Promise<void>;
    sessionExpired: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_REFRESH_INTERVAL = 23 * 60 * 60 * 1000;
const VISIBILITY_REFRESH_COOLDOWN = 5 * 60 * 1000;
const AUTH_PROFILE_URL = `${getApiUrl()}/auth/profile`;

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [sessionExpired, setSessionExpired] = useState(false);
    const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const hasShownAlert = useRef(false);
    const isRefreshingRef = useRef(false);
    const lastRefreshTimeRef = useRef(0);

    const clearRefreshTimer = useCallback(() => {
        if (!refreshIntervalRef.current) return;
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
    }, []);

    const handleSessionExpiry = useCallback(async () => {
        if (hasShownAlert.current) return;
        hasShownAlert.current = true;
        setSessionExpired(true);
        setUser(null);
        clearRefreshTimer();

        const { default: Swal } = await import('@/lib/swal');
        await Swal.fire({
            icon: 'warning',
            title: 'เซสชันหมดอายุ',
            html: `
                <div style="text-align: center;">
                    <p style="font-size: 1rem; color: #555; margin-bottom: 4px;">เซสชันของคุณหมดอายุแล้ว</p>
                    <p style="font-size: 0.9rem; color: #888;">กรุณาเข้าสู่ระบบใหม่อีกครั้ง</p>
                </div>
            `,
            confirmButtonText: 'เข้าสู่ระบบใหม่',
            confirmButtonColor: '#1E7D55',
            allowOutsideClick: false,
            allowEscapeKey: false,
        });

        window.location.href = '/login';
    }, [clearRefreshTimer]);

    const performTokenRefresh = useCallback(async () => {
        if (!user || isRefreshingRef.current) return;
        isRefreshingRef.current = true;

        try {
            const refreshed = await refreshToken();
            if (!refreshed) {
                await handleSessionExpiry();
                return;
            }
            lastRefreshTimeRef.current = Date.now();
        } finally {
            isRefreshingRef.current = false;
        }
    }, [handleSessionExpiry, user]);

    const fetchUser = useCallback(async (options?: { setLoadingTrue?: boolean }) => {
        if (options?.setLoadingTrue) {
            setLoading(true);
        }

        try {
            const response = await fetch(AUTH_PROFILE_URL, { credentials: 'include' });

            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
                setSessionExpired(false);
                hasShownAlert.current = false;
                return;
            }

            if (response.status === 429) {
                console.warn('API rate limited (429) on /auth/profile');
                return;
            }

            if (response.status === 401) {
                const refreshed = await refreshToken();
                if (refreshed) {
                    const retryResponse = await fetch(AUTH_PROFILE_URL, { credentials: 'include' });
                    if (retryResponse.ok) {
                        const userData = await retryResponse.json();
                        setUser(userData);
                        setSessionExpired(false);
                        hasShownAlert.current = false;
                        return;
                    }
                    if (retryResponse.status === 429) {
                        console.warn('API rate limited (429) on /auth/profile retry');
                        return;
                    }
                }
            }

            setUser(null);
        } catch (error) {
            console.error('Error fetching user:', error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchUser();
    }, [fetchUser]);

    useEffect(() => {
        if (!user || sessionExpired) {
            clearRefreshTimer();
            return;
        }

        clearRefreshTimer();
        refreshIntervalRef.current = setInterval(() => {
            void performTokenRefresh();
        }, TOKEN_REFRESH_INTERVAL);

        const handleVisibilityChange = async () => {
            if (document.visibilityState !== 'visible') return;
            if (Date.now() - lastRefreshTimeRef.current < VISIBILITY_REFRESH_COOLDOWN) return;
            if (isRefreshingRef.current) return;

            try {
                const res = await fetch(AUTH_PROFILE_URL, { credentials: 'include' });
                if (res.ok) return;
                if (res.status === 401) {
                    void performTokenRefresh();
                }
            } catch {
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearRefreshTimer();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [clearRefreshTimer, performTokenRefresh, sessionExpired, user]);

    const refreshUser = useCallback(async () => {
        await fetchUser({ setLoadingTrue: true });
    }, [fetchUser]);

    return (
        <AuthContext.Provider value={{ user, loading, refreshUser, sessionExpired }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
