'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RoleRequest } from '@/types/user';
import { getRoleConfig } from '@/lib/role-config';
import { fetchWithAuth } from '@/lib/auth';
import Swal from '@/lib/swal';
import {
    ArrowLeft,
    User,
    Phone,
    CreditCard,
    MapPin,
    Calendar,
    Clock,
    CheckCircle2,
    XCircle,
    FileText,
    Car,
    HeartHandshake,
    Users,
    Building2,
    Shield,
    ExternalLink,
    Loader2,
    ShieldAlert,
    AlertCircle,
} from 'lucide-react';

interface RoleRequestDetailProps {
    requestId: string;
}

export default function RoleRequestDetail({ requestId }: RoleRequestDetailProps) {
    const router = useRouter();
    const [request, setRequest] = useState<RoleRequest | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [staffNote, setStaffNote] = useState('');
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const fetchRequestDetail = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetchWithAuth(`/role-requests/${requestId}`);
            if (res.ok) {
                const data = await res.json();
                setRequest(data);
                if (data.note) setStaffNote(data.note);
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'ไม่พบข้อมูลคำร้อง',
                    text: 'ไม่พบคำร้องขอสิทธิ์หรือคุณไม่มีสิทธิ์เข้าถึง',
                    confirmButtonColor: '#1E7D55',
                }).then(() => {
                    router.push('/staff/role');
                });
            }
        } catch (err) {
            console.error('Error fetching role request detail:', err);
        } finally {
            setLoading(false);
        }
    }, [requestId, router]);

    useEffect(() => {
        fetchRequestDetail();
    }, [fetchRequestDetail]);

    const handleApprove = async () => {
        if (!request) return;

        const reqConfig = getRoleConfig(request.requestedRole);
        const result = await Swal.fire({
            title: `อนุมัติคำขอสิทธิ์ "${reqConfig.label}" ?`,
            text: `ระบบจะเพิ่มสิทธิ์ ${reqConfig.label} ให้กับ ${request.user?.firstName || ''} ${request.user?.lastName || ''} และส่งการแจ้งเตือนทันที`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'ยืนยันอนุมัติ',
            cancelButtonText: 'ยกเลิก',
            confirmButtonColor: '#1E7D55',
            cancelButtonColor: '#6B7280',
        });

        if (!result.isConfirmed) return;

        setIsSubmitting(true);
        try {
            const res = await fetchWithAuth(`/role-requests/${requestId}/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ note: staffNote }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data?.message || 'อนุมัติไม่สำเร็จ');
            }

            await Swal.fire({
                icon: 'success',
                title: 'อนุมัติคำขอสำเร็จ',
                text: 'เพิ่มสิทธิ์และส่งการแจ้งเตือนไปยังผู้ใช้เรียบร้อยแล้ว',
                confirmButtonColor: '#1E7D55',
            });

            fetchRequestDetail();
        } catch (err: any) {
            console.error('Approve error:', err);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: err?.message || 'ไม่สามารถอนุมัติคำขอได้',
                confirmButtonColor: '#1E7D55',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReject = async () => {
        if (!request) return;

        const { value: rejectReason } = await Swal.fire({
            title: 'ระบุเหตุผลการปฏิเสธคำขอ',
            input: 'textarea',
            inputPlaceholder: 'เช่น เอกสารไม่ชัดเจน, ไม่ผ่านเกณฑ์คุณสมบัติ ฯลฯ',
            showCancelButton: true,
            confirmButtonText: 'ยืนยันปฏิเสธ',
            cancelButtonText: 'ยกเลิก',
            confirmButtonColor: '#EF4444',
            cancelButtonColor: '#6B7280',
            inputValidator: (value: string) => {
                if (!value || !value.trim()) {
                    return 'กรุณาระบุเหตุผลในการปฏิเสธ';
                }
            },
        });

        if (!rejectReason) return;

        setIsSubmitting(true);
        try {
            const res = await fetchWithAuth(`/role-requests/${requestId}/reject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rejectReason, note: staffNote }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data?.message || 'ปฏิเสธไม่สำเร็จ');
            }

            await Swal.fire({
                icon: 'success',
                title: 'ปฏิเสธคำขอเรียบร้อย',
                text: 'ส่งการแจ้งเตือนเหตุผลไปยังผู้ใช้แล้ว',
                confirmButtonColor: '#1E7D55',
            });

            fetchRequestDetail();
        } catch (err: any) {
            console.error('Reject error:', err);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: err?.message || 'ไม่สามารถปฏิเสธคำขอได้',
                confirmButtonColor: '#1E7D55',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'DRIVE':
                return <Car className="w-5 h-5 text-amber-600" />;
            case 'CAREU':
                return <HeartHandshake className="w-5 h-5 text-purple-600" />;
            case 'CAREGIVER':
                return <Users className="w-5 h-5 text-blue-600" />;
            case 'STAFF':
                return <Building2 className="w-5 h-5 text-indigo-600" />;
            default:
                return <Shield className="w-5 h-5 text-gray-600" />;
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-gray-500">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
                <span className="text-sm font-medium">กำลังโหลดรายละเอียดคำร้อง...</span>
            </div>
        );
    }

    if (!request) return null;

    const reqConfig = getRoleConfig(request.requestedRole);
    const userFullName = `${request.user?.firstName || ''} ${request.user?.lastName || ''}`.trim() || 'ไม่ระบุชื่อ';
    const isPending = request.status === 'PENDING';

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-12">
            <div className="flex items-center justify-between gap-4">
                <Link
                    href="/staff/petition?tab=role"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white px-3 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>กลับไปหน้ารายการคำร้อง</span>
                </Link>

                <div className="flex items-center gap-2">
                    {request.status === 'PENDING' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                            <Clock className="w-3.5 h-3.5 animate-pulse" />
                            รอเจ้าหน้าที่ตรวจสอบ
                        </span>
                    )}
                    {request.status === 'APPROVED' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            อนุมัติสิทธิ์แล้ว
                        </span>
                    )}
                    {request.status === 'REJECTED' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300">
                            <XCircle className="w-3.5 h-3.5" />
                            ปฏิเสธคำขอ
                        </span>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                        <div className="text-center pb-5 border-b border-gray-100 dark:border-gray-700">
                            <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-2xl mx-auto mb-3 border-2 border-emerald-300 dark:border-emerald-700 overflow-hidden">
                                {request.user?.pictureUrl ? (
                                    <img
                                        src={request.user.pictureUrl}
                                        alt={userFullName}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    userFullName.charAt(0) || 'U'
                                )}
                            </div>
                            <h3 className="font-bold text-base text-gray-900 dark:text-white">
                                {userFullName}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                ผู้ยื่นคำร้องขอสิทธิ์
                            </p>
                        </div>

                        <div className="pt-4 space-y-3.5 text-xs">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                    <Phone className="w-3.5 h-3.5" /> เบอร์โทร:
                                </span>
                                <span className="font-semibold text-gray-900 dark:text-white">
                                    {request.user?.phone || '-'}
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                    <CreditCard className="w-3.5 h-3.5" /> เลขบัตร ปชช:
                                </span>
                                <span className="font-semibold text-gray-900 dark:text-white">
                                    {request.user?.idCard || '-'}
                                </span>
                            </div>

                            <div className="flex items-start justify-between gap-2">
                                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5 flex-shrink-0">
                                    <MapPin className="w-3.5 h-3.5" /> ที่อยู่:
                                </span>
                                <span className="font-medium text-gray-900 dark:text-white text-right">
                                    {[
                                        request.user?.houseNo,
                                        request.user?.villageName,
                                        request.user?.subdistrictName,
                                        request.user?.districtName,
                                        request.user?.provinceName,
                                    ]
                                        .filter(Boolean)
                                        .join(' ') || request.user?.addressDetail || '-'}
                                </span>
                            </div>

                            <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                                <span className="text-gray-500 dark:text-gray-400 block mb-1.5">
                                    สิทธิ์ที่ถือครองอยู่ในปัจจุบัน:
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                    {(request.user?.allowedRoles || ['USERS']).map((role) => (
                                        <span
                                            key={role}
                                            className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-[11px] font-medium"
                                        >
                                            {getRoleConfig(role).label}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm space-y-5">
                        <div className="flex items-start justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-700">
                            <div>
                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                                    รายละเอียดการขอสิทธิ์
                                </span>
                                <div className="flex items-center gap-2.5 mt-1.5">
                                    <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
                                        {getRoleIcon(request.requestedRole)}
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                            ขอบทบาท: {reqConfig.label}
                                        </h2>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {reqConfig.description}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="text-right text-xs text-gray-400">
                                <div>ยื่นคำร้องเมื่อ:</div>
                                <div className="font-semibold text-gray-700 dark:text-gray-300 mt-0.5">
                                    {new Date(request.createdAt).toLocaleDateString('th-TH', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                                เหตุผล / ข้อมูลที่ผู้ยื่นระบุ:
                            </label>
                            <div className="p-4 bg-gray-50 dark:bg-gray-750 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-800 dark:text-gray-200">
                                {request.reason ? request.reason : <span className="text-gray-400 italic">ไม่ได้ระบุเหตุผลเพิ่มเติม</span>}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                                เอกสารแนบ ({request.documents?.length || 0}):
                            </label>

                            {!request.documents || request.documents.length === 0 ? (
                                <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl text-center text-xs text-gray-400 border border-dashed border-gray-200 dark:border-gray-700">
                                    ไม่มีเอกสารแนบในคำร้องนี้
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {request.documents.map((docUrl, idx) => {
                                        const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(docUrl);
                                        return (
                                            <div
                                                key={idx}
                                                className="group relative rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-700 aspect-video flex items-center justify-center cursor-pointer hover:shadow-md transition"
                                                onClick={() => {
                                                    if (isImage) setPreviewImage(docUrl);
                                                    else window.open(docUrl, '_blank');
                                                }}
                                            >
                                                {isImage ? (
                                                    <img
                                                        src={docUrl}
                                                        alt={`เอกสาร #${idx + 1}`}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                                    />
                                                ) : (
                                                    <div className="flex flex-col items-center gap-1 text-gray-500 dark:text-gray-400 p-2 text-center">
                                                        <FileText className="w-6 h-6 text-emerald-600" />
                                                        <span className="text-[11px] font-medium line-clamp-1">
                                                            เอกสาร #{idx + 1}
                                                        </span>
                                                    </div>
                                                )}

                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-semibold gap-1">
                                                    <ExternalLink className="w-4 h-4" />
                                                    <span>คลิกดูเอกสาร</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {!isPending && (
                            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750 space-y-2 text-xs">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-500">ผู้ตรวจสอบ:</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                        {request.reviewedBy
                                            ? `${request.reviewedBy.firstName || ''} ${request.reviewedBy.lastName || ''}`
                                            : 'เจ้าหน้าที่เทศบาล'}
                                    </span>
                                </div>
                                {request.reviewedAt && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-500">วันที่ตรวจสอบ:</span>
                                        <span className="font-semibold text-gray-900 dark:text-white">
                                            {new Date(request.reviewedAt).toLocaleDateString('th-TH', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </span>
                                    </div>
                                )}
                                {request.status === 'REJECTED' && request.rejectReason && (
                                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700 text-rose-600 dark:text-rose-400">
                                        <strong>เหตุผลที่ปฏิเสธ:</strong> {request.rejectReason}
                                    </div>
                                )}
                                {request.note && (
                                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300">
                                        <strong>หมายเหตุเจ้าหน้าที่:</strong> {request.note}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {isPending && (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm space-y-4">
                            <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                                <ShieldAlert className="w-4 h-4 text-emerald-600" />
                                <span>การดำเนินการของเจ้าหน้าที่</span>
                            </h3>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                    หมายเหตุ / บันทึกการตรวจสอบ (ถ้ามี)
                                </label>
                                <textarea
                                    rows={2}
                                    value={staffNote}
                                    onChange={(e) => setStaffNote(e.target.value)}
                                    placeholder="เช่น ตรวจสอบใบขับขี่ถูกต้องตรงตามระเบียบ ฯลฯ"
                                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={handleReject}
                                    disabled={isSubmitting}
                                    className="px-5 py-2.5 rounded-xl border border-rose-200 dark:border-rose-800/60 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/50 text-xs font-bold transition flex items-center gap-2"
                                >
                                    <XCircle className="w-4 h-4" />
                                    <span>ปฏิเสธคำขอ</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={handleApprove}
                                    disabled={isSubmitting}
                                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold shadow-sm hover:shadow transition flex items-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>กำลังดำเนินการ...</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="w-4 h-4" />
                                            <span>อนุมัติคำขอสิทธิ์</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {previewImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
                    onClick={() => setPreviewImage(null)}
                >
                    <div className="max-w-4xl max-h-[90vh] relative">
                        <img
                            src={previewImage}
                            alt="ภาพเอกสารขยายใหญ่"
                            className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
                        />
                        <button
                            onClick={() => setPreviewImage(null)}
                            className="absolute -top-10 right-0 text-white hover:text-gray-300 text-sm font-semibold"
                        >
                            ปิดหน้าต่าง (ESC)
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
