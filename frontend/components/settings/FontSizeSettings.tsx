'use client';

import React from 'react';
import { useSettings, FONT_SIZE_OPTIONS } from '@/contexts/SettingsContext';

export default function FontSizeSettings() {
    const { fontSize, setFontSize } = useSettings();
    const currentIndex = FONT_SIZE_OPTIONS.findIndex(opt => opt.value === fontSize);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-5">
            <h3 className="text-[15px] font-bold text-gray-800 dark:text-white mb-1 flex items-center gap-2">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-primary shrink-0">
                    <polyline points="4 7 4 4 20 4 20 7"></polyline>
                    <line x1="9" y1="20" x2="15" y2="20"></line>
                    <line x1="12" y1="4" x2="12" y2="20"></line>
                </svg>
                ขนาดตัวอักษร
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                ปรับขนาดตัวอักษรให้เหมาะสมกับการใช้งาน
            </p>


            <div className="space-y-2">
                {FONT_SIZE_OPTIONS.map((option) => (
                    <button
                        key={option.value}
                        onClick={() => setFontSize(option.value)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                            fontSize === option.value
                                ? 'border-brand-primary bg-[#E8F3EF] dark:bg-green-900/30'
                                : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-gray-300'
                        }`}
                    >
                        <div className="flex items-center gap-2.5">

                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                fontSize === option.value
                                    ? 'border-brand-primary'
                                    : 'border-gray-300 dark:border-gray-500'
                            }`}>
                                {fontSize === option.value && (
                                    <div className="w-3 h-3 rounded-full bg-brand-primary"></div>
                                )}
                            </div>
                            <span className={`text-sm text-gray-800 dark:text-white ${fontSize === option.value ? 'font-semibold' : ''}`}>
                                {option.label}
                            </span>
                        </div>


                        <span
                            className="text-gray-400 dark:text-gray-400"
                            style={{ fontSize: `${option.scale * 14}px` }}
                        >
                            ก
                        </span>
                    </button>
                ))}
            </div>


            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-100 dark:border-gray-600">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">ตัวอย่างข้อความ:</p>
                <p
                    className="text-gray-800 dark:text-white font-medium"
                    style={{ fontSize: `${(FONT_SIZE_OPTIONS[currentIndex]?.scale || 1) * 16}px` }}
                >
                    สวัสดีครับ/ค่ะ ขนาดตัวอักษรระดับ "{FONT_SIZE_OPTIONS[currentIndex]?.label}"
                </p>
            </div>
        </div>
    );
}
