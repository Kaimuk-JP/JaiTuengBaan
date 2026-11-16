'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchWithAuth } from '@/lib/auth';
import Swal from '@/lib/swal';
import { Search, Plus, Building2, Check, X, Pencil, Trash2 } from 'lucide-react';
import type { Hospital } from './types';

export default function HospitalSettings() {
    const [hospitals, setHospitals] = useState<Hospital[]>([]);
    const [hospitalPage, setHospitalPage] = useState(1);
    const [hospitalHasMore, setHospitalHasMore] = useState(false);
    const [hospitalSearch, setHospitalSearch] = useState('');
    const [editingHospitalId, setEditingHospitalId] = useState<number | null>(null);
    const [editingHospitalName, setEditingHospitalName] = useState('');
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const sentinelRef = useRef<HTMLDivElement | null>(null);
    const hasMoreRef = useRef(hospitalHasMore);
    const pageRef = useRef(hospitalPage);
    const loadingRef = useRef(false);

    useEffect(() => { hasMoreRef.current = hospitalHasMore; }, [hospitalHasMore]);
    useEffect(() => { pageRef.current = hospitalPage; }, [hospitalPage]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchHospitals(1, true);
        }, 500);
        return () => clearTimeout(timer);
    }, [hospitalSearch]);

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
    }, [hospitals]);

    const loadMore = useCallback(async () => {
        if (loadingRef.current || !hasMoreRef.current) return;
        loadingRef.current = true;
        setIsLoadingMore(true);
        await fetchHospitals(pageRef.current + 1);
        loadingRef.current = false;
        setIsLoadingMore(false);
    }, []);

    const fetchHospitals = async (page = 1, reset = false) => {
        try {
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: '20',
                ...(hospitalSearch && { search: hospitalSearch })
            });
            const response = await fetchWithAuth(`/hospitals?${queryParams}`);
            if (response.ok) {
                const result = await response.json();
                if (result.data) {
                    setHospitals(prev => reset ? result.data : [...prev, ...result.data]);
                    setHospitalPage(result.page);
                    setHospitalHasMore(result.hasMore || false);
                } else {
                    setHospitals(result);
                    setHospitalHasMore(false);
                }
            }
        } catch (error) {
            console.error('Error fetching hospitals:', error);
        }
    };

    const addHospital = async () => {
        if (!hospitalSearch.trim()) return;
        try {
            const response = await fetchWithAuth('/hospitals', {
                method: 'POST',
                body: JSON.stringify({ name: hospitalSearch.trim() }),
            });
            if (response.ok) {
                setHospitalSearch('');
                fetchHospitals(1, true);
                Swal.fire({ icon: 'success', title: 'เพิ่มโรงพยาบาลสำเร็จ', timer: 1500, showConfirmButton: false });
            }
        } catch (error) {
            console.error('Error adding hospital:', error);
        }
    };

    const updateHospital = async (id: number, name: string) => {
        try {
            const response = await fetchWithAuth(`/hospitals/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({ name }),
            });
            if (response.ok) {
                setEditingHospitalId(null);
                fetchHospitals(1, true);
            }
        } catch (error) {
            console.error('Error updating hospital:', error);
        }
    };

    const deleteHospital = async (id: number) => {
        const result = await Swal.fire({
            icon: 'warning',
            title: 'ยืนยันการลบ?',
            text: 'คุณต้องการลบโรงพยาบาลนี้หรือไม่?',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'ลบ',
            cancelButtonText: 'ยกเลิก',
        });

        if (result.isConfirmed) {
            try {
                const response = await fetchWithAuth(`/hospitals/${id}`, { method: 'DELETE' });
                if (response.ok) {
                    fetchHospitals(1, true);
                    Swal.fire({ icon: 'success', title: 'ลบสำเร็จ', timer: 1500, showConfirmButton: false });
                }
            } catch (error) {
                console.error('Error deleting hospital:', error);
            }
        }
    };

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">จัดการโรงพยาบาล</h2>
                    <p className="text-sm text-slate-500 dark:text-gray-400">เพิ่ม แก้ไข หรือลบรายการโรงพยาบาล</p>
                </div>
                <span className="px-3 py-1 bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-300 rounded-lg text-sm">
                    ทั้งหมด {hospitals.length} แห่ง
                </span>
            </div>

            {}
            <div className="flex gap-3 mb-6">
                <div className="flex-1 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                    <input
                        type="text"
                        value={hospitalSearch}
                        onChange={(e) => setHospitalSearch(e.target.value)}
                        placeholder="ค้นหาโรงพยาบาล หรือ พิมพ์เพื่อเพิ่มใหม่..."
                        className="w-full pl-12 pr-4 py-3 border border-slate-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm bg-white dark:bg-gray-800 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500"
                        onKeyPress={(e) => e.key === 'Enter' && addHospital()}
                    />
                </div>
                <button
                    onClick={addHospital}
                    disabled={!hospitalSearch.trim()}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-primary to-green-600 text-white rounded-xl hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all font-medium whitespace-nowrap"
                >
                    <Plus className="w-5 h-5" />
                    {hospitalSearch.trim() ? 'เพิ่มรพ.นี้' : 'เพิ่ม'}
                </button>
            </div>

            {}
            <div className="grid gap-3 max-h-[500px] overflow-y-auto">
                {hospitals.map((hospital) => (
                    <div
                        key={hospital.id}
                        className="flex items-center justify-between p-4 bg-slate-50 dark:bg-gray-700/50 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-xl transition-all"
                    >
                        {editingHospitalId === hospital.id ? (
                            <input
                                type="text"
                                value={editingHospitalName}
                                onChange={(e) => setEditingHospitalName(e.target.value)}
                                className="flex-1 px-4 py-2 border border-brand-primary rounded-lg mr-3 outline-none bg-white dark:bg-gray-800 text-slate-800 dark:text-white"
                                onKeyPress={(e) => e.key === 'Enter' && updateHospital(hospital.id, editingHospitalName)}
                                autoFocus
                            />
                        ) : (
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                                    <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <span className="text-slate-700 dark:text-gray-200 font-medium">{hospital.name}</span>
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            {editingHospitalId === hospital.id ? (
                                <>
                                    <button
                                        onClick={() => updateHospital(hospital.id, editingHospitalName)}
                                        className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                                    >
                                        <Check className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setEditingHospitalId(null)}
                                        className="p-2 bg-slate-400 dark:bg-gray-600 text-white rounded-lg hover:bg-slate-500 dark:hover:bg-gray-500 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={() => { setEditingHospitalId(hospital.id); setEditingHospitalName(hospital.name); }}
                                        className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-500 dark:text-blue-400 rounded-lg transition-colors"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => deleteHospital(hospital.id)}
                                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ))}

                {hospitals.length === 0 && (
                    <div className="text-center py-12 text-slate-400 dark:text-gray-500">
                        <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>ยังไม่มีรายการโรงพยาบาล</p>
                    </div>
                )}

                {}
                {isLoadingMore && (
                    <div className="flex justify-center py-4">
                        <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}

                {}
                {hospitalHasMore && <div ref={sentinelRef} className="h-4" />}
            </div>
        </div>
    );
}
