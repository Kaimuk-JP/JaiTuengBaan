'use client';

import {
    Landmark,
    Clock,
    CalendarDays,
    Stethoscope,
    Building2,
    Wrench,
    Volume2,
    Monitor,
    ArrowRightLeft,
    SlidersHorizontal,
    Sparkles
} from 'lucide-react';
import type { Tab } from './types';

interface SettingsTabsProps {
    activeTab: Tab;
    onTabChange: (tab: Tab) => void;
}

interface TabItem {
    id: Tab;
    label: string;
    description: string;
    icon: any;
    badge?: string;
}

interface TabGroup {
    title: string;
    items: TabItem[];
}

export default function SettingsTabs({ activeTab, onTabChange }: SettingsTabsProps) {
    const tabGroups: TabGroup[] = [
        {
            title: 'หน่วยงานและนโยบาย',
            items: [
                {
                    id: 'organization',
                    label: 'ข้อมูลเทศบาลและนโยบาย',
                    description: 'โลโก้, พิกัด, LINE OA, กฎยกเลิก',
                    icon: Landmark,
                },
                {
                    id: 'time-slots',
                    label: 'รอบเวลาการจอง',
                    description: 'กำหนดช่วงเวลาเปิดรับจอง',
                    icon: Clock,
                },
                {
                    id: 'booking-limits',
                    label: 'โควตาการจองต่อวัน',
                    description: 'จำกัดจำนวนคิวต่อวัน/ปฏิทิน',
                    icon: CalendarDays,
                },
            ],
        },
        {
            title: 'ทรัพยากรการแพทย์',
            items: [
                {
                    id: 'diseases',
                    label: 'จัดการรายการโรค',
                    description: 'โรคประจำตัวผู้รับบริการ',
                    icon: Stethoscope,
                },
                {
                    id: 'hospitals',
                    label: 'จัดการโรงพยาบาล',
                    description: 'รายชื่อโรงพยาบาลปลายทาง',
                    icon: Building2,
                },
                {
                    id: 'equipment',
                    label: 'อุปกรณ์การแพทย์',
                    description: 'รถเข็น, ถังออกซิเจน ฯลฯ',
                    icon: Wrench,
                },
            ],
        },
        {
            title: 'การปรับแต่งและเสียง',
            items: [
                {
                    id: 'tts',
                    label: 'เสียงประกาศ Dashboard',
                    description: 'เปิด/ปิดเสียงเรียกคิวอัตโนมัติ',
                    icon: Volume2,
                },
                {
                    id: 'display',
                    label: 'ธีมและการแสดงผล',
                    description: 'สีหน้าจอและขนาดตัวอักษร',
                    icon: Monitor,
                },
                {
                    id: 'role',
                    label: 'สลับบทบาทการใช้งาน',
                    description: 'เปลี่ยนมุมมองผู้ใช้งาน',
                    icon: ArrowRightLeft,
                },
            ],
        },
    ];

    return (
        <div className="space-y-4 mb-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {tabGroups.map((group, groupIdx) => (
                    <div
                        key={groupIdx}
                        className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-1.5"
                    >
                        <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            {group.title}
                        </div>

                        <div className="space-y-1">
                            {group.items.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;

                                return (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => onTabChange(tab.id)}
                                        className={`w-full p-2.5 rounded-xl transition-all duration-200 flex items-center gap-3 text-left cursor-pointer group ${
                                            isActive
                                                ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/20'
                                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                                        }`}
                                    >
                                        <div
                                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                                                isActive
                                                    ? 'bg-white/20 text-white'
                                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400'
                                            }`}
                                        >
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs sm:text-sm font-semibold truncate">
                                                    {tab.label}
                                                </span>
                                                {isActive && (
                                                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0" />
                                                )}
                                            </div>
                                            <p
                                                className={`text-[11px] truncate ${
                                                    isActive ? 'text-emerald-100' : 'text-slate-400 dark:text-slate-500'
                                                }`}
                                            >
                                                {tab.description}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
