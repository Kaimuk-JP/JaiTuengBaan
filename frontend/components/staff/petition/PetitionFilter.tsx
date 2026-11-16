'use client';

import { useState } from 'react';

interface PetitionFilterProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    selectedStatuses: string[];
    onStatusToggle: (status: string) => void;
    selectedMobilities: string[];
    onMobilityToggle: (mobility: string) => void;
    onClearFilters: () => void;
    executiveApprovalEnabled?: boolean;
}

export default function PetitionFilter({
    searchTerm,
    onSearchChange,
    selectedStatuses,
    onStatusToggle,
    selectedMobilities,
    onMobilityToggle,
    onClearFilters,
    executiveApprovalEnabled = true,
}: PetitionFilterProps) {
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);

    const statusOptions = [
        { value: 'PENDING_MUNICIPAL', label: 'รอตรวจสอบ' },
        { value: 'APPROVED', label: 'รอประชาชนยืนยัน' },
        ...(executiveApprovalEnabled
            ? [
                { value: 'PENDING_EXECUTIVE', label: 'รอผู้บริหารอนุมัติ' },
                { value: 'EXECUTIVE_REJECTED', label: 'ผู้บริหารส่งกลับแก้ไข' },
            ]
            : []),
        { value: 'CONFIRMED', label: 'รอมอบหมาย' },
    ];

    return (
        <div className="p-4 border-b border-slate-100 bg-white">
            <div className="flex gap-4">
                { }
                <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </span>
                    <input
                        type="text"
                        placeholder="ค้นหาด้วยชื่อผู้ยื่นคำร้อง หรือ วันที่"
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-sm"
                    />
                </div>

                { }
                <div className="relative">
                    <button
                        onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                        className="h-full px-4 flex items-center gap-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 text-sm font-medium transition-colors"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        กรอง
                        {(selectedStatuses.length > 0 || selectedMobilities.length > 0) && (
                            <span className="ml-1 w-2 h-2 bg-brand-primary rounded-full"></span>
                        )}
                    </button>
                    { }
                    {showFilterDropdown && (
                        <>
                            <div
                                className="fixed inset-0 z-20"
                                onClick={() => setShowFilterDropdown(false)}
                            />
                            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-100 z-30 p-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-semibold text-slate-900">ตัวกรอง</h3>
                                    <button onClick={onClearFilters} className="text-xs text-red-500 hover:text-red-600">ล้างทั้งหมด</button>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-medium text-slate-500 mb-2 block">สถานะคำร้อง</label>
                                        <div className="space-y-2">
                                            {statusOptions.map(s => (
                                                <label key={s.value} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={s.value.split(',').some(v => selectedStatuses.includes(v))}
                                                        onChange={() => {
                                                            const groupStatuses = s.value.split(',');
                                                            const allSelected = groupStatuses.every(v => selectedStatuses.includes(v));
                                                            groupStatuses.forEach(v => {
                                                                if (allSelected) {
                                                                    if (selectedStatuses.includes(v)) onStatusToggle(v);
                                                                } else {
                                                                    if (!selectedStatuses.includes(v)) onStatusToggle(v);
                                                                }
                                                            });
                                                        }}
                                                        className="rounded text-brand-primary focus:ring-brand-primary"
                                                    />
                                                    {s.label}
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
