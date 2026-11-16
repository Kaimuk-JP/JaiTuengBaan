'use client';

import { ReactNode } from 'react';

export const ChevronIcon = ({ isOpen }: { isOpen: boolean }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
    >
        <polyline points="6 9 12 15 18 9" />
    </svg>
);

export function dateAccordionButtonClass(): string {
    return 'w-full flex items-center justify-between px-4 py-3 rounded-xl font-semibold transition-colors border-2 border-brand-primary bg-white text-brand-primary focus:outline-none';
}

export function formatThaiDateLabel(dateString: string): string {
    return `วันที่ ${new Date(dateString).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    })}`;
}

interface DateHistoryLayoutProps {
    title: string;
    searchValue: string;
    onSearchChange: (value: string) => void;
    searchPlaceholder?: string;
    children: ReactNode;
    topContent?: ReactNode;
}

export function DateHistoryLayout({
    title,
    searchValue,
    onSearchChange,
    searchPlaceholder = 'ค้นหาวันที่ (เช่น 12 ม.ค. 2569)',
    children,
    topContent,
}: DateHistoryLayoutProps) {
    return (
        <div className="w-full bg-white py-6 px-4">
            <h1 className="text-2xl text-brand-primary text-center font-semibold mb-6">
                {title}
            </h1>

            <div className="w-full max-w-md lg:max-w-2xl mx-auto">
                <div className="relative mb-6 w-full">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                            <path
                                fillRule="evenodd"
                                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary sm:text-sm transition duration-150 ease-in-out"
                        placeholder={searchPlaceholder}
                        value={searchValue}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>

                {topContent}
                <div className="w-full">{children}</div>
            </div>
        </div>
    );
}

export function DateHistoryEmptyState({ message }: { message: string }) {
    return (
        <div className="text-center py-16 text-text-tertiary w-full">
            <div className="flex justify-center mb-4">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="4" y="4" width="16" height="16" rx="2" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 4" />
                    <circle cx="15" cy="15" r="3" stroke="#64748b" strokeWidth="2" />
                    <path d="m21 21-4.35-4.35" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
                    <path d="M8 8h4" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />
                </svg>
            </div>
            <p className="text-lg">{message}</p>
        </div>
    );
}

export function DateHistoryLoadingState({ message }: { message: string }) {
    return (
        <div className="min-h-[60vh] w-full flex items-center justify-center bg-white">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-primary" />
                <p className="text-brand-primary">{message}</p>
            </div>
        </div>
    );
}
