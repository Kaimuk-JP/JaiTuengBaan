'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithAuth } from '@/lib/auth';
import { useSocket } from '@/contexts/SocketContext';
import JobStatusBadge from '@/components/staff/JobStatusBadge';

interface HistoryItem {
    id: string;
    type: 'booking' | 'profile_edit' | 'caregiver' | 'role';
    status: string;
    requesterName: string;
    reviewerName: string;
    date: string;
    rejectReason?: string | null;
    adminNote?: string | null;
    driverName?: string | null;
    careuName?: string | null;
    requestedRole?: string | null;
    currentRole?: string | null;
}

interface Pagination {
    total: number;
    totalPages: number;
    currentPage: number;
}

import BookingDetailModal from './BookingDetailModal';

const STATUS_OPTIONS = [
    { value: 'PENDING_ALL', label: 'รอตรวจสอบ', actualValues: ['PENDING_MUNICIPAL', 'PENDING'] },
    { value: 'APPROVED', label: 'อนุมัติ', actualValues: ['APPROVED'] },
    { value: 'CONFIRMED', label: 'ยืนยันแล้ว', actualValues: ['CONFIRMED'] },
    { value: 'IN_TRANSIT', label: 'กำลังดำเนินการ', actualValues: ['ASSIGNED', 'ACCEPTED', 'PICKING_UP', 'PICKED_UP', 'IN_TRANSIT', 'IN_PROGRESS', 'RETURN_HOME', 'RETURN_OFFICE'] },
    { value: 'COMPLETED', label: 'เสร็จสิ้น', actualValues: ['COMPLETED'] },
    { value: 'REJECTED', label: 'ปฏิเสธ', actualValues: ['REJECTED', 'EXECUTIVE_REJECTED'] },
    { value: 'CANCELLED_BY_USER', label: 'ยกเลิก', actualValues: ['CANCELLED_BY_USER', 'CANCELLED', 'CANCELLED_BY_MUNICIPAL', 'CANCELLED_BY_STAFF'] },
];

export default function StaffHistoryContent() {
    const router = useRouter();
    const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
    const [pagination, setPagination] = useState<Pagination>({
        total: 0,
        totalPages: 0,
        currentPage: 1,
    });
    const [selectedQueueId, setSelectedQueueId] = useState<string | null>(null);
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);

    const { socket } = useSocket();
    const itemsPerPage = 20;

    const fetchHistory = useCallback(async () => {
        try {
            setLoading(true);

            const params = new URLSearchParams();
            params.append('page', currentPage.toString());
            params.append('limit', itemsPerPage.toString());

            if (selectedTypes.length > 0) {
                params.append('types', selectedTypes.join(','));
            }

            if (selectedStatuses.length > 0) {
                const flatStatuses = selectedStatuses.flatMap(val =>
                    STATUS_OPTIONS.find(opt => opt.value === val)?.actualValues || [val]
                );
                params.append('statuses', flatStatuses.join(','));
            }

            if (debouncedSearch) {
                params.append('search', debouncedSearch);
            }

            const response = await fetchWithAuth(`/history?${params.toString()}`);

            if (response.ok) {
                const data = await response.json();

                const uniqueItemsMap = new Map<string, HistoryItem>();
                (data.data || []).forEach((item: HistoryItem) => {
                    if (!uniqueItemsMap.has(item.id)) {
                        uniqueItemsMap.set(item.id, item);
                    }
                });
                const uniqueData = Array.from(uniqueItemsMap.values());

                const statusPriority: Record<string, number> = {
                    'PENDING_MUNICIPAL': 1,
                    'PENDING': 1,
                    'APPROVED': 2,
                    'PENDING_EXECUTIVE': 2,
                    'CONFIRMED': 3,
                    'ASSIGNED': 4,
                    'ACCEPTED': 4,
                    'PICKING_UP': 4,
                    'PICKED_UP': 4,
                    'IN_TRANSIT': 4,
                    'IN_PROGRESS': 4,
                    'RETURN_HOME': 4,
                    'RETURN_OFFICE': 4,
                    'COMPLETED': 5,
                    'REJECTED': 6,
                    'EXECUTIVE_REJECTED': 6,
                    'CANCELLED_BY_USER': 7,
                    'CANCELLED_BY_MUNICIPAL': 7,
                    'CANCELLED_BY_STAFF': 7,
                    'CANCELLED': 7,
                };
                const sortedData = uniqueData.sort((a: HistoryItem, b: HistoryItem) => {
                    const priorityA = statusPriority[a.status] ?? 99;
                    const priorityB = statusPriority[b.status] ?? 99;
                    if (priorityA !== priorityB) return priorityA - priorityB;
                    return new Date(b.date).getTime() - new Date(a.date).getTime();
                });

                setHistoryItems(sortedData);
                setPagination({
                    total: data.total || 0,
                    totalPages: data.totalPages || 1,
                    currentPage: data.currentPage || currentPage,
                });
            } else {
                console.error('Failed to fetch history:', response.statusText);
                setHistoryItems([]);
            }
        } catch (error) {
            console.error('Error fetching history:', error);
            setHistoryItems([]);
        } finally {
            setLoading(false);
        }
    }, [currentPage, selectedTypes, selectedStatuses, debouncedSearch]);

    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }
        debounceTimer.current = setTimeout(() => {
            setDebouncedSearch(value);
            setCurrentPage(1);
        }, 400);
    };

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    useEffect(() => {
        if (!socket) return;

        const handleNotification = (notification: any) => {
            fetchHistory();
        };

        const handleRefresh = () => {
            fetchHistory();
        };

        socket.on('notification', handleNotification);
        socket.on('refresh_history', handleRefresh);

        return () => {
            socket.off('notification', handleNotification);
            socket.off('refresh_history', handleRefresh);
        };
    }, [socket, fetchHistory]);

    const toggleTypeFilter = (type: string) => {
        setSelectedTypes(prev => {
            const newTypes = prev.includes(type)
                ? prev.filter((t: string) => t !== type)
                : [...prev, type];
            return newTypes;
        });
        setCurrentPage(1);
    };

    const toggleStatusFilter = (status: string) => {
        setSelectedStatuses(prev => {
            const newStatuses = prev.includes(status)
                ? prev.filter((s: string) => s !== status)
                : [...prev, status];
            return newStatuses;
        });
        setCurrentPage(1);
    };

    const clearFilters = () => {
        setSelectedTypes([]);
        setSelectedStatuses([]);
        setCurrentPage(1);
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'booking': return 'การจอง';
            case 'profile_edit': return 'แก้ไขข้อมูล';
            case 'caregiver': return 'การขอเพิ่มผู้ดูแลประชาชน';
            case 'role':
            case 'role_request':
                return 'เปลี่ยนโรล';
            default: return type;
        }
    };

    const getTypeBadgeStyle = (type: string) => {
        switch (type) {
            case 'booking': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'profile_edit': return 'bg-purple-50 text-purple-700 border-purple-200';
            case 'caregiver': return 'bg-teal-50 text-teal-700 border-teal-200';
            case 'role': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            default: return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    const handleRowClick = (item: HistoryItem) => {
        if (item.type === 'booking') {
            const numericId = item.id.split('-')[1];
            if (numericId) {
                setSelectedQueueId(numericId);
            }
        } else if (item.type === 'role') {
            const roleRequestId = item.id.replace('role-', '');
            if (roleRequestId) {
                router.push(`/staff/role/${roleRequestId}`);
            }
        }
    };

    const activeFilterCount = selectedTypes.length + selectedStatuses.length;

    return (
        <>
            <div>
                { }
                <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-200 mb-6 bg-white">
                    <div className="w-10 h-10 bg-glacier-light rounded-lg flex items-center justify-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900">ประวัติรายการคำร้อง</h1>
                </div>

                { }
                <div className="mx-6 bg-white rounded-xl shadow-sm border border-gray-200 min-h-[calc(100vh-280px)]">
                    { }
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
                                    value={searchQuery}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                    placeholder="ค้นหาด้วยชื่อผู้ยื่นคำร้อง หรือ ชื่อบุคคลในระบบ"
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-sm"
                                />
                            </div>

                            { }
                            <div className="relative">
                                <button
                                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                                    className="px-4 py-2 h-full flex items-center gap-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                                        <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    กรอง
                                    {activeFilterCount > 0 && (
                                        <span className="ml-1 min-w-5 h-5 px-1 bg-blue-500 text-white rounded-full text-xs flex items-center justify-center font-semibold">
                                            {activeFilterCount}
                                        </span>
                                    )}
                                </button>

                                {showFilterDropdown && (
                                    <>
                                        { }
                                        <div
                                            className="fixed inset-0 z-10"
                                            onClick={() => setShowFilterDropdown(false)}
                                        />
                                        <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-100 z-30 p-3 max-h-[70vh] overflow-y-auto">
                                            <div className="flex justify-between items-center mb-3 px-1">
                                                <h3 className="text-sm font-bold text-slate-900">ตัวกรอง</h3>
                                                {activeFilterCount > 0 && (
                                                    <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-600 font-medium">ล้างทั้งหมด</button>
                                                )}
                                            </div>

                                            { }
                                            <div className="mb-3">
                                                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">ประเภทคำร้อง</h4>
                                                <div className="space-y-0.5">
                                                    {[
                                                        { type: 'booking', label: 'การจอง' },
                                                        { type: 'profile_edit', label: 'แก้ไขข้อมูล' },
                                                        { type: 'caregiver', label: 'การขอเพิ่มผู้ดูแลประชาชน' },
                                                        { type: 'role', label: 'เปลี่ยนโรล' },
                                                    ].map(({ type, label }) => (
                                                        <label key={type} className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer p-2 hover:bg-slate-50 rounded-lg">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedTypes.includes(type)}
                                                                onChange={() => toggleTypeFilter(type)}
                                                                className="rounded text-brand-primary focus:ring-brand-primary w-4 h-4"
                                                            />

                                                            {label}
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>

                                            <hr className="border-slate-100 my-2" />

                                            { }
                                            <div>
                                                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">สถานะ</h4>
                                                <div className="space-y-0.5">
                                                    {STATUS_OPTIONS.map(s => (
                                                        <label key={s.value} className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer p-2 hover:bg-slate-50 rounded-lg">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedStatuses.includes(s.value)}
                                                                onChange={() => toggleStatusFilter(s.value)}
                                                                className="rounded text-brand-primary focus:ring-brand-primary w-4 h-4"
                                                            />
                                                            <JobStatusBadge status={s.value === 'PENDING_ALL' ? 'PENDING' : s.value} className="text-xs !px-2 !py-0.5" />
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        { }
                        {activeFilterCount > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                                {selectedTypes.map(type => (
                                    <button
                                        key={type}
                                        onClick={() => toggleTypeFilter(type)}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium hover:bg-blue-100 transition-colors"
                                    >
                                        {getTypeLabel(type)}
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                ))}
                                {selectedStatuses.map(status => (
                                    <button
                                        key={status}
                                        onClick={() => toggleStatusFilter(status)}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium hover:bg-emerald-100 transition-colors"
                                    >
                                        <JobStatusBadge status={status === 'PENDING_ALL' ? 'PENDING' : status} className="text-xs !px-1.5 !py-0 !rounded-md" />
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    { }
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">ผู้ยื่นคำร้อง</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">ประเภทคำร้อง</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">สถานะ</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">ผู้ดำเนินการ</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">วันที่ยื่นคำร้อง</th>
                                    <th className="text-center py-3 px-4 text-sm font-medium text-text-secondary w-32">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-12">
                                            <div className="flex justify-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : historyItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-12 text-text-tertiary">
                                            ไม่พบข้อมูลประวัติ
                                        </td>
                                    </tr>
                                ) : (
                                    historyItems.map((item: HistoryItem) => (
                                        <tr
                                            key={item.id}
                                            onClick={() => handleRowClick(item)}
                                            className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${item.type === 'booking' ? 'cursor-pointer hover:bg-blue-50/50' : ''}`}
                                        >
                                            <td className="py-3 px-4 text-sm text-text-primary">
                                                {item.requesterName}
                                            </td>
                                            <td className="py-3 px-4 text-sm">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getTypeBadgeStyle(item.type)}`}>
                                                    {getTypeLabel(item.type)}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-sm">
                                                <div className="flex flex-col items-start gap-1">
                                                    <JobStatusBadge status={item.status} className="text-xs" />
                                                    {item.rejectReason && (
                                                        <span
                                                            className="inline-flex items-center gap-1 text-[11px] text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 max-w-[220px] truncate"
                                                            title={item.rejectReason}
                                                        >
                                                            ⚠️ {item.rejectReason}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-sm text-text-primary">
                                                <div>
                                                    {item.reviewerName === 'รอดำเนินการ' ? (
                                                        <span className="text-slate-400 italic">{item.reviewerName}</span>
                                                    ) : (
                                                        <span className="font-medium">{item.reviewerName}</span>
                                                    )}
                                                    {item.driverName && (
                                                        <span className="block text-xs text-slate-500 font-normal mt-0.5">
                                                            คนขับ: {item.driverName}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-sm text-text-secondary">
                                                {item.date ? new Date(item.date).toLocaleDateString('th-TH', {
                                                    year: 'numeric',
                                                    month: '2-digit',
                                                    day: '2-digit'
                                                }) : '-'}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                {(item.type === 'booking' || item.type === 'role') && (
                                                    <button
                                                        className="text-xs font-medium px-3 py-1.5 text-slate-800 bg-white hover:bg-slate-50 rounded-lg transition-colors border border-slate-300 whitespace-nowrap shadow-sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRowClick(item);
                                                        }}
                                                    >
                                                        ดูรายละเอียด
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            { }
            <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-between z-30">
                <p className="text-sm font-medium text-slate-600">
                    หน้า {pagination.currentPage} จาก {pagination.totalPages} หน้า ({pagination.total} รายการ)
                </p>
                <div className="flex gap-2">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 text-sm font-medium text-text-primary border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        ก่อนหน้า
                    </button>

                    { }
                    {(() => {
                        const totalPages = pagination.totalPages;
                        const pages: number[] = [];
                        let start = Math.max(1, currentPage - 2);
                        let end = Math.min(totalPages, currentPage + 2);

                        if (currentPage <= 2) {
                            end = Math.min(5, totalPages);
                        }
                        if (currentPage >= totalPages - 1) {
                            start = Math.max(1, totalPages - 4);
                        }

                        for (let i = start; i <= end; i++) {
                            pages.push(i);
                        }

                        return pages.map(pageNum => (
                            <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${pageNum === currentPage
                                    ? 'bg-brand-primary text-white'
                                    : 'border border-slate-300 hover:bg-slate-50 text-text-primary'
                                    }`}
                            >
                                {pageNum}
                            </button>
                        ));
                    })()}

                    <button
                        onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                        disabled={currentPage === pagination.totalPages}
                        className="px-4 py-2 text-sm font-medium text-text-primary border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        ถัดไป
                    </button>
                </div>
            </div>

            { }
            {selectedQueueId && (
                <BookingDetailModal
                    queueId={selectedQueueId}
                    onClose={() => setSelectedQueueId(null)}
                />
            )}
        </>
    );
}
