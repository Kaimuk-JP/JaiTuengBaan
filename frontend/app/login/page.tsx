'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { startLineLogin } from '@/lib/lineService';

export default function LoginPage() {
    const router = useRouter();
    const { user, loading, refreshUser } = useAuth();
    const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
    const [isAutoLoggingIn, setIsAutoLoggingIn] = useState(false);

    const [error, setError] = useState('');

    const [isLineLoading, setIsLineLoading] = useState(false);

    const lineLogin = useCallback(async () => {
        setError('');
        setIsLineLoading(true);
        try {
            await startLineLogin('/');
        } catch (e: any) {
            setIsLineLoading(false);
            setIsAutoLoggingIn(false);
            setError(e?.message || 'ไม่สามารถเริ่มเข้าสู่ระบบด้วย LINE ได้ กรุณาลองใหม่อีกครั้ง');
        }
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('autoLine') === '1') {
                setIsAutoLoggingIn(true);
                lineLogin();
            }
        }
    }, [lineLogin]);

    useEffect(() => {
        const checkAuth = async () => {
            await refreshUser();
            setHasCheckedAuth(true);
        };
        checkAuth();
    }, [refreshUser]);

    useEffect(() => {
        if (!hasCheckedAuth || loading) return;

        if (user) {
            if (user.role === 'USERS' || user.role === 'CAREGIVER') {
                router.replace('/select-role');
            } else if (user.role === 'DRIVE') {
                router.replace('/volunteer/home');
            } else if (user.role === 'STAFF') {
                router.replace('/staff/dashboard');
            } else if (user.role === 'ADMIN') {
                router.replace('/admin/portals');
            }
        }
    }, [user, loading, router, hasCheckedAuth]);

    if (isAutoLoggingIn) {
        return (
            <div className="relative min-h-screen flex items-center justify-center bg-white">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#2E7D55] border-t-transparent mx-auto mb-4"></div>
                    <p className="text-gray-500">กำลังเข้าสู่ระบบ...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-[#2E7D55] overflow-y-auto">
            <div className="flex flex-col items-center justify-center pt-8 pb-10 px-4 shrink-0">
                <div className="relative w-20 h-20 mb-3">
                    <img src="/Assets/logo.png" alt="โลโก้ใจส่งถึงบ้าน" className="w-full h-full object-contain drop-shadow-lg" />
                </div>
                <h1 className="text-white text-lg font-semibold tracking-wide">
                    ใจส่งถึงบ้าน
                </h1>
            </div>

            <div className="flex-1 bg-white rounded-t-[2rem] px-5 pt-6 pb-6 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
                <div className="max-w-md mx-auto">
                    <div className="text-center mb-4">
                        <h2 className="text-xl font-bold text-[#2E7D55] mb-0.5">
                            ยินดีต้อนรับ
                        </h2>
                        <p className="text-gray-500 text-sm">
                            เข้าสู่ระบบเพื่อเริ่มใช้งาน
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={lineLogin}
                        disabled={isLineLoading}
                        className="w-full bg-[#06C755] hover:bg-[#05b34c] disabled:opacity-70 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-3 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                        {isLineLoading ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        ) : (
                            <svg className="w-7 h-7 flex-shrink-0" viewBox="0 0 48 44" aria-hidden="true">
                                <ellipse cx="24" cy="19" rx="22" ry="17" fill="#fff" />
                                <path d="M14 33 L21 36 L11 42 Z" fill="#fff" />
                                <g fill="none" stroke="#06C755" strokeWidth="3.2" strokeLinejoin="miter">
                                    <path d="M7.5 13.5V24.5H12.5" />
                                    <path d="M17 13.5V24.5" />
                                    <path d="M21.5 24.5V13.5L28 24.5V13.5" />
                                    <path d="M38.5 13.5H32.5V24.5H38.5M32.5 19H37.5" />
                                </g>
                            </svg>
                        )}
                        <span className="text-base font-semibold">เข้าสู่ระบบด้วย LINE</span>
                    </button>

                    {error && (
                        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
                            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                            </svg>
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}