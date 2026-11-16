'use client';

import React, { useEffect, useState } from 'react';
import { fetchWithAuth } from '@/lib/auth';
import Swal from '@/lib/swal';
import JobStatusBadge from '@/components/staff/JobStatusBadge';

interface BookingDetailModalProps {
    queueId: string;
    onClose: () => void;
}

interface QueueDetail {
    id: number;
    requestDate: string;
    bookingTime: string;
    hasAppointment: boolean;
    appointmentImage: string | null;
    requiredEquipment: string | null;
    wantCareU?: boolean;
    status: string;
    rejectReason?: string | null;
    adminNote?: string | null;
    user: {
        id: number;
        firstName: string;
        lastName: string;
        displayName?: string;
        pictureUrl: string | null;
        mobilityStatus: string;
        phone?: string;
    };
    creator?: {
        id: number;
        firstName: string;
        lastName: string;
        displayName?: string;
        phone?: string;
    } | null;
    hospital?: {
        name: string;
    } | null;
    job?: {
        returnEvidenceUrl?: string | null;
        status?: string;
        vlt?: {
            id: string;
            firstName: string;
            lastName: string;
            phone?: string;
            pictureUrl?: string | null;
        } | null;
        careu?: {
            id: string;
            firstName: string;
            lastName: string;
            phone?: string;
            pictureUrl?: string | null;
        } | null;
    } | null;
}

const getMobilityStatusLabel = (status: string | undefined | null) => {
    switch (status) {
        case 'WALKING': return 'ทั่วไป';
        case 'WHEELCHAIR': return 'ต้องดูแลเพิ่ม';
        case 'BEDRIDDEN': return 'ต้องดูแลใกล้ชิด';
        default: return status || '-';
    }
};

export default function BookingDetailModal({ queueId, onClose }: BookingDetailModalProps) {
    const [queue, setQueue] = useState<QueueDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    useEffect(() => {
        const fetchQueueDetail = async () => {
            try {
                setLoading(true);
                const response = await fetchWithAuth(`/queues/${queueId}`);
                if (response.ok) {
                    const data = await response.json();
                    setQueue(data);
                } else {
                    throw new Error('ไม่สามารถดึงข้อมูลรายละเอียดคิวได้');
                }
            } catch (error) {
                console.error('Error fetching queue details:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'เกิดข้อผิดพลาด',
                    text: 'ไม่สามารถดึงข้อมูลรายละเอียดการจองได้',
                });
                onClose();
            } finally {
                setLoading(false);
            }
        };

        if (queueId) {
            fetchQueueDetail();
        }
    }, [queueId, onClose]);

    if (!queueId) return null;

    const currentEquipment = queue?.requiredEquipment ? queue.requiredEquipment.split(',').map(s => s.trim()).filter(Boolean) : [];

    const bookerName = queue?.creator
        ? (queue.creator.displayName || `${queue.creator.firstName || ''} ${queue.creator.lastName || ''}`.trim())
        : (queue?.user ? (queue.user.displayName || `${queue.user.firstName || ''} ${queue.user.lastName || ''}`.trim()) : '-');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl relative animate-in zoom-in-95 duration-200">
                { }
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-2"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                <div className="p-8">
                    <div className="flex items-center gap-3 mb-8 flex-wrap">
                        <h2 className="text-2xl font-bold text-slate-800">รายละเอียดการจอง</h2>
                        {queue?.status && <JobStatusBadge status={queue.status} className="text-xs !min-w-fit px-3 py-1" />}
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-primary"></div>
                        </div>
                    ) : queue ? (
                        <div className="space-y-6">
                            {(queue.rejectReason || queue.adminNote) && (
                                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-600 shrink-0 mt-0.5">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-bold text-rose-800">
                                                ประวัติการยกเลิก / หมายเหตุ
                                            </h4>
                                            {queue.rejectReason && (
                                                <p className="text-sm text-rose-700 mt-1 font-medium leading-relaxed">
                                                    {queue.rejectReason}
                                                </p>
                                            )}
                                            {queue.adminNote && queue.adminNote !== queue.rejectReason && (() => {
                                                try {
                                                    if (queue.adminNote.trim().startsWith('{')) {
                                                        const changes = JSON.parse(queue.adminNote);
                                                        return (
                                                            <div className="mt-2 text-xs text-rose-700 space-y-1.5 bg-rose-100/70 p-2.5 rounded-lg border border-rose-200/80">
                                                                <span className="font-bold text-rose-900 block">ประวัติการแก้ไขข้อมูล:</span>
                                                                {changes.hospitalName && (
                                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                                        <span className="font-medium text-rose-800">โรงพยาบาล:</span>
                                                                        <span className="line-through text-slate-400">{changes.hospitalName.from}</span>
                                                                        <span className="text-rose-600 font-bold">➔</span>
                                                                        <span className="font-semibold text-emerald-700">{changes.hospitalName.to}</span>
                                                                    </div>
                                                                )}
                                                                {changes.bookingTime && (
                                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                                        <span className="font-medium text-rose-800">ช่วงเวลา:</span>
                                                                        <span className="line-through text-slate-400">{changes.bookingTime.from}</span>
                                                                        <span className="text-rose-600 font-bold">➔</span>
                                                                        <span className="font-semibold text-emerald-700">{changes.bookingTime.to}</span>
                                                                    </div>
                                                                )}
                                                                {changes.requestDate && (
                                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                                        <span className="font-medium text-rose-800">วันที่นัดหมาย:</span>
                                                                        <span className="line-through text-slate-400">{changes.requestDate.from}</span>
                                                                        <span className="text-rose-600 font-bold">➔</span>
                                                                        <span className="font-semibold text-emerald-700">{changes.requestDate.to}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    }
                                                } catch { }
                                                return (
                                                    <p className="text-xs text-rose-600 mt-1 leading-relaxed">
                                                        <span className="font-semibold">หมายเหตุแอดมิน:</span> {queue.adminNote}
                                                    </p>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-center mb-6">
                                <div className="w-32 h-32 rounded-full bg-blue-50 flex items-center justify-center overflow-hidden border-4 border-white shadow-sm">
                                    {queue.user.pictureUrl ? (
                                        <img src={queue.user.pictureUrl} alt="User Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                            <circle cx="12" cy="7" r="4"></circle>
                                        </svg>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">ชื่อผู้จอง</label>
                                    <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-600">
                                        {bookerName}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">สถานะผู้ป่วย</label>
                                    <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-600">
                                        {getMobilityStatusLabel(queue.user.mobilityStatus)}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">ประเภทการจอง</label>
                                    <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-600">
                                        {queue.hasAppointment ? 'มีใบนัด' : 'ไม่มีใบนัด'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">โรงพยาบาล</label>
                                    <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-600">
                                        {queue.hospital?.name || '-'}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">เวลาที่จอง</label>
                                    <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-600">
                                        {queue.bookingTime || '-'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">วันที่จอง</label>
                                    <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-600">
                                        {new Date(queue.requestDate).toLocaleDateString('th-TH', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </div>
                                </div>

                                {queue.job?.vlt && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">เจ้าหน้าที่ขับรถ</label>
                                        <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-700 flex items-center justify-between">
                                            <span className="font-medium">{queue.job.vlt.firstName} {queue.job.vlt.lastName || ''}</span>
                                            {queue.job.vlt.phone && (
                                                <span className="text-xs text-slate-500"> {queue.job.vlt.phone}</span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {queue.job?.careu && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">จิตอาสาแคร์ยู</label>
                                        <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-700 flex items-center justify-between">
                                            <span className="font-medium">{queue.job.careu.firstName} {queue.job.careu.lastName || ''}</span>
                                            {queue.job.careu.phone && (
                                                <span className="text-xs text-slate-500"> {queue.job.careu.phone}</span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                {queue.appointmentImage && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">หลักฐานการนัดหมาย</label>
                                        <div
                                            className="bg-slate-50 border border-slate-200 rounded-lg h-48 flex items-center justify-center overflow-hidden cursor-pointer group"
                                            onClick={() => setSelectedImage(queue.appointmentImage!)}
                                        >
                                            <img src={queue.appointmentImage} alt="ใบ นัด" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                        </div>
                                    </div>
                                )}

                                {queue.job?.returnEvidenceUrl && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">หลักฐานส่งกลับบ้าน</label>
                                        <div
                                            className="bg-slate-50 border border-slate-200 rounded-lg h-48 flex items-center justify-center overflow-hidden cursor-pointer group"
                                            onClick={() => setSelectedImage(queue.job!.returnEvidenceUrl!)}
                                        >
                                            <img src={queue.job.returnEvidenceUrl} alt="ภาพหลักฐานตอนส่งกลับบ้าน" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                        </div>
                                    </div>
                                )}

                                {currentEquipment.length > 0 && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">อุปกรณ์ที่ต้องการใช้</label>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {currentEquipment.map((item) => (
                                                <span key={item} className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-medium border border-green-200">
                                                    {item}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {queue.wantCareU && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">จิตอาสาแคร์ยู</label>
                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-emerald-100 text-emerald-700">
                                            <span>ต้องการจิตอาสาแคร์ยูไปเป็นเพื่อน</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-10 text-slate-500">
                            ไม่พบข้อมูล
                        </div>
                    )}
                </div>
            </div>

            { }
            {selectedImage && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 animate-in fade-in duration-200"
                    onClick={() => setSelectedImage(null)}
                >
                    <div className="relative max-w-5xl max-h-[90vh] w-full flex items-center justify-center">
                        <button
                            className="absolute -top-12 right-0 text-white hover:text-gray-300 bg-black/50 hover:bg-black/70 rounded-full p-2 transition-colors focus:outline-none"
                            onClick={() => setSelectedImage(null)}
                            title="ปิด"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                        <img
                            src={selectedImage}
                            alt="Full screen preview"
                            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
