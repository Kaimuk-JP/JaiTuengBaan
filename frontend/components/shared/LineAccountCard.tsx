'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { unlinkLineAccount } from '@/lib/lineService';
import { fetchWithAuth } from '@/lib/auth';
import LineConnectModal from './LineConnectModal';
import Swal from '@/lib/swal';

export default function LineAccountCard() {
    const { user, refreshUser } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isUnlinking, setIsUnlinking] = useState(false);
    const [lineNotificationEnabled, setLineNotificationEnabled] = useState(true);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await fetchWithAuth('/settings/line-notification-enabled');
                if (res.ok) {
                    const data = await res.json();
                    if (typeof data.lineNotificationEnabled === 'boolean') {
                        setLineNotificationEnabled(data.lineNotificationEnabled);
                    }
                }
            } catch {
            }
        };
        fetchStatus();
    }, []);

    if (!user) return null;

    const isLinked = !!user.lineUserId;

    const handleUnlink = async () => {
        const confirm = await Swal.fire({
            title: 'ยกเลิกการผูกบัญชี LINE?',
            text: 'หากยกเลิก คุณจะไม่ได้รับการแจ้งเตือนงานและคิวรถผ่าน LINE อีกต่อไป',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'ยืนยันยกเลิก',
            cancelButtonText: 'ปิด',
        });

        if (!confirm.isConfirmed) return;

        setIsUnlinking(true);
        try {
            const res = await unlinkLineAccount();
            if (res.success) {
                await refreshUser();
                Swal.fire({
                    icon: 'success',
                    title: 'ยกเลิกการผูกบัญชีสำเร็จ',
                    confirmButtonColor: '#1E7D55',
                    timer: 2000,
                });
            }
        } catch (err: any) {
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: err.message || 'ไม่สามารถยกเลิกการผูกบัญชีได้',
                confirmButtonColor: '#1E7D55',
            });
        } finally {
            setIsUnlinking(false);
        }
    };

    const formatDate = (dateStr?: string | null) => {
        if (!dateStr) return '';
        try {
            return new Date(dateStr).toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        } catch {
            return '';
        }
    };

    return (
        <>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-gray-700">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#00C300]/10 flex items-center justify-center shrink-0">
                            <svg viewBox="0 0 24 24" fill="#00C300" className="w-6 h-6">
                                <path d="M19.365 9.864c0-4.08-4.195-7.4-9.365-7.4-5.17 0-9.365 3.32-9.365 7.4 0 3.655 3.27 6.72 7.7 7.28.3.065.707.2.81.458.093.235.06.602.03.84-.045.312-.21 1.22-.23 1.345-.035.195-.16.765.67.417.83-.348 4.48-2.64 6.115-4.52 2.37-2.6 3.64-4.11 3.64-5.82z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base">
                                การแจ้งเตือนผ่าน LINE
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                รับการแจ้งเตือนคิวรถและข่าวสารผ่าน LINE
                            </p>
                        </div>
                    </div>

                    {isLinked ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 dark:bg-green-950/40 text-[#15803D] dark:text-green-400 text-xs font-semibold rounded-full border border-green-200 dark:border-green-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                            เชื่อมต่อแล้ว
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-xs font-semibold rounded-full border border-amber-200 dark:border-amber-800">
                            ยังไม่ได้เชื่อมต่อ
                        </span>
                    )}
                </div>

                {!lineNotificationEnabled && (
                    <div className="mt-3 px-3.5 py-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300">
                        <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                        <span>ระบบแจ้งเตือนผ่าน LINE ปิดใช้งานชั่วคราวโดยผู้ดูแลระบบ (Admin)</span>
                    </div>
                )}

                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    {isLinked ? (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                {user.linePictureUrl ? (
                                    <img
                                        src={user.linePictureUrl}
                                        alt={user.lineDisplayName || 'LINE Profile'}
                                        className="w-9 h-9 rounded-full object-cover border border-slate-200"
                                    />
                                ) : (
                                    <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 font-bold text-xs">
                                        LINE
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                        {user.lineDisplayName || 'ผู้ใช้งาน LINE'}
                                    </p>
                                    {user.lineConnectedAt && (
                                        <p className="text-xs text-gray-400">
                                            เชื่อมต่อเมื่อ {formatDate(user.lineConnectedAt)}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={handleUnlink}
                                disabled={isUnlinking}
                                className="px-3.5 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors border border-red-200 dark:border-red-900"
                            >
                                {isUnlinking ? 'กำลังยกเลิก...' : 'ยกเลิกการผูกบัญชี'}
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                {lineNotificationEnabled
                                    ? 'แนะนำให้ผูกบัญชีเพื่อรับแจ้งเตือนคิวรถและข่าวสารผ่าน LINE ทันที'
                                    : 'ระบบแจ้งเตือนผ่าน LINE ปิดใช้งานอยู่ในขณะนี้'}
                            </p>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                disabled={!lineNotificationEnabled}
                                className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl shadow-sm transition-all shrink-0 active:scale-95 ${lineNotificationEnabled ? 'bg-[#00C300] hover:bg-[#00B200] text-white' : 'bg-slate-200 dark:bg-gray-700 text-slate-400 cursor-not-allowed'}`}
                            >
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                    <path d="M19.365 9.864c0-4.08-4.195-7.4-9.365-7.4-5.17 0-9.365 3.32-9.365 7.4 0 3.655 3.27 6.72 7.7 7.28.3.065.707.2.81.458.093.235.06.602.03.84-.045.312-.21 1.22-.23 1.345-.035.195-.16.765.67.417.83-.348 4.48-2.64 6.115-4.52 2.37-2.6 3.64-4.11 3.64-5.82z" />
                                </svg>
                                <span>ผูกบัญชี LINE ทันที</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <LineConnectModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    setIsModalOpen(false);
                    refreshUser();
                }}
            />
        </>
    );
}
