'use client';

import { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/auth';
import Swal from '@/lib/swal';
import { Clock, Plus, Pencil, Trash2, Check, X, Sparkles, ToggleLeft, ToggleRight, ArrowUp, ArrowDown } from 'lucide-react';

interface TimeSlot {
    id: number;
    label: string;
    value: string;
    startTime: string;
    endTime: string;
    sortOrder: number;
    isActive: boolean;
}

interface BookingTimeSlotsSettingsProps {
    embedded?: boolean;
}

export default function BookingTimeSlotsSettings({ embedded = false }: BookingTimeSlotsSettingsProps) {
    const [slots, setSlots] = useState<TimeSlot[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const [formLabel, setFormLabel] = useState('');

    useEffect(() => {
        fetchSlots();
    }, []);

    const fetchSlots = async () => {
        try {
            const response = await fetchWithAuth('/booking-time-slots/all');
            if (response.ok) {
                const data = await response.json();
                setSlots(data);
            }
        } catch (error) {
            console.error('Error fetching time slots:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const seedDefaults = async () => {
        try {
            const response = await fetchWithAuth('/booking-time-slots/seed-defaults', {
                method: 'POST',
            });
            if (response.ok) {
                const result = await response.json();
                if (result.seeded) {
                    Swal.fire({ icon: 'success', title: 'สร้างรอบเริ่มต้นสำเร็จ', text: `สร้างรอบเวลา ${result.count} รอบแล้ว`, timer: 2000, showConfirmButton: false });
                    fetchSlots();
                } else {
                    Swal.fire({ icon: 'info', title: 'มีข้อมูลอยู่แล้ว', text: result.message });
                }
            }
        } catch (error) {
            console.error('Error seeding defaults:', error);
        }
    };

    const addSlot = async () => {
        if (!formLabel.trim()) {
            Swal.fire({ icon: 'warning', title: 'กรุณากรอกข้อมูล', text: 'กรุณาระบุชื่อช่วงเวลา' });
            return;
        }

        try {
            const response = await fetchWithAuth('/booking-time-slots', {
                method: 'POST',
                body: JSON.stringify({
                    label: formLabel.trim(),
                    sortOrder: slots.length + 1,
                }),
            });

            if (response.ok) {
                Swal.fire({ icon: 'success', title: 'เพิ่มรอบเวลาสำเร็จ', timer: 1500, showConfirmButton: false });
                setShowAddForm(false);
                setFormLabel('');
                fetchSlots();
            } else {
                const err = await response.json();
                Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: err.message || 'ไม่สามารถเพิ่มรอบเวลาได้' });
            }
        } catch (error) {
            console.error('Error adding time slot:', error);
        }
    };

    const updateSlot = async (id: number, data: Partial<TimeSlot>) => {
        try {
            const response = await fetchWithAuth(`/booking-time-slots/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data),
            });
            if (response.ok) {
                setEditingId(null);
                fetchSlots();
            }
        } catch (error) {
            console.error('Error updating time slot:', error);
        }
    };

    const toggleActive = async (slot: TimeSlot) => {
        await updateSlot(slot.id, { isActive: !slot.isActive });
    };

    const moveSlot = async (slot: TimeSlot, direction: 'up' | 'down') => {
        const idx = slots.findIndex(s => s.id === slot.id);
        const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (targetIdx < 0 || targetIdx >= slots.length) return;

        const target = slots[targetIdx];
        await updateSlot(slot.id, { sortOrder: target.sortOrder });
        await updateSlot(target.id, { sortOrder: slot.sortOrder });
        fetchSlots();
    };

    const deleteSlot = async (id: number, label: string) => {
        const result = await Swal.fire({
            title: 'ยืนยันการลบ?',
            text: `ต้องการลบ "${label}" ใช่หรือไม่?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'ลบ',
            cancelButtonText: 'ยกเลิก',
        });

        if (result.isConfirmed) {
            try {
                const response = await fetchWithAuth(`/booking-time-slots/${id}`, {
                    method: 'DELETE',
                });
                if (response.ok) {
                    Swal.fire({ icon: 'success', title: 'ลบรอบเวลาสำเร็จ', timer: 1500, showConfirmButton: false });
                    fetchSlots();
                }
            } catch (error) {
                console.error('Error deleting time slot:', error);
            }
        }
    };

    return (
        <div className={embedded ? '' : 'p-6'}>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">จัดการช่วงเวลาจอง</h2>
                    <p className="text-sm text-slate-500 dark:text-gray-400">เพิ่ม แก้ไข หรือลบช่วงเวลาที่ประชาชนสามารถเลือกเมื่อจองคิว</p>
                </div>
                <span className="px-3 py-1 bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-300 rounded-lg text-sm">
                    ทั้งหมด {slots.length} รอบ
                </span>
            </div>

            { }
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm bg-gradient-to-r from-brand-primary to-green-600 text-white rounded-lg hover:shadow-md transition-all font-medium"
                >
                    <Plus className="w-4 h-4" />
                    เพิ่มรอบเวลา
                </button>
                {slots.length === 0 && (
                    <button
                        onClick={seedDefaults}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:shadow-md transition-all font-medium"
                    >
                        <Sparkles className="w-4 h-4" />
                        สร้างรอบเริ่มต้น (6 รอบ)
                    </button>
                )}
            </div>

            { }
            {showAddForm && (
                <div className="mb-6 p-4 bg-brand-primary/5 dark:bg-gray-700/50 border border-brand-primary/20 dark:border-gray-600 rounded-xl space-y-3">
                    <h3 className="font-semibold text-sm text-slate-700 dark:text-gray-200">เพิ่มรอบเวลาใหม่</h3>
                    <div>
                        <label className="block text-sm text-slate-600 dark:text-gray-400 mb-1">ชื่อช่วงเวลา *</label>
                        <input
                            type="text"
                            value={formLabel}
                            onChange={(e) => setFormLabel(e.target.value)}
                            placeholder="เช่น รอบที่ 1: 04:00 – 06:00 น."
                            className="w-full px-4 py-2.5 border border-slate-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary placeholder:text-slate-400 dark:placeholder:text-gray-500"
                            onKeyPress={(e) => e.key === 'Enter' && addSlot()}
                            autoFocus
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={addSlot}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-brand-primary text-white rounded-lg hover:bg-btn-hover transition-colors font-medium"
                        >
                            <Check className="w-3.5 h-3.5" />
                            เพิ่ม
                        </button>
                        <button
                            onClick={() => { setShowAddForm(false); setFormLabel(''); }}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-slate-200 dark:bg-gray-600 text-slate-700 dark:text-gray-200 rounded-lg hover:bg-slate-300 dark:hover:bg-gray-500 transition-colors font-medium"
                        >
                            <X className="w-3.5 h-3.5" />
                            ยกเลิก
                        </button>
                    </div>
                </div>
            )}

            { }
            {isLoading ? (
                <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-3 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {slots.map((slot, idx) => (
                        <div
                            key={slot.id}
                            className={`flex items-center justify-between p-4 rounded-xl transition-all ${slot.isActive
                                    ? 'bg-slate-50 dark:bg-gray-700/50 hover:bg-slate-100 dark:hover:bg-gray-700'
                                    : 'bg-slate-50/50 dark:bg-gray-800/30 opacity-60'
                                }`}
                        >
                            {editingId === slot.id ? (
                                <div className="flex-1 mr-3">
                                    <input
                                        type="text"
                                        defaultValue={slot.label}
                                        id={`edit-label-${slot.id}`}
                                        className="w-full px-3 py-2 border border-brand-primary rounded-lg bg-white dark:bg-gray-800 text-slate-800 dark:text-white outline-none"
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                const labelEl = document.getElementById(`edit-label-${slot.id}`) as HTMLInputElement;
                                                updateSlot(slot.id, { label: labelEl?.value || slot.label });
                                            }
                                        }}
                                        autoFocus
                                    />
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 flex-1">
                                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${slot.isActive ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-slate-400 dark:text-gray-500 flex-shrink-0" />
                                        <span className="text-slate-700 dark:text-gray-200 font-medium">{slot.label}</span>
                                    </div>
                                    <span className="text-xs text-slate-400 dark:text-gray-500 hidden sm:inline">
                                        ({slot.startTime} - {slot.endTime})
                                    </span>
                                </div>
                            )}

                            <div className="flex items-center gap-1">
                                {editingId === slot.id ? (
                                    <>
                                        <button
                                            onClick={() => {
                                                const labelEl = document.getElementById(`edit-label-${slot.id}`) as HTMLInputElement;
                                                const newLabel = labelEl?.value || slot.label;
                                                updateSlot(slot.id, { label: newLabel });
                                            }}
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
                                        { }
                                        <button
                                            onClick={() => moveSlot(slot, 'up')}
                                            disabled={idx === 0}
                                            className="p-1.5 hover:bg-slate-200 dark:hover:bg-gray-600 text-slate-400 dark:text-gray-500 rounded-lg transition-colors disabled:opacity-30"
                                        >
                                            <ArrowUp className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => moveSlot(slot, 'down')}
                                            disabled={idx === slots.length - 1}
                                            className="p-1.5 hover:bg-slate-200 dark:hover:bg-gray-600 text-slate-400 dark:text-gray-500 rounded-lg transition-colors disabled:opacity-30"
                                        >
                                            <ArrowDown className="w-3.5 h-3.5" />
                                        </button>
                                        { }
                                        <button
                                            onClick={() => toggleActive(slot)}
                                            className={`p-1.5 rounded-lg transition-colors ${slot.isActive
                                                    ? 'hover:bg-green-100 dark:hover:bg-green-900/30 text-green-500'
                                                    : 'hover:bg-slate-200 dark:hover:bg-gray-600 text-slate-400'
                                                }`}
                                            title={slot.isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                                        >
                                            {slot.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                                        </button>
                                        { }
                                        <button
                                            onClick={() => setEditingId(slot.id)}
                                            className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-500 dark:text-blue-400 rounded-lg transition-colors"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        { }
                                        <button
                                            onClick={() => deleteSlot(slot.id, slot.label)}
                                            className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 dark:text-red-400 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}

                    {slots.length === 0 && !isLoading && (
                        <div className="text-center py-12 text-slate-400 dark:text-gray-500">
                            <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>ยังไม่มีรอบเวลาจอง</p>
                            <p className="text-sm mt-1">กดปุ่ม &quot;สร้างรอบเริ่มต้น&quot; เพื่อสร้างรอบเวลามาตรฐาน หรือ &quot;เพิ่มรอบเวลา&quot; เพื่อสร้างเอง</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
