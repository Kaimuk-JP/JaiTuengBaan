'use client';

import { useState, useEffect } from 'react';
import axios from '@/lib/api-client';
import Swal from '@/lib/swal';
import { Vehicle } from './VehiclesClient';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

interface VehicleModalProps {
    isOpen: boolean;
    onClose: () => void;
    vehicle: Vehicle | null;
    onSuccess: () => void;
}

export default function VehicleModal({ isOpen, onClose, vehicle, onSuccess }: VehicleModalProps) {
    const [formData, setFormData] = useState({
        licensePlate: '',
        name: '',
        type: '',
        fuelType: '',
        status: 'READY',
        brand: '',
        model: '',
        color: '',
        capacity: 4,
        totalMileageKm: 0,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useBodyScrollLock(isOpen);

    useEffect(() => {
        if (isOpen && vehicle) {
            setFormData({
                licensePlate: vehicle.licensePlate,
                name: vehicle.name,
                type: vehicle.type,
                fuelType: vehicle.fuelType || '',
                status: vehicle.status || (vehicle.isActive ? 'READY' : 'INACTIVE'),
                brand: vehicle.brand || '',
                model: vehicle.model || '',
                color: vehicle.color || '',
                capacity: vehicle.capacity,
                totalMileageKm: vehicle.totalMileageKm,
            });
        } else if (isOpen) {
            setFormData({
                licensePlate: '',
                name: '',
                type: '',
                fuelType: '',
                status: 'READY',
                brand: '',
                model: '',
                color: '',
                capacity: 4,
                totalMileageKm: 0,
            });
        }
    }, [isOpen, vehicle]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const payload = { ...formData };
            if (payload.fuelType === '') {
                delete (payload as any).fuelType;
            }
            if (payload.brand === '') {
                delete (payload as any).brand;
            }
            if (payload.model === '') {
                delete (payload as any).model;
            }
            if (payload.color === '') {
                delete (payload as any).color;
            }

            if (vehicle) {
                await axios.patch(`/vehicles/${vehicle.id}`, payload);
                Swal.fire({
                    title: 'สำเร็จ',
                    text: 'บันทึกการเปลี่ยนแปลงแล้ว',
                    icon: 'success'
                });
            } else {
                await axios.post('/vehicles', payload);
                Swal.fire({
                    title: 'สำเร็จ',
                    text: 'เพิ่มข้อมูลรถเรียบร้อยแล้ว',
                    icon: 'success'
                });
            }
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error saving vehicle:', error);
            const msg = error.response?.data?.message || 'ไม่สามารถบันทึกข้อมูลได้';
            Swal.fire({
                title: 'ข้อผิดพลาด',
                text: Array.isArray(msg) ? msg[0] : msg,
                icon: 'error'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div
                className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-hide"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                <style jsx global>{`
                    .scrollbar-hide::-webkit-scrollbar {
                        display: none;
                    }
                    .scrollbar-hide {
                        -ms-overflow-style: none;
                        scrollbar-width: none;
                    }
                `}</style>
                <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white/90 backdrop-blur-sm z-10">
                    <h2 className="text-xl font-bold text-gray-800">
                        {vehicle ? 'แก้ไขข้อมูลรถ' : 'เพิ่มข้อมูลรถ'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1 ค้นหาทะเบียนรถ">ทะเบียนรถ *</label>
                            <input
                                type="text"
                                required
                                value={formData.licensePlate}
                                onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors text-gray-900 border-2 text-center font-bold"
                                placeholder="เช่น กข 1234 กทม."
                            />
                        </div>

                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อเรียก / รหัสรถ *</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors text-gray-900"
                                placeholder="เช่น รถตู้ ทบ. 01"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">ประเภทรถ *</label>
                            <input
                                type="text"
                                required
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors text-gray-900"
                                placeholder="เช่น รถพยาบาลพื้นฐาน"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">ประเภทเชื้อเพลิง</label>
                            <select
                                value={formData.fuelType}
                                onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors text-gray-900"
                            >
                                <option value="">-- เลือกประเภทเชื้อเพลิง --</option>
                                <optgroup label="น้ำมัน">
                                    <option value="BENZENE">เบนซิน</option>
                                    <option value="GASOHOL_91">แก๊สโซฮอล์ 91</option>
                                    <option value="GASOHOL_95">แก๊สโซฮอล์ 95</option>
                                    <option value="GASOHOL_E20">แก๊สโซฮอล์ E20</option>
                                    <option value="GASOHOL_E85">แก๊สโซฮอล์ E85</option>
                                    <option value="DIESEL">ดีเซล</option>
                                </optgroup>
                                <optgroup label="ไฟฟ้า">
                                    <option value="ELECTRIC">ไฟฟ้า (EV)</option>
                                </optgroup>
                            </select>
                        </div>

                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">สถานะรถ</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors text-gray-900"
                            >
                                <option value="READY">พร้อมใช้งาน</option>
                                <option value="MAINTENANCE">ซ่อมบำรุง</option>
                                <option value="INACTIVE">ไม่พร้อมใช้งาน</option>
                            </select>
                        </div>

                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">ยี่ห้อ (ถ้ามี)</label>
                            <input
                                type="text"
                                value={formData.brand}
                                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors text-gray-900"
                                placeholder="เช่น Toyota"
                            />
                        </div>

                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">รุ่น (ถ้ามี)</label>
                            <input
                                type="text"
                                value={formData.model}
                                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors text-gray-900"
                                placeholder="เช่น Commuter"
                            />
                        </div>

                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">สีของรถ (ถ้ามี)</label>
                            <input
                                type="text"
                                value={formData.color}
                                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors text-gray-900"
                                placeholder="เช่น ขาว-เขียว"
                            />
                        </div>

                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">ความจุผู้โดยสาร</label>
                            <input
                                type="number"
                                min="1"
                                value={formData.capacity}
                                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors text-gray-900"
                            />
                        </div>

                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                เลขไมล์ตั้งต้น (กม.)
                                <span className="text-xs font-normal text-gray-500 ml-1">(สามารถแก้ได้)</span>
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.totalMileageKm}
                                onChange={(e) => setFormData({ ...formData, totalMileageKm: parseFloat(e.target.value) || 0 })}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors text-gray-900 font-medium"
                                placeholder="เช่น 5500.5"
                            />
                        </div>
                    </div>

                    <div className="pt-4 mt-6 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium border border-gray-200"
                            disabled={isSubmitting}
                        >
                            ยกเลิก
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-5 py-2.5 bg-brand-primary text-white rounded-lg hover:bg-btn-hover transition-colors font-medium w-32 relative overflow-hidden flex items-center justify-center gap-2 disabled:bg-btn-disabled"
                        >
                            {isSubmitting && (
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            )}
                            {isSubmitting ? 'กำลังบันทึก' : 'บันทึก'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
