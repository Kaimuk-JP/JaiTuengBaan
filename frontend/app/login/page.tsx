'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getApiUrl } from '@/lib/api';
import { startLineLogin } from '@/lib/lineService';

export default function LoginPage() {
    const router = useRouter();
    const { user, loading, refreshUser } = useAuth();
    const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
    const [isAutoLoggingIn, setIsAutoLoggingIn] = useState(false);

    const [idCard, setIdCard] = useState('');
    const [phone, setPhone] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
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

    const formatIdCard = (value: string) => {
        const digits = value.replace(/\D/g, '').slice(0, 13);
        if (digits.length <= 1) return digits;
        if (digits.length <= 5) return `${digits[0]}-${digits.slice(1)}`;
        if (digits.length <= 10) return `${digits[0]}-${digits.slice(1, 5)}-${digits.slice(5)}`;
        if (digits.length <= 12) return `${digits[0]}-${digits.slice(1, 5)}-${digits.slice(5, 10)}-${digits.slice(10)}`;
        return `${digits[0]}-${digits.slice(1, 5)}-${digits.slice(5, 10)}-${digits.slice(10, 12)}-${digits[12]}`;
    };

    const formatPhone = (value: string) => {
        const digits = value.replace(/\D/g, '').slice(0, 10);
        if (digits.length <= 3) return digits;
        if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
        return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    };

    const handleIdPhoneLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const cleanIdCard = idCard.replace(/\D/g, '');
        if (cleanIdCard.length !== 13) {
            setError('กรุณากรอกเลขบัตรประชาชน 13 หลัก');
            return;
        }

        const cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.length !== 10) {
            setError('กรุณากรอกเบอร์โทรศัพท์ 10 หลัก');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch(`${getApiUrl()}/auth/admin-login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    idCard: cleanIdCard,
                    phone: cleanPhone,
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                await refreshUser();
                const role = data.user?.role;
                if (role === 'USERS' || role === 'CAREGIVER') {
                    router.push('/select-role');
                } else if (role === 'DRIVE') {
                    router.push('/volunteer/home');
                } else if (role === 'STAFF') {
                    router.push('/staff/dashboard');
                } else if (role === 'ADMIN') {
                    router.push('/admin/portals');
                } else {
                    router.push('/select-role');
                }
            } else {
                setError(data.message || 'เลขบัตรประชาชนหรือเบอร์โทรศัพท์ไม่ถูกต้อง');
            }
        } catch {
            setError('ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองใหม่อีกครั้ง');
        } finally {
            setIsSubmitting(false);
        }
    };

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
            {}
            <div className="flex flex-col items-center justify-center pt-8 pb-10 px-4 shrink-0">
                {}
                <div className="relative w-20 h-20 mb-3">
                    <img src="/Assets/logo.png" alt="โลโก้ใจส่งถึงบ้าน" className="w-full h-full object-contain drop-shadow-lg" />
                </div>
                <h1 className="text-white text-lg font-semibold tracking-wide">
                    ใจส่งถึงบ้าน
                </h1>
            </div>

            {}
            <div className="flex-1 bg-white rounded-t-[2rem] px-5 pt-6 pb-6 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
                <div className="max-w-md mx-auto">
                    {}
                    <div className="text-center mb-4">
                        <h2 className="text-xl font-bold text-[#2E7D55] mb-0.5">
                            ยินดีต้อนรับ
                        </h2>
                        <p className="text-gray-500 text-sm">
                            เข้าสู่ระบบเพื่อเริ่มใช้งาน
                        </p>
                    </div>

                    {}
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

                    {}
                    <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white text-gray-400">หรือ</span>
                        </div>
                    </div>

                    {}
                    {error && (
                        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
                            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                            </svg>
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    {}
                    <form onSubmit={handleIdPhoneLogin} className="space-y-3">
                        {}
                        <div>
                            <label htmlFor="login-idcard" className="block text-sm font-medium text-gray-700 mb-1">
                                เลขบัตรประชาชน
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Zm1.294 6.336a6.721 6.721 0 0 1-3.17.789 6.721 6.721 0 0 1-3.168-.789 3.376 3.376 0 0 1 6.338 0Z" />
                                    </svg>
                                </div>
                                <input
                                    id="login-idcard"
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="x-xxxx-xxxxx-xx-x"
                                    value={formatIdCard(idCard)}
                                    onChange={(e) => setIdCard(e.target.value.replace(/\D/g, '').slice(0, 13))}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2E7D55] focus:border-transparent transition-all text-base tracking-wider"
                                    disabled={isSubmitting}
                                    autoComplete="off"
                                />
                            </div>
                        </div>

                        {}
                        <div>
                            <label htmlFor="login-phone" className="block text-sm font-medium text-gray-700 mb-1">
                                เบอร์โทรศัพท์
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                                    </svg>
                                </div>
                                <input
                                    id="login-phone"
                                    type="text"
                                    inputMode="tel"
                                    placeholder="0xx-xxx-xxxx"
                                    value={formatPhone(phone)}
                                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2E7D55] focus:border-transparent transition-all text-base tracking-wider"
                                    disabled={isSubmitting}
                                    autoComplete="off"
                                />
                            </div>
                        </div>

                        {}
                        <button
                            type="submit"
                            disabled={isSubmitting || idCard.length !== 13 || phone.length !== 10}
                            className="w-full bg-[#2E7D55] hover:bg-[#256B48] disabled:bg-gray-300 disabled:text-gray-500 text-white font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2.5 transition-all duration-200 shadow-md hover:shadow-lg disabled:cursor-not-allowed disabled:shadow-none text-base"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                    <span>กำลังเข้าสู่ระบบ...</span>
                                </>
                            ) : (
                                <span>เข้าสู่ระบบ</span>
                            )}
                        </button>
                    </form>

                    {}

                    {}
                    <div className="mt-3 text-center">
                        <p className="text-gray-400 text-xs">กรุณาเลือกวิธีการเข้าสู่ระบบที่คุณสะดวก</p>
                    </div>
                </div>
            </div>
        </div>
    );
}