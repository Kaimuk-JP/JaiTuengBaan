'use client';

import { useState } from 'react';
import { RideRequest } from './types';
import { TripQueueMode, TripQueuePhase } from '@/utils/tripQueueOrder';

interface TripQueuePanelProps {
    phase: TripQueuePhase;
    orderedRequests: RideRequest[];
    mode: TripQueueMode;
    selectedId?: number | null;
    onReorder: (fromIndex: number, toIndex: number) => void;
    onResetAuto: () => void;
    onSelect: (req: RideRequest) => void;
}

function getDisplayName(req: RideRequest): string {
    const user = req.queue.user;
    const name =
        user.displayName?.trim() ||
        `${user.firstName || ''} ${user.lastName || ''}`.trim();
    return name || 'ไม่ระบุชื่อ';
}

export default function TripQueuePanel({
    phase,
    orderedRequests,
    mode,
    selectedId,
    onReorder,
    onResetAuto,
    onSelect,
}: TripQueuePanelProps) {
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [overIndex, setOverIndex] = useState<number | null>(null);

    if (orderedRequests.length <= 1) return null;

    const title =
        phase === 'pickup'
            ? `ลำดับการรับ (เหลือ ${orderedRequests.length} คน)`
            : `ลำดับการส่งกลับบ้าน (เหลือ ${orderedRequests.length} คน)`;

    const handleDrop = (toIndex: number) => {
        if (dragIndex === null || dragIndex === toIndex) return;
        onReorder(dragIndex, toIndex);
        setDragIndex(null);
        setOverIndex(null);
    };

    return (
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between gap-2 mb-2">
                <p className="text-sm font-bold text-gray-800">{title}</p>
                {mode === 'manual' ? (
                    <button
                        type="button"
                        onClick={onResetAuto}
                        className="text-xs font-semibold text-brand-primary hover:text-brand-secondary shrink-0"
                    >
                        กลับไปเรียงอัตโนมัติ
                    </button>
                ) : (
                    <span className="text-xs text-gray-500 shrink-0">เรียงตามใกล้ที่สุด · ลากเพื่อจัดลำดับ</span>
                )}
            </div>
            <ul className="space-y-1.5">
                {orderedRequests.map((req, index) => {
                    const isCurrent = index === 0;
                    const isNext = orderedRequests.length > 1 && index === 1;
                    const currentLabel = phase === 'pickup' ? 'กำลังไปรับ' : 'กำลังส่งกลับ';
                    const isSelected = selectedId === req.id;
                    const isDragging = dragIndex === index;
                    const isOver = overIndex === index && dragIndex !== null && dragIndex !== index;

                    return (
                        <li
                            key={req.id}
                            draggable
                            onDragStart={() => setDragIndex(index)}
                            onDragEnd={() => {
                                setDragIndex(null);
                                setOverIndex(null);
                            }}
                            onDragOver={(e) => {
                                e.preventDefault();
                                setOverIndex(index);
                            }}
                            onDrop={() => handleDrop(index)}
                            className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 transition-colors ${
                                isSelected ? 'border-brand-primary bg-white' : 'border-gray-200 bg-white'
                            } ${isDragging ? 'opacity-50' : ''} ${isOver ? 'border-brand-primary/60 bg-brand-primary/5' : ''}`}
                        >
                            <div
                                className="shrink-0 w-8 h-8 flex items-center justify-center text-gray-400 cursor-grab active:cursor-grabbing touch-none"
                                aria-hidden
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <circle cx="9" cy="7" r="1.5" />
                                    <circle cx="15" cy="7" r="1.5" />
                                    <circle cx="9" cy="12" r="1.5" />
                                    <circle cx="15" cy="12" r="1.5" />
                                    <circle cx="9" cy="17" r="1.5" />
                                    <circle cx="15" cy="17" r="1.5" />
                                </svg>
                            </div>
                            <button
                                type="button"
                                onClick={() => onSelect(req)}
                                className="flex-1 min-w-0 text-left"
                            >
                                <span className="text-xs text-gray-500 mr-1">{index + 1}.</span>
                                <span className="font-semibold text-gray-800 text-sm truncate">
                                    {getDisplayName(req)}
                                </span>
                                {isCurrent && (
                                    <span className="ml-1.5 inline-block text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-600 text-white">
                                        {currentLabel}
                                    </span>
                                )}
                                {isNext && (
                                    <span className="ml-1.5 inline-block text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-primary text-white">
                                        คนถัดไป
                                    </span>
                                )}
                            </button>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
