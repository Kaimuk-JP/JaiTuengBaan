'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ElderlySidebar from '../sidebar/ElderlySidebar';
import ElderlyHeader from '../header/ElderlyHeader';
import { User } from '../types';
import { useAuth } from '@/contexts/AuthContext';
import { fetchWithAuth } from '@/lib/auth';
import LatestQueueCard from './LatestQueueCard';
import Swal from '@/lib/swal';
import { homeCardIcon } from '@/components/shared/menuIcons';

export default function HomeContent() {
    const { user, loading } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [orgPhone, setOrgPhone] = useState<string | null>(null);

    useEffect(() => {
        fetchWithAuth('/settings/organization/phone')
            .then(res => res.ok ? res.json() : null)
            .then(data => { if (data?.phone) setOrgPhone(data.phone); })
            .catch(() => {});
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F5F5F5] dark:bg-gray-900 font-sans pb-24">

            {}
            <ElderlySidebar user={user} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {}
            <div className="bg-gradient-to-bl from-[#3AAE7D] to-[#346D55] dark:from-slate-800 dark:to-slate-900 relative text-white">
                {}
                <ElderlyHeader user={user} onToggleSidebar={() => setSidebarOpen(true)} />

                {}
                <div className="px-6 pt-2 pb-[140px]">
                    <div>
                        <h1 className="text-[1.375rem] leading-[1.4] tracking-wide">
                            <span className="font-medium">ยินดีต้อนรับสู่ระบบ</span><br />
                            <span className="font-normal text-xl">ใจส่งถึงบ้าน</span>
                        </h1>
                    </div>
                </div>
            </div>

            {}
            <div className="px-5 -mt-[110px] relative z-10 max-w-md mx-auto">
                <div className="bg-white dark:bg-gray-800 rounded-[24px] p-4 shadow-sm border border-slate-100 dark:border-gray-700 flex flex-col gap-3">

                    {}
                    <Link href="/elderly/booking" className="w-full bg-brand-primary text-white rounded-xl py-3.5 px-4 flex items-center justify-between active:scale-[0.98] transition-transform">
                        <div className="flex items-center gap-3">
                            {homeCardIcon('calendar-plus', 'w-8 h-8 shrink-0')}
                            <span className="font-bold text-[0.9375rem]">จองรถรับส่ง</span>
                        </div>
                        <svg className="w-5 h-5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                    </Link>

                    {}
                    <Link href="/elderly/confirm" className="w-full bg-[#F8F9FA] dark:bg-gray-700 hover:bg-[#F0F2F5] dark:hover:bg-gray-600 text-slate-800 dark:text-gray-100 rounded-xl py-3.5 px-4 flex items-center justify-between active:scale-[0.98] transition-transform border border-slate-100 dark:border-gray-600">
                        <div className="flex items-center gap-3">
                            {homeCardIcon('clipboard-list', 'w-7 h-7 shrink-0 text-[#1E7D55]')}
                            <span className="font-bold text-[0.9375rem]">รายการจองคิวรถ</span>
                        </div>
                        <svg className="w-5 h-5 text-slate-400 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                    </Link>

                    {}
                    <Link href="/elderly/history" className="w-full bg-[#F8F9FA] dark:bg-gray-700 hover:bg-[#F0F2F5] dark:hover:bg-gray-600 text-slate-800 dark:text-gray-100 rounded-xl py-3.5 px-4 flex items-center justify-between active:scale-[0.98] transition-transform border border-slate-100 dark:border-gray-600">
                        <div className="flex items-center gap-3">
                            {homeCardIcon('history', 'w-7 h-7 shrink-0 text-[#1E7D55]')}
                            <span className="font-bold text-[0.9375rem]">ประวัติการจองคิวรถ</span>
                        </div>
                        <svg className="w-5 h-5 text-slate-400 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                    </Link>

                    {}
                    <a
                        href={orgPhone ? `tel:${orgPhone}` : '#'}
                        onClick={(e) => {
                            if (!orgPhone) {
                                e.preventDefault();
                                Swal.fire({ icon: 'info', title: 'ไม่พบเบอร์โทร', text: 'หน่วยงานยังไม่ได้ตั้งค่าเบอร์โทรศัพท์', confirmButtonColor: '#1E7D55' });
                            }
                        }}
                        className="w-full bg-[#F8F9FA] dark:bg-gray-700 hover:bg-[#F0F2F5] dark:hover:bg-gray-600 text-slate-800 dark:text-gray-100 rounded-xl py-3.5 px-4 flex items-center justify-between active:scale-[0.98] transition-transform border border-slate-100 dark:border-gray-600"
                    >                        <div className="flex items-center gap-3">
                            <div className="w-7 h-7 flex items-center justify-center shrink-0 text-[#1E7D55]">
                                {homeCardIcon('phone', 'w-6 h-6')}
                            </div>
                            <span className="font-bold text-[0.9375rem]">โทรหาเจ้าหน้าที่</span>
                        </div>
                        <svg className="w-5 h-5 text-slate-400 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                    </a>

                </div>
            </div>

            {}
            <div className="px-5 mt-8 max-w-md mx-auto">
                <h3 className="text-[1.0625rem] font-bold text-[#003B22] dark:text-gray-100 mb-4 tracking-wide">ข้อมูลการจองคิววันนี้</h3>
                <LatestQueueCard />
            </div>

        </div>
    );
}
