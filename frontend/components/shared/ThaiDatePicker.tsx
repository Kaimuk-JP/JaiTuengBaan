'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

const THAI_MONTHS = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

interface ThaiDatePickerProps {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    max?: string;
    className?: string;
}

type Step = 'closed' | 'year' | 'month' | 'day';

export default function ThaiDatePicker({ value, onChange, placeholder = 'วว/ดด/ปปปป', max, className }: ThaiDatePickerProps) {
    const [step, setStep] = useState<Step>('closed');
    const [selectedYear, setSelectedYear] = useState<number | null>(null);
    const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
    const [mounted, setMounted] = useState(false);
    const yearListRef = useRef<HTMLDivElement>(null);

    const now = new Date();
    const maxDate = max ? new Date(max + 'T00:00:00') : now;
    const currentCEYear = now.getFullYear();

    const minYear = currentCEYear - 120;
    const maxYear = maxDate.getFullYear();

    useEffect(() => setMounted(true), []);

    useEffect(() => {
        if (step !== 'closed') {
            document.body.style.overflow = 'hidden';
            return () => { document.body.style.overflow = ''; };
        }
    }, [step]);

    useEffect(() => {
        if (step === 'year' && yearListRef.current) {
            const targetYear = currentCEYear - 65;
            const yearIndex = maxYear - targetYear;
            const itemHeight = 48;
            const scrollTop = Math.max(0, Math.floor(yearIndex / 3) * itemHeight - 80);
            yearListRef.current.scrollTop = scrollTop;
        }
    }, [step, maxYear, currentCEYear]);

    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();

    const formatDisplay = (iso: string) => {
        if (!iso) return '';
        const d = new Date(iso + 'T00:00:00');
        if (isNaN(d.getTime())) return '';
        return `${d.getDate()} ${THAI_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`;
    };

    const handleOpen = () => {
        if (step !== 'closed') {
            setStep('closed');
            return;
        }
        if (value) {
            const d = new Date(value + 'T00:00:00');
            if (!isNaN(d.getTime())) {
                setSelectedYear(d.getFullYear());
                setSelectedMonth(d.getMonth());
            }
        } else {
            setSelectedYear(null);
            setSelectedMonth(null);
        }
        setStep('year');
    };

    const handleSelectYear = (year: number) => {
        setSelectedYear(year);
        setStep('month');
    };

    const handleSelectMonth = (month: number) => {
        setSelectedMonth(month);
        setStep('day');
    };

    const handleSelectDay = (day: number) => {
        if (selectedYear === null || selectedMonth === null) return;
        const m = String(selectedMonth + 1).padStart(2, '0');
        const d = String(day).padStart(2, '0');
        onChange(`${selectedYear}-${m}-${d}`);
        setStep('closed');
    };

    const handleClear = () => {
        onChange('');
        setStep('closed');
        setSelectedYear(null);
        setSelectedMonth(null);
    };

    const handleClose = useCallback(() => setStep('closed'), []);

    const isMonthAllowed = (year: number, month: number) => {
        if (year < maxYear) return true;
        if (year === maxYear) return month <= maxDate.getMonth();
        return false;
    };

    const isDayAllowed = (year: number, month: number, day: number) => {
        const d = new Date(year, month, day);
        return d <= maxDate;
    };

    const displayValue = formatDisplay(value);

    const renderPicker = () => {
        if (step === 'closed') return null;

        return (
            <>
                <div
                    className="fixed inset-0 bg-black/40 z-[9998]"
                    onClick={handleClose}
                    onTouchEnd={handleClose}
                />

                <div
                    className="fixed bottom-0 left-0 right-0 z-[9999] bg-white dark:bg-gray-800 rounded-t-2xl shadow-2xl"
                    style={{ maxHeight: '70dvh', animation: 'slideUp 0.25s ease-out' }}
                >
                    <div className="flex justify-center pt-2 pb-1">
                        <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                    </div>

                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={() => {
                                if (step === 'month') setStep('year');
                                else if (step === 'day') setStep('month');
                                else setStep('closed');
                            }}
                            className="p-2 -ml-2 rounded-xl active:bg-gray-100 dark:active:bg-gray-700 transition-colors"
                        >
                            <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <span className="text-sm font-bold text-gray-800 dark:text-white">
                            {step === 'year' && 'เลือกปี พ.ศ.'}
                            {step === 'month' && `ปี พ.ศ. ${(selectedYear || 0) + 543} — เลือกเดือน`}
                            {step === 'day' && `${THAI_MONTHS[selectedMonth || 0]} ${(selectedYear || 0) + 543}`}
                        </span>
                        <button
                            type="button"
                            onClick={handleClose}
                            className="p-2 -mr-2 rounded-xl active:bg-gray-100 dark:active:bg-gray-700 transition-colors"
                        >
                            <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    <div className="flex items-center justify-center gap-2 py-2 px-4">
                        {['ปี', 'เดือน', 'วัน'].map((label, i) => {
                            const steps: Step[] = ['year', 'month', 'day'];
                            const isActive = step === steps[i];
                            const isPast = steps.indexOf(step) > i;
                            return (
                                <div key={label} className="flex items-center gap-2">
                                    <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                                        isActive ? 'bg-brand-primary text-white' : isPast ? 'bg-brand-primary/15 text-brand-primary' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                                    }`}>
                                        {isPast && (
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                        )}
                                        {label}
                                    </div>
                                    {i < 2 && <div className="w-4 h-px bg-gray-300 dark:bg-gray-600" />}
                                </div>
                            );
                        })}
                    </div>

                    <div className="overflow-y-auto" style={{ maxHeight: 'calc(70dvh - 130px)', WebkitOverflowScrolling: 'touch' }}>

                        {step === 'year' && (
                            <div ref={yearListRef} className="p-3 overflow-y-auto" style={{ maxHeight: 'calc(70dvh - 170px)', WebkitOverflowScrolling: 'touch' }}>
                                <div className="grid grid-cols-3 gap-2">
                                    {Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i).map(year => {
                                        const thaiYear = year + 543;
                                        const isSelected = selectedYear === year;
                                        const isCurrent = year === currentCEYear;
                                        return (
                                            <button
                                                key={year}
                                                type="button"
                                                onClick={() => handleSelectYear(year)}
                                                className={`py-3 rounded-xl text-sm font-medium transition-all active:scale-95 ${
                                                    isSelected
                                                        ? 'bg-brand-primary text-white shadow-md'
                                                        : isCurrent
                                                            ? 'bg-brand-primary/10 text-brand-primary font-bold ring-1 ring-brand-primary/30'
                                                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200'
                                                }`}
                                            >
                                                {thaiYear}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {step === 'month' && selectedYear !== null && (
                            <div className="p-4">
                                <div className="grid grid-cols-3 gap-2.5">
                                    {THAI_MONTHS.map((name, i) => {
                                        const allowed = isMonthAllowed(selectedYear, i);
                                        const isSelected = selectedMonth === i;
                                        return (
                                            <button
                                                key={i}
                                                type="button"
                                                disabled={!allowed}
                                                onClick={() => handleSelectMonth(i)}
                                                className={`py-3.5 rounded-xl text-sm font-medium transition-all active:scale-95 ${
                                                    !allowed
                                                        ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                                                        : isSelected
                                                            ? 'bg-brand-primary text-white shadow-md'
                                                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200'
                                                }`}
                                            >
                                                {name.substring(0, 3)}.
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {step === 'day' && selectedYear !== null && selectedMonth !== null && (
                            <div className="p-4">
                                <div className="grid grid-cols-7 gap-1 mb-2">
                                    {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map(d => (
                                        <div key={d} className="text-center text-xs font-semibold text-gray-400 dark:text-gray-500 py-1">{d}</div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-7 gap-1">
                                    {Array.from({ length: new Date(selectedYear, selectedMonth, 1).getDay() }, (_, i) => (
                                        <div key={`e-${i}`} />
                                    ))}
                                    {Array.from({ length: getDaysInMonth(selectedYear, selectedMonth) }, (_, i) => {
                                        const day = i + 1;
                                        const allowed = isDayAllowed(selectedYear, selectedMonth, day);
                                        const currentValue = value ? new Date(value + 'T00:00:00') : null;
                                        const isSelected = currentValue && currentValue.getFullYear() === selectedYear && currentValue.getMonth() === selectedMonth && currentValue.getDate() === day;

                                        return (
                                            <button
                                                key={day}
                                                type="button"
                                                disabled={!allowed}
                                                onClick={() => handleSelectDay(day)}
                                                className={`py-2.5 rounded-xl text-sm font-medium transition-all active:scale-90 min-h-[44px] ${
                                                    !allowed
                                                        ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                                                        : isSelected
                                                            ? 'bg-brand-primary text-white shadow-md'
                                                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200'
                                                }`}
                                            >
                                                {day}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
                        <button type="button" onClick={handleClear} className="text-sm text-red-500 font-semibold px-3 py-2 rounded-xl active:bg-red-50 transition-colors">
                            ล้างค่า
                        </button>
                        <button type="button" onClick={handleClose} className="text-sm text-gray-500 font-semibold px-3 py-2 rounded-xl active:bg-gray-100 transition-colors">
                            ปิด
                        </button>
                    </div>
                </div>

                <style>{`
                    @keyframes slideUp {
                        from { transform: translateY(100%); }
                        to { transform: translateY(0); }
                    }
                `}</style>
            </>
        );
    };

    return (
        <div className="relative w-full min-w-0 max-w-full">
            <button
                type="button"
                onClick={handleOpen}
                className={`block w-full min-w-0 max-w-full box-border overflow-hidden whitespace-nowrap text-ellipsis p-2x pr-10 typo-body text-left bg-white border border-border-neutral rounded-square focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all ${className || ''}`}
            >
                {displayValue ? (
                    <span className="text-text-primary">{displayValue}</span>
                ) : (
                    <span className="text-text-placeholder">{placeholder}</span>
                )}
            </button>
            <svg
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-placeholder pointer-events-none"
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>

            {mounted && createPortal(renderPicker(), document.body)}
        </div>
    );
}
