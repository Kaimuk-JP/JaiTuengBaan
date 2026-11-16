'use client';

import React from 'react';
import { useSettings, Theme } from '@/contexts/SettingsContext';
import type { SelectOption } from '@/types/common';

const THEME_OPTIONS: (SelectOption<Theme> & { icon: React.ReactNode; description: string })[] = [
    {
        value: 'light',
        label: 'โหมดสว่าง',
        description: 'พื้นหลังสีขาว ตัวอักษรสีเข้ม',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
        ),
    },
    {
        value: 'dark',
        label: 'โหมดมืด',
        description: 'พื้นหลังสีเข้ม ถนอมสายตา',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
        ),
    },
];

export default function ThemeSettings() {
    const { theme, setTheme } = useSettings();

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-5">
            <h3 className="text-[15px] font-bold text-gray-800 dark:text-white mb-1 flex items-center gap-2">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-primary shrink-0">
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
                ธีมการแสดงผล
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                เลือกโหมดการแสดงผลที่เหมาะสมกับการใช้งาน
            </p>


            <div className="grid grid-cols-2 gap-3">
                {THEME_OPTIONS.map((option) => (
                    <button
                        key={option.value}
                        onClick={() => setTheme(option.value)}
                        className={`flex flex-col items-center p-3 sm:p-4 rounded-2xl border-2 transition-all ${
                            theme === option.value
                                ? 'border-brand-primary bg-[#E8F3EF] dark:bg-green-900/30'
                                : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-gray-300'
                        }`}
                    >
                        <div className={`w-full h-14 sm:h-16 rounded-xl mb-2 flex items-center justify-center ${
                            option.value === 'light'
                                ? 'bg-gray-100 border border-gray-200'
                                : 'bg-gray-800 border border-gray-600'
                        }`}>
                            <div className={`scale-110 ${option.value === 'light' ? 'text-gray-600' : 'text-yellow-300'}`}>
                                {option.icon}
                            </div>
                        </div>

                        <span className={`text-sm font-semibold ${
                            theme === option.value
                                ? 'text-brand-primary'
                                : 'text-gray-800 dark:text-white'
                        }`}>
                            {option.label}
                        </span>
                        <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 text-center leading-tight">
                            {option.description}
                        </span>
                    </button>
                ))}
            </div>


            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-100 dark:border-gray-600">
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    กำลังใช้งาน: <span className="font-semibold text-gray-800 dark:text-white">
                        {theme === 'light' ? '☀️ โหมดสว่าง' : '🌙 โหมดมืด'}
                    </span>
                </p>
            </div>
        </div>
    );
}
