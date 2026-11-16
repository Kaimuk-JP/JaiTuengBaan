'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface PersonnelFilterProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    selectedRoles: string[];
    onRoleToggle: (role: string) => void;
    onClearFilters: () => void;
}

const ROLES = [
    { id: 'USERS', label: 'ผู้ใช้บริการ' },
    { id: 'CAREGIVER', label: 'ผู้ดูแลประชาชน / ญาติ' },
    { id: 'DRIVE', label: 'เจ้าหน้าที่รถ' },
    { id: 'CAREU', label: 'จิตอาสาแคร์ยู' },
];

export default function PersonnelFilter({
    searchTerm,
    onSearchChange,
    selectedRoles,
    onRoleToggle,
    onClearFilters
}: PersonnelFilterProps) {
    const router = useRouter();
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);

    return (
        <div className="p-3 sm:p-4 border-b border-slate-100 bg-white">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                { }
                <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </span>
                    <input
                        type="text"
                        placeholder="ค้นหาด้วยชื่อ"
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-sm"
                    />
                </div>

                { }
                <div className="flex gap-2">
                    { }
                    <button
                        onClick={() => router.push('/staff/personnel/add')}
                        className="flex-1 sm:flex-none px-3 sm:px-4 py-2 h-full flex items-center justify-center sm:justify-start gap-2 bg-brand-primary border border-brand-primary rounded-lg hover:bg-brand-primary_hover text-white text-xs sm:text-sm font-medium transition-colors whitespace-nowrap"
                    >
                        <svg width="16" height="16" sm-width="18" sm-height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="8.5" cy="7" r="4"></circle>
                            <line x1="20" y1="8" x2="20" y2="14"></line>
                            <line x1="23" y1="11" x2="17" y2="11"></line>
                        </svg>
                        <span className="hidden sm:inline">เพิ่มบุคลากรในระบบ</span>
                        <span className="sm:hidden">เพิ่ม</span>
                    </button>

                    { }
                    <div className="relative">
                        <button
                            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                            className="px-3 sm:px-4 py-2 h-full flex items-center gap-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-medium transition-colors"
                        >
                            <svg width="14" height="14" sm-width="16" sm-height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                                <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            กรอง
                            {(selectedRoles.length > 0) && (
                                <span className="ml-1 w-2 h-2 bg-blue-500 rounded-full"></span>
                            )}
                        </button>

                        {showFilterDropdown && (
                            <>
                                { }
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setShowFilterDropdown(false)}
                                />
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 z-30 p-2">
                                    <div className="flex justify-between items-center mb-2 px-2 pt-2">
                                        <h3 className="text-xs font-semibold text-slate-900">ประเภทบุคลากร</h3>
                                        <button onClick={onClearFilters} className="text-xs text-red-500 hover:text-red-600">ล้าง</button>
                                    </div>
                                    <div className="space-y-1">
                                        {ROLES.map((role) => (
                                            <label key={role.id} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer p-2 hover:bg-slate-50 rounded-lg">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedRoles.includes(role.id)}
                                                    onChange={() => onRoleToggle(role.id)}
                                                    className="rounded text-brand-primary focus:ring-brand-primary w-4 h-4"
                                                />
                                                {role.label}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
