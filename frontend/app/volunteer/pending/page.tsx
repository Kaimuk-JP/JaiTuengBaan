'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getApiUrl } from '@/lib/api';
import Link from 'next/link';
import { Clock, RefreshCw, ShieldCheck, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Swal from '@/lib/swal';

export default function VolunteerPendingPage() {
    const router = useRouter();
    const { user, loading, refreshUser } = useAuth();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [myRequest, setMyRequest] = useState<any>(null);

    const checkStatus = useCallback(async () => {
        if (!user) return;

        if (user.role === 'DRIVE' || user.allowedRoles?.includes('DRIVE')) {
            router.push('/volunteer/driver');
            return;
        }
        if (user.role === 'CAREU' || user.allowedRoles?.includes('CAREU')) {
            router.push('/volunteer/careu/home');
            return;
        }

        try {
            const res = await fetch(`${getApiUrl()}/role-requests/my`, {
                credentials: 'include',
            });
            if (res.ok) {
                const data = await res.json();
                const latest = Array.isArray(data) && data.length > 0 ? data[0] : null;
                setMyRequest(latest);

                if (latest?.status === 'APPROVED') {
                    await Swal.fire({
                        icon: 'success',
                        title: 'คำขอของคุณได้รับการอนุมัติแล้ว!',
                        text: 'ระบบจะนำคุณเข้าสู่หน้าการทำงาน',
                        timer: 2000,
                        showConfirmButton: false,
                    });
                    await refreshUser();
                    if (latest.requestedRole === 'DRIVE') {
                        router.push('/volunteer/driver');
                    } else if (latest.requestedRole === 'CAREU') {
                        router.push('/volunteer/careu/home');
                    }
                }
            }
        } catch (err) {
            console.error('Check request status error:', err);
        }
    }, [user, router, refreshUser]);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
            return;
        }

        if (!loading && user) {
            checkStatus();
        }
    }, [user, loading, router, checkStatus]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await refreshUser();
            await checkStatus();
        } finally {
            setIsRefreshing(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-center">
                    <div className="relative w-16 h-16 mx-auto mb-4">
                        <div className="absolute inset-0 border-4 border-brand-primary/20 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-brand-primary rounded-full border-t-transparent animate-spin"></div>
                    </div>
                    <p className="text-xl font-medium text-gray-800">กำลังโหลด...</p>
                </div>
            </div>
        );
    }

    const requestedRoleName = myRequest?.requestedRole === 'DRIVE'
        ? 'เจ้าหน้าที่รถ (คนขับรถ)'
        : myRequest?.requestedRole === 'CAREU'
            ? 'จิตอาสาแคร์ยู'
            : (user?.role === 'CAREU' ? 'จิตอาสาแคร์ยู' : 'เจ้าหน้าที่รถ');

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-8">
            <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-smooth-medium border border-gray-100 text-center">
                <div className="w-20 h-20 mx-auto mb-5 bg-amber-50 border-2 border-amber-200 rounded-full flex items-center justify-center shadow-sm">
                    <Clock size={38} className="text-amber-500 animate-pulse" />
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    รอเทศบาลตรวจสอบและอนุมัติ
                </h1>
                <p className="text-sm text-gray-500 mb-6">
                    ระบบบันทึกข้อมูลการสมัครเรียบร้อยแล้ว
                </p>

                <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 sm:p-5 mb-6 text-left space-y-3">
                    <div className="flex items-center justify-between border-b border-amber-200/60 pb-3">
                        <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">บทบาทที่สมัคร</span>
                        <span className="text-sm font-bold text-brand-primary bg-brand-primary/10 px-2.5 py-0.5 rounded-full">
                            {requestedRoleName}
                        </span>
                    </div>

                    <div className="flex items-center justify-between border-b border-amber-200/60 pb-3">
                        <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">สถานะคำขอ</span>
                        <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                            รอการอนุมัติ (Pending)
                        </span>
                    </div>

                    <div className="pt-1 text-xs text-gray-600 space-y-2">
                        <div className="flex items-start gap-2">
                            <CheckCircle2 size={16} className="text-brand-primary flex-shrink-0 mt-0.5" />
                            <span>ข้อมูลและเอกสารของคุณถูกส่งไปยังเจ้าหน้าที่เทศบาลแล้ว</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <ShieldCheck size={16} className="text-brand-primary flex-shrink-0 mt-0.5" />
                            <span>เมื่อเจ้าหน้าที่เทศบาลตรวจสอบและอนุมัติแล้ว ระบบจะเปิดสิทธิ์การใช้งานให้คุณโดยอัตโนมัติ</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="w-full py-3.5 px-4 bg-brand-primary hover:bg-btn-hover text-white font-bold rounded-xl transition-all shadow-smooth-low flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                        <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
                        <span>{isRefreshing ? 'กำลังตรวจสอบ...' : 'ตรวจสอบสถานะการอนุมัติ'}</span>
                    </button>

                    <Link
                        href="/select-role?switch=true"
                        className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                        <ArrowLeft size={16} />
                        <span>กลับไปหน้าเลือกบทบาท</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
