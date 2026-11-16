'use client';

import React, { useState, useEffect } from 'react';
import { isLineBrowser, getLineOAuthUrl, connectViaLiff } from '@/lib/lineService';
import Swal from '@/lib/swal';

interface LineConnectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    stepText?: string;
    systemName?: string;
    orgId?: string;
    customLiffId?: string;
    botBasicId?: string;
    customBenefits?: {
        title1?: string;
        title2?: string;
        title3?: string;
    };
}

export default function LineConnectModal({
    isOpen,
    onClose,
    onSuccess,
    stepText = 'ขั้นตอนแนะนำ',
    systemName = 'ใจส่งถึงบ้าน',
    orgId,
    customLiffId,
    botBasicId,
    customBenefits,
}: LineConnectModalProps) {
    const [isConnecting, setIsConnecting] = useState(false);
    const [dontRemind7Days, setDontRemind7Days] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setIsConnecting(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleDismiss = () => {
        if (dontRemind7Days && typeof window !== 'undefined') {
            const until = Date.now() + 7 * 24 * 60 * 60 * 1000;
            localStorage.setItem('volunteer_smart_line_modal_dismissed_until', until.toString());
        }
        onClose();
    };

    const handleConnectLine = async () => {
        setIsConnecting(true);
        try {
            const activeLiffId = customLiffId || process.env.NEXT_PUBLIC_LIFF_ID;
            if (isLineBrowser() && activeLiffId) {
                try {
                    const result = await connectViaLiff(customLiffId);
                    if (result.success) {
                        await Swal.fire({
                            icon: 'success',
                            title: 'เชื่อมต่อ LINE สำเร็จ!',
                            text: 'คุณจะได้รับการแจ้งเตือนงานและคิวรถผ่าน LINE อัตโนมัติ',
                            confirmButtonColor: '#00C300',
                            confirmButtonText: 'ตกลง',
                        });
                        onSuccess?.();
                        onClose();
                        return;
                    }
                } catch (liffErr) {
                    console.warn('LIFF connect failed, fallback to OAuth URL:', liffErr);
                }
            }

            const authUrl = await getLineOAuthUrl(
                typeof window !== 'undefined' ? window.location.pathname : '/',
                orgId,
            );
            window.location.href = authUrl;
        } catch (err: any) {
            setIsConnecting(false);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: err.message || 'ไม่สามารถเริ่มการเชื่อมต่อ LINE ได้ กรุณาลองใหม่อีกครั้ง',
                confirmButtonColor: '#1E7D55',
            });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div
                className="relative w-full max-w-[380px] bg-[#F4FAF6] border border-[#D5EEDB] rounded-[28px] p-5 shadow-2xl transition-all transform scale-100"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={handleDismiss}
                    aria-label="ปิด"
                    className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100/60 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="flex items-center justify-between mb-3.5 pr-6">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#DDF4E4] text-[#1E7D55] text-xs font-semibold rounded-full">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                        <span>{stepText}</span>
                    </div>
                    <span className="text-xs font-medium text-gray-400">ผูกบัญชี</span>
                </div>

                <div className="mb-4">
                    <h2 className="text-[1.25rem] font-bold text-gray-900 leading-tight">
                        ผูกบัญชี {systemName} กับ LINE
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                        กดยืนยันเพื่อเชื่อมต่อระบบเข้ากับ LINE ของคุณ
                    </p>
                    {botBasicId && (
                        <div className="mt-2.5 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200/80 rounded-xl px-3 py-2 flex items-center justify-between">
                            <span className="truncate pr-2">LINE: <b>{botBasicId.startsWith('@') || botBasicId.startsWith('http') ? botBasicId : `@${botBasicId}`}</b></span>
                            {botBasicId.startsWith('http') ? (
                                <a href={botBasicId} target="_blank" rel="noopener noreferrer" className="underline font-semibold text-emerald-700 shrink-0">
                                    เพิ่มเพื่อน
                                </a>
                            ) : (
                                <a href={`https://line.me/R/ti/p/${encodeURIComponent(botBasicId.startsWith('@') ? botBasicId : `@${botBasicId}`)}`} target="_blank" rel="noopener noreferrer" className="underline font-semibold text-emerald-700 shrink-0">
                                    เพิ่มเพื่อน
                                </a>
                            )}
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E7F0EB] mb-4 space-y-3.5">
                    <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <span className="text-xs sm:text-sm font-medium text-gray-700">
                            {customBenefits?.title1 || 'แจ้งเตือนคำขออนุมัติ & งานใหม่ / คิวรถ'}
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <span className="text-xs sm:text-sm font-medium text-gray-700">
                            {customBenefits?.title2 || 'เตือนเวลานัดหมาย & เวลารถรับ-ส่ง'}
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-sky-50 text-sky-500 flex items-center justify-center shrink-0">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                        </div>
                        <span className="text-xs sm:text-sm font-medium text-gray-700">
                            {customBenefits?.title3 || 'อัปเดตสถานะและข้อมูลสำคัญ Real-time'}
                        </span>
                    </div>
                </div>

                <button
                    onClick={handleConnectLine}
                    disabled={isConnecting}
                    className="w-full bg-[#00C300] hover:bg-[#00B200] active:scale-[0.98] disabled:opacity-75 text-white font-semibold py-3.5 px-4 rounded-xl flex items-center justify-between shadow-md shadow-green-500/20 transition-all duration-200"
                >
                    <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 flex items-center justify-center shrink-0">
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
                                <path d="M19.365 9.864c0-4.08-4.195-7.4-9.365-7.4-5.17 0-9.365 3.32-9.365 7.4 0 3.655 3.27 6.72 7.7 7.28.3.065.707.2.81.458.093.235.06.602.03.84-.045.312-.21 1.22-.23 1.345-.035.195-.16.765.67.417.83-.348 4.48-2.64 6.115-4.52 2.37-2.6 3.64-4.11 3.64-5.82z" />
                            </svg>
                        </div>
                        <span className="text-sm sm:text-base font-bold">
                            {isConnecting ? 'กำลังเชื่อมต่อ LINE...' : 'เชื่อมต่อ LINE ทันที'}
                        </span>
                    </div>
                    {isConnecting ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    )}
                </button>

                <div className="mt-3.5 flex flex-col items-center gap-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-500 hover:text-gray-700 select-none">
                        <input
                            type="checkbox"
                            checked={dontRemind7Days}
                            onChange={(e) => setDontRemind7Days(e.target.checked)}
                            className="rounded border-gray-300 text-[#1E7D55] focus:ring-[#1E7D55] w-3.5 h-3.5"
                        />
                        <span>ไม่ต้องแจ้งเตือนอีกใน 7 วัน</span>
                    </label>

                    <button
                        type="button"
                        onClick={handleDismiss}
                        className="text-xs text-gray-400 hover:text-gray-600 transition-colors py-1"
                    >
                        ไว้คราวหลัง
                    </button>
                </div>
            </div>
        </div>
    );
}
