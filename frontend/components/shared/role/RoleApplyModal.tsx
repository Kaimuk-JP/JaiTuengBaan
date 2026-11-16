'use client';

import React, { useState, useEffect } from 'react';
import { Role } from '@/types/user';
import { ROLE_CONFIGS, getRoleConfig } from '@/lib/role-config';
import { getApiUrl } from '@/lib/api';
import Swal from '@/lib/swal';
import {
    X,
    Upload,
    Car,
    HeartHandshake,
    Users,
    Building2,
    Shield,
    FileText,
    CheckCircle2,
    AlertCircle,
    Loader2,
    UserPlus
} from 'lucide-react';

interface RoleApplyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    currentAllowedRoles: Role[];
}

export default function RoleApplyModal({
    isOpen,
    onClose,
    onSuccess,
    currentAllowedRoles,
}: RoleApplyModalProps) {
    const [selectedRole, setSelectedRole] = useState<Role | ''>('');
    const [reason, setReason] = useState('');
    const [note, setNote] = useState('');
    const [uploadedDocs, setUploadedDocs] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const originalOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = originalOverflow;
            };
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const applyableRoles: Role[] = (['DRIVE', 'CAREU', 'CAREGIVER', 'STAFF'] as Role[]).filter(
        (r) => !currentAllowedRoles.includes(r)
    );

    const getRoleIcon = (role: Role) => {
        switch (role) {
            case 'DRIVE':
                return <Car className="w-6 h-6 text-amber-600" />;
            case 'CAREU':
                return <HeartHandshake className="w-6 h-6 text-purple-600" />;
            case 'CAREGIVER':
                return <Users className="w-6 h-6 text-blue-600" />;
            case 'STAFF':
                return <Building2 className="w-6 h-6 text-indigo-600" />;
            default:
                return <Shield className="w-6 h-6 text-gray-600" />;
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);
        try {
            const formData = new FormData();
            for (let i = 0; i < files.length; i++) {
                formData.append('file', files[i]);
            }

            const res = await fetch(`${getApiUrl()}/upload`, {
                method: 'POST',
                credentials: 'include',
                body: formData,
            });

            if (!res.ok) {
                throw new Error('อัปโหลดไฟล์ไม่สำเร็จ');
            }

            const data = await res.json();
            const urls = Array.isArray(data.urls) ? data.urls : [data.url || data.path];
            setUploadedDocs((prev) => [...prev, ...urls.filter(Boolean)]);
        } catch (err: any) {
            console.error('File upload error:', err);
            Swal.fire({
                icon: 'error',
                title: 'อัปโหลดไฟล์ล้มเหลว',
                text: err?.message || 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์',
                confirmButtonColor: '#1E7D55',
            });
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemoveDoc = (index: number) => {
        setUploadedDocs((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRole) {
            Swal.fire({
                icon: 'warning',
                title: 'กรุณาเลือกบทบาท',
                text: 'โปรดเลือกบทบาทที่คุณต้องการยื่นขอสิทธิ์',
                confirmButtonColor: '#1E7D55',
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch(`${getApiUrl()}/role-requests`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    requestedRole: selectedRole,
                    reason,
                    documents: uploadedDocs,
                    note,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data?.message || 'เกิดข้อผิดพลาดในการยื่นคำร้อง');
            }

            await Swal.fire({
                icon: 'success',
                title: 'ยื่นคำร้องสำเร็จ',
                text: 'คำร้องของคุณถูกส่งไปยังเจ้าหน้าที่เทศบาลแล้ว ระหว่างรอการตรวจสอบคุณสามารถใช้งานบทบาทเดิมได้ตามปกติ',
                confirmButtonColor: '#1E7D55',
            });

            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Submit role request error:', err);
            Swal.fire({
                icon: 'error',
                title: 'ยื่นคำร้องไม่สำเร็จ',
                text: err?.message || 'ไม่สามารถส่งคำร้องได้ กรุณาลองใหม่อีกครั้ง',
                confirmButtonColor: '#1E7D55',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn overscroll-contain"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700 flex flex-col max-h-[90vh] overscroll-contain">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-emerald-50/80 to-teal-50/50 dark:from-gray-800 dark:to-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                            <UserPlus className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-gray-900 dark:text-white">
                                ยื่นขอสิทธิ์บทบาทเพิ่มเติม
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                ส่งคำขอไปยังเจ้าหน้าที่เทศบาลเพื่อรับการตรวจสอบและอนุมัติสิทธิ์
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-white/80 dark:hover:bg-gray-700 transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 overscroll-contain">
                    <div className="p-3.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40 rounded-xl flex items-start gap-3 text-xs text-blue-800 dark:text-blue-200">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-600" />
                        <div>
                            <strong>ข้อมูลสำคัญ:</strong> ระหว่างรอเจ้าหน้าที่ตรวจสอบคำร้อง คุณยังคงสามารถใช้งานบทบาทปัจจุบันได้ตามปกติตลอดเวลา เมื่อได้รับการอนุมัติระบบจะแจ้งเตือนให้สลับบทบาทได้ทันที
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                            เลือกบทบาทที่ต้องการขอสิทธิ์ <span className="text-red-500">*</span>
                        </label>
                        {applyableRoles.length === 0 ? (
                            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-center text-sm text-gray-500">
                                คุณได้รับสิทธิ์ครบทุกบทบาทที่สามารถยื่นขอได้แล้ว
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {applyableRoles.map((role) => {
                                    const config = getRoleConfig(role);
                                    const isSelected = selectedRole === role;
                                    return (
                                        <button
                                            type="button"
                                            key={role}
                                            onClick={() => setSelectedRole(role)}
                                            className={`p-3.5 rounded-xl border text-left transition flex items-start gap-3 relative ${
                                                isSelected
                                                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20 shadow-sm'
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                                            }`}
                                        >
                                            <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-700/60 flex-shrink-0">
                                                {getRoleIcon(role)}
                                            </div>
                                            <div className="flex-1 min-w-0 pr-4">
                                                <div className="font-semibold text-sm text-gray-900 dark:text-white">
                                                    {config.label}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">
                                                    {config.description}
                                                </div>
                                            </div>
                                            {isSelected && (
                                                <CheckCircle2 className="w-5 h-5 text-emerald-600 absolute top-3 right-3" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
                            เหตุผล / ข้อมูลประกอบการขอสิทธิ์
                        </label>
                        <textarea
                            rows={3}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="เช่น มีใบขับขี่และมีความพร้อมในการรับส่งผู้ป่วยจิตอาสา, ผ่านการอบรมแคร์ยูแล้ว ฯลฯ"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
                            เอกสารประกอบ (เช่น รูปถ่ายใบขับขี่, บัตรประชาชน, ใบรับรอง)
                        </label>

                        <div className="space-y-3">
                            <label className="border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer bg-gray-50/50 dark:bg-gray-700/30 hover:bg-emerald-50/20 transition">
                                <Upload className="w-6 h-6 text-gray-400 mb-1.5" />
                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                    คลิกเพื่ออัปโหลดเอกสาร / รูปถ่าย
                                </span>
                                <span className="text-[11px] text-gray-400 mt-0.5">
                                    รองรับไฟล์ JPG, PNG, PDF (สูงสุด 10MB)
                                </span>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*,application/pdf"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    disabled={isUploading}
                                />
                            </label>

                            {isUploading && (
                                <div className="flex items-center gap-2 text-xs text-emerald-600 justify-center py-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>กำลังอัปโหลดไฟล์...</span>
                                </div>
                            )}

                            {uploadedDocs.length > 0 && (
                                <div className="space-y-1.5">
                                    {uploadedDocs.map((doc, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-xs border border-gray-200 dark:border-gray-600"
                                        >
                                            <div className="flex items-center gap-2 truncate pr-2">
                                                <FileText className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                                <span className="truncate text-gray-700 dark:text-gray-200">
                                                    เอกสารแนบ #{idx + 1}
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveDoc(idx)}
                                                className="text-red-500 hover:text-red-700 p-1"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </form>

                <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition"
                    >
                        ยกเลิก
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting || !selectedRole}
                        className="px-5 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-sm hover:shadow transition flex items-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>กำลังส่งคำร้อง...</span>
                            </>
                        ) : (
                            <span>ส่งคำร้องขอสิทธิ์</span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
