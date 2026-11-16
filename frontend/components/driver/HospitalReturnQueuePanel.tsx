'use client';

import { useState } from 'react';
import { RideRequest } from './types';
import { TripQueueMode } from '@/utils/tripQueueOrder';

interface HospitalReturnQueuePanelProps {
    orderedRequests: RideRequest[];
    mode: TripQueueMode;
    onReorder: (fromIndex: number, toIndex: number) => void;
    onResetAuto: () => void;
}

function getDisplayName(req: RideRequest): string {
    const user = req.queue.user;
    const name =
        user.displayName?.trim() ||
        `${user.firstName || ''} ${user.lastName || ''}`.trim();
    return name || 'ไม่ระบุชื่อ';
}

export default function HospitalReturnQueuePanel({
    orderedRequests,
    mode,
    onReorder,
    onResetAuto,
}: HospitalReturnQueuePanelProps) {
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [overIndex, setOverIndex] = useState<number | null>(null);

    if (orderedRequests.length === 0) return null;

    const canReorder = orderedRequests.length > 1;

    const handleDrop = (toIndex: number) => {
        if (!canReorder || dragIndex === null || dragIndex === toIndex) return;
        onReorder(dragIndex, toIndex);
        setDragIndex(null);
        setOverIndex(null);
    };

    return (
        <div className="px-4 py-3 bg-amber-50 border-b border-amber-200">
            <div className="flex items-center justify-between gap-2 mb-2">
                <p className="text-sm font-bold text-amber-800">
                    รอรับกลับที่โรงพยาบาล ({orderedRequests.length})
                </p>
                {canReorder && (
                    mode === 'manual' ? (
                        <button
                            type="button"
                            onClick={onResetAuto}
                            className="text-xs font-semibold text-amber-700 hover:text-amber-900 shrink-0"
                        >
                            กลับไปเรียงอัตโนมัติ
                        </button>
                    ) : (
                        <span className="text-xs text-amber-700 shrink-0">เรียงตามเวลาเรียกกลับ · ลากเพื่อจัดลำดับ</span>
                    )
                )}
            </div>
            <ul className="space-y-2">
                {orderedRequests.map((req, index) => {
                    const isCurrent = index === 0;
                    const isNext = canReorder && index === 1;
                    const isDragging = dragIndex === index;
                    const isOver = overIndex === index && dragIndex !== null && dragIndex !== index;

                    return (
                        <li
                            key={req.id}
                            draggable={canReorder}
                            onDragStart={() => canReorder && setDragIndex(index)}
                            onDragEnd={() => {
                                setDragIndex(null);
                                setOverIndex(null);
                            }}
                            onDragOver={(e) => {
                                if (!canReorder) return;
                                e.preventDefault();
                                setOverIndex(index);
                            }}
                            onDrop={() => handleDrop(index)}
                            className={`rounded-lg border border-amber-200 bg-white transition-colors ${
                                isDragging ? 'opacity-50' : ''
                            } ${isOver ? 'border-amber-400 bg-amber-100/60' : ''}`}
                        >
                            <div className="flex items-stretch">
                                {canReorder && (
                                    <div
                                        className="shrink-0 w-9 flex items-center justify-center text-amber-500 cursor-grab active:cursor-grabbing touch-none border-r border-amber-100"
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
                                )}
                                <div className="flex-1 min-w-0 px-3 py-2 select-none">
                                    <span className="text-xs text-amber-700 mr-1">{index + 1}.</span>
                                    <span className="font-semibold text-gray-800 text-sm">
                                        {getDisplayName(req)}
                                    </span>
                                    {isCurrent && (
                                        <span className="ml-2 text-xs font-bold text-amber-800 bg-amber-200 px-2 py-0.5 rounded-full">
                                            รับขึ้นรถถัดไป
                                        </span>
                                    )}
                                    {isNext && (
                                        <span className="ml-2 text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                                            คนถัดไป
                                        </span>
                                    )}
                                </div>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
