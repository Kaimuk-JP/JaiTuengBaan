'use client';

import { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/auth';
import Image from 'next/image';
import type { StockHistory } from '../types';
import HistoryIcon from '@mui/icons-material/History';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import InventoryIcon from '@mui/icons-material/Inventory';
import CloseIcon from '@mui/icons-material/Close';

export default function RewardHistoryContainer() {
    const [history, setHistory] = useState<StockHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    const [selectedAction, setSelectedAction] = useState<string>('ALL');
    const [searchQuery, setSearchQuery] = useState<string>('');

    const [selectedPhotoItem, setSelectedPhotoItem] = useState<StockHistory | null>(null);

    useEffect(() => {
        fetchHistory();
    }, [page, selectedAction]);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const actionParam = selectedAction !== 'ALL' ? `&action=${selectedAction}` : '';
            const response = await fetchWithAuth(`/rewards/stock-history?page=${page}&limit=20${actionParam}`);
            if (response.ok) {
                const result = await response.json();
                setHistory(result.data || []);
                setTotalPages(result.pagination?.totalPages || 1);
                setTotalItems(result.pagination?.total || 0);
            }
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setLoading(false);
        }
    };

    const getActionBadge = (action: string) => {
        const badges: Record<string, { text: string; bg: string; textCol: string; border: string }> = {
            ADD_STOCK: {
                text: 'เพิ่มสต๊อก',
                bg: 'bg-emerald-50 dark:bg-emerald-950/40',
                textCol: 'text-emerald-700 dark:text-emerald-300',
                border: 'border-emerald-200 dark:border-emerald-800',
            },
            DEDUCT_STOCK: {
                text: 'ลด/ตัดชำรุด',
                bg: 'bg-rose-50 dark:bg-rose-950/40',
                textCol: 'text-rose-700 dark:text-rose-300',
                border: 'border-rose-200 dark:border-rose-800',
            },
            SET_STOCK: {
                text: 'ปรับยอดจริง',
                bg: 'bg-blue-50 dark:bg-blue-950/40',
                textCol: 'text-blue-700 dark:text-blue-300',
                border: 'border-blue-200 dark:border-blue-800',
            },
            CREATE: {
                text: 'สร้างรางวัลใหม่',
                bg: 'bg-teal-50 dark:bg-teal-950/40',
                textCol: 'text-teal-700 dark:text-teal-300',
                border: 'border-teal-200 dark:border-teal-800',
            },
            UPDATE: {
                text: 'แก้ไขข้อมูล',
                bg: 'bg-amber-50 dark:bg-amber-950/40',
                textCol: 'text-amber-700 dark:text-amber-300',
                border: 'border-amber-200 dark:border-amber-800',
            },
            DELETE: {
                text: 'ลบรางวัล',
                bg: 'bg-red-50 dark:bg-red-950/40',
                textCol: 'text-red-700 dark:text-red-300',
                border: 'border-red-200 dark:border-red-800',
            },
        };

        const b = badges[action] || {
            text: action,
            bg: 'bg-slate-100 dark:bg-gray-800',
            textCol: 'text-slate-700 dark:text-gray-300',
            border: 'border-slate-200 dark:border-gray-700',
        };

        return (
            <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${b.bg} ${b.textCol} ${b.border}`}
            >
                {b.text}
            </span>
        );
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const filteredHistory = history.filter((item) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const rewardName = item.reward?.name?.toLowerCase() || '';
        const note = item.note?.toLowerCase() || '';
        const staffName = `${item.staff?.firstName || ''} ${item.staff?.lastName || ''}`.toLowerCase();
        return rewardName.includes(q) || note.includes(q) || staffName.includes(q);
    });

    return (
        <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-brand-primary border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center shadow-sm">
                        <HistoryIcon fontSize="medium" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                            ประวัติสต๊อกของรางวัล
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-gray-400">
                            บันทึกประวัติการเพิ่ม-ลดสต๊อก พร้อมรูปถ่ายยืนยัน ({totalItems} รายการ)
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800/80 rounded-2xl p-4 border border-slate-200/80 dark:border-gray-700 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto scrollbar-none pb-1 md:pb-0">
                    {[
                        { id: 'ALL', label: 'ทั้งหมด' },
                        { id: 'ADD_STOCK', label: 'เพิ่มสต๊อก' },
                        { id: 'DEDUCT_STOCK', label: 'ลด/ตัดชำรุด' },
                        { id: 'SET_STOCK', label: 'ปรับยอดจริง' },
                        { id: 'CREATE', label: 'สร้างใหม่' },
                        { id: 'UPDATE', label: 'แก้ไข' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => {
                                setSelectedAction(tab.id);
                                setPage(1);
                            }}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                                selectedAction === tab.id
                                    ? 'bg-brand-primary text-white shadow-sm'
                                    : 'bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-600'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="relative w-full md:w-72">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="ค้นหาชื่อรางวัล, ผู้บันทึก..."
                        className="w-full pl-9 pr-4 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-gray-700/60 border border-slate-200 dark:border-gray-600 text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-brand-primary outline-none"
                    />
                </div>
            </div>

            {loading ? (
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-12 text-center border border-slate-200 dark:border-gray-700">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-primary mx-auto"></div>
                    <p className="text-sm text-slate-500 dark:text-gray-400 mt-3">กำลังโหลดประวัติสต๊อก...</p>
                </div>
            ) : filteredHistory.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-12 text-center border border-slate-200 dark:border-gray-700 shadow-sm space-y-3">
                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-gray-700 text-slate-400 flex items-center justify-center mx-auto">
                        <InventoryIcon fontSize="large" />
                    </div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-base">ไม่พบประวัติการจัดการสต๊อก</h3>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-gray-400 max-w-sm mx-auto">
                        เมื่อมีการเพิ่ม-ลดสต๊อก หรือสร้างของรางวัลใหม่ ประวัติพร้อมรูปถ่ายจะถูกบันทึกและแสดงที่นี่
                    </p>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800/90 rounded-3xl border border-slate-200 dark:border-gray-700 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-gray-700/60 border-b border-slate-200 dark:border-gray-700 text-[11px] sm:text-xs font-bold text-slate-500 dark:text-gray-300 uppercase tracking-wider">
                                    <th className="px-4 py-3.5">วัน-เวลา</th>
                                    <th className="px-4 py-3.5">ของรางวัล</th>
                                    <th className="px-4 py-3.5">การกระทำ</th>
                                    <th className="px-4 py-3.5">การเปลี่ยนแปลงสต๊อก</th>
                                    <th className="px-4 py-3.5">หมายเหตุ / เหตุผล</th>
                                    <th className="px-4 py-3.5 text-center">รูปถ่ายยืนยัน</th>
                                    <th className="px-4 py-3.5">ผู้ดำเนินการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-gray-700/60 text-xs sm:text-sm">
                                {filteredHistory.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="hover:bg-slate-50/70 dark:hover:bg-gray-700/40 transition-colors"
                                    >
                                        <td className="px-4 py-3.5 text-slate-500 dark:text-gray-400 whitespace-nowrap text-xs">
                                            {formatDate(item.createdAt)}
                                        </td>

                                        <td className="px-4 py-3.5">
                                            <div className="flex items-center gap-2.5">
                                                {item.reward?.imageUrl ? (
                                                    <div className="relative w-9 h-9 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200 dark:border-gray-700">
                                                        <Image
                                                            src={item.reward.imageUrl}
                                                            alt={item.reward?.name || 'Reward'}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0">
                                                        <InventoryIcon fontSize="small" />
                                                    </div>
                                                )}
                                                <span className="font-bold text-slate-800 dark:text-gray-200 line-clamp-1">
                                                    {item.reward?.name || 'ของรางวัล'}
                                                </span>
                                            </div>
                                        </td>

                                        <td className="px-4 py-3.5 whitespace-nowrap">{getActionBadge(item.action)}</td>

                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                            <div className="flex items-center gap-2 font-medium">
                                                <span className="text-slate-400 dark:text-gray-500">
                                                    {item.quantityBefore < 0 ? '∞' : item.quantityBefore}
                                                </span>
                                                <span className="text-slate-300 dark:text-gray-600">→</span>
                                                <span className="font-bold text-slate-800 dark:text-white">
                                                    {item.quantityAfter < 0 ? '∞' : item.quantityAfter}
                                                </span>
                                                {item.quantityChange !== 0 && (
                                                    <span
                                                        className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${
                                                            item.quantityChange > 0
                                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                                                                : 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300'
                                                        }`}
                                                    >
                                                        {item.quantityChange > 0 ? `+${item.quantityChange}` : item.quantityChange}
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        <td className="px-4 py-3.5 max-w-xs">
                                            <span className="text-slate-600 dark:text-gray-300 text-xs line-clamp-2">
                                                {item.note || '-'}
                                            </span>
                                        </td>

                                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                                            {item.evidenceUrl ? (
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedPhotoItem(item)}
                                                    className="group relative inline-flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-gray-700/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-gray-600 hover:border-emerald-400 transition-all cursor-pointer shadow-sm"
                                                >
                                                    <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0">
                                                        <Image
                                                            src={item.evidenceUrl}
                                                            alt="Evidence"
                                                            fill
                                                            className="object-cover group-hover:scale-110 transition-transform"
                                                        />
                                                    </div>
                                                    <span className="text-[11px] font-bold text-slate-700 dark:text-gray-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 pr-1.5 flex items-center gap-1">
                                                        <VisibilityIcon style={{ fontSize: 14 }} />
                                                        <span>ดูรูป</span>
                                                    </span>
                                                </button>
                                            ) : (
                                                <span className="text-slate-400 text-xs">-</span>
                                            )}
                                        </td>

                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-brand-primary flex items-center justify-center font-bold text-xs shrink-0">
                                                    {item.staff?.firstName?.charAt(0) || 'จ'}
                                                </div>
                                                <span className="text-xs text-slate-700 dark:text-gray-300 font-medium">
                                                    {item.staff?.firstName} {item.staff?.lastName}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-slate-200 dark:border-gray-700 flex items-center justify-between">
                            <span className="text-xs text-slate-500 dark:text-gray-400">
                                หน้า {page} จาก {totalPages}
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-gray-700 hover:bg-slate-100 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors"
                                >
                                    ย้อนกลับ
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-gray-700 hover:bg-slate-100 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors"
                                >
                                    ถัดไป
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {selectedPhotoItem && selectedPhotoItem.evidenceUrl && (
                <div className="fixed inset-0 z-[999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 dark:border-gray-800 flex flex-col max-h-[90vh]">
                        <div className="bg-gradient-to-r from-[#1E7D55] to-[#13603F] text-white px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <PhotoCameraIcon />
                                <div>
                                    <h3 className="font-bold text-base">รูปถ่ายหลักฐานยืนยันสต๊อก</h3>
                                    <p className="text-xs text-emerald-100">
                                        {selectedPhotoItem.reward?.name} • {formatDate(selectedPhotoItem.createdAt)}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedPhotoItem(null)}
                                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                            >
                                <CloseIcon fontSize="small" />
                            </button>
                        </div>

                        <div className="relative w-full h-80 sm:h-96 bg-black flex items-center justify-center">
                            <Image
                                src={selectedPhotoItem.evidenceUrl}
                                alt="Evidence Large"
                                fill
                                className="object-contain"
                            />
                        </div>

                        <div className="p-5 bg-slate-50 dark:bg-gray-800/80 border-t border-slate-200 dark:border-gray-700 space-y-2 text-xs sm:text-sm">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-500 dark:text-gray-400">การกระทำ:</span>
                                    {getActionBadge(selectedPhotoItem.action)}
                                </div>
                                <div className="font-bold text-slate-700 dark:text-gray-300">
                                    สต๊อก: {selectedPhotoItem.quantityBefore} → {selectedPhotoItem.quantityAfter} ชิ้น
                                </div>
                            </div>
                            {selectedPhotoItem.note && (
                                <div className="p-2.5 bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-300">
                                    <span className="font-bold">หมายเหตุ:</span> {selectedPhotoItem.note}
                                </div>
                            )}
                            <div className="text-[11px] text-slate-400 text-right">
                                บันทึกโดย: {selectedPhotoItem.staff?.firstName} {selectedPhotoItem.staff?.lastName}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
