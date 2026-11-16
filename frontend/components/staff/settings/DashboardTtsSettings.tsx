'use client';

import { useEffect, useState } from 'react';
import Swal from '@/lib/swal';
import { speakText } from '@/lib/tts';

const STAFF_DASHBOARD_TTS_KEY = 'staff_dashboard_tts_enabled';

export default function DashboardTtsSettings() {
    const [dashboardTtsEnabled, setDashboardTtsEnabled] = useState(true);

    useEffect(() => {
        const savedDashboardTts = localStorage.getItem(STAFF_DASHBOARD_TTS_KEY);
        setDashboardTtsEnabled(savedDashboardTts === null ? true : savedDashboardTts === 'true');
    }, []);

    const handleToggleDashboardTts = () => {
        const nextValue = !dashboardTtsEnabled;
        setDashboardTtsEnabled(nextValue);
        localStorage.setItem(STAFF_DASHBOARD_TTS_KEY, String(nextValue));
        void speakText(nextValue ? 'เปิดเสียงแจ้งเตือนแล้ว' : 'ปิดเสียงแจ้งเตือนแล้ว');
        Swal.fire({
            icon: 'success',
            title: nextValue ? 'เปิดเสียงแจ้งเตือนแล้ว' : 'ปิดเสียงแจ้งเตือนแล้ว',
            text: 'ตั้งค่าสำหรับหน้า Dashboard ของเจ้าหน้าที่เรียบร้อยแล้ว',
            timer: 1800,
            showConfirmButton: false,
        });
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="p-4 sm:p-5 flex items-start sm:items-center justify-between gap-4">
                <div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-sm sm:text-base">เสียงแจ้งเตือน Dashboard</h3>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-gray-400">
                        แจ้งเตือนด้วยเสียงเมื่อมีคิวใหม่หรือมีการอัปเดตสถานะคิวในหน้าแดชบอร์ดเจ้าหน้าที่
                    </p>
                </div>
                <button
                    type="button"
                    onClick={handleToggleDashboardTts}
                    className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors ${dashboardTtsEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-gray-600'}`}
                    aria-pressed={dashboardTtsEnabled}
                    aria-label={dashboardTtsEnabled ? 'ปิดเสียงแจ้งเตือน Dashboard' : 'เปิดเสียงแจ้งเตือน Dashboard'}
                >
                    <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${dashboardTtsEnabled ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                </button>
            </div>
        </div>
    );
}
