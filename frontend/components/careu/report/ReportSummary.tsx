'use client';

import { useState, useMemo, useCallback } from 'react';
import { getApiUrl } from '@/lib/api';
import { createPortal } from 'react-dom';
import CareUSidebar from '@/components/careu/Sidebar/CareUSidebar';
import CareUHeader from '@/components/careu/Header/CareUHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { fetchWithAuth } from '@/lib/auth';


interface MonthlyData {
    totalJobs: number;
    completedJobs: number;
    cancelledJobs: number;
    totalHours: number;
    earnedPoints: number;
    patients: number;
}

const THAI_MONTHS = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

const THAI_MONTHS_SHORT = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];

function aggregateData(jobs: any[], year: number, month: number): MonthlyData {
    const periodJobs = jobs.filter(j => {
        if (!j.queue?.requestDate) return false;
        const d = new Date(j.queue.requestDate);
        return d.getFullYear() === year && d.getMonth() === month;
    });

    const completed = periodJobs.filter(j => j.status === 'COMPLETED');
    const cancelled = periodJobs.filter(j => ['CANCELLED', 'REJECTED'].includes(j.status));

    const patientMap = new Set<string>();
    completed.forEach(j => {
        if (j.queue?.user?.id) patientMap.add(j.queue.user.id);
    });

    return {
        totalJobs: periodJobs.length,
        completedJobs: completed.length,
        cancelledJobs: cancelled.length,
        totalHours: completed.length * 3,
        earnedPoints: completed.length * 50,
        patients: patientMap.size,
    };
}

function getCompletionRate(completed: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
}

function getMonthLabel(year: number, month: number): string {
    return `${THAI_MONTHS[month]} ${year + 543}`;
}

export default function ReportSummary() {
    const { user } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [selYear, setSelYear] = useState(new Date().getFullYear());
    const [selMonth, setSelMonth] = useState(new Date().getMonth());
    const [pickerOpen, setPickerOpen] = useState(false);
    const [pickerStep, setPickerStep] = useState<'year' | 'month'>('year');
    const [pickerYear, setPickerYear] = useState(new Date().getFullYear());
    const [mounted, setMounted] = useState(false);
    const [jobs, setJobs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        if (!user?.id) return;
        const fetchJobs = async () => {
            try {
                setIsLoading(true);
                const res = await fetchWithAuth(`/jobs/assigned-to/${user.id}`);
                if (!res.ok) throw new Error('API default fetch failed');
                const data = await res.json();
                setJobs(data);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchJobs();
    }, [user?.id]);

    const data = useMemo(() => aggregateData(jobs, selYear, selMonth), [jobs, selYear, selMonth]);
    const completionRate = getCompletionRate(data.completedJobs, data.totalJobs);

    const totals = useMemo(() => {
        const completed = jobs.filter((j: any) => j.status === 'COMPLETED');
        const patientMap = new Set<string>();
        completed.forEach((j: any) => {
            if (j.queue?.user?.id) patientMap.add(j.queue.user.id);
        });

        return {
            jobs: jobs.length,
            completed: completed.length,
            hours: completed.length * 3,
            points: completed.length * 50,
            patients: patientMap.size,
        };
    }, [jobs]);

    const barData = useMemo(() => {
        const result = [];
        for (let i = 0; i < 6; i++) {
            const d = new Date(selYear, selMonth - i, 1);
            const y = d.getFullYear();
            const m = d.getMonth();
            result.push({ year: y, month: m, label: `${THAI_MONTHS_SHORT[m]} ${(y + 543) % 100}`, data: aggregateData(jobs, y, m) });
        }
        return result.reverse();
    }, [jobs, selYear, selMonth]);

    const maxBarJobs = Math.max(...barData.map(b => b.data.totalJobs), 1);
    const rightNow = new Date();

    const canGoNext = !(selYear === rightNow.getFullYear() && selMonth === rightNow.getMonth());
    const goNext = () => {
        const d = new Date(selYear, selMonth + 1, 1);
        if (d <= rightNow) { setSelYear(d.getFullYear()); setSelMonth(d.getMonth()); }
    };
    const goPrev = () => {
        const d = new Date(selYear, selMonth - 1, 1);
        setSelYear(d.getFullYear()); setSelMonth(d.getMonth());
    };

    const openPicker = () => {
        setPickerYear(selYear);
        setPickerStep('year');
        setPickerOpen(true);
    };

    const handlePickYear = (y: number) => {
        setPickerYear(y);
        setPickerStep('month');
    };

    const handlePickMonth = (m: number) => {
        const rightNowCheck = new Date();
        const picked = new Date(pickerYear, m, 1);
        if (picked > rightNowCheck) return;
        setSelYear(pickerYear);
        setSelMonth(m);
        setPickerOpen(false);
    };

    const closePicker = useCallback(() => setPickerOpen(false), []);

    const getRelativeLabel = () => {
        const rightNowLabel = new Date();
        const diff = (rightNowLabel.getFullYear() - selYear) * 12 + (rightNowLabel.getMonth() - selMonth);
        if (diff === 0) return 'เดือนนี้';
        if (diff === 1) return 'เดือนที่แล้ว';
        return `${diff} เดือนที่แล้ว`;
    };

    const rightNowY = new Date();
    const startYearCE = rightNowY.getFullYear() - 5;
    const endYearCE = rightNowY.getFullYear();

    const renderPicker = () => {
        if (!pickerOpen) return null;
        return (
            <>
                <div className="fixed inset-0 bg-black/40 z-[9998]" onClick={closePicker} />
                <div
                    className="fixed bottom-0 left-0 right-0 z-[9999] bg-white dark:bg-gray-800 rounded-t-2xl shadow-2xl"
                    style={{ maxHeight: '55dvh', animation: 'slideUpReport 0.25s ease-out' }}
                >
                    { }
                    <div className="flex justify-center pt-2 pb-1">
                        <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                    </div>

                    { }
                    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={() => { if (pickerStep === 'month') setPickerStep('year'); else closePicker(); }}
                            className="p-2 -ml-2 rounded-xl active:bg-gray-100 dark:active:bg-gray-700"
                        >
                            <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <span className="text-sm font-bold text-gray-800 dark:text-white">
                            {pickerStep === 'year' ? 'เลือกปี' : `ปี พ.ศ. ${pickerYear + 543}`}
                        </span>
                        <button type="button" onClick={closePicker} className="p-2 -mr-2 rounded-xl active:bg-gray-100 dark:active:bg-gray-700">
                            <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    { }
                    {pickerStep === 'year' && (
                        <div className="p-4 grid grid-cols-3 gap-2.5">
                            {Array.from({ length: endYearCE - startYearCE + 1 }, (_, i) => endYearCE - i).map(y => (
                                <button
                                    key={y}
                                    type="button"
                                    onClick={() => handlePickYear(y)}
                                    className={`py-3.5 rounded-xl text-sm font-semibold transition-all active:scale-95 ${y === selYear
                                            ? 'bg-brand-primary text-white shadow-md'
                                            : y === new Date().getFullYear()
                                                ? 'bg-brand-primary/10 text-brand-primary ring-1 ring-brand-primary/30'
                                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    {y + 543}
                                </button>
                            ))}
                        </div>
                    )}

                    { }
                    {pickerStep === 'month' && (
                        <div className="p-4 grid grid-cols-3 gap-2.5">
                            {THAI_MONTHS.map((name, i) => {
                                const checkDate = new Date();
                                const isFuture = new Date(pickerYear, i, 1) > checkDate;
                                const isSelected = pickerYear === selYear && i === selMonth;
                                const isCurrent = pickerYear === checkDate.getFullYear() && i === checkDate.getMonth();
                                return (
                                    <button
                                        key={i}
                                        type="button"
                                        disabled={isFuture}
                                        onClick={() => handlePickMonth(i)}
                                        className={`py-3.5 rounded-xl text-sm font-semibold transition-all active:scale-95 ${isFuture
                                                ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                                                : isSelected
                                                    ? 'bg-brand-primary text-white shadow-md'
                                                    : isCurrent
                                                        ? 'bg-brand-primary/10 text-brand-primary ring-1 ring-brand-primary/30'
                                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}
                                    >
                                        {name.substring(0, 3)}.
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    { }
                    <div style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }} />
                </div>

                <style>{`
                    @keyframes slideUpReport {
                        from { transform: translateY(100%); }
                        to { transform: translateY(0); }
                    }
                `}</style>
            </>
        );
    };

    return (
        <div className="min-h-[100dvh] h-[100dvh] overflow-y-auto overflow-x-hidden bg-[#F5F5F5] dark:bg-gray-900 font-sans pb-24">
            <CareUSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            { }
            <div className="bg-gradient-to-bl from-[#3AAE7D] to-[#346D55] dark:from-slate-800 dark:to-slate-900 text-white">
                <CareUHeader user={null} onToggleSidebar={() => setSidebarOpen(true)} iconColor="white" />
            </div>

            { }
            <div className="px-4 mt-4 max-w-md mx-auto space-y-4">

                { }
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
                    <h2 className="text-sm font-bold text-gray-800 dark:text-white mb-3">ภาพรวมทั้งหมด</h2>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="text-center">
                            <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-1.5">
                                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                </svg>
                            </div>
                            <p className="text-xl font-bold text-gray-800 dark:text-white">{totals.completed}</p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400">งานสำเร็จ</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 mx-auto rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center mb-1.5">
                                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <p className="text-xl font-bold text-gray-800 dark:text-white">{totals.hours}</p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400">ชั่วโมง</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 mx-auto rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center mb-1.5">
                                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <circle cx="12" cy="8" r="7" />
                                    <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                                </svg>
                            </div>
                            <p className="text-xl font-bold text-gray-800 dark:text-white">{totals.points}</p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400">แต้มสะสม</p>
                        </div>
                    </div>
                </div>

                { }
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm px-3 py-3 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={goPrev}
                        className="p-2.5 rounded-xl active:bg-gray-100 dark:active:bg-gray-700 transition-colors"
                    >
                        <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    { }
                    <button
                        type="button"
                        onClick={openPicker}
                        className="flex-1 text-center px-2 py-1.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 transition-colors"
                    >
                        <p className="text-base font-bold text-gray-800 dark:text-white flex items-center justify-center gap-1.5">
                            {getMonthLabel(selYear, selMonth)}
                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                        </p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{getRelativeLabel()}</p>
                    </button>
                    <button
                        type="button"
                        onClick={goNext}
                        disabled={!canGoNext}
                        className="p-2.5 rounded-xl active:bg-gray-100 dark:active:bg-gray-700 transition-colors disabled:opacity-30"
                    >
                        <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>

                { }
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                    <div className="p-5 space-y-5">
                        { }
                        <div className="flex items-center gap-5">
                            <div className="relative w-20 h-20 shrink-0">
                                <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                                    <path
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        fill="none"
                                        stroke="#E5E7EB"
                                        strokeWidth="3"
                                        className="dark:stroke-gray-700"
                                    />
                                    <path
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        fill="none"
                                        stroke="#1E7D55"
                                        strokeWidth="3"
                                        strokeDasharray={`${completionRate}, 100`}
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-lg font-bold text-gray-800 dark:text-white">{completionRate}%</span>
                                </div>
                            </div>
                            <div className="flex-1 space-y-1.5">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">งานทั้งหมด</span>
                                    <span className="font-bold text-gray-800 dark:text-white">{data.totalJobs} งาน</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-green-600">สำเร็จ</span>
                                    <span className="font-bold text-green-600">{data.completedJobs} งาน</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-red-500">ยกเลิก</span>
                                    <span className="font-bold text-red-500">{data.cancelledJobs} งาน</span>
                                </div>
                            </div>
                        </div>

                        { }
                        <div className="border-t border-gray-100 dark:border-gray-700" />

                        { }
                        <div className="grid grid-cols-3 gap-4">
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-900/30 mb-1.5">
                                    <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                </div>
                                <p className="text-lg font-bold text-gray-800 dark:text-white">{data.patients}</p>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400">ดูแลประชาชน</p>
                            </div>
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-sky-50 dark:bg-sky-900/30 mb-1.5">
                                    <svg className="w-4 h-4 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                                <p className="text-lg font-bold text-gray-800 dark:text-white">{data.totalHours}</p>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400">ชั่วโมง</p>
                            </div>
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-900/30 mb-1.5">
                                    <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" /></svg>
                                </div>
                                <p className="text-lg font-bold text-gray-800 dark:text-white">{data.earnedPoints}</p>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400">แต้มได้รับ</p>
                            </div>
                        </div>
                    </div>
                </div>

                { }
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-4">เปรียบเทียบ 6 เดือน</h3>
                    <div className="space-y-3">
                        {barData.map((b) => {
                            const pct = Math.round((b.data.completedJobs / maxBarJobs) * 100);
                            const cancelPct = Math.round((b.data.cancelledJobs / maxBarJobs) * 100);
                            const isSelected = b.year === selYear && b.month === selMonth;
                            return (
                                <div key={`${b.year}-${b.month}`}>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className={`font-medium ${isSelected ? 'text-brand-primary' : 'text-gray-600 dark:text-gray-300'}`}>
                                            {b.label}
                                        </span>
                                        <span className="text-gray-500 dark:text-gray-400">
                                            {b.data.completedJobs}/{b.data.totalJobs} งาน
                                        </span>
                                    </div>
                                    <div className="h-5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden flex">
                                        <div
                                            className="h-full bg-brand-primary rounded-l-full transition-all duration-500 ease-out"
                                            style={{ width: `${pct}%` }}
                                        />
                                        {cancelPct > 0 && (
                                            <div
                                                className="h-full bg-red-300 dark:bg-red-500/50 transition-all duration-500 ease-out"
                                                style={{ width: `${cancelPct}%` }}
                                            />
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    { }
                    <div className="flex items-center gap-4 mt-3 text-[10px] text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-brand-primary" />
                            <span>สำเร็จ</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-300" />
                            <span>ยกเลิก</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-gray-200 dark:bg-gray-600" />
                            <span>เหลือ</span>
                        </div>
                    </div>
                </div>

                { }
                <div className="bg-gradient-to-br from-brand-primary to-[#346D55] rounded-2xl p-5 text-white shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
                        <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </div>
                    <h3 className="font-bold text-base mb-1">ขอบคุณที่เป็นส่วนหนึ่ง 💚</h3>
                    <p className="text-sm text-white/80 leading-relaxed">
                        คุณได้ดูแลประชาชนไปแล้ว <span className="font-bold text-white">{totals.patients} ท่าน</span> รวม <span className="font-bold text-white">{totals.hours} ชั่วโมง</span> — ทุกครั้งที่ออกเดินทางคือความอบอุ่นที่มอบให้ผู้คน
                    </p>
                </div>

            </div>

            { }
            {mounted && typeof document !== 'undefined' && createPortal(renderPicker(), document.body)}
        </div>
    );
}
