'use client';

import { useState } from 'react';

interface PetitionFilterProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    selectedStatuses: string[];
    onStatusToggle: (status: string) => void;
    onClearFilters: () => void;
}

export default function PetitionFilter({
    searchTerm,
    onSearchChange,
    selectedStatuses,
    onStatusToggle,
    onClearFilters
}: PetitionFilterProps) {
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);

    return (
        <div className="p-4 border-b border-slate-100 bg-white">
            <div className="flex gap-4">
                {}
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

                {}
                <div className="relative">
                    <button
                        onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                        className="px-4 py-2 h-full flex items-center gap-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                            <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        กรอง
                        {(selectedStatuses.length > 0) && (
                            <span className="ml-1 w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                    </button>

                    {showFilterDropdown && (
                        <>
                            {}
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setShowFilterDropdown(false)}
                            />
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 z-30 p-2">
                                <div className="flex justify-between items-center mb-2 px-2 pt-2">
                                    <h3 className="text-xs font-semibold text-slate-900">สถานะคำร้อง</h3>
                                    <button onClick={onClearFilters} className="text-xs text-red-500 hover:text-red-600">ล้าง</button>
                                </div>
                                <div className="space-y-1">
                                    {['PENDING', 'APPROVED', 'REJECTED'].map(s => (
                                        <label key={s} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer p-2 hover:bg-slate-50 rounded-lg">
                                            <input
                                                type="checkbox"
                                                checked={selectedStatuses.includes(s)}
                                                onChange={() => onStatusToggle(s)}
                                                className="rounded text-brand-primary focus:ring-brand-primary w-4 h-4"
                                            />
                                            {s === 'PENDING' ? 'รอตรวจสอบ' : s === 'APPROVED' ? 'อนุมัติ' : 'ปฏิเสธ'}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
