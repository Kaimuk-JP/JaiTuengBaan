'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import type { Reward } from './types';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import StockCameraCaptureModal from './StockCameraCaptureModal';

interface RewardModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (formData: any, file: File | null, evidenceFile: File | null) => Promise<void>;
    editingReward: Reward | null;
    uploading: boolean;
}

export default function RewardModal({
    isOpen,
    onClose,
    onSubmit,
    editingReward,
    uploading,
}: RewardModalProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const evidenceInputRef = useRef<HTMLInputElement>(null);

    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const [evidencePreviewUrl, setEvidencePreviewUrl] = useState<string>('');
    const [selectedEvidenceFile, setSelectedEvidenceFile] = useState<File | null>(null);
    const [showCameraModal, setShowCameraModal] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        imageUrl: '',
        pointsCost: 100,
        stock: -1,
        isActive: true,
        note: '',
    });

    useBodyScrollLock(isOpen);

    useEffect(() => {
        if (isOpen) {
            if (editingReward) {
                setFormData({
                    name: editingReward.name,
                    description: editingReward.description || '',
                    imageUrl: editingReward.imageUrl || '',
                    pointsCost: editingReward.pointsCost,
                    stock: editingReward.stock,
                    isActive: editingReward.isActive,
                    note: '',
                });
                setPreviewUrl(editingReward.imageUrl || '');
            } else {
                setFormData({
                    name: '',
                    description: '',
                    imageUrl: '',
                    pointsCost: 100,
                    stock: 0,
                    isActive: true,
                    note: '',
                });
                setPreviewUrl('');
            }
            setSelectedFile(null);
            setSelectedEvidenceFile(null);
            setEvidencePreviewUrl('');
        }
    }, [isOpen, editingReward]);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    };

    const handleEvidenceSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setSelectedEvidenceFile(file);
        setEvidencePreviewUrl(URL.createObjectURL(file));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData, selectedFile, selectedEvidenceFile);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-[999] p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-lg max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200 dark:border-gray-800">
                <div className="bg-gradient-to-r from-[#1E7D55] via-[#166D45] to-[#0D4D2E] text-white px-6 py-4 flex items-center justify-between shadow-sm">
                    <h2 className="text-lg font-bold">
                        {editingReward ? 'แก้ไขข้อมูลของรางวัล' : 'เพิ่มของรางวัลใหม่'}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-5 sm:p-6 space-y-4 text-slate-800 dark:text-gray-100 scrollbar-thin">
                    <div>
                        <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-gray-300 mb-1">
                            ชื่อรางวัล <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-primary outline-none"
                            placeholder="เช่น คูปองส่วนลด 100 บาท, เสื้อยืดจิตอาสา"
                        />
                    </div>

                    <div>
                        <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-gray-300 mb-1">
                            รายละเอียด
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-primary outline-none"
                            rows={2}
                            placeholder="รายละเอียดของรางวัล เงื่อนไขการใช้งาน"
                        />
                    </div>

                    <div>
                        <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-gray-300 mb-1.5">
                            รูปภาพของรางวัล
                        </label>
                        <div className="flex items-center gap-3">
                            {(previewUrl || formData.imageUrl) && (
                                <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 dark:border-gray-700 shrink-0 bg-slate-100 dark:bg-gray-800">
                                    <Image
                                        src={previewUrl || formData.imageUrl}
                                        alt="Preview"
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                </div>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageSelect}
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="px-4 py-2 text-xs font-bold border border-slate-300 dark:border-gray-600 rounded-xl hover:bg-slate-50 dark:hover:bg-gray-800 text-slate-700 dark:text-gray-200 transition-colors disabled:opacity-50 cursor-pointer"
                            >
                                {uploading ? 'กำลังอัปโหลด...' : (previewUrl || formData.imageUrl) ? 'เปลี่ยนรูปภาพ' : 'เลือกรูปภาพรางวัล'}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-gray-300 mb-1">
                                แต้มที่ใช้แลก <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                min="1"
                                required
                                value={formData.pointsCost}
                                onChange={(e) => setFormData({ ...formData, pointsCost: Number(e.target.value) })}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-primary outline-none font-bold"
                            />
                        </div>
                        <div>
                            <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-gray-300 mb-1">
                                จำนวนสต๊อก (-1 = ไม่จำกัด)
                            </label>
                            <input
                                type="number"
                                min="-1"
                                value={formData.stock}
                                onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-primary outline-none font-bold"
                            />
                        </div>
                    </div>

                    <div className="p-3.5 bg-slate-50 dark:bg-gray-800/60 rounded-2xl border border-slate-200 dark:border-gray-700 space-y-2">
                        <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-gray-300 flex items-center gap-1.5">
                            <PhotoCameraIcon className="text-brand-primary" style={{ fontSize: 16 }} />
                            <span>ถ่ายรูปหลักฐานยืนยันสต๊อกสินค้าจริง</span>
                            <span className="text-slate-400 text-xs font-normal">(ทางเลือก)</span>
                        </label>

                        {evidencePreviewUrl ? (
                            <div className="relative rounded-xl overflow-hidden border border-emerald-500 bg-slate-900">
                                <div className="relative w-full h-32">
                                    <Image src={evidencePreviewUrl} alt="Evidence" fill className="object-contain" />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedEvidenceFile(null);
                                        setEvidencePreviewUrl('');
                                    }}
                                    className="absolute top-2 right-2 px-2.5 py-1 bg-rose-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow"
                                >
                                    <DeleteForeverIcon fontSize="small" />
                                    <span>ลบรูป</span>
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCameraModal(true)}
                                    className="flex items-center justify-center gap-1.5 p-2 rounded-xl border border-dashed border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
                                >
                                    <PhotoCameraIcon fontSize="small" />
                                    <span>เปิดกล้อง</span>
                                </button>

                                <input
                                    ref={evidenceInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleEvidenceSelect}
                                />
                                <button
                                    type="button"
                                    onClick={() => evidenceInputRef.current?.click()}
                                    className="flex items-center justify-center gap-1.5 p-2 rounded-xl border border-dashed border-slate-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-700 dark:text-gray-300 text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
                                >
                                    <UploadFileIcon fontSize="small" />
                                    <span>อัปโหลดรูป</span>
                                </button>
                            </div>
                        )}
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer pt-1">
                        <input
                            type="checkbox"
                            checked={formData.isActive}
                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                            className="w-4 h-4 text-brand-primary rounded border-slate-300 focus:ring-brand-primary cursor-pointer"
                        />
                        <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-gray-300">
                            เปิดใช้งานของรางวัลนี้ (แสดงให้จิตอาสาเห็นและแลกได้)
                        </span>
                    </label>

                    <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-gray-800">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={uploading}
                            className="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border border-slate-300 dark:border-gray-700 text-slate-700 dark:text-gray-300 rounded-xl hover:bg-slate-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors cursor-pointer"
                        >
                            ยกเลิก
                        </button>
                        <button
                            type="submit"
                            disabled={uploading}
                            className="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold bg-gradient-to-r from-[#1E7D55] to-[#146440] hover:from-[#196B49] hover:to-[#0F4E33] text-white rounded-xl shadow-md disabled:opacity-50 transition-all cursor-pointer"
                        >
                            {uploading ? 'กำลังบันทึก...' : editingReward ? 'บันทึกการแก้ไข' : 'สร้างของรางวัล'}
                        </button>
                    </div>
                </form>
            </div>

            <StockCameraCaptureModal
                isOpen={showCameraModal}
                onClose={() => setShowCameraModal(false)}
                onCapture={(file) => {
                    setSelectedEvidenceFile(file);
                    setEvidencePreviewUrl(URL.createObjectURL(file));
                    setShowCameraModal(false);
                }}
                title={editingReward ? `ถ่ายรูปสต๊อก: ${editingReward.name}` : 'ถ่ายรูปยืนยันสต๊อกสินค้า'}
            />
        </div>
    );
}
