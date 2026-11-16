'use client';

import React from 'react';
import { getApiUrl } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Swal from '@/lib/swal';
import { useAuth } from '@/contexts/AuthContext';

interface NotificationDetailModalProps {
    isOpen: boolean;
    notification: any;
    onClose: () => void;
    userRole?: 'USERS' | 'DRIVE' | 'CAREU' | 'STAFF' | 'CAREGIVER';
    onActionSuccess?: () => void;
}

export default function NotificationDetailModal({
    isOpen,
    notification,
    onClose,
    userRole = 'USERS',
    onActionSuccess
}: NotificationDetailModalProps) {
    const router = useRouter();
    const { user } = useAuth();
    const [jobData, setJobData] = React.useState<any>(null);
    const [queueData, setQueueData] = React.useState<any>(null);
    const [queueStatus, setQueueStatus] = React.useState<string | null>(notification?.data?.status || null);
    const [isLoadingQueue, setIsLoadingQueue] = React.useState(true);
    const [isConfirming, setIsConfirming] = React.useState(false);
    const [isCancelling, setIsCancelling] = React.useState(false);
    const [isAcceptingJob, setIsAcceptingJob] = React.useState(false);
    const [redemptionData, setRedemptionData] = React.useState<any>(null);

    const isRewardNotification = (n: any) => {
        if (!n) return false;
        const type = (n.originalType || n.type || '').toUpperCase();
        return type.startsWith('REWARD_REDEMPTION');
    };



    React.useEffect(() => {
        if (isOpen) {
            const scrollY = window.scrollY;
            document.documentElement.style.overflow = 'hidden';
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollY}px`;
            document.body.style.left = '0';
            document.body.style.right = '0';
            return () => {
                document.documentElement.style.overflow = '';
                document.body.style.overflow = '';
                document.body.style.position = '';
                document.body.style.top = '';
                document.body.style.left = '';
                document.body.style.right = '';
                window.scrollTo(0, scrollY);
            };
        }
    }, [isOpen]);

    React.useEffect(() => {
        const fetchData = async () => {
            setIsLoadingQueue(true);

            if (isRewardNotification(notification) && notification?.data?.redemptionId) {
                try {
                    const response = await fetch(`${getApiUrl()}/rewards/history`, {
                        credentials: 'include',
                    });
                    if (response.ok) {
                        const result = await response.json();
                        const redemption = result.data?.find((r: any) => r.id === notification.data.redemptionId);
                        if (redemption) {
                            setRedemptionData(redemption);
                        }
                    }
                } catch (error) {
                    console.error('Failed to fetch redemption data:', error);
                }
                setIsLoadingQueue(false);
                return;
            }

            if ((userRole === 'USERS' || userRole === 'CAREGIVER' || userRole === 'DRIVE' || userRole === 'CAREU') && notification?.data?.queueId) {
                try {
                    const response = await fetch(`${getApiUrl()}/queues/${notification.data.queueId}`, {
                        credentials: 'include',
                    });
                    if (response.ok) {
                        const data = await response.json();
                        setQueueData(data);
                        setJobData(data.job);
                        setQueueStatus(data.status);
                    }
                } catch (error) {
                    console.error('Failed to fetch queue data:', error);
                }
            }
            setIsLoadingQueue(false);
        };

        if (isOpen) {
            fetchData();
        } else {
            setIsLoadingQueue(true);
            setQueueStatus(notification?.data?.status || null);
            setRedemptionData(null);
        }
    }, [isOpen, notification, userRole]);



    const handleConfirm = async () => {
        if (isConfirming || isCancelling) return;

        if (queueStatus !== 'APPROVED') {
            return;
        }

        try {
            setIsConfirming(true);

            const queueId = notification.data?.id || notification.data?.queueId;

            if (!queueId) {
                throw new Error('ไม่พบข้อมูลคิวในการแจ้งเตือน');
            }

            const response = await fetch(`${getApiUrl()}/queues/${queueId}/confirm`, {
                method: 'PUT',
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('ไม่สามารถยืนยันการจองได้');
            }

            await Swal.fire({
                icon: 'success',
                title: 'ยืนยันสำเร็จ!',
                text: 'คุณได้ยืนยันข้อมูลการจองที่แก้ไขแล้ว',
                confirmButtonColor: '#1E7D55',
                timer: 2000,
            });

            setQueueStatus('CONFIRMED');

            if (onActionSuccess) {
                await onActionSuccess();
            }
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

            const queueId = notification.data?.id || notification.data?.queueId;

            if (!queueId) {
                throw new Error('ไม่พบข้อมูลคิวในการแจ้งเตือน');
            }

            const response = await fetch(`${getApiUrl()}/queues/${queueId}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('ไม่สามารถยกเลิกการจองได้');
            }

            await Swal.fire({
                icon: 'success',
                title: 'ยกเลิกสำเร็จ!',
                text: 'คุณได้ยกเลิกการจองแล้ว',
                confirmButtonColor: '#1E7D55',
                timer: 2000,
            });

            if (onActionSuccess) {
                await onActionSuccess();
            }

            onClose();
            window.location.reload();
        } catch (error) {
            console.error('Error cancelling booking:', error);
            await Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถยกเลิกได้ กรุณาลองใหม่อีกครั้ง',
                confirmButtonColor: '#1E7D55',
            });
        } finally {
            setIsCancelling(false);
        }
    };

    const handleAcceptJob = async () => {
        if (isAcceptingJob) return;

        try {
            setIsAcceptingJob(true);
            const jobId = notification.data?.jobId ||
                (Array.isArray(notification.data.job)
                    ? notification.data.job[0]?.id
                    : notification.data.job?.id);

            if (!jobId) {
                console.error('Job ID not found in notification:', notification.data);
                throw new Error('ไม่พบข้อมูลงาน');
            }

            const response = await fetch(`${getApiUrl()}/jobs/${jobId}/accept-by-volunteer`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    vltId: user?.id ? Number(user.id) : undefined,
                }),
            });

            if (!response.ok) {
                throw new Error('ไม่สามารถรับงานได้');
            }

            await Swal.fire({
                icon: 'success',
                title: 'รับงานสำเร็จ!',
                text: 'คุณได้รับงานนี้แล้ว กำลังเตรียมตัวออกเดินทาง',
                confirmButtonColor: '#1E7D55',
                timer: 1500,
                showConfirmButton: false,
            });

            onClose();
            router.push(`/volunteer/driver?map=true&jobId=${jobId}`);
        } catch (error) {
            console.error('Error accepting job:', error);
            await Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถรับงานได้ กรุณาลองใหม่อีกครั้ง',
                confirmButtonColor: '#1E7D55',
            });
        } finally {
            setIsAcceptingJob(false);
        }
    };

    const getRedemptionStatusInfo = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'PENDING':
                return { label: 'รอการอนุมัติ', color: 'bg-yellow-100 text-yellow-800', icon: '⏳' };
            case 'APPROVED':
                return { label: 'อนุมัติแล้ว', color: 'bg-green-100 text-green-800', icon: '' };
            case 'REJECTED':
                return { label: 'ถูกปฏิเสธ', color: 'bg-red-100 text-red-800', icon: '❌' };
            case 'COMPLETED':
                return { label: 'รับรางวัลแล้ว', color: 'bg-blue-100 text-blue-800', icon: '🎁' };
            default:
                return { label: status || 'ไม่ทราบ', color: 'bg-gray-100 text-gray-800', icon: '📋' };
        }
    };

    const renderRewardContent = () => {
        const data = redemptionData || notification?.data;
        const reward = data?.reward;
        const notifType = (notification?.originalType || notification?.type || '').toUpperCase();

        let status = data?.status || '';
        if (!status) {
            if (notifType.includes('SUBMITTED')) status = 'PENDING';
            else if (notifType.includes('APPROVED')) status = 'APPROVED';
            else if (notifType.includes('REJECTED')) status = 'REJECTED';
            else if (notifType.includes('COMPLETED')) status = 'COMPLETED';
        }
        const statusInfo = getRedemptionStatusInfo(status);

        return (
            <div className="flex flex-col items-center p-4">
                { }
                <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-4">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 12V22H4V12" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <rect x="2" y="7" width="20" height="5" rx="1" fill="#fef3c7" stroke="#d97706" strokeWidth="2" />
                        <path d="M12 22V7" stroke="#d97706" strokeWidth="2" strokeLinecap="round" />
                        <path d="M12 7c-2.5-4-6-4-6-1.5S9.5 7 12 7zm0 0c2.5-4 6-4 6-1.5S14.5 7 12 7z" fill="#fbbf24" stroke="#d97706" strokeWidth="1.5" strokeLinejoin="round" />
                    </svg>
                </div>

                <h3 className="text-lg font-bold text-text-primary mb-2">ข้อมูลการแลกของรางวัล</h3>

                { }
                <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium mb-5 ${statusInfo.color}`}>
                    <span>{statusInfo.icon}</span>
                    <span>{statusInfo.label}</span>
                </span>

                { }
                <div className="w-full bg-gray-50 rounded-xl p-4 space-y-3 mb-4">
                    { }
                    {reward?.imageUrl && (
                        <div className="flex justify-center mb-3">
                            <img
                                src={reward.imageUrl}
                                alt={reward.name}
                                className="w-24 h-24 rounded-xl object-cover border-2 border-gray-200"
                            />
                        </div>
                    )}
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-text-tertiary">ชื่อรางวัล:</span>
                        <span className="text-sm text-text-primary font-semibold">{reward?.name || notification?.title || 'ไม่ระบุ'}</span>
                    </div>
                    {(data?.pointsUsed || reward?.pointsCost) && (
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-text-tertiary">แต้มที่ใช้:</span>
                            <span className="text-sm text-text-primary font-semibold">{data?.pointsUsed || reward?.pointsCost} แต้ม</span>
                        </div>
                    )}
                    {data?.createdAt && (
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-text-tertiary">วันที่แลก:</span>
                            <span className="text-sm text-text-primary">
                                {new Date(data.createdAt).toLocaleDateString('th-TH', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                })}
                            </span>
                        </div>
                    )}
                    {(data?.rejectReason || data?.reason) && (
                        <div className="flex flex-col gap-1 pt-2 border-t border-gray-200">
                            <span className="text-sm font-medium text-red-600">เหตุผลที่ปฏิเสธ:</span>
                            <span className="text-sm text-text-primary">{data.rejectReason || data.reason}</span>
                        </div>
                    )}
                </div>

                { }
                <p className="text-sm text-text-tertiary text-center leading-relaxed mb-6">{notification?.message}</p>

                <button
                    onClick={onClose}
                    className="w-full bg-brand-primary hover:bg-btn-hover text-white font-bold py-3 px-6 rounded-full transition-colors"
                >
                    รับทราบ
                </button>
            </div>
        );
    };

    const renderChanges = (changes: any) => {
        if (!changes) return null;

        return (
            <div className="space-y-3 mb-6 bg-orange-50 p-4 rounded-xl border border-orange-200">
                <h4 className="text-sm font-bold text-orange-800 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                    สิ่งที่เทศบาลแก้ไข
                </h4>

                {changes.hospitalName && (
                    <div className="bg-white p-3 rounded-lg border border-orange-100 shadow-sm">
                        <p className="text-xs font-semibold text-gray-500 mb-1">โรงพยาบาล</p>
                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-red-500 line-through decoration-red-300">เดิม: {changes.hospitalName.from}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                                <span className="text-sm text-green-600 font-bold">ใหม่: {changes.hospitalName.to}</span>
                            </div>
                        </div>
                    </div>
                )}

                {changes.requestDate && (
                    <div className="bg-white p-3 rounded-lg border border-orange-100 shadow-sm">
                        <p className="text-xs font-semibold text-gray-500 mb-1">วันที่จอง</p>
                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-red-500 line-through decoration-red-300">เดิม: {changes.requestDate.from}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                                <span className="text-sm text-green-600 font-bold">ใหม่: {changes.requestDate.to}</span>
                            </div>
                        </div>
                    </div>
                )}

                {changes.bookingTime && (
                    <div className="bg-white p-3 rounded-lg border border-orange-100 shadow-sm">
                        <p className="text-xs font-semibold text-gray-500 mb-1">ช่วงเวลาที่จอง</p>
                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-red-500 line-through decoration-red-300">เดิม: {changes.bookingTime.from}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                                <span className="text-sm text-green-600 font-bold">ใหม่: {changes.bookingTime.to}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderContent = () => {
        if (isRewardNotification(notification)) {
            return renderRewardContent();
        }

        if (userRole === 'USERS') {
            return (
                <>
                    { }
                    <div className="bg-white pb-4 px-4">
                        <h3 className="text-lg font-bold text-text-primary mb-5">ข้อมูลการจอง</h3>

                        { }
                        <div className="flex flex-col items-center mb-4">
                            {user?.pictureUrl ? (
                                <img
                                    src={user.pictureUrl}
                                    alt={`${user.firstName || ''} ${user.lastName || ''}`}
                                    className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 mb-2"
                                />
                            ) : (
                                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-2">
                                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M16 16C18.9455 16 21.3333 13.6122 21.3333 10.6667C21.3333 7.72115 18.9455 5.33333 16 5.33333C13.0545 5.33333 10.6667 7.72115 10.6667 10.6667C10.6667 13.6122 13.0545 16 16 16ZM16 18.6667C12.4467 18.6667 5.33333 20.4489 5.33333 24V26.6667H26.6667V24C26.6667 20.4489 19.5533 18.6667 16 18.6667Z" fill="#6B7280" />
                                    </svg>
                                </div>
                            )}
                            <p className="text-base font-semibold text-text-primary">{`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'ประชาชน'}</p>
                        </div>

                        { }
                        {(notification?.originalType === 'QUEUE_EDITED' || String(notification?.type).toUpperCase() === 'QUEUE_EDITED') && notification.data?.changes ? (
                            renderChanges(notification.data.changes)
                        ) : (
                            <div className="space-y-2 mb-6">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-text-tertiary">ประเภทการจอง:</span>
                                    <span className="text-sm text-text-primary">{(queueData?.hasAppointment ?? notification.data.hasAppointment) ? 'มีใบนัด' : 'ไม่มีใบนัด'}</span>
                                </div>

                                <div className="text-sm text-text-primary font-medium">
                                    {queueData?.hospital?.name || queueData?.hospitalName || notification.data.hospital?.name || notification.data.hospitalName || ''}
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-text-tertiary">วันที่จอง:</span>
                                    <span className="text-sm text-text-primary">
                                        {(queueData?.requestDate || notification.data.requestDate)
                                            ? new Date(queueData?.requestDate || notification.data.requestDate).toLocaleDateString('th-TH', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric',
                                            })
                                            : '24 ธันวาคม 2568'}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-text-tertiary">ช่วงเวลาที่จอง:</span>
                                    <span className="text-sm text-text-primary">{queueData?.bookingTime || notification.data.bookingTime || '04.00 น. - 06.00 น.'}</span>
                                </div>
                            </div>
                        )}

                        { }
                        {!isLoadingQueue && queueStatus === 'APPROVED' && (
                            <div className="flex gap-3">
                                <button
                                    onClick={handleCancel}
                                    disabled={isConfirming || isCancelling}
                                    className="flex-1 bg-fuan-dark hover:bg-fuan-dark/90 text-white font-bold py-3 px-6 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isCancelling ? 'กำลังยกเลิก...' : 'ยกเลิก'}
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    disabled={isConfirming || isCancelling}
                                    className="flex-1 bg-brand-primary hover:bg-btn-hover text-white font-bold py-3 px-6 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isConfirming ? 'กำลังยืนยัน...' : 'ยืนยันการแก้ไข'}
                                </button>
                            </div>
                        )}

                        { }
                        {(() => {
                            const job = (jobData?.vlt ? jobData : notification.data?.job) || jobData;
                            const volunteer = job?.vlt;

                            if (!volunteer || (!volunteer.firstName && !volunteer.lastName && !volunteer.displayName)) {
                                return null;
                            }

                            const volunteerName = volunteer.displayName ||
                                `${volunteer.firstName || ''} ${volunteer.lastName || ''}`.trim();

                            return (
                                <>
                                    { }
                                    <div className="my-6 border-t border-brand-primary"></div>

                                    <h3 className="text-lg font-bold text-text-primary mb-4">เจ้าหน้าที่รถที่รับผิดชอบ</h3>

                                    <div className="flex items-center gap-4">
                                        {volunteer.pictureUrl ? (
                                            <img
                                                src={volunteer.pictureUrl}
                                                alt={volunteerName}
                                                className="w-20 h-20 rounded-full object-cover border-4 border-gray-200"
                                            />
                                        ) : (
                                            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                                                <svg width="40" height="40" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M16 16C18.9455 16 21.3333 13.6122 21.3333 10.6667C21.3333 7.72115 18.9455 5.33333 16 5.33333C13.0545 5.33333 10.6667 7.72115 10.6667 10.6667C10.6667 13.6122 13.0545 16 16 16ZM16 18.6667C12.4467 18.6667 5.33333 20.4489 5.33333 24V26.6667H26.6667V24C26.6667 20.4489 19.5533 18.6667 16 18.6667Z" fill="#6B7280" />
                                                </svg>
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-bold text-text-primary text-base">
                                                ชื่อ {volunteerName}
                                            </p>
                                            <p className="text-text-tertiary text-sm">เจ้าหน้าที่รถ</p>
                                            {volunteer.phone && (
                                                <button
                                                    onClick={async () => {
                                                        const result = await Swal.fire({
                                                            title: 'โทรหาเจ้าหน้าที่รถ?',
                                                            text: `ต้องการโทรหา ${volunteer.phone} หรือไม่?`,
                                                            icon: 'question',
                                                            showCancelButton: true,
                                                            confirmButtonColor: '#1E7D55',
                                                            cancelButtonColor: '#6B7280',
                                                            confirmButtonText: 'โทร',
                                                            cancelButtonText: 'ยกเลิก',
                                                        });
                                                        if (result.isConfirmed) {
                                                            window.location.href = `tel:${volunteer.phone}`;
                                                        }
                                                    }}
                                                    className="flex items-center gap-1.5 mt-1 text-text-secondary hover:text-brand-primary transition-colors"
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                                    </svg>
                                                    <span className="text-sm underline">{volunteer.phone}</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </>
            );
        } else if (userRole === 'DRIVE') {
            const patient = queueData?.user || notification.data.user;
            const queue = queueData || notification.data;
            const equipmentList = queue?.requiredEquipment ? queue.requiredEquipment.split(',').map((item: string) => item.trim()) : [];

            return (
                <>
                    <h3 className="text-xl font-bold text-text-primary text-center mb-4">งานที่ได้รับมอบหมาย</h3>

                    <div className="bg-white rounded-3xl border-2 border-[#1E7D55] p-6 mb-6 shadow-sm">

                        { }
                        <div className="flex flex-col items-center mb-6">
                            <h4 className="text-xl font-bold text-[#1E7D55] mb-4">ข้อมูลประชาชน</h4>

                            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-3 overflow-hidden border-4 border-white shadow-sm">
                                {patient?.pictureUrl ? (
                                    <img
                                        src={patient.pictureUrl}
                                        alt={patient.firstName + ' ' + patient.lastName}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-primary">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="12" cy="7" r="4"></circle>
                                    </svg>
                                )}
                            </div>
                            <p className="text-lg font-bold text-text-primary mb-2">
                                {(patient?.displayName) || `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim() || 'ไม่ระบุชื่อ'}
                            </p>

                            { }
                            {patient?.mobilityStatus && (
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="font-medium text-text-primary">สถานะประชาชน :</span>
                                    <span className={`px-4 py-1 rounded-full text-white text-sm font-medium ${patient.mobilityStatus === 'WALKING' ? 'bg-green-500' :
                                        patient.mobilityStatus === 'WHEELCHAIR' ? 'bg-orange-400' :
                                            patient.mobilityStatus === 'BEDRIDDEN' ? 'bg-red-500' : 'bg-gray-500'
                                        }`}>
                                        {patient.mobilityStatus === 'WALKING' ? 'ทั่วไป' :
                                            patient.mobilityStatus === 'WHEELCHAIR' ? 'ต้องดูแลเพิ่ม' :
                                                patient.mobilityStatus === 'BEDRIDDEN' ? 'ต้องดูแลใกล้ชิด' :
                                                    patient.mobilityStatus}
                                    </span>
                                </div>
                            )}
                        </div>

                        { }
                        <div className="space-y-4 text-text-tertiary px-2">
                            <div className="flex flex-col sm:flex-row sm:gap-2">
                                <span className="font-medium min-w-[120px]">ประเภทการจอง : {queue?.hasAppointment ? 'มีใบนัด' : 'ไม่มีใบนัด'} </span>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:gap-2">
                                <span className="font-medium min-w-[120px]">โรงพยาบาล : {queue?.hospital?.name || queue?.hospitalName || 'ไม่ระบุ'}</span>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:gap-2">
                                <span className="font-medium min-w-[120px]">วันที่จอง : {queue?.requestDate
                                    ? new Date(queue.requestDate).toLocaleDateString('th-TH', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                    })
                                    : 'ไม่ระบุ'}
                                </span>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:gap-2">
                                <span className="font-medium min-w-[120px]">ช่วงเวลาที่จอง : {queue?.bookingTime || 'ไม่ระบุ'}</span>
                            </div>

                            { }
                            <div className="flex flex-col gap-2">
                                <span className="font-medium">อุปกรณ์ที่ต้องการใช้ :</span>
                                {equipmentList.length > 0 ? (
                                    <ul className="list-disc pl-8 space-y-1">
                                        {equipmentList.map((item: string, index: number) => (
                                            <li key={index}>{item}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <span className="pl-4 text-text-tertiary">- ไม่มี -</span>
                                )}
                            </div>
                        </div>
                    </div>

                    { }
                    <div className="mt-4">
                        {notification.data?.status === 'ASSIGNED' && (
                            <button
                                onClick={handleAcceptJob}
                                disabled={isAcceptingJob}
                                className="w-full bg-brand-primary hover:bg-btn-hover text-white font-bold py-3 px-6 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                            >
                                {isAcceptingJob ? 'กำลังรับงาน...' : 'รับงาน'}
                            </button>
                        )}
                    </div>
                </>
            );
        } else if (userRole === 'CAREGIVER') {
            const patient = queueData?.user || notification.data?.user;
            const queue = queueData || notification.data;

            const job = jobData || (Array.isArray(notification.data?.job)
                ? notification.data.job[0]
                : notification.data?.job);
            const volunteer = job?.vlt;
            const careu = job?.careu;

            return (
                <>
                    { }
                    <div className="bg-white p-6">
                        <h3 className="text-lg font-semibold text-text-primary mb-4">ข้อมูลการจอง</h3>

                        { }
                        <div className="flex flex-col items-center mb-4">
                            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-3 overflow-hidden">
                                {(patient?.pictureUrl || notification.data?.patientPictureUrl) ? (
                                    <img
                                        src={patient?.pictureUrl || notification.data?.patientPictureUrl}
                                        alt={`${patient?.firstName || ''} ${patient?.lastName || ''}`.trim() || notification.data?.patientName}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <svg width="40" height="40" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M16 16C18.9455 16 21.3333 13.6122 21.3333 10.6667C21.3333 7.72115 18.9455 5.33333 16 5.33333C13.0545 5.33333 10.6667 7.72115 10.6667 10.6667C10.6667 13.6122 13.0545 16 16 16ZM16 18.6667C12.4467 18.6667 5.33333 20.4489 5.33333 24V26.6667H26.6667V24C26.6667 20.4489 19.5533 18.6667 16 18.6667Z" fill="#6B7280" />
                                    </svg>
                                )}
                            </div>
                            <p className="font-semibold text-text-primary">
                                {`${patient?.firstName || ''} ${patient?.lastName || ''}`.trim() || notification.data?.patientName || 'ประชาชน'}
                            </p>
                        </div>

                        { }
                        {(notification?.originalType === 'QUEUE_EDITED' || String(notification?.type).toUpperCase() === 'QUEUE_EDITED') && notification.data?.changes ? (
                            renderChanges(notification.data.changes)
                        ) : (
                            <div className="space-y-2 text-sm text-text-tertiary">
                                <p>
                                    <span className="font-medium">ประเภทการจอง :</span>{' '}
                                    {(queue?.hasAppointment ?? notification.data?.hasAppointment) ? 'มีใบนัด' : 'ไม่มีใับนัด'}
                                </p>
                                <p>
                                    <span className="font-medium"></span>{' '}
                                    {queue?.hospital?.name || queue?.hospitalName || notification.data?.hospital?.name || notification.data?.hospitalName || 'ไม่ระบุ'}
                                </p>
                                <p>
                                    <span className="font-medium">วันที่จอง :</span>{' '}
                                    {(queue?.requestDate || notification.data?.requestDate)
                                        ? new Date(queue?.requestDate || notification.data?.requestDate).toLocaleDateString('th-TH', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric',
                                        })
                                        : 'ไม่ระบุ'}
                                </p>
                                <p>
                                    <span className="font-medium">ช่วงเวลาที่จอง :</span>{' '}
                                    {queue?.bookingTime || notification.data?.bookingTime || 'ไม่ระบุ'}
                                </p>
                            </div>
                        )}


                        { }
                        {!isLoadingQueue && queueStatus === 'APPROVED' && (
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={handleCancel}
                                    disabled={isConfirming || isCancelling}
                                    className="flex-1 bg-fuan-dark hover:bg-fuan-dark/90 text-white font-bold py-3 px-6 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isCancelling ? 'กำลังยกเลิก...' : 'ยกเลิก'}
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    disabled={isConfirming || isCancelling}
                                    className="flex-1 bg-brand-primary hover:bg-btn-hover text-white font-bold py-3 px-6 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isConfirming ? 'กำลังยืนยัน...' : 'ยืนยันการแก้ไข'}
                                </button>
                            </div>
                        )}

                        { }
                        {(volunteer || careu) && (
                            <>
                                <div className="my-6 border-t border-brand-primary"></div>
                                <h3 className="text-lg font-semibold text-text-primary mb-4 text-center">เจ้าหน้าที่ที่รับผิดชอบ</h3>
                                <div className="flex flex-col gap-6">
                                    {volunteer && (
                                        <div className="flex flex-col items-center">
                                            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-3 overflow-hidden">
                                                {volunteer.pictureUrl ? (
                                                    <img
                                                        src={volunteer.pictureUrl}
                                                        alt={`${volunteer.firstName || ''} ${volunteer.lastName || ''}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M16 16C18.9455 16 21.3333 13.6122 21.3333 10.6667C21.3333 7.72115 18.9455 5.33333 16 5.33333C13.0545 5.33333 10.6667 7.72115 10.6667 10.6667C10.6667 13.6122 13.0545 16 16 16ZM16 18.6667C12.4467 18.6667 5.33333 20.4489 5.33333 24V26.6667H26.6667V24C26.6667 20.4489 19.5533 18.6667 16 18.6667Z" fill="#6B7280" />
                                                    </svg>
                                                )}
                                            </div>
                                            <p className="font-medium text-text-primary text-sm">ชื่อ {`${volunteer.firstName || ''} ${volunteer.lastName || ''}`.trim()}</p>
                                            <p className="text-text-tertiary text-xs">พนักงานขับรถ (จิตอาสา)</p>
                                            {volunteer.phone && (
                                                <button
                                                    onClick={async () => {
                                                        const result = await Swal.fire({
                                                            title: 'โทรหาจิตอาสา?',
                                                            text: `ต้องการโทรหา ${volunteer.phone} หรือไม่?`,
                                                            icon: 'question',
                                                            showCancelButton: true,
                                                            confirmButtonColor: '#1E7D55',
                                                            cancelButtonColor: '#6B7280',
                                                            confirmButtonText: 'โทร',
                                                            cancelButtonText: 'ยกเลิก',
                                                        });
                                                        if (result.isConfirmed) {
                                                            window.location.href = `tel:${volunteer.phone}`;
                                                        }
                                                    }}
                                                    className="flex items-center gap-1.5 mt-1 text-text-secondary hover:text-brand-primary transition-colors"
                                                >
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                                    </svg>
                                                    <span className="text-xs underline">{volunteer.phone}</span>
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {careu && (
                                        <div className="flex flex-col items-center">
                                            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-3 overflow-hidden">
                                                {careu.pictureUrl ? (
                                                    <img
                                                        src={careu.pictureUrl}
                                                        alt={`${careu.firstName || ''} ${careu.lastName || ''}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M16 16C18.9455 16 21.3333 13.6122 21.3333 10.6667C21.3333 7.72115 18.9455 5.33333 16 5.33333C13.0545 5.33333 10.6667 7.72115 10.6667 10.6667C10.6667 13.6122 13.0545 16 16 16ZM16 18.6667C12.4467 18.6667 5.33333 20.4489 5.33333 24V26.6667H26.6667V24C26.6667 20.4489 19.5533 18.6667 16 18.6667Z" fill="#6B7280" />
                                                    </svg>
                                                )}
                                            </div>
                                            <p className="font-medium text-text-primary text-sm">ชื่อ {`${careu.firstName || ''} ${careu.lastName || ''}`.trim()}</p>
                                            <p className="text-text-tertiary text-xs">จิตอาสาแคร์ยู</p>
                                            {careu.phone && (
                                                <button
                                                    onClick={async () => {
                                                        const result = await Swal.fire({
                                                            title: 'โทรหาจิตอาสา?',
                                                            text: `ต้องการโทรหา ${careu.phone} หรือไม่?`,
                                                            icon: 'question',
                                                            showCancelButton: true,
                                                            confirmButtonColor: '#1E7D55',
                                                            cancelButtonColor: '#6B7280',
                                                            confirmButtonText: 'โทร',
                                                            cancelButtonText: 'ยกเลิก',
                                                        });
                                                        if (result.isConfirmed) {
                                                            window.location.href = `tel:${careu.phone}`;
                                                        }
                                                    }}
                                                    className="flex items-center gap-1.5 mt-1 text-text-secondary hover:text-brand-primary transition-colors"
                                                >
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                                    </svg>
                                                    <span className="text-xs underline">{careu.phone}</span>
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </>
            );
        }

        return (
            <div className="flex flex-col items-center p-4 text-center">
                <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mb-4">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1E7D55" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                </div>
                <h3 className="text-lg font-bold text-text-primary mb-2">{notification.title}</h3>
                <p className="text-text-tertiary leading-relaxed">{notification.message}</p>

                <button
                    onClick={onClose}
                    className="mt-8 w-full bg-brand-primary hover:bg-btn-hover text-white font-bold py-3 px-6 rounded-full transition-colors"
                >
                    รับทราบ
                </button>
            </div>
        );
    };


    if (!isOpen || !notification) return null;

    return (
        <>
            { }
            <div
                className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center p-3"
                style={{ overscrollBehavior: 'contain', touchAction: 'none' }}
                onClick={onClose}
            >
                { }
                <div
                    className="bg-white rounded-2xl w-full max-w-sm max-h-[85vh] shadow-2xl animate-scale-in relative flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    { }
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-4 p-2 hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-700 transition-all z-20"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>

                    { }
                    <div className="overflow-y-auto flex-1 p-4 pt-8 scrollbar-hide" style={{ overscrollBehavior: 'contain' }}>
                        {renderContent()}
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes scale-in {
                    from {
                        opacity: 0;
                        transform: scale(0.9);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                .animate-scale-in {
                    animation: scale-in 0.2s ease-out;
                }
                /* Hide scrollbar for Chrome, Safari and Opera */
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                /* Hide scrollbar for IE, Edge and Firefox */
                .scrollbar-hide {
                    -ms-overflow-style: none;  /* IE and Edge */
                    scrollbar-width: none;  /* Firefox */
                }
            `}</style>
        </>
    );
}
