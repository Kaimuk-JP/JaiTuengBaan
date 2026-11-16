'use client';

import { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/auth';
import Swal from '@/lib/swal';
import { Save, AlertCircle, ChevronLeft, ChevronRight, Check, Trash2, X, ChevronDown, CalendarDays, Hash } from 'lucide-react';
import type { DateLimit } from '@/types/common';

type Section = 'booking-limit' | 'calendar-limit' | null;

interface GeneralSettingsProps {
    embedded?: boolean;
}

export default function GeneralSettings({ embedded = false }: GeneralSettingsProps) {
    const [dailyBookingLimit, setDailyBookingLimit] = useState(10);
    const [isSavingLimit, setIsSavingLimit] = useState(false);
    const [dateLimits, setDateLimits] = useState<DateLimit[]>([]);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedDateLimit, setSelectedDateLimit] = useState(10);
    const [calendarMonth, setCalendarMonth] = useState(new Date());
    const [openSection, setOpenSection] = useState<Section>(null);

    useEffect(() => {
        fetchDailyBookingLimit();
        fetchDateLimits();
    }, []);

    const fetchDailyBookingLimit = async () => {
        try {
            const response = await fetchWithAuth('/settings/daily-booking-limit');
            if (response.ok) {
                const data = await response.json();
                setDailyBookingLimit(data.dailyBookingLimit);
            }
        } catch (error) {
            console.error('Error fetching daily booking limit:', error);
        }
    };

    const saveDailyBookingLimit = async () => {
        setIsSavingLimit(true);
        try {
            const response = await fetchWithAuth('/settings/daily-booking-limit', {
                method: 'PUT',
                body: JSON.stringify({ limit: dailyBookingLimit }),
            });
            if (response.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'บันทึกสำเร็จ',
                    text: 'บันทึกจำนวนการจองสูงสุดต่อวันเรียบร้อยแล้ว',
                    timer: 2000,
                    showConfirmButton: false,
                });
            }
        } catch (error) {
            console.error('Error saving daily booking limit:', error);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถบันทึกข้อมูลได้',
            });
        } finally {
            setIsSavingLimit(false);
        }
    };

    const fetchDateLimits = async () => {
        try {
            const response = await fetchWithAuth('/settings/date-limits');
            if (response.ok) {
                const data = await response.json();
                setDateLimits(data.dateLimits || []);
            }
        } catch (error) {
            console.error('Error fetching date limits:', error);
        }
    };

    const saveDateLimit = async (date: string, limit: number) => {
        try {
            const response = await fetchWithAuth(`/settings/date-limit/${date}`, {
                method: 'PUT',
                body: JSON.stringify({ limit }),
            });
            if (response.ok) {
                fetchDateLimits();
                Swal.fire({ icon: 'success', title: 'บันทึกสำเร็จ', timer: 1500, showConfirmButton: false });
                setSelectedDate(null);
            }
        } catch (error) {
            console.error('Error saving date limit:', error);
        }
    };

    const deleteDateLimit = async (date: string) => {
        try {
            const response = await fetchWithAuth(`/settings/date-limit/${date}`, { method: 'DELETE' });
            if (response.ok) {
                fetchDateLimits();
                Swal.fire({ icon: 'success', title: 'ลบสำเร็จ', text: 'ใช้ค่า default แทน', timer: 1500, showConfirmButton: false });
            }
        } catch (error) {
            console.error('Error deleting date limit:', error);
        }
    };

    const getDateLimit = (dateStr: string) => {
        const found = dateLimits.find(d => d.date === dateStr);
        return found ? found.limit : null;
    };

    const toggleSection = (section: Section) => {
        setOpenSection(openSection === section ? null : section);
    };

    const renderCalendar = () => {
        const days = [];
        const year = calendarMonth.getFullYear();
        const month = calendarMonth.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="py-3" />);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const customLimit = getDateLimit(dateStr);
            const isSelected = selectedDate === dateStr;
            const dateObj = new Date(year, month, day);
            const isPast = dateObj < today;

            days.push(
                <button
                    key={day}
                    onClick={() => {
                        if (!isPast) {
                            setSelectedDate(dateStr);
                            setSelectedDateLimit(customLimit ?? dailyBookingLimit);
                        }
                    }}
                    disabled={isPast}
                    className={`
                        relative py-3 rounded-xl transition-all duration-200 text-sm font-medium
                        ${isPast
                            ? 'text-slate-300 dark:text-gray-600 cursor-not-allowed'
                            : isSelected
                                ? 'bg-gradient-to-br from-brand-primary to-green-600 text-white shadow-lg scale-105'
                                : customLimit !== null
                                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 hover:scale-105'
                                    : 'hover:bg-slate-100 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-300 hover:scale-105'
                        }
                    `}
                >
                    {day}
                    {customLimit !== null && !isSelected && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white text-[0.625rem] rounded-full flex items-center justify-center">
                            {customLimit}
                        </span>
                    )}
                </button>
            );
        }
        return days;
    };

    const sections = [
        {
            id: 'booking-limit' as Section,
            icon: Hash,
            title: 'จำนวนการจองสูงสุดต่อวัน',
            description: 'ค่าเริ่มต้นสำหรับทุกวัน',
            color: 'from-emerald-500 to-teal-500',
            bgColor: 'bg-emerald-50',
        },
        {
            id: 'calendar-limit' as Section,
            icon: CalendarDays,
            title: 'ตั้งค่า Limit รายวัน',
            description: 'กำหนด limit เฉพาะวันที่ต้องการ',
            color: 'from-blue-500 to-indigo-500',
            bgColor: 'bg-blue-50',
        },
    ];

    return (
        <div className={embedded ? 'space-y-4' : 'p-4 sm:p-6 space-y-4'}>
            {sections.map((section) => (
                <div key={section.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 overflow-hidden shadow-sm transition-all">
                    <button
                        onClick={() => toggleSection(section.id)}
                        className={`w-full flex items-center justify-between p-4 sm:p-5 transition-all hover:bg-slate-50 dark:hover:bg-gray-700 ${openSection === section.id ? 'border-b border-slate-200 dark:border-gray-700' : ''}`}
                    >
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${section.color} flex items-center justify-center shadow-md flex-shrink-0`}>
                                <section.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-bold text-slate-800 dark:text-white text-sm sm:text-base">{section.title}</h3>
                                <p className="text-xs sm:text-sm text-slate-500 dark:text-gray-400">{section.description}</p>
                            </div>
                        </div>
                        <ChevronDown className={`w-5 h-5 text-slate-400 dark:text-gray-500 transition-transform duration-300 flex-shrink-0 ${openSection === section.id ? 'rotate-180' : ''}`} />
                    </button>

                    {openSection === section.id && (
                        <div className="p-4 sm:p-6 animate-[fadeIn_0.2s_ease-in-out]">
                            {section.id === 'booking-limit' && (
                                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl p-4 sm:p-6 border border-emerald-100 dark:border-emerald-800/30">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:justify-between">
                                        <p className="text-sm text-slate-600 dark:text-gray-300">ค่าเริ่มต้นสำหรับวันที่ไม่ได้ตั้งค่าเฉพาะ</p>
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <div className="flex items-center bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-600 overflow-hidden">
                                                <button
                                                    onClick={() => setDailyBookingLimit(Math.max(1, dailyBookingLimit - 1))}
                                                    className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors text-slate-600 dark:text-gray-300"
                                                >
                                                    −
                                                </button>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="100"
                                                    value={dailyBookingLimit}
                                                    onChange={(e) => setDailyBookingLimit(parseInt(e.target.value) || 1)}
                                                    className="w-16 text-center text-lg font-bold text-slate-800 dark:text-white outline-none bg-transparent"
                                                />
                                                <button
                                                    onClick={() => setDailyBookingLimit(Math.min(100, dailyBookingLimit + 1))}
                                                    className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors text-slate-600 dark:text-gray-300"
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <span className="text-slate-500 dark:text-gray-400">คิว/วัน</span>
                                            <button
                                                onClick={saveDailyBookingLimit}
                                                disabled={isSavingLimit}
                                                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-brand-primary to-green-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 transition-all"
                                            >
                                                <Save className="w-4 h-4" />
                                                {isSavingLimit ? 'กำลังบันทึก...' : 'บันทึก'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {section.id === 'calendar-limit' && (
                                <div>
                                    <p className="text-sm text-slate-500 dark:text-gray-400 flex items-center gap-2 mb-4">
                                        <AlertCircle className="w-4 h-4" />
                                        คลิกวันที่เพื่อตั้ง limit เฉพาะวัน
                                    </p>
                                    <div className="grid lg:grid-cols-2 gap-6">
                                        <div className="bg-slate-50 dark:bg-gray-900/50 rounded-2xl p-4 sm:p-5">
                                            <div className="flex justify-between items-center mb-4">
                                                <button
                                                    onClick={() => setCalendarMonth(new Date(calendarMonth.setMonth(calendarMonth.getMonth() - 1)))}
                                                    className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-xl transition-colors"
                                                >
                                                    <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-gray-400" />
                                                </button>
                                                <span className="font-bold text-slate-800 dark:text-white text-sm sm:text-base">
                                                    {calendarMonth.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}
                                                </span>
                                                <button
                                                    onClick={() => setCalendarMonth(new Date(calendarMonth.setMonth(calendarMonth.getMonth() + 1)))}
                                                    className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-xl transition-colors"
                                                >
                                                    <ChevronRight className="w-5 h-5 text-slate-600 dark:text-gray-400" />
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center">
                                                {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map(d => (
                                                    <div key={d} className="font-medium text-slate-400 dark:text-gray-500 py-2 text-xs sm:text-sm">{d}</div>
                                                ))}
                                                {renderCalendar()}
                                            </div>
                                            <div className="flex items-center gap-4 mt-4 text-xs text-slate-500 dark:text-gray-400">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 bg-blue-100 dark:bg-blue-900/30 rounded"></div>
                                                    <span>มี limit เฉพาะ</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 bg-gradient-to-r from-brand-primary to-green-600 rounded"></div>
                                                    <span>เลือกอยู่</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            {selectedDate && (
                                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 sm:p-5 border border-blue-100 dark:border-blue-800/30">
                                                    <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-3 text-sm sm:text-base">
                                                        📅 {new Date(selectedDate).toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                                    </h3>
                                                    <div className="flex gap-3 items-center flex-wrap">
                                                        <div className="flex items-center bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-700 overflow-hidden">
                                                            <button
                                                                onClick={() => setSelectedDateLimit(Math.max(1, selectedDateLimit - 1))}
                                                                className="px-3 py-2 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors text-slate-600 dark:text-gray-300"
                                                            >
                                                                −
                                                            </button>
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                max="100"
                                                                value={selectedDateLimit}
                                                                onChange={(e) => setSelectedDateLimit(parseInt(e.target.value) || 1)}
                                                                className="w-14 text-center font-bold text-blue-800 dark:text-blue-300 outline-none bg-transparent"
                                                            />
                                                            <button
                                                                onClick={() => setSelectedDateLimit(Math.min(100, selectedDateLimit + 1))}
                                                                className="px-3 py-2 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors text-slate-600 dark:text-gray-300"
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                        <span className="text-slate-500 dark:text-gray-400">คิว</span>
                                                        <button
                                                            onClick={() => saveDateLimit(selectedDate, selectedDateLimit)}
                                                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                                                        >
                                                            <Check className="w-4 h-4" />
                                                            บันทึก
                                                        </button>
                                                        {getDateLimit(selectedDate) !== null && (
                                                            <button
                                                                onClick={() => deleteDateLimit(selectedDate)}
                                                                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                                ลบ
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => setSelectedDate(null)}
                                                            className="p-2 bg-slate-200 dark:bg-gray-700 hover:bg-slate-300 dark:hover:bg-gray-600 rounded-xl transition-colors"
                                                        >
                                                            <X className="w-4 h-4 text-slate-600 dark:text-gray-300" />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {dateLimits.length > 0 && (
                                                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 overflow-hidden">
                                                    <div className="px-4 py-3 bg-slate-50 dark:bg-gray-900/50 border-b border-slate-200 dark:border-gray-700">
                                                        <h3 className="font-bold text-slate-700 dark:text-gray-300 text-sm">Limit ที่ตั้งไว้ ({dateLimits.length})</h3>
                                                    </div>
                                                    <div className="max-h-60 overflow-y-auto">
                                                        {dateLimits.sort((a, b) => a.date.localeCompare(b.date)).map(dl => (
                                                            <div key={dl.date} className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-gray-700 last:border-0 hover:bg-slate-50 dark:hover:bg-gray-700/50">
                                                                <span className="text-slate-600 dark:text-gray-300 text-sm">
                                                                    {new Date(dl.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                                </span>
                                                                <div className="flex items-center gap-3">
                                                                    <span className="font-bold text-brand-primary bg-green-50 dark:bg-green-900/30 px-3 py-1 rounded-lg text-sm">
                                                                        {dl.limit} คิว
                                                                    </span>
                                                                    <button
                                                                        onClick={() => deleteDateLimit(dl.date)}
                                                                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}


                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
