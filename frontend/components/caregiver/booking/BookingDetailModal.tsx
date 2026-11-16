"use client";

import { useState } from "react";
import { getApiUrl } from '@/lib/api';
import { fetchWithAuth } from '@/lib/auth';
import Image from "next/image";
import Swal from '@/lib/swal';
import { getImageUrl } from '@/utils/image';
import { JOB_STATUS_CONFIG } from '@/components/staff/JobStatusBadge';

interface Volunteer {
    name: string;
    role: string;
    phone: string;
    pictureUrl?: string;
}

interface BookingDetail {
    id: string;
    patientName: string;
    patientPictureUrl?: string;
    patientMobilityStatus: 'WALKING' | 'WHEELCHAIR' | 'BEDRIDDEN';
    bookingType: string;
    hospitalName: string;
    bookingDate: string;
    bookingTime: string;
    status: 'PENDING' | 'AI_MATCHING' | 'ACCEPTED' | 'EN_ROUTE' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    rawStatus?: string;
    requiredEquipment: string[];
    appointmentImage?: string;
    returnEvidenceUrl?: string;
    wantCareU?: boolean;
    careUVolunteer?: {
        name: string;
        phone: string;
        pictureUrl?: string;
    };
    volunteer?: Volunteer;
    jobId?: number;
    bookedOnBehalf?: boolean;
    returnPickupRequestedAt?: string | null;
}

interface BookingDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    booking: BookingDetail | null;
    onBookingAction?: () => void;
}

export function BookingDetailModal({ isOpen, onClose, booking, onBookingAction }: BookingDetailModalProps) {
    const [isConfirming, setIsConfirming] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [isRequestingPickup, setIsRequestingPickup] = useState(false);

    if (!isOpen || !booking) return null;

    const jobStatus = booking.rawStatus || booking.status;
    const canRequestReturnPickup =
        !!booking.jobId &&
        jobStatus === 'AT_HOSPITAL' &&
        !booking.returnPickupRequestedAt;

    const handleRequestReturnPickup = async () => {
        if (!booking.jobId || isRequestingPickup) return;

        const result = await Swal.fire({
            icon: 'question',
            title: booking.bookedOnBehalf ? 'เรียกรถกลับแทน?' : 'เรียกรถกลับ?',
            text: booking.bookedOnBehalf
                ? `ยืนยันเรียกรถมารับ ${booking.patientName} ที่โรงพยาบาล`
                : 'ยืนยันเรียกรถมารับที่โรงพยาบาล',
            showCancelButton: true,
            confirmButtonColor: '#1E7D55',
            cancelButtonColor: '#6B7280',
            confirmButtonText: booking.bookedOnBehalf ? 'เรียกรถกลับแทน' : 'เรียกรถกลับ',
            cancelButtonText: 'ยกเลิก',
        });
        if (!result.isConfirmed) return;

        try {
            setIsRequestingPickup(true);
            const response = await fetchWithAuth(`/jobs/${booking.jobId}/request-return-pickup`, {
                method: 'POST',
            });
            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.message || 'ไม่สามารถเรียกรถกลับได้');
            }
            await Swal.fire({
                icon: 'success',
                title: 'เรียกรถกลับสำเร็จ',
                text: 'รอคนขับมารับที่โรงพยาบาล',
                confirmButtonColor: '#1E7D55',
                timer: 2000,
            });
            onBookingAction?.();
            onClose();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'ไม่สามารถเรียกรถกลับได้';
            await Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: message,
                confirmButtonColor: '#1E7D55',
            });
        } finally {
            setIsRequestingPickup(false);
        }
    };

    const getPatientStatusBadge = (status: string) => {
        switch (status) {
            case 'WALKING':
                return { text: 'เดินได้ปกติ', color: 'bg-[#1E7D55] text-white' };
            case 'WHEELCHAIR':
                return { text: 'ต้องดูแลเพิ่ม', color: 'bg-[#F29F05] text-white' };
            case 'BEDRIDDEN':
                return { text: 'ต้องดูแลใกล้ชิด', color: 'bg-[#EF4444] text-white' };
            default:
                return { text: status, color: 'bg-gray-500 text-white' };
        }
    };

    const getBookingStatusBadge = (status: string) => {
        if (status === 'OPEN') {
            return { text: 'รอตอบรับ', color: 'bg-yellow-100 text-yellow-700' };
        }
        if (status === 'RETURN_OFFICE') {
            return { text: 'ส่งถึงบ้านแล้ว', color: 'bg-green-100 text-green-700' };
        }
        if (status === 'AI_MATCHING') {
            return { text: 'กำลังจับคู่จิตอาสา', color: 'bg-blue-100 text-blue-600' };
        }

        const config = JOB_STATUS_CONFIG[status];
        if (config) {
            return { text: config.label, color: config.style };
        }

        switch (status) {
            case 'PENDING':
            case 'PENDING_MUNICIPAL':
                return { text: 'รอเทศบาลตรวจสอบ', color: 'bg-brand-secondary text-brand-primary' };
            case 'PENDING_EXECUTIVE':
                return { text: 'รอผู้บริหารอนุมัติ', color: 'bg-orange-100 text-orange-700' };
            case 'EXECUTIVE_REJECTED':
                return { text: 'ผู้บริหารปฏิเสธ', color: 'bg-red-100 text-red-600' };
            case 'IN_PROGRESS':
                return { text: 'กำลังให้บริการ', color: 'bg-blue-100 text-blue-600' };
            case 'COMPLETED':
                return { text: 'เสร็จสิ้น', color: 'bg-apple-soft text-brand-primary' };
            case 'CANCELLED_BY_MUNICIPAL':
                return { text: 'เทศบาลยกเลิก', color: 'bg-red-100 text-red-600' };
            case 'CANCELLED_BY_USER':
                return { text: 'ผู้ใช้ยกเลิก', color: 'bg-slate-100 text-slate-600' };
            case 'CANCELLED':
            case 'REJECTED':
                return { text: 'ยกเลิก', color: 'bg-red-100 text-red-600' };
            default:
                return { text: status, color: 'bg-gray-100 text-gray-700' };
        }
    };

    const patientStatus = getPatientStatusBadge(booking.patientMobilityStatus);
    const bookingStatus = getBookingStatusBadge(jobStatus);

    const handleConfirm = async () => {
        if (isConfirming || isCancelling) return;

        try {
            setIsConfirming(true);

            const response = await fetch(`${getApiUrl()}/queues/${booking.id}/confirm`, {
                method: 'PUT',
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('ไม่สามารถยืนยันการจองได้');
            }

            await Swal.fire({
                icon: 'success',
                title: 'ยืนยันสำเร็จ!',
                text: 'คุณได้ยืนยันการจองแล้ว',
                confirmButtonColor: '#1E7D55',
                timer: 2000,
            });

            if (onBookingAction) {
                onBookingAction();
            }
            onClose();
        } catch (error) {
            console.error('Error confirming booking:', error);
            await Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถยืนยันการจองได้ กรุณาลองใหม่อีกครั้ง',
                confirmButtonColor: '#1E7D55',
            });
        } finally {
            setIsConfirming(false);
        }
    };

    const handleCancel = async () => {
        if (isConfirming || isCancelling) return;

        try {
            setIsCancelling(true);

            const result = await Swal.fire({
                icon: 'warning',
                title: 'ยกเลิกการจอง?',
                text: 'คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการจองนี้?',
                showCancelButton: true,
                confirmButtonColor: '#DC2626',
                cancelButtonColor: '#6B7280',
                confirmButtonText: 'ใช่, ยกเลิก',
                cancelButtonText: 'ไม่ยกเลิก',
            });

            if (!result.isConfirmed) {
                setIsCancelling(false);
                return;
            }

            const response = await fetch(`${getApiUrl()}/queues/${booking.id}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.message || 'ไม่สามารถยกเลิกการจองได้');
            }

            await Swal.fire({
                icon: 'success',
                title: 'ยกเลิกสำเร็จ!',
                text: 'คุณได้ยกเลิกการจองแล้ว',
                confirmButtonColor: '#1E7D55',
                timer: 2000,
            });

            if (onBookingAction) {
                onBookingAction();
            }
            onClose();
        } catch (error: any) {
            console.error('Error cancelling booking:', error);
            await Swal.fire({
                icon: 'error',
                title: 'ไม่สามารถยกเลิกได้',
                text: error?.message || 'ไม่สามารถยกเลิกได้ กรุณาลองใหม่อีกครั้ง หรือติดต่อเทศบาล',
                confirmButtonColor: '#1E7D55',
            });
        } finally {
            setIsCancelling(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-3" onClick={onClose}>
            { }
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[85vh] overflow-y-auto relative animate-fade-in-up scrollbar-hide"
                onClick={(e) => e.stopPropagation()}
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                { }
                <div className="sticky top-0 bg-white z-10 px-4 py-3 border-b border-border-neutral flex items-center justify-between">
                    <div className="w-6"></div>
                    <h2 className="text-lg font-bold text-[#1E7D55]">รายละเอียดการจอง</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-3 space-y-3">
                    { }
                    <div className="border border-[#1E7D55] rounded-xl p-4 relative">
                        { }
                        <div className="flex justify-center mb-2">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                                {booking.patientPictureUrl ? (
                                    <Image src={booking.patientPictureUrl} alt={booking.patientName} width={64} height={64} className="object-cover w-full h-full" />
                                ) : (
                                    <svg className="w-10 h-10 text-text-placeholder" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                )}
                            </div>
                        </div>

                        { }
                        <h3 className="text-center text-base font-medium text-text-primary mb-3">
                            {booking.patientName}
                        </h3>

                        { }
                        <div className="space-y-3 text-sm text-text-primary">
                            <div className="flex items-start">
                                <span className="w-32 flex-shrink-0 text-text-primary">สถานะประชาชน :</span>
                                <span className={`${patientStatus.color} text-xs px-3 py-1 rounded-full font-medium`}>
                                    {patientStatus.text}
                                </span>
                            </div>

                            <div className="flex items-start">
                                <span className="w-32 flex-shrink-0">ประเภทการจอง :</span>
                                <span className="font-medium">{booking.bookingType}</span>
                            </div>

                            <div className="flex items-start">
                                <span className="w-32 flex-shrink-0">โรงพยาบาล :</span>
                                <span className="font-medium">{booking.hospitalName}</span>
                            </div>

                            <div className="flex items-start">
                                <span className="w-32 flex-shrink-0">วันที่จอง :</span>
                                <span className="font-medium">{booking.bookingDate}</span>
                            </div>

                            <div className="flex items-start">
                                <span className="w-32 flex-shrink-0">ช่วงเวลาที่จอง :</span>
                                <span className="font-medium">{booking.bookingTime}</span>
                            </div>

                            <div className="flex items-center">
                                <span className="w-32 flex-shrink-0">สถานะการจอง :</span>
                                <span className={`${bookingStatus.color} px-3 py-1 rounded-full text-xs font-medium`}>
                                    {bookingStatus.text}
                                </span>
                            </div>

                            <div className="flex items-start flex-col mt-2">
                                <span className="mb-1">อุปกรณ์ที่ต้องการใช้ :</span>
                                <ul className="list-disc pl-5 space-y-1 text-text-tertiary">
                                    {booking.requiredEquipment.length > 0 ? (
                                        booking.requiredEquipment.map((item, index) => (
                                            <li key={index}>{item}</li>
                                        ))
                                    ) : (
                                        <li>-</li>
                                    )}
                                </ul>
                            </div>

                            {booking.appointmentImage && (
                                <div className="flex items-start flex-col mt-4">
                                    <span className="mb-2 font-medium">รูปใบนัด :</span>
                                    <div className="relative w-full h-48 rounded-xl overflow-hidden border border-border-neutral bg-fuji-light">
                                        <Image
                                            src={getImageUrl(booking.appointmentImage)}
                                            alt="รูปใบนัด"
                                            fill
                                            className="object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                            onClick={() => window.open(getImageUrl(booking.appointmentImage!), '_blank')}
                                            unoptimized
                                        />
                                    </div>
                                </div>
                            )}

                            {booking.returnEvidenceUrl && (
                                <div className="flex items-start flex-col mt-4">
                                    <span className="mb-2 font-medium">รูปส่งกลับบ้าน :</span>
                                    <div className="relative w-full h-48 rounded-xl overflow-hidden border border-border-neutral bg-fuji-light">
                                        <Image
                                            src={getImageUrl(booking.returnEvidenceUrl)}
                                            alt="รูปส่งกลับบ้าน"
                                            fill
                                            className="object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                            onClick={() => window.open(getImageUrl(booking.returnEvidenceUrl!), '_blank')}
                                            unoptimized
                                        />
                                    </div>
                                </div>
                            )}

                            { }
                            <div className="pt-3 mt-3 border-t border-brand-primary">
                                <h4 className="text-sm font-medium text-text-primary mb-3">เจ้าหน้าที่ขับรถ :</h4>

                                <div className="flex items-center gap-3">
                                    { }
                                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                                        {booking.volunteer?.pictureUrl ? (
                                            <Image src={booking.volunteer.pictureUrl} alt={booking.volunteer.name} width={48} height={48} className="object-cover w-full h-full" />
                                        ) : (
                                            <svg className="w-6 h-6 text-text-placeholder" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        )}
                                    </div>

                                    { }
                                    <div className="text-left">
                                        <p className="font-medium text-text-primary text-sm">
                                            {booking.volunteer ? booking.volunteer.name : '-'}
                                        </p>
                                        {booking.volunteer?.phone ? (
                                            <button
                                                onClick={async () => {
                                                    const result = await Swal.fire({
                                                        title: 'โทรหาจิตอาสา?',
                                                        text: `ต้องการโทรหา ${booking.volunteer?.phone} หรือไม่?`,
                                                        icon: 'question',
                                                        showCancelButton: true,
                                                        confirmButtonColor: '#1E7D55',
                                                        cancelButtonColor: '#6B7280',
                                                        confirmButtonText: 'โทร',
                                                        cancelButtonText: 'ยกเลิก',
                                                    });
                                                    if (result.isConfirmed) {
                                                        window.location.href = `tel:${booking.volunteer?.phone}`;
                                                    }
                                                }}
                                                className="flex items-center gap-1.5 text-text-secondary hover:text-brand-primary transition-colors"
                                            >
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                                </svg>
                                                <span className="text-xs underline">{booking.volunteer?.phone}</span>
                                            </button>
                                        ) : (
                                            <p className="text-xs text-text-tertiary">-</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            { }
                            {booking.wantCareU && (
                                <div className="pt-3 mt-3 border-t border-brand-primary">
                                    <h4 className="text-sm font-medium text-text-primary mb-3 flex items-center gap-1.5">
                                        จิตอาสาแคร์ยู :
                                    </h4>

                                    <div className="flex items-center gap-3">
                                        { }
                                        <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                                            {booking.careUVolunteer?.pictureUrl ? (
                                                <Image src={booking.careUVolunteer.pictureUrl} alt={booking.careUVolunteer.name} width={48} height={48} className="object-cover w-full h-full" />
                                            ) : (
                                                <svg className="w-6 h-6 text-text-placeholder" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                            )}
                                        </div>

                                        { }
                                        <div className="text-left">
                                            <p className="font-medium text-text-primary text-sm">
                                                {booking.careUVolunteer ? booking.careUVolunteer.name : '-'}
                                            </p>
                                            {booking.careUVolunteer?.phone ? (
                                                <button
                                                    onClick={async () => {
                                                        const result = await Swal.fire({
                                                            title: 'โทรหาจิตอาสาแคร์ยู?',
                                                            text: `ต้องการโทรหา ${booking.careUVolunteer?.phone} หรือไม่?`,
                                                            icon: 'question',
                                                            showCancelButton: true,
                                                            confirmButtonColor: '#1E7D55',
                                                            cancelButtonColor: '#6B7280',
                                                            confirmButtonText: 'โทร',
                                                            cancelButtonText: 'ยกเลิก',
                                                        });
                                                        if (result.isConfirmed) {
                                                            window.location.href = `tel:${booking.careUVolunteer?.phone}`;
                                                        }
                                                    }}
                                                    className="flex items-center gap-1.5 text-text-secondary hover:text-brand-primary transition-colors"
                                                >
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                                    </svg>
                                                    <span className="text-xs underline">{booking.careUVolunteer?.phone}</span>
                                                </button>
                                            ) : (
                                                <p className="text-xs text-text-tertiary">-</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {(canRequestReturnPickup || (jobStatus === 'AT_HOSPITAL' && booking.returnPickupRequestedAt)) && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                {canRequestReturnPickup ? (
                                    <button
                                        type="button"
                                        onClick={handleRequestReturnPickup}
                                        disabled={isRequestingPickup}
                                        className="w-full bg-[#1E7D55] hover:bg-[#165c40] text-white font-bold py-2.5 px-4 rounded-xl transition-colors disabled:opacity-50"
                                    >
                                        {isRequestingPickup
                                            ? 'กำลังเรียกรถ...'
                                            : booking.bookedOnBehalf
                                                ? 'เรียกรถกลับแทน'
                                                : 'เรียกรถกลับ'}
                                    </button>
                                ) : (
                                    <p className="text-sm text-center text-amber-700 bg-amber-50 rounded-xl py-2.5 px-3">
                                        เรียกรถกลับแล้ว — รอคนขับมารับที่โรงพยาบาล
                                    </p>
                                )}
                            </div>
                        )}

                        {(booking.rawStatus === 'APPROVED' || booking.rawStatus === 'PENDING' || booking.rawStatus === 'PENDING_MUNICIPAL') && (
                            <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
                                <button
                                    onClick={handleCancel}
                                    disabled={isConfirming || isCancelling}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isCancelling ? 'กำลังยกเลิก...' : 'ยกเลิก'}
                                </button>
                                {booking.rawStatus === 'APPROVED' && (
                                    <button
                                        onClick={handleConfirm}
                                        disabled={isConfirming || isCancelling}
                                        className="flex-1 bg-brand-primary hover:bg-btn-hover text-white font-bold py-2 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isConfirming ? 'กำลังยืนยัน...' : 'ยืนยันการแก้ไข'}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
