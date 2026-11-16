"use client";

import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/auth';

interface BookingCalendarProps {
    value: string;
    onChange: (date: string) => void;
    hasAppointment: boolean;
}

const ChevronLeftIcon = ({ size = 20, className = "" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="m15 18-6-6 6-6" />
    </svg>
);

const ChevronRightIcon = ({ size = 20, className = "" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="m9 18 6-6-6-6" />
    </svg>
);


export function BookingCalendar({ value, onChange, hasAppointment }: BookingCalendarProps) {
    const [currentDate, setCurrentDate] = useState(value ? new Date(value) : new Date());
    const [availability, setAvailability] = useState<Record<string, number>>({});
    const [defaultLimit, setDefaultLimit] = useState(10);
    const [dateLimits, setDateLimits] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [advanceBookingSetting, setAdvanceBookingSetting] = useState<{
        advanceBookingLimitEnabled: boolean;
        advanceBookingUnit: string;
        advanceBookingValue: number;
        minAdvanceBookingDays: number;
    }>({
        advanceBookingLimitEnabled: true,
        advanceBookingUnit: 'DAYS',
        advanceBookingValue: 1,
        minAdvanceBookingDays: 1,
    });

    const getLimitForDate = (dateStr: string) => dateLimits[dateStr] ?? defaultLimit;

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();

    const daysOfWeek = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

    useEffect(() => {
        const fetchAvailability = async () => {
            try {
                setIsLoading(true);
                const response = await fetchWithAuth(
                    `/queues/availability?year=${year}&month=${month + 1}`,
                );
                if (!response.ok) throw new Error('ไม่สามารถดึงข้อมูลวันว่างได้');
                const data = await response.json();
                setAvailability(data.bookings || {});
                setDefaultLimit(data.defaultLimit || 10);
                setDateLimits(data.dateLimits || {});
            } catch (error) {
                console.error('Error fetching availability:', error);
            } finally {
                setIsLoading(false);
            }
        };

        const fetchAdvanceBooking = async () => {
            try {
                const res = await fetchWithAuth('/settings/advance-booking');
                if (res.ok) {
                    const data = await res.json();
                    setAdvanceBookingSetting({
                        advanceBookingLimitEnabled: data.advanceBookingLimitEnabled ?? true,
                        advanceBookingUnit: data.advanceBookingUnit || 'DAYS',
                        advanceBookingValue: data.advanceBookingValue ?? data.minAdvanceBookingDays ?? 1,
                        minAdvanceBookingDays: data.minAdvanceBookingDays ?? 1,
                    });
                }
            } catch (err) {
            }
        };

        fetchAvailability();
        fetchAdvanceBooking();
    }, [year, month]);

    const handleDateClick = (day: number) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const count = availability[dateStr] || 0;
        const limit = getLimitForDate(dateStr);

        if (!hasAppointment && count >= limit) return;

        onChange(dateStr);
    };

    const renderDays = () => {
        const days = [];

        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-10 w-10" />);
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let day = 1; day <= daysInMonth; day++) {
            const dateObj = new Date(year, month, day);
            dateObj.setHours(0, 0, 0, 0);
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isSelected = value === dateStr;
            const count = availability[dateStr] || 0;
            const limit = getLimitForDate(dateStr);

            const isFull = count >= limit;
            const isNearFull = count >= limit - 1 && count < limit;
            const isPast = dateObj < today;

            let isTooSoon = false;
            if (advanceBookingSetting.advanceBookingLimitEnabled) {
                const unit = advanceBookingSetting.advanceBookingUnit || 'DAYS';
                const val = advanceBookingSetting.advanceBookingValue ?? advanceBookingSetting.minAdvanceBookingDays ?? 1;

                if (unit === 'DAYS' && val > 0) {
                    const diffTime = dateObj.getTime() - today.getTime();
                    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
                    if (diffDays < val) {
                        isTooSoon = true;
                    }
                } else if (unit === 'HOURS' && val > 0) {
                    if (dateObj.getTime() === today.getTime()) {
                        const now = new Date();
                        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
                        const remainingHours = (endOfToday.getTime() - now.getTime()) / (1000 * 60 * 60);
                        if (remainingHours < val) {
                            isTooSoon = true;
                        }
                    }
                }
            }

            const canBook = !isPast && !isTooSoon && (!isFull || hasAppointment);

            let className = "relative w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all text-sm ";

            if (isPast || isTooSoon) {
                className += "text-text-placeholder cursor-not-allowed opacity-50 ";
            } else if (!canBook) {
                className += "bg-fuan-light text-fuan-medium cursor-not-allowed border border-fuan-light ";
            } else {
                className += "cursor-pointer hover:scale-105 shadow-sm ";
                if (isSelected) {
                    className += "bg-brand-primary text-white ring-2 ring-offset-2 ring-brand-primary ";
                } else if (hasAppointment) {
                    className += "bg-take-soft text-take-dark border border-take-medium hover:bg-apple-soft ";
                } else if (isFull) {
                    className += "bg-fuan-light text-fuan-medium cursor-not-allowed border border-fuan-light ";
                } else if (isNearFull) {
                    className += "bg-saffron-light text-saffron-dark border border-saffron-medium hover:bg-saffron-light-soft ";
                } else {
                    className += "bg-take-soft text-take-dark border border-take-medium hover:bg-apple-soft ";
                }
            }

            let tooltip = `ว่าง ${limit - count} ที่`;
            if (isPast) {
                tooltip = 'วันที่ผ่านมาแล้ว';
            } else if (isTooSoon) {
                const unit = advanceBookingSetting.advanceBookingUnit || 'DAYS';
                const val = advanceBookingSetting.advanceBookingValue ?? advanceBookingSetting.minAdvanceBookingDays ?? 1;
                const noticeText = unit === 'DAYS'
                    ? (val === 1 ? '1 วัน (เริ่มจองได้ตั้งแต่วันถัดไป)' : `${val} วัน`)
                    : `${val} ชั่วโมง`;
                tooltip = `ต้องจองล่วงหน้าอย่างน้อย ${noticeText}`;
            } else if (isFull) {
                tooltip = hasAppointment ? 'คิวเต็ม (ใช้สิทธิ์ใบนัด)' : 'เต็มแล้ว';
            }

            days.push(
                <button
                    key={day}
                    onClick={() => canBook && handleDateClick(day)}
                    disabled={!canBook}
                    className={className}
                    title={tooltip}
                >
                    {day}
                </button>
            );
        }
        return days;
    };

    const changeMonth = (offset: number) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + offset);
        setCurrentDate(newDate);
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-square-hard border border-border-neutral dark:border-gray-600 p-2x shadow-smooth-low w-full max-w-sm mx-auto">
            {}
            <div className="flex justify-between items-center mb-2x">
                <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-field-default rounded-full text-text-tertiary">
                    <ChevronLeftIcon />
                </button>
                <span className="typo-body font-bold text-text-primary">
                    {currentDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}
                </span>
                <button onClick={() => changeMonth(1)} className="p-1 hover:bg-field-default rounded-full text-text-tertiary">
                    <ChevronRightIcon />
                </button>
            </div>


            {}
            <div className="grid grid-cols-7 text-center mb-1x">
                {daysOfWeek.map(d => (
                    <div key={d} className="typo-tags font-semibold text-text-placeholder">
                        {d}
                    </div>
                ))}
            </div>

            {}
            <div className="grid grid-cols-7 text-center gap-y-2 gap-x-1 justify-items-center">
                {isLoading ? (
                    <div className="col-span-7 py-3x text-text-placeholder typo-menu">กำลังโหลดข้อมูล...</div>
                ) : renderDays()}
            </div>

            {}
            {value && !isLoading && (
                <div className="mt-2x text-center">
                    {(() => {
                        const count = availability[value] || 0;
                        const limit = getLimitForDate(value);
                        if (count >= limit) {
                            if (hasAppointment) return <p className="text-status-stable typo-menu font-medium">ใช้สิทธิ์ใบนัด (จองได้)</p>;
                            return <p className="text-status-danger typo-menu font-medium">วันนี้คิวเต็มแล้วครับ</p>;
                        }
                        if (count >= limit - 1) return <p className="text-status-warning typo-menu font-medium">วันนี้ใกล้เต็มแล้ว (เหลือ {limit - count} ที่)</p>;
                    })()}
                </div>
            )}
        </div>
    );
}
