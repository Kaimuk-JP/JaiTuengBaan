'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithAuth } from '@/lib/auth';

const CATEGORIES = [
    { value: 'AUTH', label: 'เข้าสู่ระบบ', color: 'bg-blue-100 text-blue-800' },
    { value: 'QUEUE', label: 'คำร้องการจอง', color: 'bg-green-100 text-green-800' },
    { value: 'JOB', label: 'งานจิตอาสา', color: 'bg-purple-100 text-purple-800' },
    { value: 'CAREGIVER', label: 'ผู้ดูแลประชาชน', color: 'bg-orange-100 text-orange-800' },
    { value: 'USER', label: 'ผู้ใช้', color: 'bg-cyan-100 text-cyan-800' },
    { value: 'VEHICLE', label: 'รถส่วนกลาง', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'REWARD', label: 'ระบบแต้ม', color: 'bg-pink-100 text-pink-800' },
    { value: 'SETTING', label: 'ตั้งค่าระบบ', color: 'bg-gray-100 text-gray-800' },
];

const syntaxHighlight = (json: any) => {
    if (!json) return '';
    let jsonStr = typeof json !== 'string' ? JSON.stringify(json, undefined, 2) : json;
    jsonStr = jsonStr.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return jsonStr.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match: string) {
        let cls = 'text-blue-500';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'text-gray-800 dark:text-gray-200 font-semibold';
            } else {
                cls = 'text-green-600 dark:text-green-400';
            }
        } else if (/true|false/.test(match)) {
            cls = 'text-purple-600 dark:text-purple-400 font-bold';
        } else if (/null/.test(match)) {
            cls = 'text-red-500 dark:text-red-400 mb-1';
        } else {
            cls = 'text-orange-600 dark:text-orange-400';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
};

export default function AdminLogsPage() {
    const router = useRouter();
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState<any>({});
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [filters, setFilters] = useState({
        category: '',
        success: '',
        search: '',
        startDate: '',
        endDate: '',
    });

    const [selectedLog, setSelectedLog] = useState<any>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('page', page.toString());
            params.append('limit', limit.toString());
            if (filters.category) params.append('category', filters.category);
            if (filters.success) params.append('success', filters.success);
            if (filters.search) params.append('search', filters.search);
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);

            const res = await fetchWithAuth(`/admin/logs?${params.toString()}`);
            const data = await res.json();
            setLogs(data.data || []);
            setPagination(data.pagination || {});
        } catch (error) {
            console.error('Failed to fetch logs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [page, limit]);

    const applyFilters = () => {
        setPage(1);
        fetchLogs();
    };

    const clearFilters = () => {
        setFilters({ category: '', success: '', search: '', startDate: '', endDate: '' });
        setPage(1);
    };

    const viewLogDetail = async (logId: number) => {
        setLoadingDetail(true);
        try {
            const res = await fetchWithAuth(`/admin/logs/${logId}`);
            if (!res.ok) {
                throw new Error('Failed to fetch log detail');
            }
            const data = await res.json();
            if (!data || !data.id) {
                throw new Error('Log not found');
            }
            setSelectedLog(data);
            setShowDetailModal(true);
        } catch (error: any) {
            console.error('Failed to fetch log detail:', error);
            alert(`ไม่สามารถโหลดรายละเอียดได้: ${error.message || 'ไม่พบข้อมูล'}`);
        } finally {
            setLoadingDetail(false);
        }
    };

    const getCategoryLabel = (cat: string) => CATEGORIES.find(c => c.value === cat)?.label || cat;
    const getCategoryColor = (cat: string) => CATEGORIES.find(c => c.value === cat)?.color || 'bg-gray-100 text-gray-800';

    const formatDateTime = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('th-TH', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-gray-900 p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">บันทึกกิจกรรมระบบ (Activity Logs)</h1>
                <p className="text-slate-500 dark:text-gray-400 mt-1">ติดตามและตรวจสอบกิจกรรมทั้งหมดในระบบ</p>
            </div>

            { }
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-gray-700 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">จำนวน/หน้า</label>
                        <select
                            value={limit}
                            onChange={(e) => { setLimit(parseInt(e.target.value)); setPage(1); }}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 text-sm"
                        >
                            <option value={20}>20 รายการ</option>
                            <option value={50}>50 รายการ</option>
                            <option value={100}>100 รายการ</option>
                            <option value={500}>500 รายการ</option>
                            <option value={10000}>ทั้งหมด</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">หมวดหมู่</label>
                        <select
                            value={filters.category}
                            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 text-sm"
                        >
                            <option value="">ทั้งหมด</option>
                            {CATEGORIES.map(c => (
                                <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">สถานะ</label>
                        <select
                            value={filters.success}
                            onChange={(e) => setFilters({ ...filters, success: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 text-sm"
                        >
                            <option value="">ทั้งหมด</option>
                            <option value="true">สำเร็จ</option>
                            <option value="false">ไม่สำเร็จ</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">ค้นหา</label>
                        <input
                            type="text"
                            placeholder="ID, IP, หมายเหตุ..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">ตั้งแต่</label>
                        <input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">ถึง</label>
                        <input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 text-sm"
                        />
                    </div>
                </div>

                <div className="flex gap-2">
                    <button onClick={applyFilters} className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary_hover text-sm font-medium">
                        ค้นหา
                    </button>
                    <button onClick={clearFilters} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 text-sm font-medium">
                        ล้างตัวกรอง
                    </button>
                </div>
            </div>

            { }
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-gray-700/50 text-slate-500 dark:text-gray-400 text-sm border-b border-slate-200 dark:border-gray-700">
                                <th className="px-4 py-3 font-semibold">เวลา</th>
                                <th className="px-4 py-3 font-semibold">ผู้ใช้</th>
                                <th className="px-4 py-3 font-semibold">หมวดหมู่</th>
                                <th className="px-4 py-3 font-semibold">Action</th>
                                <th className="px-4 py-3 font-semibold">สถานะ</th>
                                <th className="px-4 py-3 font-semibold">รายละเอียด</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center">
                                        <div className="flex justify-center items-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
                                        </div>
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-500 dark:text-gray-400">
                                        ไม่พบบันทึกกิจกรรม
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors">
                                        <td className="px-4 py-3 text-xs text-slate-600 dark:text-gray-300 whitespace-nowrap">
                                            {formatDateTime(log.createdAt)}
                                        </td>
                                        <td className="px-4 py-3">
                                            {log.user ? (
                                                <div className="flex items-center gap-2">
                                                    {log.user.pictureUrl && (
                                                        <img src={log.user.pictureUrl} alt="" className="w-6 h-6 rounded-full" />
                                                    )}
                                                    <div>
                                                        <div className="text-sm font-medium text-slate-900 dark:text-white">
                                                            {log.user.firstName || ''} {log.user.lastName || ''}
                                                        </div>
                                                        <div className="text-xs text-slate-500 dark:text-gray-400">{log.user.role}</div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-slate-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(log.category)}`}>
                                                {getCategoryLabel(log.category)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm font-mono text-slate-700 dark:text-gray-300">
                                            {log.action}
                                        </td>
                                        <td className="px-4 py-3">
                                            {log.success ? (
                                                <span className="text-green-600 dark:text-green-400 font-medium">สำเร็จ</span>
                                            ) : (
                                                <span className="text-red-600 dark:text-red-400 font-medium">ไม่สำเร็จ</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => viewLogDetail(log.id)}
                                                className="text-brand-primary hover:text-brand-primary_hover text-xs font-medium"
                                            >
                                                ดู JSON →
                                            </button>
                                            {log.ipAddress && (
                                                <div className="text-slate-400 mt-1 text-xs">IP: {log.ipAddress}</div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                { }
                {pagination.totalPages > 1 && (
                    <div className="px-4 py-3 border-t border-slate-200 dark:border-gray-700 flex items-center justify-between">
                        <span className="text-sm text-slate-500 dark:text-gray-400">
                            แสดง {((pagination.page - 1) * limit) + 1}-{Math.min(pagination.page * limit, pagination.total)} จาก {pagination.total} รายการ
                            (เลือก {limit} รายการ/หน้า)
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={!pagination.hasPrevPage}
                                className="px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                ก่อนหน้า
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                disabled={!pagination.hasNextPage}
                                className="px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                ถัดไป
                            </button>
                        </div>
                    </div>
                )}
            </div>

            { }
            {showDetailModal && selectedLog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDetailModal(false)}>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        { }
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-gray-700 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">รายละเอียด Activity Log</h2>
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        { }
                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                            {loadingDetail ? (
                                <div className="flex justify-center items-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    { }
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 dark:text-gray-400 mb-1">Log ID</label>
                                            <div className="text-sm font-mono bg-slate-50 dark:bg-gray-700 px-3 py-2 rounded-lg">#{selectedLog.id}</div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 dark:text-gray-400 mb-1">เวลา</label>
                                            <div className="text-sm bg-slate-50 dark:bg-gray-700 px-3 py-2 rounded-lg">{formatDateTime(selectedLog.createdAt)}</div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 dark:text-gray-400 mb-1">ผู้ใช้</label>
                                            <div className="text-sm bg-slate-50 dark:bg-gray-700 px-3 py-2 rounded-lg">
                                                {selectedLog.user ? `${selectedLog.user.firstName || ''} ${selectedLog.user.lastName || ''} (${selectedLog.user.role})` : '-'}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 dark:text-gray-400 mb-1">Action</label>
                                            <div className="text-sm font-mono bg-slate-50 dark:bg-gray-700 px-3 py-2 rounded-lg">{selectedLog.action}</div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 dark:text-gray-400 mb-1">หมวดหมู่</label>
                                            <div>
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(selectedLog.category)}`}>
                                                    {getCategoryLabel(selectedLog.category)}
                                                </span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 dark:text-gray-400 mb-1">สถานะ</label>
                                            <div className="text-sm bg-slate-50 dark:bg-gray-700 px-3 py-2 rounded-lg">
                                                {selectedLog.success ? 'สำเร็จ' : 'ไม่สำเร็จ'}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 dark:text-gray-400 mb-1">IP Address</label>
                                            <div className="text-sm font-mono bg-slate-50 dark:bg-gray-700 px-3 py-2 rounded-lg">{selectedLog.ipAddress || '-'}</div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 dark:text-gray-400 mb-1">Device</label>
                                            <div className="text-sm bg-slate-50 dark:bg-gray-700 px-3 py-2 rounded-lg">{selectedLog.device || '-'}</div>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-xs font-medium text-slate-500 dark:text-gray-400 mb-1">Entity</label>
                                            <div className="text-sm bg-slate-50 dark:bg-gray-700 px-3 py-2 rounded-lg">
                                                {selectedLog.entityType || '-'} #{selectedLog.entityId || '-'}
                                            </div>
                                        </div>
                                    </div>

                                    { }
                                    {selectedLog.before && (
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 dark:text-gray-400 mb-2">Before (ก่อนเปลี่ยน)</label>
                                            <pre
                                                className="bg-slate-50 dark:bg-gray-700 p-4 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all max-h-60 overflow-y-auto"
                                                dangerouslySetInnerHTML={{ __html: syntaxHighlight(selectedLog.before) }}
                                            />
                                        </div>
                                    )}

                                    { }
                                    {selectedLog.after && (
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 dark:text-gray-400 mb-2">After (หลังเปลี่ยน)</label>
                                            <pre
                                                className="bg-slate-50 dark:bg-gray-700 p-4 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all max-h-60 overflow-y-auto"
                                                dangerouslySetInnerHTML={{ __html: syntaxHighlight(selectedLog.after) }}
                                            />
                                        </div>
                                    )}

                                    { }
                                    {selectedLog.note && (
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 dark:text-gray-400 mb-1">หมายเหตุ</label>
                                            <div className="text-sm bg-slate-50 dark:bg-gray-700 px-3 py-2 rounded-lg whitespace-pre-wrap">{selectedLog.note}</div>
                                        </div>
                                    )}

                                    { }
                                    {selectedLog.userAgent && (
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 dark:text-gray-400 mb-1">User Agent</label>
                                            <div className="text-xs font-mono bg-slate-50 dark:bg-gray-700 px-3 py-2 rounded-lg break-all">{selectedLog.userAgent}</div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>


                    </div>
                </div>
            )}
        </div>
    );
}
