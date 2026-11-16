'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchWithAuth } from '@/lib/auth';
import { useAuth } from '@/contexts/AuthContext';

interface Hospital {
    id: number;
    name: string;
}

interface TimeSlot {
    value: string;
    label: string;
    endTime: string;
}

interface PatientInfoFormProps {
    displayName: string;
    mobilityStatus: string;
    hasAppointment: boolean;
    hospitalName: string;
    bookingTime: string;
    requestDate: string;
    isEditMode: boolean;
    editedData: any;
    onDataChange: (field: string, value: any) => void;
    hospitals?: Hospital[];
}

const getMobilityStatusLabel = (status: string) => {
    switch (status) {
        case 'WHEELCHAIR':
            return 'ต้องดูแลเพิ่ม';
        case 'BEDRIDDEN':
            return 'ต้องดูแลใกล้ชิด';
        case 'WALKING':
            return 'ทั่วไป';
        default:
            return status || 'ไม่ระบุ';
    }
};

export default function PatientInfoForm({
    displayName,
    mobilityStatus,
    hasAppointment,
    hospitalName,
    bookingTime,
    requestDate,
    isEditMode,
    editedData,
    onDataChange,
    hospitals = [],
}: PatientInfoFormProps) {
    const { user } = useAuth();

    const [hospitalSearch, setHospitalSearch] = useState('');
    const [filteredHospitals, setFilteredHospitals] = useState<Hospital[]>([]);
    const [showHospitalDropdown, setShowHospitalDropdown] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const hospitalRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

    useEffect(() => {
        if (isEditMode) {
            setHospitalSearch(editedData.hospitalName || hospitalName || '');
        }
    }, [isEditMode]);

    useEffect(() => {
        if (!isEditMode) return;

        const fetchTimeSlots = async () => {
            try {
                const orgParam = user?.organizationId ? `?organizationId=${user.organizationId}` : '';
                const response = await fetchWithAuth(`/booking-time-slots${orgParam}`);
                if (response.ok) {
                    const data = await response.json();
                    if (Array.isArray(data) && data.length > 0) {
                        setTimeSlots(data.map((s: any) => {
                            const match = (s.label || '').match(/(\d{1,2}:\d{2})\s*[–\-]\s*(\d{1,2}:\d{2})/);
                            return {
                                value: match ? `${match[1]} – ${match[2]}` : s.label,
                                label: s.label,
                                endTime: match ? match[2] : '23:59',
                            };
                        }));
                        return;
                    }
                }
            } catch (error) {
                console.error('Error fetching time slots:', error);
            }
            setTimeSlots([
                { value: "04:00 – 06:00", label: "รอบที่ 1: 04:00 – 06:00 น.", endTime: "06:00" },
                { value: "06:00 – 08:00", label: "รอบที่ 2: 06:00 – 08:00 น.", endTime: "08:00" },
                { value: "08:00 – 10:00", label: "รอบที่ 3: 08:00 – 10:00 น.", endTime: "10:00" },
                { value: "10:00 – 12:00", label: "รอบที่ 4: 10:00 – 12:00 น.", endTime: "12:00" },
                { value: "12:00 – 14:00", label: "รอบที่ 5: 12:00 – 14:00 น.", endTime: "14:00" },
                { value: "14:00 – 16:00", label: "รอบที่ 6: 14:00 – 16:00 น.", endTime: "16:00" },
            ]);
        };
        fetchTimeSlots();
    }, [isEditMode, user?.organizationId]);

    useEffect(() => {
        if (!isEditMode || timeSlots.length === 0) return;

        const currentBookingTime = editedData.bookingTime;
        if (!currentBookingTime) return;

        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const selectedDate = (editedData.requestDate || '').substring(0, 10);
        const isToday = selectedDate === todayStr;
        const currentHour = now.getHours();

        const availableSlots = timeSlots.filter((slot) => {
            if (!isToday) return true;
            const endHour = parseInt((slot.endTime || '23:59').split(':')[0], 10);
            return endHour > currentHour;
        });

        const isStillAvailable = availableSlots.some(s => s.value === currentBookingTime);
        if (!isStillAvailable) {
            onDataChange('bookingTime', '');
        }
    }, [isEditMode, timeSlots, editedData.requestDate]);

    useEffect(() => {
        const handleClickOutside = (e: Event) => {
            if (hospitalRef.current && !hospitalRef.current.contains(e.target as Node)) {
                setShowHospitalDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, []);

    const searchHospitals = useCallback(async (term: string) => {
        if (term.trim().length < 2) {
            setFilteredHospitals([]);
            setShowHospitalDropdown(false);
            return;
        }
        setIsSearching(true);
        try {
            const response = await fetchWithAuth(`/hospitals?search=${encodeURIComponent(term)}&limit=10`);
            const data = await response.json();
            const list: Hospital[] = Array.isArray(data) ? data : (data.data || []);
            setFilteredHospitals(list);
            setShowHospitalDropdown(true);
        } catch {
            setFilteredHospitals([]);
        } finally {
            setIsSearching(false);
        }
    }, []);

    const handleHospitalInput = (value: string) => {
        setHospitalSearch(value);
        onDataChange('hospitalId', null);
        onDataChange('hospitalName', '');
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (value.trim().length < 2) {
            setFilteredHospitals([]);
            setShowHospitalDropdown(false);
        } else {
            debounceRef.current = setTimeout(() => searchHospitals(value), 300);
        }
    };

    const handleSelectHospital = (h: Hospital) => {
        setHospitalSearch(h.name);
        onDataChange('hospitalId', h.id);
        onDataChange('hospitalName', h.name);
        setShowHospitalDropdown(false);
    };

    return (
        <div className="space-y-4 mb-6">
            <div className="flex items-center gap-2">
                <span className="font-medium text-gray-700">ชื่อ-สกุล:</span>
                <span className="text-gray-900">{displayName}</span>
            </div>

            <div className="flex items-center gap-2">
                <span className="font-medium text-gray-700">สถานะการเคลื่อนที่:</span>
                <span className={`px-2 py-1 rounded-full text-sm font-medium ${mobilityStatus === 'WHEELCHAIR' ? 'bg-blue-100 text-blue-800' :
                    mobilityStatus === 'BEDRIDDEN' ? 'bg-red-100 text-red-800' :
                        'bg-apple-soft text-brand-primary'
                    }`}>
                    {getMobilityStatusLabel(mobilityStatus)}
                </span>
            </div>

            <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-sm font-medium ${hasAppointment ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                    {hasAppointment ? 'มีนัดพบแพทย์' : 'ไม่มีนัด'}
                </span>
            </div>

            <div className="flex items-center gap-2">
                <span className="font-medium text-gray-700">โรงพยาบาล:</span>
                {isEditMode ? (
                    <div className="relative flex-1" ref={hospitalRef}>
                        <div className="relative">
                            <input
                                type="text"
                                value={hospitalSearch}
                                onChange={(e) => handleHospitalInput(e.target.value)}
                                onFocus={() => {
                                    if (hospitalSearch.trim().length >= 2) searchHospitals(hospitalSearch);
                                }}
                                className="w-full px-3 py-1.5 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
                                placeholder="พิมพ์ค้นหาโรงพยาบาล..."
                                autoComplete="off"
                            />
                            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                {isSearching ? (
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                )}
                            </div>
                        </div>
                        {showHospitalDropdown && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                {filteredHospitals.length > 0 ? (
                                    filteredHospitals.map((h) => (
                                        <div
                                            key={h.id}
                                            onClick={() => handleSelectHospital(h)}
                                            className="px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer transition-colors border-b border-gray-50 last:border-b-0"
                                        >
                                            {h.name}
                                        </div>
                                    ))
                                ) : (
                                    <div className="px-3 py-3 text-sm text-gray-400 text-center">
                                        ไม่พบโรงพยาบาลที่ค้นหา
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <span className="text-gray-900">{hospitalName}</span>
                )}
            </div>

            <div className="flex items-center gap-2">
                <span className="font-medium text-gray-700 whitespace-nowrap">เวลานัด:</span>
                {isEditMode ? (
                    (() => {
                        const now = new Date();
                        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                        const selectedDate = (editedData.requestDate || '').substring(0, 10);
                        const isToday = selectedDate === todayStr;
                        const currentHour = now.getHours();

                        return (
                            <select
                                value={editedData.bookingTime || ''}
                                onChange={(e) => onDataChange('bookingTime', e.target.value)}
                                className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
                            >
                                <option value="">-- เลือกเวลานัด --</option>
                                {timeSlots
                                    .filter((slot) => {
                                        if (!isToday) return true;
                                        const endHour = parseInt((slot.endTime || '23:59').split(':')[0], 10);
                                        return endHour > currentHour;
                                    })
                                    .map((slot) => (
                                        <option key={slot.value} value={slot.value}>
                                            {slot.label}
                                        </option>
                                    ))}

                            </select>
                        );
                    })()
                ) : (
                    <span className="text-gray-900">{bookingTime || '-'}</span>
                )}
            </div>

            <div className="flex items-center gap-2">
                <span className="font-medium text-gray-700 whitespace-nowrap">วันที่ขอใช้บริการ:</span>
                {isEditMode ? (
                    <input
                        type="date"
                        value={editedData.requestDate || ''}
                        onChange={(e) => onDataChange('requestDate', e.target.value)}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                ) : (
                    <span className="text-gray-900">
                        {new Date(requestDate).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                        })}
                    </span>
                )}
            </div>
        </div>
    );
}
