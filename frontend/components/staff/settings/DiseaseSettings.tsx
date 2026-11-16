'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchWithAuth } from '@/lib/auth';
import Swal from '@/lib/swal';
import type { NameActiveUpdate } from '@/types/common';
import { Search, Plus, Stethoscope, Check, X, Pencil } from 'lucide-react';
import type { Disease } from './types';

export default function DiseaseSettings() {
    const [diseases, setDiseases] = useState<Disease[]>([]);
    const [diseasePage, setDiseasePage] = useState(1);
    const [diseaseHasMore, setDiseaseHasMore] = useState(false);
    const [diseaseSearch, setDiseaseSearch] = useState('');
    const [editingDiseaseId, setEditingDiseaseId] = useState<number | null>(null);
    const [editingDiseaseName, setEditingDiseaseName] = useState('');
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const sentinelRef = useRef<HTMLDivElement | null>(null);
    const hasMoreRef = useRef(diseaseHasMore);
    const pageRef = useRef(diseasePage);
    const loadingRef = useRef(false);

    useEffect(() => { hasMoreRef.current = diseaseHasMore; }, [diseaseHasMore]);
    useEffect(() => { pageRef.current = diseasePage; }, [diseasePage]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchDiseases(1, true);
        }, 500);
        return () => clearTimeout(timer);
    }, [diseaseSearch]);

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
    }, [diseases]);

    const loadMore = useCallback(async () => {
        if (loadingRef.current || !hasMoreRef.current) return;
        loadingRef.current = true;
        setIsLoadingMore(true);
        await fetchDiseases(pageRef.current + 1);
        loadingRef.current = false;
        setIsLoadingMore(false);
    }, []);

    const fetchDiseases = async (page = 1, reset = false) => {
        try {
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: '20',
                ...(diseaseSearch && { search: diseaseSearch })
            });
            const response = await fetchWithAuth(`/diseases?${queryParams}`);
            if (response.ok) {
                const result = await response.json();
                if (result.data) {
                    setDiseases(prev => reset ? result.data : [...prev, ...result.data]);
                    setDiseasePage(result.page);
                    setDiseaseHasMore(result.hasMore || false);
                } else {
                    setDiseases(result);
                    setDiseaseHasMore(false);
                }
            }
        } catch (error) {
            console.error('Error fetching diseases:', error);
        }
    };

    const addDisease = async () => {
        if (!diseaseSearch.trim()) return;
        try {
            const response = await fetchWithAuth('/diseases', {
                method: 'POST',
                body: JSON.stringify({ name: diseaseSearch.trim() }),
            });
            if (response.ok) {
                setDiseaseSearch('');
                fetchDiseases(1, true);
                Swal.fire({ icon: 'success', title: 'เพิ่มโรคสำเร็จ', timer: 1500, showConfirmButton: false });
            }
        } catch (error) {
            console.error('Error adding disease:', error);
        }
    };

    const updateDisease = async (id: number, data: NameActiveUpdate) => {
        try {
            const response = await fetchWithAuth(`/diseases/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(data),
            });
            if (response.ok) {
                setEditingDiseaseId(null);
                fetchDiseases(1, true);
            }
        } catch (error) {
            console.error('Error updating disease:', error);
        }
    };

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">จัดการรายการโรค</h2>
                    <p className="text-sm text-slate-500 dark:text-gray-400">เพิ่มหรือแก้ไขรายการโรค</p>
                </div>
                <span className="px-3 py-1 bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-300 rounded-lg text-sm">
                    ทั้งหมด {diseases.length} รายการ
                </span>
            </div>

            <div className="flex gap-3 mb-6">
                <div className="flex-1 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-gray-500 group-focus-within:text-brand-primary transition-colors" />
                    <input
                        type="text"
                        value={diseaseSearch}
                        onChange={(e) => setDiseaseSearch(e.target.value)}
                        placeholder="ค้นหาโรค หรือ พิมพ์เพื่อเพิ่มใหม่..."
                        className="w-full pl-12 pr-4 py-3 border border-slate-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all shadow-sm bg-white dark:bg-gray-800 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500"
                        onKeyPress={(e) => e.key === 'Enter' && addDisease()}
                    />
                </div>
                <button
                    onClick={addDisease}
                    disabled={!diseaseSearch.trim()}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-primary to-green-600 text-white rounded-xl hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all font-medium whitespace-nowrap"
                >
                    <Plus className="w-5 h-5" />
                    {diseaseSearch.trim() ? 'เพิ่มโรค' : 'เพิ่ม'}
                </button>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {diseases.map((disease) => (
                    <div
                        key={disease.id}
                        className="flex items-center justify-between p-4 rounded-xl transition-all bg-slate-50 dark:bg-gray-700/50 hover:bg-slate-100 dark:hover:bg-gray-700"
                    >
                        {editingDiseaseId === disease.id ? (
                            <input
                                type="text"
                                value={editingDiseaseName}
                                onChange={(e) => setEditingDiseaseName(e.target.value)}
                                className="flex-1 px-4 py-2 border border-brand-primary rounded-lg mr-3 outline-none bg-white dark:bg-gray-800 text-slate-800 dark:text-white"
                                onKeyPress={(e) => e.key === 'Enter' && updateDisease(disease.id, { name: editingDiseaseName })}
                                autoFocus
                            />
                        ) : (
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <span className="text-slate-700 dark:text-gray-200">
                                    {disease.name}
                                </span>
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            {editingDiseaseId === disease.id ? (
                                <>
                                    <button
                                        onClick={() => updateDisease(disease.id, { name: editingDiseaseName })}
                                        className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                                    >
                                        <Check className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setEditingDiseaseId(null)}
                                        className="p-2 bg-slate-400 dark:bg-gray-600 text-white rounded-lg hover:bg-slate-500 dark:hover:bg-gray-500 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => { setEditingDiseaseId(disease.id); setEditingDiseaseName(disease.name); }}
                                    className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-500 dark:text-blue-400 rounded-lg transition-colors"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {diseases.length === 0 && (
                    <div className="text-center py-12 text-slate-400 dark:text-gray-500">
                        <Stethoscope className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>ยังไม่มีรายการโรค</p>
                    </div>
                )}

                {isLoadingMore && (
                    <div className="flex justify-center py-4">
                        <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}

                {diseaseHasMore && <div ref={sentinelRef} className="h-4" />}
            </div>
        </div>
    );
}
