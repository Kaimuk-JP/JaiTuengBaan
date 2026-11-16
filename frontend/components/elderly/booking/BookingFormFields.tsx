"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { BookingCalendar } from "./BookingCalendar";
import { useAuth } from "@/contexts/AuthContext";
import type { TimeSlot } from "@/types/common";
import { getApiUrl } from "@/lib/api";

interface Hospital {
    id: number;
    name: string;
    lat?: number;
    lng?: number;
}

interface BookingFormFieldsProps {
    hospital: string;
    bookingTime: string;
    bookingDate: string;
    hasAppointment: boolean;
    bookedFor: string;
    showBookedForField?: boolean;
    onHospitalChange: (value: string) => void;
    onTimeChange: (value: string) => void;
    onDateChange: (value: string) => void;
    onBookedForChange: (value: string) => void;
    onHospitalSelect: (hospital: Hospital | null) => void;
}

export function BookingFormFields({
    hospital,
    bookingTime,
    bookingDate,
    hasAppointment,
    bookedFor,
    showBookedForField = false,
    onHospitalChange,
    onTimeChange,
    onDateChange,
    onBookedForChange,
    onHospitalSelect
}: BookingFormFieldsProps) {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [filteredHospitals, setFilteredHospitals] = useState<Hospital[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);
    const { user } = useAuth();

    const [dynamicTimeSlots, setDynamicTimeSlots] = useState<TimeSlot[]>([]);

    useEffect(() => {
        const fetchTimeSlots = async () => {
            try {
                const orgParam = user?.organizationId ? `?organizationId=${user.organizationId}` : '';
                const response = await fetch(`${getApiUrl()}/booking-time-slots${orgParam}`);
                if (response.ok) {
                    const data = await response.json();
                    if (Array.isArray(data) && data.length > 0) {
                        setDynamicTimeSlots(data.map((s: any) => {
                            const match = (s.label || '').match(/(\d{1,2}:\d{2})\s*[–\-]\s*(\d{1,2}:\d{2})/);
                            let value = s.label;
                            let endTime = '23:59';
                            if (match) {
                                value = `${match[1]} – ${match[2]}`;
                                endTime = match[2];
                            }
                            return {
                                value,
                                label: s.label,
                                endTime,
                            };
                        }));
                        return;
                    }
                }
            } catch (error) {
                console.error('Error fetching time slots:', error);
            }
            setDynamicTimeSlots([
                { value: "04:00 – 06:00", label: "รอบที่ 1: 04:00 – 06:00 น.", endTime: "06:00" },
                { value: "06:00 – 08:00", label: "รอบที่ 2: 06:00 – 08:00 น.", endTime: "08:00" },
                { value: "08:00 – 10:00", label: "รอบที่ 3: 08:00 – 10:00 น.", endTime: "10:00" },
                { value: "10:00 – 12:00", label: "รอบที่ 4: 10:00 – 12:00 น.", endTime: "12:00" },
                { value: "12:00 – 14:00", label: "รอบที่ 5: 12:00 – 14:00 น.", endTime: "14:00" },
                { value: "14:00 – 16:00", label: "รอบที่ 6: 14:00 – 16:00 น.", endTime: "16:00" },
            ]);
        };
        fetchTimeSlots();
    }, [user?.organizationId]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const searchHospitals = useCallback(async (searchTerm: string) => {
        if (searchTerm.trim().length < 2) {
            setFilteredHospitals([]);
            setShowSuggestions(false);
            return;
        }

        setIsLoading(true);
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL;
            const response = await fetch(`${API_URL}/hospitals?search=${encodeURIComponent(searchTerm)}&limit=10`);
            const data = await response.json();

            const hospitals: Hospital[] = Array.isArray(data) ? data : (data.data || []);

            setFilteredHospitals(hospitals);
            setShowSuggestions(true);
        } catch (error) {
            console.error("Error searching hospitals:", error);
            setFilteredHospitals([]);
            setShowSuggestions(true);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleHospitalInput = (value: string) => {
        onHospitalChange(value);
        onHospitalSelect(null);

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        if (value.trim().length < 2) {
            setFilteredHospitals([]);
            setShowSuggestions(false);
        } else {
            debounceRef.current = setTimeout(() => {
                searchHospitals(value);
            }, 300);
        }
    };

    const handleSelectHospital = (selectedHospital: Hospital) => {
        onHospitalChange(selectedHospital.name);
        onHospitalSelect(selectedHospital);
        setShowSuggestions(false);
    };

    return (
        <div className="space-y-3x">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center">
                    <svg className="w-4 h-4 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                </div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                    รายละเอียดการจอง
                </h2>
            </div>

            {}
            {showBookedForField && (
                <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        ชื่อผู้จอง
                    </label>
                    <select
                        value={bookedFor}
                        onChange={(e) => onBookedForChange(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all appearance-none text-gray-800 dark:text-white"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M6 9L12 15L18 9' stroke='%236B7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 1rem center',
                            paddingRight: '2.5rem'
                        }}
                    >
                        <option value="self">{`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.displayName || 'ตัวเอง'}</option>
                        {}
                    </select>
                </div>
            )}

            {}
            <div className="relative" ref={dropdownRef}>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    ค้นหาโรงพยาบาล
                </label>
                <div className="relative">
                    <input
                        type="text"
                        value={hospital}
                        onChange={(e) => handleHospitalInput(e.target.value)}
                        onFocus={() => {
                            if (hospital.trim().length >= 2) {
                                searchHospitals(hospital);
                            }
                        }}
                        className="w-full px-4 py-3 pl-11 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all placeholder:text-gray-400 text-gray-800 dark:text-white"
                        placeholder="พิมพ์ชื่อโรงพยาบาลเพื่อค้นหา..."
                        autoComplete="off"
                        maxLength={255}
                    />
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                </div>

                {}
                {showSuggestions && (
                    <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-lg max-h-60 overflow-y-auto overflow-x-hidden backdrop-blur-xl bg-opacity-95">
                        {isLoading ? (
                            <div className="p-3 text-center text-sm text-gray-500">
                                กำลังค้นหา...
                            </div>
                        ) : filteredHospitals.length > 0 ? (
                            filteredHospitals.map((h) => (
                                <div
                                    key={h.id}
                                    onClick={() => handleSelectHospital(h)}
                                    className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-brand-primary/5 hover:text-brand-primary cursor-pointer transition-colors border-b border-gray-50 dark:border-gray-700 last:border-b-0"
                                >
                                    {h.name}
                                </div>
                            ))
                        ) : hospital.trim().length >= 2 ? (
                            <div className="p-3 text-center text-sm text-gray-500">
                                ไม่พบข้อมูลโรงพยาบาลที่ค้นหา
                            </div>
                        ) : null}
                    </div>
                )}
            </div>

            {}
            <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    วันที่ต้องการจอง
                </label>
                <BookingCalendar
                    value={bookingDate}
                    onChange={onDateChange}
                    hasAppointment={hasAppointment}
                />
            </div>

            {}
            <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    เวลาที่ต้องการจอง
                </label>
                <div className="relative">
                    <select
                        value={bookingTime}
                        onChange={(e) => onTimeChange(e.target.value)}
                        disabled={!bookingDate}
                        className={`w-full px-4 py-3 pl-11 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all appearance-none ${
                            !bookingDate
                                ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed opacity-60'
                                : 'bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white'
                        }`}
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M6 9L12 15L18 9' stroke='%236B7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 1rem center',
                            paddingRight: '2.5rem'
                        }}
                    >
                    <option value="">{!bookingDate ? 'กรุณาเลือกวันที่ก่อน' : 'เลือกช่วงเวลา'}</option>
                    {bookingDate && (() => {
                        const today = new Date();
                        const year = today.getFullYear();
                        const month = String(today.getMonth() + 1).padStart(2, '0');
                        const day = String(today.getDate()).padStart(2, '0');
                        const todayStr = `${year}-${month}-${day}`;
                        const isToday = bookingDate === todayStr;
                        const currentMinutes = today.getHours() * 60 + today.getMinutes();

                        return dynamicTimeSlots
                            .filter(slot => {
                                if (!isToday) return true;
                                const parts = slot.endTime.split(':').map(Number);
                                const endMinutes = (parts[0] || 0) * 60 + (parts[1] || 0);
                                return endMinutes > currentMinutes;
                            })
                            .map(slot => (
                                <option key={slot.value} value={slot.value}>{slot.label}</option>
                            ));
                    })()}
                </select>
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                </div>
                {!bookingDate && (
                    <p className="mt-2 text-xs text-amber-500 font-medium flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        กรุณาเลือกวันที่ก่อน
                    </p>
                )}
            </div>
        </div>
    );
}
