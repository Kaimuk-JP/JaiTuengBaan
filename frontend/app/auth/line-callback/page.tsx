'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { connectViaOauth, loginViaLine, consumeLineLoginNonce } from '@/lib/lineService';
import { useAuth } from '@/contexts/AuthContext';
import Swal from '@/lib/swal';
import { getApiUrl } from '@/lib/api';

type LineLoginOutcome = { success: boolean; message?: string; user?: any };
const lineLoginRuns = new Map<string, Promise<LineLoginOutcome>>();

function runLineLogin(code: string, nonce: string, redirectUri: string): Promise<LineLoginOutcome> {
    let run = lineLoginRuns.get(code);
    if (!run) {
        run = (async () => {
            if (!consumeLineLoginNonce(nonce)) {
                return { success: false, message: 'คำขอเข้าสู่ระบบไม่ถูกต้องหรือหมดอายุ กรุณาเข้าสู่ระบบใหม่' };
            }
            return loginViaLine(code, redirectUri);
        })();
        lineLoginRuns.set(code, run);
    }
    return run;
}

function LineCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { refreshUser, user } = useAuth();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [errorMessage, setErrorMessage] = useState('');
    const [isLogin, setIsLogin] = useState(false);
    const hasHandled = useRef(false);

    useEffect(() => {
        if (hasHandled.current) return;
        hasHandled.current = true;

        const processCallback = async () => {
            const code = searchParams.get('code');
            const error = searchParams.get('error');
            const errorDescription = searchParams.get('error_description');
            const state = searchParams.get('state');

            if (error) {
                setStatus('error');
                setErrorMessage(errorDescription || 'การเข้าสู่ระบบ LINE ถูกยกเลิกหรือไม่สำเร็จ');
                return;
            }

            if (!code) {
                setStatus('error');
                setErrorMessage('ไม่พบ authorization code จาก LINE');
                return;
            }

            let returnUrl = '/';
            let mode = '';
            let nonce = '';
            if (state) {
                try {
                    const parsed = JSON.parse(atob(state));
                    if (parsed?.returnUrl) {
                        returnUrl = parsed.returnUrl;
                    }
                    mode = parsed?.mode || '';
                    nonce = parsed?.nonce || '';
                } catch {
                }
            }

            if (mode === 'login') {
                setIsLogin(true);
                try {
                    const redirectUri = `${window.location.origin}/auth/line-callback`;
                    const result = await runLineLogin(code, nonce, redirectUri);
                    let u = result.user;
                    if (!result.success) {
                        const prof = await fetch(`${getApiUrl()}/auth/profile`, { credentials: 'include' }).catch(() => null);
                        if (prof && prof.ok) {
                            u = await prof.json().catch(() => undefined);
                        } else {
                            setStatus('error');
                            setErrorMessage(result.message || 'เข้าสู่ระบบด้วย LINE ไม่สำเร็จ');
                            return;
                        }
                    }
                    setStatus('success');
                    await refreshUser();
                    const safeReturn = returnUrl.startsWith('/') && !returnUrl.startsWith('//') && returnUrl !== '/' && !returnUrl.includes('/auth/') && !returnUrl.startsWith('/login');
                    if (safeReturn) {
                        router.replace(returnUrl);
                    } else if (u?.role === 'USERS') {
                        router.replace(u.phone ? '/elderly/home' : '/select-role');
                    } else if (u?.role === 'CAREGIVER') {
                        router.replace(u.phone ? '/caregiver/home' : '/select-role');
                    } else if (u?.role === 'DRIVE') {
                        router.replace('/volunteer/home');
                    } else if (u?.role === 'STAFF') {
                        router.replace('/staff/dashboard');
                    } else if (u?.role === 'ADMIN') {
                        router.replace('/admin/portals');
                    } else {
                        router.replace('/select-role');
                    }
                } catch (err: any) {
                    setStatus('error');
                    setErrorMessage(err?.message || 'ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองใหม่อีกครั้ง');
                }
                return;
            }

            try {
                const redirectUri = `${window.location.origin}/auth/line-callback`;
                const result = await connectViaOauth(code, redirectUri);

                if (result.success) {
                    setStatus('success');
                    await refreshUser();

                    await Swal.fire({
                        icon: 'success',
                        title: 'ผูกบัญชี LINE สำเร็จ!',
                        text: 'คุณจะได้รับการแจ้งเตือนคิวรถและข่าวสารผ่าน LINE ทันที',
                        showConfirmButton: false,
                        timer: 2500,
                    });

                    if (returnUrl === '/' || returnUrl.includes('/auth/')) {
                        if (user?.role === 'USERS') {
                            router.replace('/elderly/home');
                        } else if (user?.role === 'CAREGIVER') {
                            router.replace('/caregiver/home');
                        } else if (user?.role === 'DRIVE') {
                            router.replace('/volunteer/driver');
                        } else if (user?.role === 'CAREU') {
                            router.replace('/volunteer/careu');
                        } else if (user?.role === 'STAFF' || user?.role === 'ADMIN') {
                            router.replace('/staff/dashboard');
                        } else {
                            router.replace('/select-role');
                        }
                    } else {
                        router.replace(returnUrl);
                    }
                } else {
                    setStatus('error');
                    setErrorMessage(result.message || 'การเชื่อมต่อ LINE ไม่สำเร็จ');
                }
            } catch (err: any) {
                console.error('Error linking LINE:', err);
                setStatus('error');
                setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ LINE');
            }
        };

        processCallback();
    }, [searchParams, router, refreshUser, user]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F4FAF6] p-4">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-lg border border-slate-100 text-center">
                {status === 'loading' && (
                    <div className="py-6">
                        <div className="w-16 h-16 border-4 border-[#00C300] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <h2 className="text-lg font-bold text-gray-800">{isLogin ? 'กำลังเข้าสู่ระบบด้วย LINE...' : 'กำลังเชื่อมต่อ LINE...'}</h2>
                        <p className="text-xs text-gray-500 mt-2">{isLogin ? 'กรุณารอสักครู่' : 'กรุณารอสักครู่ ระบบกำลังบันทึกข้อมูลการผูกบัญชี'}</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="py-6">
                        <div className="w-16 h-16 rounded-full bg-[#E8F8EE] text-[#00C300] flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                            ✓
                        </div>
                        <h2 className="text-lg font-bold text-gray-800">{isLogin ? 'เข้าสู่ระบบสำเร็จ' : 'ผูกบัญชี LINE สำเร็จ'}</h2>
                        <p className="text-xs text-gray-500 mt-2">กำลังนำคุณกลับไปยังหน้าหลัก...</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="py-6">
                        <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                            ✕
                        </div>
                        <h2 className="text-lg font-bold text-gray-800">{isLogin ? 'เข้าสู่ระบบด้วย LINE ไม่สำเร็จ' : 'เชื่อมต่อ LINE ไม่สำเร็จ'}</h2>
                        <p className="text-xs text-red-600 mt-2 px-2">{errorMessage}</p>

                        <button
                            onClick={() => router.replace(isLogin ? '/login' : '/')}
                            className="mt-6 w-full bg-[#1E7D55] hover:bg-[#186846] text-white py-3 px-4 rounded-xl text-sm font-semibold transition-all shadow-md"
                        >
                            กลับไปหน้าหลัก
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function LineCallbackPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-[#F4FAF6]">
                    <div className="w-12 h-12 border-4 border-[#00C300] border-t-transparent rounded-full animate-spin"></div>
                </div>
            }
        >
            <LineCallbackContent />
        </Suspense>
    );
}
