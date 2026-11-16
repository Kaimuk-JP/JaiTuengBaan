'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { fetchWithAuth } from '@/lib/auth';
import Swal from '@/lib/swal';
import CareUHeader from '@/components/careu/Header/CareUHeader';
import CareUSidebar from '@/components/careu/Sidebar/CareUSidebar';
import CareUTodayJobsCard from '@/components/careu/home/TodayJobsCard';
import { homeCardIcon, MenuIcon } from '@/components/shared/menuIcons';

export default function CareUHomeContent() {
    const { user, loading } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [orgPhone, setOrgPhone] = useState<string | null>(null);
    const [hasTodayJobs, setHasTodayJobs] = useState(false);
    const [jobsLoading, setJobsLoading] = useState(true);

    const handleJobsChange = useCallback((info: { hasJobs: boolean; loading: boolean }) => {
        setHasTodayJobs(info.hasJobs);
        setJobsLoading(info.loading);
    }, []);

    useEffect(() => {
        fetchWithAuth('/settings/organization/phone')
            .then(res => res.ok ? res.json() : null)
            .then(data => { if (data?.phone) setOrgPhone(data.phone); })
            .catch(() => { });
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-[100dvh] h-[100dvh] overflow-y-auto overflow-x-hidden bg-[#F5F5F5] dark:bg-gray-900 font-sans pb-24">

            { }
            <CareUSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <CareUHeader user={user} onToggleSidebar={() => setSidebarOpen(true)} />

            <div className="bg-gradient-to-bl from-[#3AAE7D] to-[#346D55] dark:from-slate-800 dark:to-slate-900 px-6 pt-8 pb-[140px] relative text-white">
                <div className="mt-6">
                    <h1 className="text-[1.375rem] leading-[1.4] tracking-wide">
                        <span className="font-medium">ยินดีต้อนรับสู่ระบบ</span><br />
                        <span className="font-normal text-xl">จิตอาสาแคร์ยู</span>
                    </h1>
                </div>
            </div>

            { }
            <div className="px-5 -mt-[110px] relative z-10 max-w-md mx-auto">
                <div className="bg-white dark:bg-gray-800 rounded-[24px] p-4 shadow-sm border border-slate-100 dark:border-gray-700 flex flex-col gap-3">

                    { }
                    <Link href="/volunteer/careu/patients" className="w-full bg-[#F8F9FA] dark:bg-gray-700 hover:bg-[#F0F2F5] dark:hover:bg-gray-600 text-slate-800 dark:text-gray-100 rounded-xl py-3.5 px-4 flex items-center justify-between active:scale-[0.98] transition-transform border border-slate-100 dark:border-gray-600">
                        <div className="flex items-center gap-3">
                            {homeCardIcon('clipboard-list', 'w-7 h-7 text-[#1E7D55] shrink-0')}
                            <span className="font-bold text-[0.9375rem]">ข้อมูลและประวัติประชาชน</span>
                        </div>
                        <svg className="w-5 h-5 text-slate-400 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                    </Link>

                    { }
                    <Link href="/volunteer/careu/jobs" className="w-full bg-brand-primary text-white rounded-xl py-3.5 px-4 flex items-center justify-between active:scale-[0.98] transition-transform">
                        <div className="flex items-center gap-3">
                            {homeCardIcon('calendar-event', 'w-8 h-8 shrink-0')}
                            <span className="font-bold text-[0.9375rem]">คิวงานวัน ณ ปัจจุบัน</span>
                        </div>
                        <svg className="w-5 h-5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                    </Link>

                    <Link href="/volunteer/careu/work-history" className="w-full bg-[#F8F9FA] dark:bg-gray-700 hover:bg-[#F0F2F5] dark:hover:bg-gray-600 text-slate-800 dark:text-gray-100 rounded-xl py-3.5 px-4 flex items-center justify-between active:scale-[0.98] transition-transform border border-slate-100 dark:border-gray-600">
                        <div className="flex items-center gap-3">
                            {homeCardIcon('history', 'w-7 h-7 shrink-0 text-[#1E7D55]')}
                            <span className="font-bold text-[0.9375rem]">ประวัติการทำงาน</span>
                        </div>
                        <svg className="w-5 h-5 text-slate-400 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                    </Link>

                    { }
                    <Link href="/volunteer/careu/report" className="w-full bg-[#F8F9FA] dark:bg-gray-700 hover:bg-[#F0F2F5] dark:hover:bg-gray-600 text-slate-800 dark:text-gray-100 rounded-xl py-3.5 px-4 flex items-center justify-between active:scale-[0.98] transition-transform border border-slate-100 dark:border-gray-600">
                        <div className="flex items-center gap-3">
                            {homeCardIcon('chart-bar', 'w-7 h-7 text-[#1E7D55]')}
                            <span className="font-bold text-[0.9375rem]">สรุปรายงาน</span>
                        </div>
                        <svg className="w-5 h-5 text-slate-400 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                    </Link>

                    { }
                    <Link href="/volunteer/careu/rewards" className="w-full bg-[#F8F9FA] dark:bg-gray-700 hover:bg-[#F0F2F5] dark:hover:bg-gray-600 text-slate-800 dark:text-gray-100 rounded-xl py-3.5 px-4 flex items-center justify-between active:scale-[0.98] transition-transform border border-slate-100 dark:border-gray-600">
                        <div className="flex items-center gap-3">
                            {homeCardIcon('award', 'w-7 h-7 text-[#1E7D55]')}
                            <span className="font-bold text-[0.9375rem]">แต้มสะสมและแลกของรางวัล</span>
                        </div>
                        <svg className="w-5 h-5 text-slate-400 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                    </Link>

                    { }
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

            <div className="px-5 mt-6 max-w-md mx-auto">
                {!jobsLoading && !hasTodayJobs && (
                    <div className="bg-white dark:bg-gray-800 rounded-[20px] p-5 shadow-sm border border-brand-primary/20 flex items-center justify-between relative overflow-hidden">
                        <div className="absolute right-0 top-0 opacity-10 pointer-events-none">
                            <MenuIcon name="award" className="text-brand-primary" size={100} strokeWidth={1.5} />
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">คะแนนสะสมของคุณ</h3>
                            <div className="text-3xl font-bold text-brand-primary">{user?.pointsBalance || 0} <span className="text-lg font-normal text-gray-500">แต้ม</span></div>
                        </div>
                        <Link href="/volunteer/careu/rewards" className="px-4 py-2 bg-brand-primary/10 text-brand-primary font-medium rounded-full text-sm">
                            แลกของรางวัล
                        </Link>
                    </div>
                )}

                {hasTodayJobs && (
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-bold text-[#003B22] dark:text-gray-100 tracking-wide">
                            งานวันนี้
                        </h3>
                        <Link href="/volunteer/careu/jobs" className="text-base font-semibold text-brand-primary hover:underline">
                            ดูทั้งหมด
                        </Link>
                    </div>
                )}
                <CareUTodayJobsCard onJobsChange={handleJobsChange} />
            </div>

        </div>
    );
}
