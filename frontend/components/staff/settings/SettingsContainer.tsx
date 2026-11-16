'use client';

import { useState } from 'react';
import { Settings } from 'lucide-react';
import SettingsTabs from './SettingsTabs';
import DiseaseSettings from './DiseaseSettings';
import HospitalSettings from './HospitalSettings';
import BookingTimeSlotsSettings from './BookingTimeSlotsSettings';
import GeneralSettings from './GeneralSettings';
import EquipmentSettings from './EquipmentSettings';
import DashboardTtsSettings from './DashboardTtsSettings';
import ThemeSettings from '@/components/settings/ThemeSettings';
import FontSizeSettings from '@/components/settings/FontSizeSettings';
import OrganizationSettings from './OrganizationSettings';
import RoleSwitcherCard from '@/components/shared/role/RoleSwitcherCard';
import type { Tab } from './types';

export default function SettingsContainer() {
    const [activeTab, setActiveTab] = useState<Tab>('organization');

    const getTabTitle = () => {
        switch (activeTab) {
            case 'organization':
                return 'ข้อมูลเทศบาลและนโยบายระบบ';
            case 'time-slots':
                return 'จัดการรอบเวลาการจอง (Booking Time Slots)';
            case 'booking-limits':
                return 'จำกัดจำนวนการจองต่อวัน (Daily & Calendar Booking Limits)';
            case 'diseases':
                return 'จัดการรายการโรคประจำตัว';
            case 'hospitals':
                return 'จัดการรายชื่อโรงพยาบาล';
            case 'equipment':
                return 'จัดการอุปกรณ์ทางการแพทย์';
            case 'tts':
                return 'ระบบเสียงแจ้งเตือนอัตโนมัติ (Dashboard TTS)';
            case 'display':
                return 'ปรับแต่งธีมและการแสดงผลหน้าจอ';
            case 'role':
                return 'สลับบทบาทการใช้งานระบบ';
            default:
                return 'ตั้งค่าระบบ';
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/70 dark:bg-slate-900 pb-16">
            <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-700 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl flex items-center justify-center shadow-md shadow-emerald-700/20 text-white">
                                <Settings className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="mb-0.5">
                                    <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                                        ตั้งค่าระบบ (System Settings)
                                    </h1>
                                </div>
                                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                                    จัดการข้อมูลหน่วยงาน นโยบายคิว ข้อมูลทางการแพทย์ และการปรับแต่งระบบ
                                </p>
                            </div>
                        </div>

                        <div className="self-start sm:self-center">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600">
                                กำลังตั้งค่า: <strong className="text-emerald-700 dark:text-emerald-400">{getTabTitle()}</strong>
                            </span>
                        </div>
                    </div>
                </div>

                <SettingsTabs activeTab={activeTab} onTabChange={setActiveTab} />

                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-700 overflow-hidden">
                    {activeTab === 'organization' && <OrganizationSettings />}
                    {activeTab === 'time-slots' && (
                        <div className="p-4 sm:p-6">
                            <BookingTimeSlotsSettings embedded={false} />
                        </div>
                    )}
                    {activeTab === 'booking-limits' && (
                        <div className="p-4 sm:p-6">
                            <GeneralSettings embedded={false} />
                        </div>
                    )}
                    {activeTab === 'diseases' && <DiseaseSettings />}
                    {activeTab === 'hospitals' && <HospitalSettings />}
                    {activeTab === 'equipment' && (
                        <div className="p-4 sm:p-6">
                            <EquipmentSettings embedded={false} />
                        </div>
                    )}
                    {activeTab === 'tts' && (
                        <div className="p-4 sm:p-6">
                            <DashboardTtsSettings />
                        </div>
                    )}
                    {activeTab === 'role' && (
                        <div className="p-4 sm:p-6">
                            <RoleSwitcherCard />
                        </div>
                    )}
                    {activeTab === 'display' && (
                        <div className="p-4 sm:p-6 space-y-6">
                            <ThemeSettings />
                            <FontSizeSettings />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
