'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getApiUrl } from '@/lib/api';

export default function AdminLoginPage() {
    const router = useRouter();
    const { user, loading, refreshUser } = useAuth();
    const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

    const [idCard, setIdCard] = useState('');
    const [phone, setPhone] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

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
            if (user.role === 'STAFF' || user.role === 'ADMIN') {
                router.push('/staff/dashboard');
            } else {
                router.push('/login');
            }
        }
    }, [user, loading, router, hasCheckedAuth]);

    const handleSubmit = async (e: React.FormEvent) => {
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
                router.push('/staff/dashboard');
            } else {
                setError(data.message || 'เลขบัตรประชาชนหรือเบอร์โทรศัพท์ไม่ถูกต้อง');
            }
        } catch {
            setError('ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองใหม่อีกครั้ง');
        } finally {
            setIsSubmitting(false);
        }
    };

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

    return (
        <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {}
            <div className="absolute inset-0 opacity-5"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
            />

            {}
            <div className="relative z-10 bg-white rounded-2xl shadow-2xl p-8 md:p-10 max-w-md w-full mx-4 border border-slate-200">
                {}
                <div className="text-center mb-8">
                    {}
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl mb-5 shadow-lg">
                        <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                        </svg>
                    </div>

                    <div className="inline-block px-3 py-1 bg-slate-100 rounded-full mb-4">
                        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">ระบบจัดการภายใน</span>
                    </div>

                    <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">
                        เข้าสู่ระบบสำหรับเจ้าหน้าที่
                    </h1>

                    <p className="text-slate-500 text-sm">
                        สำหรับเจ้าหน้าที่เทศบาลและผู้ดูแลระบบเท่านั้น
                    </p>
                </div>

                {}
                {error && (
                    <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5">
                        <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                        </svg>
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                )}

                {}
                <form onSubmit={handleSubmit} className="space-y-5">
                    {}
                    <div>
                        <label htmlFor="admin-idcard" className="block text-sm font-medium text-slate-700 mb-1.5">
                            เลขบัตรประชาชน
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Zm1.294 6.336a6.721 6.721 0 0 1-3.17.789 6.721 6.721 0 0 1-3.168-.789 3.376 3.376 0 0 1 6.338 0Z" />
                                </svg>
                            </div>
                            <input
                                id="admin-idcard"
                                type="text"
                                inputMode="numeric"
                                placeholder="x-xxxx-xxxxx-xx-x"
                                value={formatIdCard(idCard)}
                                onChange={(e) => setIdCard(e.target.value.replace(/\D/g, '').slice(0, 13))}
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all text-base tracking-wider"
                                disabled={isSubmitting}
                                autoComplete="off"
                            />
                        </div>
                    </div>

                    {}
                    <div>
                        <label htmlFor="admin-phone" className="block text-sm font-medium text-slate-700 mb-1.5">
                            เบอร์โทรศัพท์
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                                </svg>
                            </div>
                            <input
                                id="admin-phone"
                                type="text"
                                inputMode="tel"
                                placeholder="0xx-xxx-xxxx"
                                value={formatPhone(phone)}
                                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all text-base tracking-wider"
                                disabled={isSubmitting}
                                autoComplete="off"
                            />
                        </div>
                    </div>

                    {}
                    <button
                        type="submit"
                        disabled={isSubmitting || idCard.length !== 13 || phone.length !== 10}
                        className="w-full bg-gradient-to-r from-slate-700 to-slate-900 hover:from-slate-800 hover:to-slate-950 disabled:from-slate-300 disabled:to-slate-400 text-white font-semibold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2.5 transition-all duration-200 shadow-sm hover:shadow-lg disabled:cursor-not-allowed disabled:shadow-none"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                <span>กำลังเข้าสู่ระบบ...</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                                </svg>
                                <span>เข้าสู่ระบบ</span>
                            </>
                        )}
                    </button>
                </form>

                {}
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200"></div>
                    </div>
                </div>

                {}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                        </svg>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            กรุณาใช้เลขบัตรประชาชนและเบอร์โทรศัพท์ที่ลงทะเบียนไว้กับระบบ หากยังไม่มีสิทธิ์เข้าใช้งาน กรุณาติดต่อผู้ดูแลระบบ
                        </p>
                    </div>
                </div>

                {}
                <div className="mt-6 text-center">
                    <button
                        onClick={() => router.push('/login')}
                        className="text-sm text-slate-400 hover:text-slate-600 transition-colors inline-flex items-center gap-1"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                        </svg>
                        กลับหน้าเข้าสู่ระบบหลัก
                    </button>
                </div>
            </div>
        </div>
    );
}
