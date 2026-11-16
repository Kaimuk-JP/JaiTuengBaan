'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getApiUrl } from '@/lib/api';
import type { NamedPerson } from '@/types/common';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import LayoutWithSidebar from '@/components/shared/LayoutWithSidebar';
import ElderlySidebar from '@/components/elderly/sidebar/ElderlySidebar';
import ElderlyHeader from '@/components/elderly/header/ElderlyHeader';
import Image from 'next/image';
import { getImageUrl } from '@/utils/image';
import Swal from '@/lib/swal';
import { useSocket } from '@/contexts/SocketContext';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import { BookingDetailModal } from '@/components/caregiver/booking/BookingDetailModal';
interface Queue {
    id: number;
    userId: number;
    hospital?: {
        name: string;
    };
    requestDate: string;
    bookingTime: string | null;
    status: string;
    severityLevel: string;
    hasAppointment: boolean;
    appointmentImage: string | null;
    requiredEquipment?: string;
    wantCareU?: boolean;
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
        patientDroppedOffAt?: string | null;
        completedAt?: string | null;
        returnEvidenceUrl?: string | null;
        vlt?: {
            id: number;
            firstName?: string;
            lastName?: string;
            displayName?: string;
            phone: string;
            pictureUrl?: string;
        };
        careu?: {
            id: number;
            firstName?: string;
            lastName?: string;
            displayName?: string;
            phone: string;
            pictureUrl?: string;
        };
        vehicle?: {
            id: number;
            licensePlate: string;
            brand: string;
            model: string;
            color: string;
        };
    };
}

function ElderlyHistoryPage() {
    const router = useRouter();
    const [queues, setQueues] = useState<Queue[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [selectedQueue, setSelectedQueue] = useState<Queue | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [searchDate, setSearchDate] = useState('');
    const ITEMS_PER_PAGE = 10;
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const getStatusLabel = (queueStatus: string, jobStatus?: string) => {
        if (queueStatus === 'CONFIRMED' && jobStatus) {
            switch (jobStatus) {
                case 'OPEN': return 'รออาสาสมัครรับงาน';
                case 'ASSIGNED': return 'มอบหมายแล้ว';
                case 'ACCEPTED': return 'จิตอาสารับงานแล้ว';
                case 'PICKING_UP': return 'กำลังเดินทางไปรับ';
                case 'IN_TRANSIT': return 'กำลังเดินทางไปโรงพยาบาล';
                case 'RETURN_HOME': return 'ส่งถึงโรงพยาบาลแล้ว / กำลังพากลับบ้าน';
                case 'RETURN_OFFICE': return 'ส่งถึงบ้านแล้ว (อาสากำลังกลับ)';
                case 'COMPLETED': return 'บริการเสร็จสิ้น';
                case 'CANCELLED': return 'ยกเลิกโดยจิตอาสา';
                case 'REJECTED': return 'จิตอาสาปฏิเสธงาน';
            }
        }

        switch (queueStatus) {
            case 'PENDING_MUNICIPAL': return 'รอตรวจสอบ';
            case 'APPROVED': return 'รอประชาชนยืนยัน';
            case 'CONFIRMED': return 'ยืนยันแล้ว';
            case 'PENDING_VOLUNTEER': return 'รออาสาสมัคร';
            case 'ASSIGNED': return 'มอบหมายแล้ว';
            case 'IN_PROGRESS': return 'กำลังดำเนินการ';
            case 'COMPLETED': return 'เสร็จสิ้น';
            case 'CANCELLED': return 'ยกเลิก';
            case 'CANCELLED_BY_USER': return 'ยกเลิกโดยผู้ใช้';
            case 'CANCELLED_BY_MUNICIPAL': return 'ยกเลิกโดยเทศบาล';
            case 'REJECTED': return 'ปฏิเสธ';
            default: return queueStatus;
        }
    };

    const getStatusColor = (queueStatus: string, jobStatus?: string) => {
        const badgeClasses = 'px-2x py-0.5 rounded-square';

        if (queueStatus === 'CONFIRMED' && jobStatus) {
            switch (jobStatus) {
                case 'OPEN':
                case 'ASSIGNED': return `${badgeClasses} bg-support-warning text-white`;
                case 'ACCEPTED':
                case 'PICKING_UP':
                case 'IN_TRANSIT':
                case 'RETURN_HOME':
                case 'RETURN_OFFICE':
                case 'COMPLETED': return 'text-brand-primary font-bold';
                case 'CANCELLED':
                case 'REJECTED': return `${badgeClasses} bg-support-error text-white`;
            }
        }

        switch (queueStatus) {
            case 'PENDING_MUNICIPAL': return `${badgeClasses} bg-support-warning text-white`;
            case 'APPROVED': return `${badgeClasses} bg-support-success text-white`;
            case 'CONFIRMED': return `${badgeClasses} bg-brand-primary text-white`;
            case 'REJECTED':
            case 'CANCELLED_BY_USER':
            case 'CANCELLED_BY_MUNICIPAL':
            case 'CANCELLED': return `${badgeClasses} bg-support-error text-white`;
            default: return `${badgeClasses} bg-gray-200 text-gray-700`;
        }
    };

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const userResponse = await fetch(`${getApiUrl()}/auth/profile`, {
                    credentials: 'include',
                });

                if (!userResponse.ok) {
                    throw new Error('ไม่พบข้อมูลผู้ใช้ กรุณาล็อกอินใหม่');
                }

                const userData = await userResponse.json();
                setUser(userData);
            } catch (error: any) {
                console.error('Error fetching user:', error);
            }
        };

        fetchUser();
    }, [getApiUrl()]);

    const fetchQueues = useCallback(async (pageNum: number, isInitial = false) => {
        if (!user) return;

        try {
            if (isInitial) {
                setLoading(true);
            } else {
                setLoadingMore(true);
            }

            const response = await fetch(
                `${getApiUrl()}/queues/user/${user.id}?page=${pageNum}&limit=${ITEMS_PER_PAGE}`,
                {
                    credentials: 'include',
                }
            );

            if (!response.ok) {
                throw new Error('ไม่สามารถดึงข้อมูลประวัติได้');
            }

            const data = await response.json();

            const allQueues = Array.isArray(data) ? data : data.queues || [];

            const targetQueues = allQueues;

            if (targetQueues.length < ITEMS_PER_PAGE) {
                setHasMore(false);
            }

            if (isInitial) {
                setQueues(targetQueues);
            } else {
                setQueues(prev => [...prev, ...targetQueues]);
            }
        } catch (error: any) {
            console.error('Error fetching queues:', error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchQueues(1, true);
        }
    }, [user, fetchQueues]);

    const { socket } = useSocket();
    useEffect(() => {
        if (!socket || !user) return;

        const handleRealtimeUpdate = () => {
            setPage(1);
            setHasMore(true);
            fetchQueues(1, true);
        };

        socket.on('notification', handleRealtimeUpdate);

        return () => {
            socket.off('notification', handleRealtimeUpdate);
        };
    }, [socket, user, fetchQueues]);

    useEffect(() => {
        const handleScroll = () => {
            if (loadingMore || !hasMore) return;

            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollHeight = document.documentElement.scrollHeight;
            const clientHeight = window.innerHeight;

            if (scrollTop + clientHeight >= scrollHeight - 200) {
                setPage(prev => prev + 1);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [loadingMore, hasMore]);

    useEffect(() => {
        if (page > 1) {
            fetchQueues(page);
        }
    }, [page, fetchQueues]);

    useEffect(() => {
        if (selectedQueue) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [selectedQueue]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatTime = (timeString: string | null, dateString: string) => {
        if (timeString) return timeString.includes('น.') ? timeString : `${timeString} น.`;
        return new Date(dateString).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
    };

    return (
        <LayoutWithSidebar role="USERS" showSidebar={false} user={user}>
            <div className="min-h-screen bg-white relative">
                { }
                <ElderlySidebar user={user} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

                { }
                <ElderlyHeader user={user} variant="large" onToggleSidebar={() => setSidebarOpen(true)} />

                <div className="container mx-auto px-3x py-3x max-w-lg">
                    <h2 className="typo-h3 text-brand-primary text-center mb-3x">ประวัติการจอง</h2>

                    { }
                    <div className="mb-3x">
                        <div className="relative">
                            <input
                                type="text"
                                value={searchDate}
                                onChange={(e) => setSearchDate(e.target.value)}
                                placeholder="ค้นหาวันที่ เช่น วันที่ 4 มกราคม, 4 มกราคม"
                                className="w-full px-3x py-2x border border-border-neutral rounded-square text-base text-text-primary focus:border-brand-primary focus:outline-none"
                            />
                            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <path d="m21 21-4.3-4.3"></path>
                                </svg>
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="p-4x text-center typo-body text-text-primary">กำลังโหลด...</div>
                    ) : queues.length === 0 ? (
                        <div className="p-6x text-center typo-body text-text-tertiary">
                            <p>ไม่มีประวัติการจอง</p>
                        </div>
                    ) : (() => {
                        const normalize = (str: string) => str.toLowerCase().replace(/\s+/g, '');

                        const extractDayNumber = (dateStr: string) => {
                            const date = new Date(dateStr);
                            return date.getDate().toString();
                        };

                        const filteredQueues = searchDate.trim()
                            ? queues.filter((item) => {
                                const formattedDate = formatDate(item.requestDate);
                                const normalizedDate = normalize(formattedDate);
                                const searchStr = normalize(searchDate);
                                const dayNumber = extractDayNumber(item.requestDate);

                                return dayNumber === searchStr.replace(/\D/g, '') ||
                                    normalizedDate.includes(searchStr) ||
                                    formattedDate.includes(searchDate.trim());
                            })
                            : queues;

                        return filteredQueues.length === 0 ? (
                            <div className="p-6x text-center typo-body text-text-tertiary">
                                <p>ไม่พบรายการที่ตรงกับ "{searchDate}"</p>
                            </div>
                        ) : (
                            <div className="space-y-2x">
                                {filteredQueues.map((item) => (
                                    <div
                                        key={item.id}
                                        onClick={() => setSelectedQueue(item)}
                                        className="bg-white rounded-square-hard shadow-smooth-low border border-border-neutral p-3x flex items-center justify-between hover:shadow-smooth-medium transition-shadow cursor-pointer"
                                    >
                                        <div className="space-y-1x flex-1">
                                            { }
                                            <div className="flex items-start gap-2x">
                                                <div className="w-5 flex-shrink-0 mt-0.5">
                                                    <svg width="15" height="16" viewBox="0 0 15 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M2.08333 15.8333C1.50111 15.8333 1.00833 15.6317 0.605 15.2283C0.201667 14.825 0 14.3322 0 13.75V12.8525C0 12.4383 0.1475 12.0838 0.4425 11.7888C0.7375 11.4938 1.09215 11.3463 1.50646 11.3463H2.5V1.50646C2.5 1.09215 2.6475 0.7375 2.9425 0.4425C3.2375 0.1475 3.59215 0 4.00646 0H12.6602C13.0745 0 13.4292 0.1475 13.7242 0.4425C14.0192 0.7375 14.1667 1.09215 14.1667 1.50646V13.75C14.1667 14.3322 13.965 14.825 13.5617 15.2283C13.1583 15.6317 12.6656 15.8333 12.0833 15.8333H2.08333ZM12.0833 14.5833C12.3194 14.5833 12.5174 14.5035 12.6771 14.3438C12.8368 14.184 12.9167 13.9861 12.9167 13.75V1.50646C12.9167 1.4316 12.8926 1.37014 12.8446 1.32208C12.7965 1.27403 12.7351 1.25 12.6602 1.25H4.00646C3.9316 1.25 3.87014 1.27403 3.82208 1.32208C3.77403 1.37014 3.75 1.4316 3.75 1.50646V11.3463H9.74354C10.1578 11.3463 10.5125 11.4938 10.8075 11.7888C11.1025 12.0838 11.25 12.4383 11.25 12.8525V13.75C11.25 13.9861 11.3299 14.184 11.4896 14.3438C11.6493 14.5035 11.8472 14.5833 12.0833 14.5833ZM5.36854 5.16021C5.19146 5.16021 5.04306 5.10028 4.92333 4.98042C4.80347 4.86056 4.74354 4.71208 4.74354 4.535C4.74354 4.35778 4.80347 4.20938 4.92333 4.08979C5.04306 3.97007 5.19146 3.91021 5.36854 3.91021H11.2981C11.4752 3.91021 11.6236 3.97014 11.7433 4.09C11.8632 4.20986 11.9231 4.3584 11.9231 4.53563C11.9231 4.71271 11.8632 4.86111 11.7433 4.98083C11.6236 5.10042 11.4752 5.16021 11.2981 5.16021H5.36854ZM5.36854 7.56417C5.19146 7.56417 5.04306 7.50424 4.92333 7.38438C4.80347 7.26451 4.74354 7.11597 4.74354 6.93875C4.74354 6.76167 4.80347 6.61326 4.92333 6.49354C5.04306 6.37396 5.19146 6.31417 5.36854 6.31417H11.2981C11.4752 6.31417 11.6236 6.3741 11.7433 6.49396C11.8632 6.61368 11.9231 6.76215 11.9231 6.93938C11.9231 7.1166 11.8632 7.265 11.7433 7.38458C11.6236 7.50431 11.4752 7.56417 11.2981 7.56417H5.36854ZM2.08333 14.5833H10V12.8525C10 12.7778 9.97597 12.7164 9.92792 12.6683C9.87986 12.6201 9.8184 12.596 9.74354 12.596H1.50646C1.4316 12.596 1.37014 12.6201 1.32208 12.6683C1.27403 12.7164 1.25 12.7778 1.25 12.8525V13.75C1.25 13.9861 1.32986 14.184 1.48958 14.3438C1.64931 14.5035 1.84722 14.5833 2.08333 14.5833ZM2.08333 14.5833H1.25H10H2.08333Z" fill="var(--color-brand-primary)" />
                                                    </svg>
                                                </div>
                                                <span className="typo-menu text-text-primary font-medium">
                                                    {item.hasAppointment ? 'มีใบนัด' : 'ไม่มีใบนัด'}
                                                </span>
                                            </div>

                                            { }
                                            <div className="flex items-start gap-2x">
                                                <div className="w-5 flex-shrink-0 mt-0.5">
                                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M9.99992 6.66667V9.33333M11.3333 16V14C11.3333 13.6464 11.1928 13.3072 10.9427 13.0572C10.6927 12.8071 10.3535 12.6667 9.99992 12.6667C9.6463 12.6667 9.30716 12.8071 9.05711 13.0572C8.80706 13.3072 8.66659 13.6464 8.66659 14V16M11.3333 8H8.66659M13.9999 9.33333H15.3333C15.6869 9.33333 16.026 9.47381 16.2761 9.72386C16.5261 9.97391 16.6666 10.313 16.6666 10.6667V14.6667C16.6666 15.0203 16.5261 15.3594 16.2761 15.6095C16.026 15.8595 15.6869 16 15.3333 16H4.66659C4.31296 16 3.97382 15.8595 3.72378 15.6095C3.47373 15.3594 3.33325 15.0203 3.33325 14.6667V8.66667C3.33325 8.31304 3.47373 7.97391 3.72378 7.72386C3.97382 7.47381 4.31296 7.33333 4.66659 7.33333H5.99992M13.9999 16V5.33333C13.9999 4.97971 13.8594 4.64057 13.6094 4.39052C13.3593 4.14048 13.0202 4 12.6666 4H7.33325C6.97963 4 6.64049 4.14048 6.39044 4.39052C6.14039 4.64057 5.99992 4.97971 5.99992 5.33333V16" stroke="var(--color-brand-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                </div>
                                                <span className="typo-menu text-text-primary">{item.hospital?.name || 'ไม่ระบุโรงพยาบาล'}</span>
                                            </div>

                                            { }
                                            <div className="flex items-start gap-2x">
                                                <div className="w-5 flex-shrink-0 mt-0.5">
                                                    <svg width="16" height="17" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M1.25 5.3525H12.9167V3.26917C12.9167 3.205 12.8899 3.14625 12.8365 3.09292C12.7831 3.03944 12.7244 3.01271 12.6602 3.01271H1.50646C1.44229 3.01271 1.38354 3.03944 1.33021 3.09292C1.27674 3.14625 1.25 3.205 1.25 3.26917V5.3525ZM1.50646 15.9294C1.08549 15.9294 0.729167 15.7835 0.4375 15.4919C0.145833 15.2002 0 14.8439 0 14.4229V3.26917C0 2.84819 0.145833 2.49187 0.4375 2.20021C0.729167 1.90854 1.08549 1.76271 1.50646 1.76271H2.66021V0.640834C2.66021 0.458195 2.72139 0.305694 2.84375 0.183333C2.96611 0.0611109 3.11861 0 3.30125 0C3.48403 0 3.63653 0.0611109 3.75875 0.183333C3.88111 0.305694 3.94229 0.458195 3.94229 0.640834V1.76271H10.2565V0.625C10.2565 0.447639 10.3163 0.299097 10.4358 0.179375C10.5556 0.0597914 10.7041 0 10.8815 0C11.0588 0 11.2073 0.0597914 11.3269 0.179375C11.4466 0.299097 11.5065 0.447639 11.5065 0.625V1.76271H12.6602C13.0812 1.76271 13.4375 1.90854 13.7292 2.20021C14.0208 2.49187 14.1667 2.84819 14.1667 3.26917V7.19708C14.1667 7.37444 14.1068 7.52292 13.9871 7.6425C13.8675 7.76222 13.719 7.82208 13.5417 7.82208C13.3643 7.82208 13.2158 7.76222 13.0963 7.6425C12.9765 7.52292 12.9167 7.37444 12.9167 7.19708V6.6025H1.25V14.4229C1.25 14.4871 1.27674 14.5458 1.33021 14.5992C1.38354 14.6526 1.44229 14.6794 1.50646 14.6794H6.60417C6.78153 14.6794 6.93007 14.7392 7.04979 14.859C7.16938 14.9785 7.22917 15.127 7.22917 15.3044C7.22917 15.4817 7.16938 15.6302 7.04979 15.7498C6.93007 15.8695 6.78153 15.9294 6.60417 15.9294H1.50646ZM12.2435 16.7627C11.203 16.7627 10.3178 16.3978 9.58813 15.6681C8.8584 14.9384 8.49354 14.0533 8.49354 13.0127C8.49354 11.9722 8.8584 11.087 9.58813 10.3573C10.3178 9.62757 11.203 9.26271 12.2435 9.26271C13.2842 9.26271 14.1694 9.62757 14.899 10.3573C15.6287 11.087 15.9935 11.9722 15.9935 13.0127C15.9935 14.0533 15.6287 14.9384 14.899 15.6681C14.1694 16.3978 13.2842 16.7627 12.2435 16.7627ZM12.6123 12.8621V10.9294C12.6123 10.829 12.5759 10.7424 12.5031 10.6698C12.4305 10.5972 12.344 10.5608 12.2435 10.5608C12.1431 10.5608 12.0566 10.5972 11.984 10.6698C11.9113 10.7424 11.875 10.829 11.875 10.9294V12.8492C11.875 12.9496 11.8932 13.0452 11.9296 13.136C11.9658 13.2269 12.023 13.3113 12.101 13.3894L13.3719 14.6602C13.4445 14.7328 13.5297 14.7705 13.6275 14.7731C13.7251 14.7758 13.813 14.7381 13.891 14.6602C13.9691 14.5822 14.0081 14.4956 14.0081 14.4006C14.0081 14.3055 13.9691 14.2189 13.891 14.1408L12.6123 12.8621Z" fill="var(--color-brand-primary)" />
                                                    </svg>
                                                </div>
                                                <span className="typo-menu text-gray-800 font-medium">วันที่ {new Date(item.requestDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                            </div>

                                            <div className="flex items-center gap-1.5 mt-1">
                                                <span className="typo-menu text-text-secondary text-xs">สถานะการจอง :</span>
                                                {(() => {
                                                    const queueStatus = item.status;
                                                    const jobStatus = item.job?.status;

                                                    let label = '';
                                                    let bgColor = '';
                                                    let dotColor = '';

                                                    if (queueStatus === 'CONFIRMED' && jobStatus) {
                                                        switch (jobStatus) {
                                                            case 'OPEN':
                                                                label = 'รออาสาสมัครรับงาน';
                                                                bgColor = 'bg-amber-100 text-amber-700';
                                                                dotColor = 'bg-amber-500';
                                                                break;
                                                            case 'ASSIGNED':
                                                                label = 'มอบหมายแล้ว';
                                                                bgColor = 'bg-blue-100 text-blue-700';
                                                                dotColor = 'bg-blue-500';
                                                                break;
                                                            case 'ACCEPTED':
                                                            case 'PICKING_UP':
                                                            case 'IN_TRANSIT':
                                                                label = jobStatus === 'ACCEPTED' ? 'จิตอาสารับงานแล้ว' : jobStatus === 'PICKING_UP' ? 'กำลังเดินทางไปรับ' : 'กำลังเดินทางไปโรงพยาบาล';
                                                                bgColor = 'bg-green-100 text-green-700';
                                                                dotColor = 'bg-green-500';
                                                                break;
                                                            case 'AT_HOSPITAL':
                                                            case 'RETURN_HOME':
                                                            case 'RETURN_OFFICE':
                                                                label = jobStatus === 'AT_HOSPITAL' ? 'ถึงโรงพยาบาลแล้ว' : jobStatus === 'RETURN_HOME' ? 'กำลังพากลับบ้าน' : 'ส่งถึงบ้านแล้ว';
                                                                bgColor = 'bg-teal-100 text-teal-700';
                                                                dotColor = 'bg-teal-500';
                                                                break;
                                                            case 'COMPLETED':
                                                                label = 'บริการเสร็จสิ้น';
                                                                bgColor = 'bg-emerald-100 text-emerald-700';
                                                                dotColor = 'bg-emerald-500';
                                                                break;
                                                            case 'CANCELLED':
                                                            case 'REJECTED':
                                                                label = jobStatus === 'CANCELLED' ? 'ยกเลิกโดยจิตอาสา' : 'จิตอาสาปฏิเสธงาน';
                                                                bgColor = 'bg-red-100 text-red-600';
                                                                dotColor = 'bg-red-500';
                                                                break;
                                                            default:
                                                                label = jobStatus;
                                                                bgColor = 'bg-gray-100 text-gray-600';
                                                                dotColor = 'bg-gray-400';
                                                        }
                                                    } else {
                                                        switch (queueStatus) {
                                                            case 'PENDING_MUNICIPAL':
                                                            case 'PENDING_EXECUTIVE':
                                                                label = 'รอตรวจสอบ';
                                                                bgColor = 'bg-amber-100 text-amber-700';
                                                                dotColor = 'bg-amber-500';
                                                                break;
                                                            case 'APPROVED':
                                                                label = 'รอประชาชนยืนยัน';
                                                                bgColor = 'bg-blue-100 text-blue-700';
                                                                dotColor = 'bg-blue-500';
                                                                break;
                                                            case 'CONFIRMED':
                                                                label = 'ยืนยันแล้ว';
                                                                bgColor = 'bg-green-100 text-green-700';
                                                                dotColor = 'bg-green-500';
                                                                break;
                                                            case 'COMPLETED':
                                                                label = 'เสร็จสิ้น';
                                                                bgColor = 'bg-emerald-100 text-emerald-700';
                                                                dotColor = 'bg-emerald-500';
                                                                break;
                                                            case 'CANCELLED':
                                                            case 'CANCELLED_BY_USER':
                                                            case 'CANCELLED_BY_MUNICIPAL':
                                                                label = queueStatus === 'CANCELLED_BY_MUNICIPAL' ? 'ยกเลิกโดยเทศบาล' : 'ยกเลิก';
                                                                bgColor = 'bg-red-100 text-red-600';
                                                                dotColor = 'bg-red-500';
                                                                break;
                                                            case 'REJECTED':
                                                            case 'EXECUTIVE_REJECTED':
                                                                label = 'ปฏิเสธ';
                                                                bgColor = 'bg-red-100 text-red-600';
                                                                dotColor = 'bg-red-500';
                                                                break;
                                                            default:
                                                                label = queueStatus;
                                                                bgColor = 'bg-gray-100 text-gray-600';
                                                                dotColor = 'bg-gray-400';
                                                        }
                                                    }

                                                    return (
                                                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${bgColor}`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor}`} />
                                                            {label}
                                                        </span>
                                                    );
                                                })()}
                                            </div>

                                            { }
                                            {item.job?.patientDroppedOffAt && (
                                                <div className="flex items-start gap-2x">
                                                    <div className="w-5 flex-shrink-0 mt-0.5 text-brand-primary flex justify-center items-center">
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <circle cx="12" cy="12" r="10"></circle>
                                                            <polyline points="12 6 12 12 16 14"></polyline>
                                                        </svg>
                                                    </div>
                                                    <span className="typo-menu text-brand-primary font-medium">ถึงบ้านเวลา: {new Date(item.job.patientDroppedOffAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</span>
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => setSelectedQueue(item)}
                                            className="bg-btn-primary hover:bg-btn-hover text-white typo-menu px-3x py-1x rounded-circle font-medium transition-colors flex-shrink-0"
                                        >
                                            รายละเอียด
                                        </button>
                                    </div>
                                ))}

                                { }
                                {loadingMore && (
                                    <div className="p-2x text-center">
                                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
                                        <p className="typo-menu text-text-tertiary mt-1x">กำลังโหลดเพิ่มเติม...</p>
                                    </div>
                                )}

                                { }
                                {!hasMore && queues.length > 0 && (
                                    <div className="p-2x text-center typo-menu text-text-tertiary">
                                        ไม่มีข้อมูลเพิ่มเติม
                                    </div>
                                )}
                            </div>
                        );
                    })()}

                </div>

                { }
                {selectedQueue && (
                    <BookingDetailModal
                        isOpen={!!selectedQueue}
                        onClose={() => setSelectedQueue(null)}
                        onBookingAction={() => {
                            setPage(1);
                            setHasMore(true);
                            fetchQueues(1, true);
                        }}
                        booking={{
                            id: selectedQueue.id.toString(),
                            patientName: selectedQueue.user?.firstName
                                ? `${selectedQueue.user.firstName} ${selectedQueue.user.lastName || ''}`.trim()
                                : (user?.displayName || 'คุณ'),
                            patientPictureUrl: selectedQueue.user?.pictureUrl || user?.pictureUrl,
                            patientMobilityStatus: (selectedQueue.user?.mobilityStatus || 'WALKING') as any,
                            bookingType: selectedQueue.hasAppointment ? 'มีใบนัด' : 'ไม่มีใบนัด',
                            hospitalName: selectedQueue.hospital?.name || 'โรงพยาบาล',
                            bookingDate: formatDate(selectedQueue.requestDate),
                            bookingTime: formatTime(selectedQueue.bookingTime, selectedQueue.requestDate),
                            status: selectedQueue.status as any,
                            rawStatus: selectedQueue.status,
                            requiredEquipment: selectedQueue.requiredEquipment ? selectedQueue.requiredEquipment.split(',') : [],
                            appointmentImage: selectedQueue.appointmentImage || undefined,
                            returnEvidenceUrl: selectedQueue.job?.returnEvidenceUrl || undefined,
                            wantCareU: selectedQueue.wantCareU,
                            volunteer: selectedQueue.job?.vlt ? {
                                name: `${selectedQueue.job.vlt.firstName || ''} ${selectedQueue.job.vlt.lastName || ''}`.trim(),
                                role: 'จิตอาสา',
                                phone: selectedQueue.job.vlt.phone,
                                pictureUrl: selectedQueue.job.vlt.pictureUrl,
                            } : undefined,
                            careUVolunteer: selectedQueue.job?.careu ? {
                                name: `${selectedQueue.job.careu.firstName || ''} ${selectedQueue.job.careu.lastName || ''}`.trim(),
                                phone: selectedQueue.job.careu.phone,
                                pictureUrl: selectedQueue.job.careu.pictureUrl,
                            } : undefined,
                        }}
                    />
                )}
            </div>
        </LayoutWithSidebar>
    );
}

export default function ElderlyHistory() {
    return (
        <ProtectedRoute allowedRoles={['USERS', 'ADMIN']}>
            <ElderlyHistoryPage />
        </ProtectedRoute>
    );
}
