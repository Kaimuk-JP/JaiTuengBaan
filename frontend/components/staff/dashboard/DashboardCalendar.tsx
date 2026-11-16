'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getQueueLocalDateStr } from '@/utils/dateHelpers';

interface DashboardCalendarProps {
    queues: any[];
    onDateSelect: (date: string) => void;
    selectedDate: string | null;
}

const PENDING_STATUSES = new Set(['PENDING_MUNICIPAL', 'APPROVED', 'PENDING_EXECUTIVE', 'EXECUTIVE_REJECTED', 'OPEN', 'ASSIGNED']);
const ACTIVE_STATUSES = new Set(['ACCEPTED', 'PICKING_UP', 'IN_TRANSIT', 'AT_HOSPITAL', 'AT_PATIENT_HOME', 'RETURN_HOME', 'RETURN_OFFICE']);
const CANCELLED_STATUSES = new Set(['CANCELLED', 'CANCELLED_BY_USER', 'CANCELLED_BY_MUNICIPAL', 'REJECTED']);

export default function DashboardCalendar({ queues, onDateSelect, selectedDate }: DashboardCalendarProps) {
    const [viewDate, setViewDate] = useState(new Date());

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const statusByDate = useMemo(() => {
        const statuses: Record<string, { hasJobs: boolean; hasPending: boolean; hasActive: boolean }> = {};
        queues.forEach(q => {
            const qStatus = q.status;
            const jStatus = q.job?.status;

            if (CANCELLED_STATUSES.has(qStatus) || (jStatus && CANCELLED_STATUSES.has(jStatus))) {
                return;
            }

            const dateStr = getQueueLocalDateStr(q);
            if (!dateStr) return;

            if (!statuses[dateStr]) {
                statuses[dateStr] = { hasJobs: false, hasPending: false, hasActive: false };
            }

            statuses[dateStr].hasJobs = true;

            if (PENDING_STATUSES.has(qStatus) || PENDING_STATUSES.has(jStatus)) {
                statuses[dateStr].hasPending = true;
            }

            if (ACTIVE_STATUSES.has(jStatus)) {
                statuses[dateStr].hasActive = true;
            }
        });
        return statuses;
    }, [queues]);

    const changeMonth = (offset: number) => {
        setViewDate(new Date(year, month + offset, 1));
    };

    const days = [];
    for (let i = 0; i < firstDay; i++) {
        days.push(<div key={`empty-${i}`} className="h-16 rounded-xl bg-transparent" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayStatuses = statusByDate[dateStr] || { hasJobs: false, hasPending: false, hasActive: false };
        const isSelected = selectedDate === dateStr;

        days.push(
            <div
                key={day}
                onClick={() => onDateSelect(dateStr)}
                className={`
                    h-16 flex flex-col items-center justify-center rounded-2xl cursor-pointer transition-all duration-200
                    ${isSelected
                        ? 'bg-[#00A651] text-white shadow-md'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }
                `}
            >
                <span className="text-sm font-semibold mb-1">
                    {day}
                </span>

                <div className="flex gap-1 h-1.5 items-center justify-center">
                    {dayStatuses.hasActive && (
                         <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                    )}
                    {dayStatuses.hasPending && (
                         <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    )}
                    {dayStatuses.hasJobs && !dayStatuses.hasPending && !dayStatuses.hasActive && (
                         <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    )}
                </div>
            </div>
        );
    }

    const thaiMonth = viewDate.toLocaleDateString('th-TH', { month: 'long' });
    const thaiYear = viewDate.toLocaleDateString('th-TH', { year: 'numeric' });

    return (
        <div className="bg-white rounded-2xl w-full">
            <div className="px-2 py-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-800">
                    {thaiMonth} <span className="text-slate-400 font-medium">{thaiYear}</span>
                </h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => changeMonth(-1)}
                        className="p-1 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => changeMonth(1)}
                        className="p-1 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-2 text-center mb-2">
                {['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'].map(d => (
                    <div key={d} className="py-2 text-xs font-semibold text-slate-400">
                        {d}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
                {days}
            </div>
        </div>
    );
}
