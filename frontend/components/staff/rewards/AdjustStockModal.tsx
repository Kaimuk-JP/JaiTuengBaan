'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import type { Reward } from './types';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { getApiUrl } from '@/lib/api';
import { fetchWithAuth } from '@/lib/auth';
import Swal from '@/lib/swal';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import TuneIcon from '@mui/icons-material/Tune';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import InventoryIcon from '@mui/icons-material/Inventory';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import StockCameraCaptureModal from './StockCameraCaptureModal';

interface AdjustStockModalProps {
    isOpen: boolean;
    onClose: () => void;
    reward: Reward | null;
    onSuccess: () => void;
}

export default function AdjustStockModal({
    isOpen,
    onClose,
    reward,
    onSuccess,
}: AdjustStockModalProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [action, setAction] = useState<'ADD_STOCK' | 'DEDUCT_STOCK' | 'SET_STOCK'>('ADD_STOCK');
    const [quantity, setQuantity] = useState<number>(1);
    const [note, setNote] = useState<string>('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [showCameraModal, setShowCameraModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useBodyScrollLock(isOpen);

    useEffect(() => {
        if (isOpen && reward) {
            setAction('ADD_STOCK');
            setQuantity(1);
            setNote('');
            setSelectedFile(null);
            setPreviewUrl('');
            setShowCameraModal(false);
        }
    }, [isOpen, reward]);

    if (!isOpen || !reward) return null;

    const currentStock = reward.stock < 0 ? 0 : reward.stock;
    let newStock = currentStock;
    if (action === 'ADD_STOCK') {
        newStock = currentStock + (quantity || 0);
    } else if (action === 'DEDUCT_STOCK') {
        newStock = Math.max(0, currentStock - (quantity || 0));
    } else if (action === 'SET_STOCK') {
        newStock = quantity || 0;
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    };

    const handleCameraCaptured = (file: File) => {
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        setShowCameraModal(false);
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        setPreviewUrl('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const uploadEvidenceImage = async (file: File): Promise<string | null> => {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch(`${getApiUrl()}/upload/reward-image`, {
                method: 'POST',
                credentials: 'include',
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                return data.url;
            }
            return null;
        } catch (error) {
            console.error('Error uploading stock evidence:', error);
            return null;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (quantity === undefined || quantity === null || (action !== 'SET_STOCK' && quantity <= 0)) {
            Swal.fire({
                icon: 'warning',
                title: 'กรุณาระบุจำนวน',
                text: 'จำนวนที่ปรับเปลี่ยนต้องมากกว่า 0',
                confirmButtonColor: '#1E7D55',
            });
            return;
        }

        if (action === 'DEDUCT_STOCK' && currentStock < quantity) {
            Swal.fire({
                icon: 'error',
                title: 'สต๊อกคงเหลือไม่พอ',
                text: `จำนวนคงเหลือปัจจุบันมี ${currentStock} ชิ้น ไม่สามารถตัดสต๊อก ${quantity} ชิ้นได้`,
                confirmButtonColor: '#1E7D55',
            });
            return;
        }

        if (!selectedFile) {
            Swal.fire({
                icon: 'warning',
                title: 'ต้องมีรูปถ่ายยืนยันสต๊อก',
                text: 'กรุณากดเปิดกล้องถ่ายรูปสินค้าจริงหรือเอกสารตรวจรับเพื่อยืนยันก่อนบันทึก',
                confirmButtonColor: '#1E7D55',
            });
            return;
        }

        try {
            setSubmitting(true);

            let evidenceUrl: string | null = null;
            if (selectedFile) {
                evidenceUrl = await uploadEvidenceImage(selectedFile);
                if (!evidenceUrl) {
                    throw new Error('อัปโหลดรูปภาพหลักฐานไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
                }
            }

            const res = await fetchWithAuth(`/rewards/${reward.id}/adjust-stock`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action,
                    quantity: Number(quantity),
                    note: note.trim() || undefined,
                    evidenceUrl,
                }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || 'ไม่สามารถบันทึกข้อมูลสต๊อกได้');
            }

            await Swal.fire({
                icon: 'success',
                title: 'บันทึกสต๊อกสำเร็จ',
                text: `ปรับปรุงสต๊อกของรางวัล "${reward.name}" เรียบร้อยแล้ว`,
                timer: 1800,
                showConfirmButton: false,
                confirmButtonColor: '#1E7D55',
            });

            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error submitting stock adjust:', error);
            await Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: error?.message || 'ไม่สามารถบันทึกสต๊อกได้',
                confirmButtonColor: '#1E7D55',
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-[999] p-3 sm:p-5 animate-fade-in">
                <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-lg max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200 dark:border-gray-800">
                    <div className="bg-gradient-to-r from-[#1E7D55] via-[#166D45] to-[#0D4D2E] text-white px-6 py-4 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
                                <InventoryIcon />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold">จัดการสต๊อกของรางวัล</h2>
                                <p className="text-xs text-emerald-100 line-clamp-1">{reward.name}</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                        >
                            ✕
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-5 sm:p-6 space-y-5 text-slate-800 dark:text-gray-100 scrollbar-thin">
                        <div className="flex items-center gap-4 p-3.5 bg-slate-50 dark:bg-gray-800/60 rounded-2xl border border-slate-100 dark:border-gray-800">
                            {reward.imageUrl ? (
                                <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-200 dark:bg-gray-700 shrink-0 border border-slate-200 dark:border-gray-600">
                                    <Image src={reward.imageUrl} alt={reward.name} fill className="object-cover" />
                                </div>
                            ) : (
                                <div className="w-14 h-14 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900">
                                    <InventoryIcon fontSize="medium" />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                                    {reward.name}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-slate-500 dark:text-gray-400">สต๊อกปัจจุบัน:</span>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300">
                                        {reward.stock < 0 ? 'ไม่จำกัด' : `${reward.stock} ชิ้น`}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">
                                ประเภทการจัดการสต๊อก <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setAction('ADD_STOCK')}
                                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all cursor-pointer ${
                                        action === 'ADD_STOCK'
                                            ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold shadow-sm'
                                            : 'border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-800 text-slate-600 dark:text-gray-400'
                                    }`}
                                >
                                    <AddCircleIcon className="mb-1 text-emerald-600" />
                                    <span className="text-xs">เพิ่มสต๊อก</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setAction('DEDUCT_STOCK')}
                                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all cursor-pointer ${
                                        action === 'DEDUCT_STOCK'
                                            ? 'border-rose-500 bg-rose-50/80 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold shadow-sm'
                                            : 'border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-800 text-slate-600 dark:text-gray-400'
                                    }`}
                                >
                                    <RemoveCircleIcon className="mb-1 text-rose-600" />
                                    <span className="text-xs">ลด/ตัดชำรุด</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setAction('SET_STOCK')}
                                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all cursor-pointer ${
                                        action === 'SET_STOCK'
                                            ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold shadow-sm'
                                            : 'border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-800 text-slate-600 dark:text-gray-400'
                                    }`}
                                >
                                    <TuneIcon className="mb-1 text-blue-600" />
                                    <span className="text-xs">ปรับยอดจริง</span>
                                </button>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-gray-300">
                                    {action === 'SET_STOCK' ? 'ยอดคงเหลือใหม่ที่นับได้' : 'จำนวนที่ต้องการปรับเปลี่ยน'}{' '}
                                    <span className="text-red-500">*</span>
                                </label>
                                <span className="text-xs text-slate-500 dark:text-gray-400">หน่วย: ชิ้น</span>
                            </div>
                            <input
                                type="number"
                                min={action === 'SET_STOCK' ? 0 : 1}
                                value={quantity}
                                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-white font-bold text-lg focus:ring-2 focus:ring-brand-primary outline-none"
                                placeholder="กรอกจำนวน"
                            />

                            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                {[1, 5, 10, 20, 50, 100].map((preset) => (
                                    <button
                                        key={preset}
                                        type="button"
                                        onClick={() => {
                                            if (action === 'SET_STOCK') setQuantity(preset);
                                            else setQuantity((prev) => (prev || 0) + preset);
                                        }}
                                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 dark:hover:bg-gray-600 text-slate-700 dark:text-gray-300 cursor-pointer transition-colors"
                                    >
                                        +{preset}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="p-3.5 bg-gradient-to-r from-slate-50 to-emerald-50/50 dark:from-gray-800 dark:to-emerald-950/20 rounded-2xl border border-slate-200 dark:border-gray-700 flex items-center justify-between text-xs sm:text-sm">
                            <div className="text-center">
                                <div className="text-slate-500 dark:text-gray-400 text-xs">สต๊อกเดิม</div>
                                <div className="font-bold text-slate-800 dark:text-gray-200 text-base mt-0.5">
                                    {currentStock}
                                </div>
                            </div>
                            <div className="text-slate-400">→</div>
                            <div className="text-center">
                                <div className="text-slate-500 dark:text-gray-400 text-xs">การเปลี่ยนแปลง</div>
                                <div
                                    className={`font-bold text-base mt-0.5 ${
                                        action === 'ADD_STOCK'
                                            ? 'text-emerald-600'
                                            : action === 'DEDUCT_STOCK'
                                            ? 'text-rose-600'
                                            : 'text-blue-600'
                                    }`}
                                >
                                    {action === 'ADD_STOCK'
                                        ? `+${quantity || 0}`
                                        : action === 'DEDUCT_STOCK'
                                        ? `-${quantity || 0}`
                                        : `ปรับเป็น ${quantity || 0}`}
                                </div>
                            </div>
                            <div className="text-slate-400">→</div>
                            <div className="text-center">
                                <div className="text-emerald-700 dark:text-emerald-400 font-semibold text-xs">
                                    ยอดคงเหลือใหม่
                                </div>
                                <div className="font-extrabold text-emerald-600 text-lg mt-0.5">{newStock} ชิ้น</div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-gray-300 flex items-center gap-1.5">
                                    <PhotoCameraIcon className="text-brand-primary" style={{ fontSize: 18 }} />
                                    <span>ถ่ายรูปยืนยันสินค้าจริง / เอกสารตรวจรับ</span>
                                    <span className="text-red-500">* (จำเป็น)</span>
                                </label>
                            </div>

                            {previewUrl ? (
                                <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500 bg-slate-900 group">
                                    <div className="relative w-full h-48 sm:h-56">
                                        <Image src={previewUrl} alt="Evidence" fill className="object-contain" />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleRemoveFile}
                                        className="absolute top-2 right-2 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-md transition-all cursor-pointer"
                                    >
                                        <DeleteForeverIcon fontSize="small" />
                                        <span>ถ่ายใหม่ / ลบรูป</span>
                                    </button>
                                    <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-white text-[11px] font-medium">
                                        ✓ บันทึกรูปยืนยันแล้ว
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-2.5">
                                    <button
                                        type="button"
                                        onClick={() => setShowCameraModal(true)}
                                        className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-100/60 dark:hover:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 transition-all cursor-pointer group"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                                            <PhotoCameraIcon className="text-emerald-700 dark:text-emerald-300" />
                                        </div>
                                        <span className="text-xs font-bold">เปิดกล้องถ่ายรูป</span>
                                        <span className="text-[10px] text-emerald-600/80">เปิดกล้องอุปกรณ์ทันที</span>
                                    </button>

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        className="hidden"
                                        onChange={handleFileSelect}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-slate-300 dark:border-gray-700 bg-slate-50 dark:bg-gray-800/40 hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-700 dark:text-gray-300 transition-all cursor-pointer group"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-gray-700 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                                            <UploadFileIcon className="text-slate-600 dark:text-gray-300" />
                                        </div>
                                        <span className="text-xs font-bold">อัปโหลดรูปภาพ</span>
                                        <span className="text-[10px] text-slate-500">จากอัลบั้ม / เอกสาร</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-gray-300 mb-1.5">
                                หมายเหตุ / เหตุผลการจัดการสต๊อก (ทางเลือก)
                            </label>
                            <textarea
                                rows={2}
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-primary outline-none"
                                placeholder="เช่น รับของบริจาคเพิ่ม 50 ชิ้น, ตรวจนับสต๊อกสิ้นเดือน, ของชำรุด 2 ชิ้น"
                            />
                        </div>
                    </form>

                    <div className="bg-slate-50 dark:bg-gray-800/80 p-4 sm:p-5 border-t border-slate-200 dark:border-gray-700 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-700 transition-colors cursor-pointer disabled:opacity-50"
                        >
                            ยกเลิก
                        </button>

                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="px-6 py-2.5 bg-gradient-to-r from-[#1E7D55] to-[#146440] hover:from-[#196B49] hover:to-[#0F4E33] text-white rounded-xl text-sm font-bold shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                        >
                            {submitting ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                    <span>กำลังบันทึก...</span>
                                </>
                            ) : (
                                <span>บันทึกสต๊อกและรูปถ่าย</span>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <StockCameraCaptureModal
                isOpen={showCameraModal}
                onClose={() => setShowCameraModal(false)}
                onCapture={handleCameraCaptured}
                title={`ถ่ายรูปสต๊อก: ${reward.name}`}
            />
        </>
    );
}
