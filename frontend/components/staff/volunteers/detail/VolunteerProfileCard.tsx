'use client';

import Image from 'next/image';
import type { VolunteerDetail } from './types';

interface VolunteerProfileCardProps {
    volunteer: VolunteerDetail | null;
    activeTab: string;
    onTabChange: (tab: string) => void;
}

export default function VolunteerProfileCard({ volunteer, activeTab, onTabChange }: VolunteerProfileCardProps) {
    const tabs = [
        {
            id: 'personal', label: 'ข้อมูลส่วนตัว', icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                </svg>
            )
        },
        {
            id: 'schedule', label: 'ตารางงาน', icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
            )
        },
        {
            id: 'history', label: 'ประวัติการทำงาน', icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
            )
        },
    ];

    return (
        <div className="w-72 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex flex-col items-center mb-6">
                    <div className="w-28 h-28 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden mb-4">
                        {volunteer?.pictureUrl ? (
                            <Image
                                src={volunteer.pictureUrl}
                                alt={volunteer.displayName}
                                width={112}
                                height={112}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#1e293b" strokeWidth="1.5">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                        )}
                    </div>
                    <h2 className="text-lg font-bold text-text-primary text-center">
                        {volunteer?.firstName || volunteer?.lastName
                            ? `${volunteer?.firstName || ''} ${volunteer?.lastName || ''}`.trim()
                            : volunteer?.displayName || 'ไม่มีชื่อ'}
                    </h2>
                    <p className="text-sm text-text-tertiary">เจ้าหน้าที่จิตอาสา</p>

                    <div className="mt-3 flex items-center gap-2 px-4 py-1.5 bg-yellow-50 rounded-full border border-yellow-200">
                        <span className="text-sm font-bold text-yellow-700">{volunteer ? volunteer.pointsBalance : 0} คะแนน</span>
                    </div>
                </div>

                <div className="space-y-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                                ${activeTab === tab.id
                                    ? 'bg-brand-primary text-white'
                                    : 'text-text-secondary hover:bg-slate-50'
                                }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
