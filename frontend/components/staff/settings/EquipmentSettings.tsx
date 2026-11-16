'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchWithAuth } from '@/lib/auth';
import Swal from '@/lib/swal';
import type { NameActiveUpdate } from '@/types/common';
import { Search, Plus, Wrench, Check, X, Pencil, Trash2 } from 'lucide-react';

interface Equipment {
    id: number;
    name: string;
    isActive: boolean;
}

interface EquipmentSettingsProps {
    embedded?: boolean;
}

export default function EquipmentSettings({ embedded = false }: EquipmentSettingsProps) {
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [search, setSearch] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editingName, setEditingName] = useState('');
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const sentinelRef = useRef<HTMLDivElement | null>(null);
    const hasMoreRef = useRef(hasMore);
    const pageRef = useRef(page);
    const loadingRef = useRef(false);

    useEffect(() => { hasMoreRef.current = hasMore; }, [hasMore]);
    useEffect(() => { pageRef.current = page; }, [page]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchEquipment(1, true);
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMoreRef.current && !loadingRef.current) {
                    loadMore();
                }
            },
            { threshold: 0.1 }
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [equipment]);

    const loadMore = useCallback(async () => {
        if (loadingRef.current || !hasMoreRef.current) return;
        loadingRef.current = true;
        setIsLoadingMore(true);
        await fetchEquipment(pageRef.current + 1);
        loadingRef.current = false;
        setIsLoadingMore(false);
    }, []);

    const fetchEquipment = async (p = 1, reset = false) => {
        try {
            const queryParams = new URLSearchParams({
                page: p.toString(),
                limit: '20',
                ...(search && { search })
            });
            const response = await fetchWithAuth(`/equipment?${queryParams}`);
            if (response.ok) {
                const result = await response.json();
                if (result.data) {
                    setEquipment(prev => reset ? result.data : [...prev, ...result.data]);
                    setPage(result.page);
                    setHasMore(result.hasMore || false);
                } else {
                    setEquipment(result);
                    setHasMore(false);
                }
            }
        } catch (error) {
            console.error('Error fetching equipment:', error);
        }
    };

    const addEquipment = async () => {
        if (!search.trim()) return;
        try {
            const response = await fetchWithAuth('/equipment', {
                method: 'POST',
                body: JSON.stringify({ name: search.trim() }),
            });
            if (response.ok) {
                setSearch('');
                fetchEquipment(1, true);
                Swal.fire({ icon: 'success', title: 'เพิ่มอุปกรณ์สำเร็จ', timer: 1500, showConfirmButton: false });
            } else {
                const err = await response.json();
                Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: err.message || 'ไม่สามารถเพิ่มอุปกรณ์ได้' });
            }
        } catch (error) {
            console.error('Error adding equipment:', error);
        }
    };

    const updateEquipment = async (id: number, data: NameActiveUpdate) => {
        try {
            const response = await fetchWithAuth(`/equipment/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(data),
            });
            if (response.ok) {
                setEditingId(null);
                fetchEquipment(1, true);
            }
        } catch (error) {
            console.error('Error updating equipment:', error);
        }
    };

    const deleteEquipment = async (id: number, name: string) => {
        const result = await Swal.fire({
            title: 'ยืนยันการลบ?',
            text: `ต้องการลบอุปกรณ์ "${name}" ใช่หรือไม่?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'ลบ',
            cancelButtonText: 'ยกเลิก',
        });

        if (result.isConfirmed) {
            try {
                const response = await fetchWithAuth(`/equipment/${id}`, {
                    method: 'DELETE',
                });
                if (response.ok) {
                    fetchEquipment(1, true);
                    Swal.fire({ icon: 'success', title: 'ลบอุปกรณ์สำเร็จ', timer: 1500, showConfirmButton: false });
                }
            } catch (error) {
                console.error('Error deleting equipment:', error);
            }
        }
    };

    return (
        <div className={embedded ? '' : 'p-6'}>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">จัดการอุปกรณ์เสริม</h2>
                    <p className="text-sm text-slate-500 dark:text-gray-400">เพิ่ม แก้ไข หรือลบรายการอุปกรณ์ที่ผู้ป่วยสามารถเลือกใช้เมื่อจองคิว</p>
                </div>
                <span className="px-3 py-1 bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-300 rounded-lg text-sm">
                    ทั้งหมด {equipment.length} รายการ
                </span>
            </div>

            {}
            <div className="flex gap-3 mb-6">
                <div className="flex-1 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-gray-500 group-focus-within:text-brand-primary transition-colors" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="ค้นหาอุปกรณ์ หรือ พิมพ์เพื่อเพิ่มใหม่..."
                        className="w-full pl-12 pr-4 py-3 border border-slate-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all shadow-sm bg-white dark:bg-gray-800 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500"
                        onKeyPress={(e) => e.key === 'Enter' && addEquipment()}
                    />
                </div>
                <button
                    onClick={addEquipment}
                    disabled={!search.trim()}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-primary to-green-600 text-white rounded-xl hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all font-medium whitespace-nowrap"
                >
                    <Plus className="w-5 h-5" />
                    {search.trim() ? 'เพิ่มอุปกรณ์' : 'เพิ่ม'}
                </button>
            </div>

            {}
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {equipment.map((item) => (
                    <div
                        key={item.id}
                        className="flex items-center justify-between p-4 rounded-xl transition-all bg-slate-50 dark:bg-gray-700/50 hover:bg-slate-100 dark:hover:bg-gray-700"
                    >
                        {editingId === item.id ? (
                            <input
                                type="text"
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                className="flex-1 px-4 py-2 border border-brand-primary rounded-lg mr-3 outline-none bg-white dark:bg-gray-800 text-slate-800 dark:text-white"
                                onKeyPress={(e) => e.key === 'Enter' && updateEquipment(item.id, { name: editingName })}
                                autoFocus
                            />
                        ) : (
                            <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${item.isActive ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                <span className="text-slate-700 dark:text-gray-200">
                                    {item.name}
                                </span>
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            {editingId === item.id ? (
                                <>
                                    <button
                                        onClick={() => updateEquipment(item.id, { name: editingName })}
                                        className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                                    >
                                        <Check className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setEditingId(null)}
                                        className="p-2 bg-slate-400 dark:bg-gray-600 text-white rounded-lg hover:bg-slate-500 dark:hover:bg-gray-500 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={() => { setEditingId(item.id); setEditingName(item.name); }}
                                        className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-500 dark:text-blue-400 rounded-lg transition-colors"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => deleteEquipment(item.id, item.name)}
                                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 dark:text-red-400 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ))}

                {equipment.length === 0 && (
                    <div className="text-center py-12 text-slate-400 dark:text-gray-500">
                        <Wrench className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>ยังไม่มีรายการอุปกรณ์</p>
                        <p className="text-sm mt-1">พิมพ์ชื่ออุปกรณ์ด้านบนแล้วกด "เพิ่มอุปกรณ์"</p>
                    </div>
                )}

                {}
                {isLoadingMore && (
                    <div className="flex justify-center py-4">
                        <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}

                {}
                {hasMore && <div ref={sentinelRef} className="h-4" />}
            </div>
        </div>
    );
}
