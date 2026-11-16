'use client';

import { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/auth';
import Swal from '@/lib/swal';
import Image from 'next/image';

interface Redemption {
    id: number;
    pointsUsed: number;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
    rejectReason: string | null;
    createdAt: string;
    reviewedAt: string | null;
    reward: {
        id: number;
        name: string;
        imageUrl: string | null;
    };
    user: {
        id: number;
        firstName: string;
        lastName: string;
        pictureUrl: string | null;
        phone: string | null;
    };
    reviewer?: {
        firstName: string;
        lastName: string;
    };
}

const statusLabels: Record<string, string> = {
    PENDING: 'รออนุมัติ',
    APPROVED: 'อนุมัติแล้ว',
    REJECTED: 'ไม่อนุมัติ',
    COMPLETED: 'รับรางวัลแล้ว',
};

const statusColors: Record<string, string> = {
    PENDING: 'bg-saffron-light-soft text-saffron-dark',
    APPROVED: 'bg-take-soft text-take-dark',
    REJECTED: 'bg-fuan-light text-fuan-dark',
    COMPLETED: 'bg-brand-primary_light text-brand-primary',
};

export default function RedemptionList() {
    const [redemptions, setRedemptions] = useState<Redemption[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [processingId, setProcessingId] = useState<number | null>(null);

    useEffect(() => {
        fetchRedemptions();
    }, [statusFilter]);

    const fetchRedemptions = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (statusFilter) params.append('status', statusFilter);

            const response = await fetchWithAuth(`/rewards/redemptions?${params.toString()}`);
            if (response.ok) {
                const result = await response.json();
                const statusOrder: Record<string, number> = {
                    PENDING: 0,
                    APPROVED: 1,
                    COMPLETED: 2,
                    REJECTED: 3,
                };
                const sorted = (result.data || []).sort((a: Redemption, b: Redemption) => {
                    const orderDiff = (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99);
                    if (orderDiff !== 0) return orderDiff;
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                });
                setRedemptions(sorted);
            }
        } catch (error) {
            console.error('Error fetching redemptions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (redemption: Redemption) => {
        const result = await Swal.fire({
            title: 'ยืนยันการอนุมัติ',
            html: `
                <p>อนุมัติการแลกรางวัล <strong>${redemption.reward.name}</strong></p>
                <p>ให้ <strong>${redemption.user.firstName} ${redemption.user.lastName}</strong></p>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#1E7D55',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'อนุมัติ',
            cancelButtonText: 'ยกเลิก',
        });

        if (!result.isConfirmed) return;

        try {
            setProcessingId(redemption.id);
            const response = await fetchWithAuth(`/rewards/redemptions/${redemption.id}/approve`, {
                method: 'PUT',
            });

            if (response.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'อนุมัติสำเร็จ',
                    timer: 1500,
                    showConfirmButton: false,
                });
                fetchRedemptions();
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
            });
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (redemption: Redemption) => {
        const result = await Swal.fire({
            title: 'ปฏิเสธการแลก',
            input: 'textarea',
            inputLabel: 'เหตุผล (ไม่บังคับ)',
            inputPlaceholder: 'กรอกเหตุผลในการปฏิเสธ...',
            showCancelButton: true,
            confirmButtonColor: '#EF4444',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'ปฏิเสธ',
            cancelButtonText: 'ยกเลิก',
        });

        if (!result.isConfirmed) return;

        try {
            setProcessingId(redemption.id);
            const response = await fetchWithAuth(`/rewards/redemptions/${redemption.id}/reject`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: result.value || '' }),
            });

            if (response.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'ปฏิเสธสำเร็จ',
                    text: 'คืนแต้มให้จิตอาสาเรียบร้อย',
                    timer: 2000,
                    showConfirmButton: false,
                });
                fetchRedemptions();
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
            });
        } finally {
            setProcessingId(null);
        }
    };

    const handleComplete = async (redemption: Redemption) => {
        const result = await Swal.fire({
            title: 'ยืนยันการมอบรางวัล',
            text: `มอบรางวัล "${redemption.reward.name}" ให้ ${redemption.user.firstName} ${redemption.user.lastName} แล้วหรือไม่?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#1E7D55',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'มอบแล้ว',
            cancelButtonText: 'ยกเลิก',
        });

        if (!result.isConfirmed) return;

        try {
            setProcessingId(redemption.id);
            const response = await fetchWithAuth(`/rewards/redemptions/${redemption.id}/complete`, {
                method: 'PUT',
            });

            if (response.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'บันทึกสำเร็จ',
                    timer: 1500,
                    showConfirmButton: false,
                });
                fetchRedemptions();
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
            });
        } finally {
            setProcessingId(null);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="p-6">
            {}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-50 rounded-lg">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 12V22H4V12" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <rect x="2" y="7" width="20" height="5" rx="1" fill="#fef3c7" stroke="#d97706" strokeWidth="2" />
                            <path d="M12 22V7" stroke="#d97706" strokeWidth="2" strokeLinecap="round" />
                            <path d="M12 7c-2.5-4-6-4-6-1.5S9.5 7 12 7zm0 0c2.5-4 6-4 6-1.5S14.5 7 12 7z" fill="#fbbf24" stroke="#d97706" strokeWidth="1.5" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-text-primary">คำขอแลกแต้ม</h1>
                        <p className="text-sm text-text-tertiary">จัดการคำขอแลกแต้มของจิตอาสา</p>
                    </div>
                </div>

                {}
                <div className="flex gap-2">
                    {['', 'PENDING', 'APPROVED', 'COMPLETED', 'REJECTED'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${statusFilter === status
                                ? 'bg-brand-primary text-white'
                                : 'bg-white border border-border-default text-text-secondary hover:bg-gray-50'
                                }`}
                        >
                            {status === '' ? 'ทั้งหมด' : statusLabels[status]}
                        </button>
                    ))}
                </div>
            </div>

            {}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-primary"></div>
                </div>
            ) : redemptions.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center border border-border-default">
                    <p className="text-text-tertiary">ไม่มีคำขอแลกแต้ม</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {redemptions.map((redemption) => (
                        <div
                            key={redemption.id}
                            className="bg-white rounded-xl p-4 border border-border-default"
                        >
                            <div className="flex items-start gap-4">
                                {}
                                <div className="w-12 h-12 rounded-full bg-brand-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                                    {redemption.user.pictureUrl ? (
                                        <Image
                                            src={redemption.user.pictureUrl}
                                            alt={`${redemption.user.firstName} ${redemption.user.lastName}`}
                                            width={48}
                                            height={48}
                                            className="object-cover"
                                            unoptimized
                                        />
                                    ) : (
                                        <span className="text-lg">👤</span>
                                    )}
                                </div>

                                {}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <div>
                                            <h3 className="font-semibold text-text-primary text-sm">
                                                {redemption.user.firstName} {redemption.user.lastName}
                                            </h3>
                                            {redemption.user.phone && (
                                                <p className="text-sm text-text-tertiary">
                                                    {redemption.user.phone}
                                                </p>
                                            )}
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-full ${statusColors[redemption.status]}`}>
                                            {statusLabels[redemption.status]}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2 mb-2">
                                        <span className="text-xl"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M20 12V22H4V12" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            <rect x="2" y="7" width="20" height="5" rx="1" fill="#fef3c7" stroke="#d97706" strokeWidth="2" />
                                            <path d="M12 22V7" stroke="#d97706" strokeWidth="2" strokeLinecap="round" />
                                            <path d="M12 7c-2.5-4-6-4-6-1.5S9.5 7 12 7zm0 0c2.5-4 6-4 6-1.5S14.5 7 12 7z" fill="#fbbf24" stroke="#d97706" strokeWidth="1.5" strokeLinejoin="round" />
                                        </svg></span>
                                        <div>
                                            <p className="font-medium text-text-primary text-sm">
                                                {redemption.reward.name}
                                            </p>
                                            <p className="text-xs text-brand-primary">
                                                {redemption.pointsUsed} แต้ม
                                            </p>
                                        </div>
                                    </div>

                                    <p className="text-xs text-text-placeholder">
                                        ขอแลกเมื่อ {formatDate(redemption.createdAt)}
                                    </p>

                                    {redemption.status === 'REJECTED' && redemption.rejectReason && (
                                        <p className="text-sm text-fuan-dark mt-2 bg-fuan-light/50 px-3 py-1 rounded">
                                            เหตุผล: {redemption.rejectReason}
                                        </p>
                                    )}

                                    {}
                                    {redemption.status === 'PENDING' && (
                                        <div className="flex gap-2 mt-3">
                                            <button
                                                onClick={() => handleApprove(redemption)}
                                                disabled={processingId === redemption.id}
                                                className="px-4 py-1.5 bg-brand-primary text-white text-sm rounded-lg hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {processingId === redemption.id ? 'กำลังบันทึก...' : 'อนุมัติ'}
                                            </button>
                                            <button
                                                onClick={() => handleReject(redemption)}
                                                disabled={processingId === redemption.id}
                                                className="px-4 py-1.5 border border-red-500 text-red-500 text-sm rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {processingId === redemption.id ? 'กำลังบันทึก...' : 'ปฏิเสธ'}
                                            </button>
                                        </div>
                                    )}

                                    {redemption.status === 'APPROVED' && (
                                        <div className="mt-3">
                                            <button
                                                onClick={() => handleComplete(redemption)}
                                                disabled={processingId === redemption.id}
                                                className="px-4 py-1.5 bg-take text-white text-sm rounded-lg hover:bg-take/90 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {processingId === redemption.id ? 'กำลังบันทึก...' : 'มอบรางวัลแล้ว'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
