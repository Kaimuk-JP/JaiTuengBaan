'use client';

import { useState } from 'react';
import Image from 'next/image';
import Swal from '@/lib/swal';
import { getImageUrl } from '@/utils/image';
import type { NamedPerson } from '@/types/common';

interface Queue {
    id: number;
    userId: number;
    hospitalName: string;
    requestDate: string;
    bookingTime: string | null;
    status: string;
    severityLevel: string;
    hasAppointment: boolean;
    appointmentImage: string | null;
    user: {
        id: number;
        firstName?: string;
        lastName?: string;
        displayName?: string;
        pictureUrl?: string;
        phone: string;
        mobilityStatus: string;
        medicalConditions: string | null;
    };
    job?: {
        id: number;
        status: string;
        vlt?: {
            id: number;
            firstName?: string;
            lastName?: string;
            displayName?: string;
            phone: string;
            pictureUrl?: string;
        };
    };
}

interface HistoryDetailModalProps {
    queue: Queue;
    onClose: () => void;
    formatDate: (dateString: string) => string;
    formatTime: (timeString: string | null, dateString: string) => string;
    getStatusLabel: (status: string) => string;
}

export function HistoryDetailModal({
    queue,
    onClose,
    formatDate,
    formatTime,
    getStatusLabel
}: HistoryDetailModalProps) {
    const [userImgError, setUserImgError] = useState(false);
    const [vltImgError, setVltImgError] = useState(false);

    const getUserDisplayName = () => {
        if (queue.user?.firstName && queue.user?.lastName) {
            return `${queue.user.firstName} ${queue.user.lastName}`;
        }
        return queue.user?.displayName || 'ไม่ระบุชื่อ';
    };

    const getVolunteerDisplayName = (vlt: Partial<NamedPerson>) => {
        if (vlt?.firstName && vlt?.lastName) {
            return `${vlt.firstName} ${vlt.lastName}`;
        }
        return vlt?.displayName || 'ไม่ระบุชื่อ';
    };

    const assignedJob = (queue.job?.status === 'ASSIGNED' || queue.job?.status === 'ACCEPTED' || queue.job?.status === 'IN_PROGRESS' || queue.job?.status === 'COMPLETED') ? queue.job : null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3x" onClick={onClose}>
            <div
                className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto overflow-x-hidden animate-fade-in-up shadow-smooth-high scrollbar-hide"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="sticky top-0 bg-white z-10 px-4 py-3 border-b border-border-neutral flex items-center justify-between">
                    <div className="w-6"></div>
                    <h2 className=" text-brand-primary font-bold">ประวัติการจอง</h2>
                    <button
                        onClick={onClose}
                        className="text-text-tertiary hover:text-text-primary transition-colors"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="mx-3x mt-3x mb-3x bg-white rounded-square-hard shadow-smooth-medium border border-brand-primary overflow-hidden">
                    <div className="px-3x pt-3x pb-2x">
                        <h3 className="typo-body font-medium text-text-primary">รายละเอียด</h3>
                    </div>
                    <div className="border-t border-border-neutral mx-3x mb-3x"></div>

                    <div className="flex flex-col items-center px-3x pb-3x">
                        <div className="w-16 h-16 rounded-full bg-fuji-light flex items-center justify-center overflow-hidden mb-2x">
                            {queue.user?.pictureUrl && !userImgError ? (
                                <img
                                    src={getImageUrl(queue.user.pictureUrl)}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                    onError={() => setUserImgError(true)}
                                />
                            ) : (
                                <svg className="w-10 h-10 text-fuji-medium" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                </svg>
                            )}
                        </div>

                        <p className="typo-body font-medium text-text-primary">
                            {getUserDisplayName()}
                        </p>
                    </div>

                    <div className="px-3x pb-3x space-y-2x">
                        <p className="typo-menu text-text-primary">
                            ประเภทการจอง : <span className="font-normal">{queue.hasAppointment ? 'มีใบนัด' : 'ไม่มีใบนัด'}</span>
                        </p>

                        <p className="typo-menu text-text-primary">
                            <span className="font-normal">{queue.hospitalName}</span>
                        </p>

                        <p className="typo-menu text-text-primary">
                            วันที่จอง : <span className="font-normal">{formatDate(queue.requestDate)}</span>
                        </p>

                        <p className="typo-menu text-text-primary">
                            ช่วงเวลาที่จอง : <span className="font-normal">
                                {formatTime(queue.bookingTime, queue.requestDate)}
                            </span>
                        </p>

                        <div className="flex items-center gap-1x">
                            <span className="typo-menu text-text-primary">สถานะการจอง :</span>
                            <span className="bg-apple-soft text-brand-primary typo-menu px-2x py-0.5 rounded-square">
                                {getStatusLabel(queue.status)}
                            </span>
                        </div>

                        {queue.appointmentImage && (
                            <div>
                                <p className="typo-menu text-text-primary mb-1x">รูปใบนัด</p>
                                <div className="relative w-full h-40 rounded-square overflow-hidden border border-border-neutral">
                                    <Image
                                        src={getImageUrl(queue.appointmentImage.includes('/') ? queue.appointmentImage : `/uploads/${queue.appointmentImage}`)}
                                        alt="Appointment"
                                        fill
                                        className="object-contain bg-field-default"
                                        unoptimized
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="border-t border-brand-primary mx-3x"></div>

                    <div className="px-3x pt-3x pb-2x">
                        <h3 className="typo-body font-medium text-text-primary">เจ้าหน้าที่ขับรถ</h3>
                    </div>

                    <div className="flex items-center gap-3x px-3x pb-3x">
                        <div className="w-16 h-16 rounded-full bg-fuji-light flex items-center justify-center overflow-hidden flex-shrink-0">
                            {assignedJob?.vlt?.pictureUrl && !vltImgError ? (
                                <img
                                    src={getImageUrl(assignedJob.vlt.pictureUrl)}
                                    alt="Volunteer"
                                    className="w-full h-full object-cover"
                                    onError={() => setVltImgError(true)}
                                />
                            ) : (
                                <svg className="w-10 h-10 text-fuji-medium" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                </svg>
                            )}
                        </div>

                        {assignedJob && assignedJob.vlt ? (
                            <div className="space-y-0.5">
                                <p className="typo-menu text-text-secondary">
                                    เจ้าหน้าที่ จิตอาสา
                                </p>
                                <p className="typo-menu text-text-primary">
                                    ชื่อ {getVolunteerDisplayName(assignedJob.vlt)}
                                </p>
                                <button
                                    onClick={async () => {
                                        const result = await Swal.fire({
                                            title: 'โทรหาจิตอาสา?',
                                            text: `ต้องการโทรหา ${assignedJob.vlt!.phone} หรือไม่?`,
                                            icon: 'question',
                                            showCancelButton: true,
                                            confirmButtonColor: '#1E7D55',
                                            cancelButtonColor: '#6B7280',
                                            confirmButtonText: 'โทร',
                                            cancelButtonText: 'ยกเลิก',
                                        });
                                        if (result.isConfirmed) {
                                            window.location.href = `tel:${assignedJob.vlt!.phone}`;
                                        }
                                    }}
                                    className="flex items-center gap-1.5 text-text-secondary hover:text-brand-primary transition-colors"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                    </svg>
                                    <span className="typo-menu underline">{assignedJob.vlt.phone}</span>
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-0.5">
                                <p className="typo-menu text-text-secondary">
                                    รอเทศบาลมอบหมาย
                                </p>
                                <p className="typo-menu text-text-placeholder">
                                    กรุณารอสักครู่...
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
