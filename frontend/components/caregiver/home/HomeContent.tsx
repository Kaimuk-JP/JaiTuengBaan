'use client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { CaregiverSidebar } from '../sidebar';
import { User } from '../types';
import { getCurrentUser, fetchWithAuth } from '@/lib/auth';
import CaregiverHeader from '../header/CaregiverHeader';
import { getImageUrl } from '@/utils/image';
import LayoutWithSidebar from '@/components/shared/LayoutWithSidebar';
import { useSocket } from '@/contexts/SocketContext';
import { BookingDetailModal } from '@/components/caregiver/booking/BookingDetailModal';
import { getBangkokDateKey } from '@/utils/jobHelpers';
import { JOB_STATUS_CONFIG } from '@/components/staff/JobStatusBadge';
import { homeCardIcon, MenuIcon } from '@/components/shared/menuIcons';

export default function HomeContent() {
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [stats, setStats] = useState({ patients: 0, pendingBookings: 0 });
    const [statsLoading, setStatsLoading] = useState(true);
    const [orgPhone, setOrgPhone] = useState<string | null>(null);
    const [recentBookings, setRecentBookings] = useState<any[]>([]);
    const [selectedQueue, setSelectedQueue] = useState<any | null>(null);

    const router = useRouter();
    const { socket, unreadCount } = useSocket();

    useEffect(() => {
        const loadUser = async () => {
            const userData = await getCurrentUser();

            if (userData && !userData.phone) {
                router.push('/caregiver/register');
                return;
            }

            setUser(userData);
        };
        loadUser();
    }, [router]);

    useEffect(() => {
        fetchWithAuth('/settings/organization/phone')
            .then(res => res.ok ? res.json() : null)
            .then(data => { if (data?.phone) setOrgPhone(data.phone); })
            .catch(() => { });
    }, []);

    const loadStatsAndBookings = async () => {
        if (!user?.id) return;
        try {
            setStatsLoading(true);
            const [patientsRes, bookingsRes] = await Promise.all([
                fetchWithAuth('/caregiver/patients'),
                fetchWithAuth('/caregiver/bookings'),
            ]);

            const patientsRaw = patientsRes.ok ? await patientsRes.json() : [];
            const patientsList = Array.isArray(patientsRaw)
                ? patientsRaw
                : (patientsRaw?.data ?? []);
            const bookingsData = bookingsRes.ok ? await bookingsRes.json() : [];

            const patientsUnderCareCount = patientsList.filter(
                (p: { status?: string }) => p.status === 'APPROVED' || p.status === 'PENDING',
            ).length;

            const uniqueBookings: Array<{
                requestDate?: string;
                bookingDate?: string;
                rawStatus?: string;
                status?: string;
            }> = Array.isArray(bookingsData)
                ? bookingsData
                : (bookingsData?.data ?? []);

            uniqueBookings.forEach((item) => {
                if (!item.requestDate && item.bookingDate) {
                    item.requestDate = item.bookingDate;
                }
            });

            uniqueBookings.sort(
                (a, b) =>
                    new Date(b.requestDate || b.bookingDate || 0).getTime() -
                    new Date(a.requestDate || a.bookingDate || 0).getTime(),
            );

            const excludedStatuses = [
                'CANCELLED', 'CANCELLED_BY_USER', 'CANCELLED_BY_MUNICIPAL', 'REJECTED',
            ];

            const todayKey = getBangkokDateKey(new Date());

            const isTodayBooking = (b: { requestDate?: string; bookingDate?: string }) => {
                const bookingKey = getBangkokDateKey(b.bookingDate || b.requestDate);
                return bookingKey !== '' && bookingKey === todayKey;
            };

            const isVisibleBooking = (b: { rawStatus?: string; status?: string }) => {
                const statuses = [b.rawStatus, b.status].filter(Boolean) as string[];
                if (statuses.length === 0) return true;
                return !statuses.some((s) => excludedStatuses.includes(s));
            };

            const todayBookings = uniqueBookings.filter(
                (b) => isVisibleBooking(b) && isTodayBooking(b)
            );

            setStats({ patients: patientsUnderCareCount, pendingBookings: todayBookings.length });

            const activeBookings = [...todayBookings];

            activeBookings.sort(
                (a, b) =>
                    new Date(a.requestDate || a.bookingDate || 0).getTime() -
                    new Date(b.requestDate || b.bookingDate || 0).getTime(),
            );

            setRecentBookings(activeBookings);
        } catch {
        } finally {
            setStatsLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            loadStatsAndBookings();
        }
    }, [user]);

    useEffect(() => {
        if (!socket || !user) return;

        const handleRealtimeUpdate = () => {
            loadStatsAndBookings();
        };

        socket.on('notification', handleRealtimeUpdate);
        socket.on('refresh_jobs', handleRealtimeUpdate);

        return () => {
            socket.off('notification', handleRealtimeUpdate);
            socket.off('refresh_jobs', handleRealtimeUpdate);
        };
    }, [socket, user]);

    const [isActioning, setIsActioning] = useState(false);

    const handleQuickConfirm = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (isActioning) return;

        try {
            setIsActioning(true);
            const response = await fetchWithAuth(`/queues/${id}/confirm`, {
                method: 'PUT',
            });

            if (!response.ok) throw new Error('Failed to confirm');

            const Swal = (await import('sweetalert2')).default;
            await Swal.fire({
                icon: 'success',
                title: 'ยืนยันสำเร็จ!',
                text: 'คุณได้ยืนยันข้อมูลการจองที่แก้ไขแล้ว',
                confirmButtonColor: '#1E7D55',
                timer: 2000,
            });

            loadStatsAndBookings();
        } catch (error) {
            const Swal = (await import('sweetalert2')).default;
            await Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถยืนยันได้ กรุณาลองใหม่อีกครั้ง',
                confirmButtonColor: '#1E7D55',
            });
        } finally {
            setIsActioning(false);
        }
    };

    const handleQuickCancel = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (isActioning) return;

        try {
            setIsActioning(true);
            const Swal = (await import('sweetalert2')).default;
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

            if (!result.isConfirmed) return;

            const response = await fetchWithAuth(`/queues/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.message || 'ไม่สามารถยกเลิกได้');
            }

            await Swal.fire({
                icon: 'success',
                title: 'ยกเลิกสำเร็จ!',
                text: 'คุณได้ยกเลิกการจองแล้ว',
                confirmButtonColor: '#1E7D55',
                timer: 2000,
            });

            loadStatsAndBookings();
        } catch (error: any) {
            const Swal = (await import('sweetalert2')).default;
            await Swal.fire({
                icon: 'error',
                title: 'ไม่สามารถยกเลิกได้',
                text: error?.message || 'ไม่สามารถยกเลิกได้ กรุณาลองใหม่อีกครั้ง หรือติดต่อเทศบาล',
                confirmButtonColor: '#1E7D55',
            });
        } finally {
            setIsActioning(false);
        }
    };

    const handleRequestReturnPickup = async (e: React.MouseEvent, queue: { job?: { id?: number; returnPickupRequestedAt?: string | null }; bookedOnBehalf?: boolean; patientName?: string; user?: { firstName?: string; lastName?: string } }) => {
        e.stopPropagation();
        if (isActioning || !queue.job?.id) return;

        const patientName = queue.patientName ||
            `${queue.user?.firstName || ''} ${queue.user?.lastName || ''}`.trim() ||
            'ผู้รับบริการ';

        try {
            setIsActioning(true);
            const Swal = (await import('sweetalert2')).default;
            const result = await Swal.fire({
                icon: 'question',
                title: queue.bookedOnBehalf ? 'เรียกรถกลับแทน?' : 'เรียกรถกลับ?',
                text: queue.bookedOnBehalf
                    ? `ยืนยันเรียกรถมารับ ${patientName} ที่โรงพยาบาล`
                    : 'ยืนยันเรียกรถมารับที่โรงพยาบาล',
                showCancelButton: true,
                confirmButtonColor: '#1E7D55',
                cancelButtonColor: '#6B7280',
                confirmButtonText: queue.bookedOnBehalf ? 'เรียกรถกลับแทน' : 'เรียกรถกลับ',
                cancelButtonText: 'ยกเลิก',
            });
            if (!result.isConfirmed) return;

            const response = await fetchWithAuth(`/jobs/${queue.job.id}/request-return-pickup`, {
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
            loadStatsAndBookings();
        } catch (error: unknown) {
            const Swal = (await import('sweetalert2')).default;
            const message = error instanceof Error ? error.message : 'ไม่สามารถเรียกรถกลับได้';
            await Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: message,
                confirmButtonColor: '#1E7D55',
            });
        } finally {
            setIsActioning(false);
        }
    };

    const getTimeAgo = (dateStr: string) => {
        const now = new Date();
        const date = new Date(dateStr);
        const diffMs = now.getTime() - date.getTime();
        const diffMin = Math.floor(diffMs / 60000);
        if (diffMin < 1) return 'เมื่อสักครู่';
        if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`;
        const diffHr = Math.floor(diffMin / 60);
        if (diffHr < 24) return `${diffHr} ชั่วโมงที่แล้ว`;
        const diffDay = Math.floor(diffHr / 24);
        if (diffDay < 7) return `${diffDay} วันที่แล้ว`;
        return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
    };

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

    const getRelationshipLabel = (relationship: string) => {
        const labels: Record<string, string> = {
            FAMILY: 'ครอบครัว',
            RELATIVE: 'ญาติ',
            CLOSE_PERSON: 'คนใกล้ชิด',
            'จองแทน': 'จองแทน',
        };
        return labels[relationship] || relationship;
    };

    const getStatusLabel = (status: string) => {
        if (status === 'OPEN') return 'รอตอบรับ';
        if (status === 'RETURN_OFFICE') return 'ส่งถึงบ้านแล้ว';
        return JOB_STATUS_CONFIG[status]?.label ?? status;
    };

    const getStatusColor = (status: string) => {
        if (status === 'RETURN_OFFICE') return 'bg-green-100 text-green-700';
        return JOB_STATUS_CONFIG[status]?.style ?? 'bg-gray-100 text-gray-700';
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'QUEUE_APPROVED':
            case 'EDIT_REQUEST_APPROVED':
                return (
                    <div className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                        <svg className="w-4.5 h-4.5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                );
            case 'QUEUE_REJECTED':
            case 'EDIT_REQUEST_REJECTED':
                return (
                    <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                        <svg className="w-4.5 h-4.5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                );
            case 'VOLUNTEER_ASSIGNED':
                return (
                    <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                        <svg className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                );
            default:
                return (
                    <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                        <svg className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                    </div>
                );
        }
    };

    return (
        <LayoutWithSidebar role="CAREGIVER" showSidebar={false} user={user}>
            <div className="min-h-screen bg-[#F5F5F5] dark:bg-gray-900 font-sans pb-24">

                { }
                <CaregiverSidebar user={user} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

                { }
                <CaregiverHeader user={user} onToggleSidebar={() => setSidebarOpen(true)} />

                { }
                <div className="bg-gradient-to-bl from-[#3AAE7D] to-[#346D55] dark:from-slate-800 dark:to-slate-900 px-6 pt-8 pb-[140px] relative text-white">

                    { }
                    <div className="mt-6">
                        <h1 className="text-[1.375rem] leading-[1.4] tracking-wide">
                            <span className="font-medium">ยินดีต้อนรับสู่ระบบ</span><br />
                            <span className="font-normal text-xl">ใจส่งถึงบ้าน</span>
                        </h1>
                    </div>
                </div>

                { }
                <div className="px-5 -mt-[110px] relative z-10 max-w-md mx-auto">
                    <div className="bg-white dark:bg-gray-800 rounded-[24px] p-4 shadow-sm border border-slate-100 dark:border-gray-700 flex flex-col gap-3">

                        <Link href="/caregiver/booking" className="w-full bg-[#F8F9FA] dark:bg-gray-700 hover:bg-[#F0F2F5] dark:hover:bg-gray-600 text-slate-800 dark:text-gray-100 rounded-xl py-3.5 px-4 flex items-center justify-between active:scale-[0.98] transition-transform border border-slate-100 dark:border-gray-600">
                            <div className="flex items-center gap-3">
                                {homeCardIcon('calendar-plus', 'w-7 h-7 shrink-0 text-[#1E7D55]')}
                                <span className="font-bold text-[0.9375rem]">จองเลย</span>
                            </div>
                            <svg className="w-5 h-5 text-slate-400 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>

                        <Link href="/caregiver/patients" className="w-full bg-[#1E7D55] hover:bg-[#165c40] text-white rounded-xl py-3.5 px-4 flex items-center justify-between active:scale-[0.98] transition-transform shadow-sm">
                            <div className="flex items-center gap-3">
                                {homeCardIcon('users', 'w-7 h-7 shrink-0 text-white')}
                                <span className="font-bold text-[0.9375rem]">จองในนาม </span>
                            </div>
                            <svg className="w-5 h-5 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>

                        { }
                        <Link href="/caregiver/confirm" className="w-full bg-[#F8F9FA] dark:bg-gray-700 hover:bg-[#F0F2F5] dark:hover:bg-gray-600 text-slate-800 dark:text-gray-100 rounded-xl py-3.5 px-4 flex items-center justify-between active:scale-[0.98] transition-transform border border-slate-100 dark:border-gray-600">
                            <div className="flex items-center gap-3">
                                {homeCardIcon('history', 'w-7 h-7 shrink-0 text-[#1E7D55]')}
                                <span className="font-bold text-[0.9375rem]">ประวัติการจอง</span>
                            </div>
                            <svg className="w-5 h-5 text-slate-400 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>

                        { }
                        <Link href="/caregiver/add-patient" className="w-full bg-[#F8F9FA] dark:bg-gray-700 hover:bg-[#F0F2F5] dark:hover:bg-gray-600 text-slate-800 dark:text-gray-100 rounded-xl py-3.5 px-4 flex items-center justify-between active:scale-[0.98] transition-transform border border-slate-100 dark:border-gray-600">
                            <div className="flex items-center gap-3">
                                {homeCardIcon('user-plus', 'w-7 h-7 shrink-0 text-[#1E7D55]')}
                                <span className="font-bold text-[0.9375rem]">เพิ่มประชาชนในความดูแล</span>
                            </div>
                            <svg className="w-5 h-5 text-slate-400 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>

                        { }
                        <a
                            href={orgPhone ? `tel:${orgPhone}` : '#'}
                            onClick={(e) => {
                                if (!orgPhone) {
                                    e.preventDefault();
                                    import('sweetalert2').then(Swal => {
                                        Swal.default.fire({ icon: 'info', title: 'ไม่พบเบอร์โทร', text: 'หน่วยงานยังไม่ได้ตั้งค่าเบอร์โทรศัพท์', confirmButtonColor: '#1E7D55' });
                                    });
                                }
                            }}
                            className="w-full bg-[#F8F9FA] dark:bg-gray-700 hover:bg-[#F0F2F5] dark:hover:bg-gray-600 text-slate-800 dark:text-gray-100 rounded-xl py-3.5 px-4 flex items-center justify-between active:scale-[0.98] transition-transform border border-slate-100 dark:border-gray-600"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-7 h-7 flex items-center justify-center shrink-0 text-[#1E7D55]">
                                    {homeCardIcon('phone', 'w-6 h-6')}
                                </div>
                                <span className="font-bold text-[0.9375rem]">โทรหาเจ้าหน้าที่</span>
                            </div>
                            <svg className="w-5 h-5 text-slate-400 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                            </svg>
                        </a>

                    </div>
                </div>

                { }
                <div className="px-5 mt-5 max-w-md mx-auto">
                    <h3 className="text-sm font-semibold text-slate-500 dark:text-gray-400 mb-3 px-1">ภาพรวม</h3>
                    <div className="grid grid-cols-3 gap-3">
                        { }
                        <Link href="/caregiver/patients" className="bg-white dark:bg-gray-800 rounded-2xl p-3.5 shadow-sm border border-slate-100 dark:border-gray-700 text-center active:scale-[0.97] transition-transform">
                            <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-2">
                                <MenuIcon name="clipboard-list" className="w-5 h-5 text-[#1E7D55]" size={20} />
                            </div>
                            {statsLoading ? (
                                <div className="h-7 w-8 bg-slate-200 dark:bg-gray-600 rounded mx-auto mb-1 animate-pulse" />
                            ) : (
                                <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.patients}</p>
                            )}
                            <p className="text-[0.6875rem] text-slate-500 dark:text-gray-400 leading-tight">ประชาชน</p>
                        </Link>

                        { }
                        <Link href="/caregiver/confirm" className="bg-white dark:bg-gray-800 rounded-2xl p-3.5 shadow-sm border border-slate-100 dark:border-gray-700 text-center active:scale-[0.97] transition-transform">
                            <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mx-auto mb-2">
                                <MenuIcon name="calendar-event" className="w-5 h-5 text-amber-600 dark:text-amber-400" size={20} />
                            </div>
                            {statsLoading ? (
                                <div className="h-7 w-8 bg-slate-200 dark:bg-gray-600 rounded mx-auto mb-1 animate-pulse" />
                            ) : (
                                <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.pendingBookings}</p>
                            )}
                            <p className="text-[0.6875rem] text-slate-500 dark:text-gray-400 leading-tight">รายการจอง</p>
                        </Link>

                        { }
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-3.5 shadow-sm border border-slate-100 dark:border-gray-700 text-center">
                            <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-2">
                                <MenuIcon name="bell" className="w-5 h-5 text-red-500 dark:text-red-400" size={20} />
                            </div>
                            <p className="text-2xl font-bold text-slate-800 dark:text-white">{unreadCount}</p>
                            <p className="text-[0.6875rem] text-slate-500 dark:text-gray-400 leading-tight">ยังไม่อ่าน</p>
                        </div>
                    </div>
                </div>

                <div className="px-5 mt-6 max-w-md mx-auto">
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h3 className="text-sm font-semibold text-slate-500 dark:text-gray-400">รายการจองวันนี้</h3>
                        <Link href="/caregiver/confirm" className="text-xs text-[#1E7D55] font-medium hover:underline">ดูทั้งหมด</Link>
                    </div>
                    {recentBookings.length > 0 ? (
                        <div className="space-y-3">
                            {recentBookings.map((queue) => (
                                <div
                                    key={queue.id}
                                    onClick={() => setSelectedQueue(queue)}
                                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 p-4 cursor-pointer hover:border-[#1E7D55] transition-colors"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden shrink-0">
                                                {(queue.user?.pictureUrl || queue.patientPictureUrl) ? (
                                                    <img src={getImageUrl(queue.user?.pictureUrl || queue.patientPictureUrl)} alt="Profile" className="w-full h-full object-cover" />
                                                ) : (
                                                    <svg className="w-full h-full text-slate-400 p-1.5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm text-slate-800 dark:text-white">
                                                    {queue.user?.firstName
                                                        ? `${queue.user.firstName} ${queue.user.lastName || ''}`.trim()
                                                        : (queue.patientName || user?.displayName || 'คุณ')}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {(queue.hasAppointment || queue.bookingType === 'มีใบนัด') ? 'มีใบนัด' : 'ไม่มีใบนัด'}
                                                </p>
                                                {(queue.bookedOnBehalf || (queue.patientRelationship && queue.patientRelationship !== 'ตัวเอง')) && (
                                                    <p className="text-[0.6875rem] text-[#1E7D55] font-medium">
                                                        จองแทน
                                                        {queue.patientRelationship && queue.patientRelationship !== 'จองแทน'
                                                            ? ` · ${getRelationshipLabel(queue.patientRelationship)}`
                                                            : ''}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <span className={`text-[0.6875rem] font-bold px-2 py-1 rounded-full ${getStatusColor(queue.rawStatus || queue.status)}`}>
                                            {getStatusLabel(queue.rawStatus || queue.status)}
                                        </span>
                                    </div>
                                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-gray-300">
                                        <div className="flex items-center gap-1.5">
                                            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                            <span className="truncate">{formatDate(queue.requestDate || queue.bookingDate)}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            <span className="truncate">{formatTime(queue.bookingTime, queue.requestDate || queue.bookingDate)}</span>
                                        </div>
                                    </div>

                                    {(queue.hospital?.name || queue.hospitalName) && (
                                        <div className="mt-2 flex items-start gap-1.5 text-xs text-slate-600 dark:text-gray-300">
                                            <svg className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                            <span className="line-clamp-2 leading-snug">{queue.hospital?.name || queue.hospitalName}</span>
                                        </div>
                                    )}
                                    {queue.requiredEquipment &&
                                        (Array.isArray(queue.requiredEquipment)
                                            ? queue.requiredEquipment.length > 0
                                            : String(queue.requiredEquipment).trim().length > 0) && (
                                            <div className="mt-1 flex items-start gap-1.5 text-[0.6875rem] text-slate-500 dark:text-gray-400">
                                                <span className="shrink-0 font-medium text-slate-500">อุปกรณ์</span>
                                                <span className="line-clamp-2 leading-snug">
                                                    {Array.isArray(queue.requiredEquipment)
                                                        ? queue.requiredEquipment.join(', ')
                                                        : queue.requiredEquipment}
                                                </span>
                                            </div>
                                        )}

                                    {queue.adminNote && ['APPROVED', 'AI_MATCHING'].includes(queue.status || queue.rawStatus) && (() => {
                                        let changes: any = null;
                                        try { changes = JSON.parse(queue.adminNote); } catch { }

                                        if (changes && typeof changes === 'object') {
                                            return (
                                                <div className="mt-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
                                                    <p className="text-xs font-semibold text-amber-800 dark:text-amber-400 mb-2 flex items-center gap-1.5">
                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                        เทศบาลแก้ไขข้อมูล
                                                    </p>
                                                    <div className="space-y-1.5">
                                                        {changes.hospitalName && (
                                                            <div className="text-[0.6875rem]">
                                                                <span className="text-amber-600 dark:text-amber-500 font-medium">โรงพยาบาล: </span>
                                                                <span className="text-slate-400 line-through">{changes.hospitalName.from}</span>
                                                                <span className="text-amber-700 dark:text-amber-300"> → </span>
                                                                <span className="text-amber-800 dark:text-amber-200 font-semibold">{changes.hospitalName.to}</span>
                                                            </div>
                                                        )}
                                                        {changes.bookingTime && (
                                                            <div className="text-[0.6875rem]">
                                                                <span className="text-amber-600 dark:text-amber-500 font-medium">เวลา: </span>
                                                                <span className="text-slate-400 line-through">{changes.bookingTime.from}</span>
                                                                <span className="text-amber-700 dark:text-amber-300"> → </span>
                                                                <span className="text-amber-800 dark:text-amber-200 font-semibold">{changes.bookingTime.to}</span>
                                                            </div>
                                                        )}
                                                        {changes.requestDate && (
                                                            <div className="text-[0.6875rem]">
                                                                <span className="text-amber-600 dark:text-amber-500 font-medium">วันที่: </span>
                                                                <span className="text-slate-400 line-through">{changes.requestDate.from}</span>
                                                                <span className="text-amber-700 dark:text-amber-300"> → </span>
                                                                <span className="text-amber-800 dark:text-amber-200 font-semibold">{changes.requestDate.to}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return (
                                            <div className="mt-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-2.5">
                                                <p className="text-xs font-semibold text-amber-800 dark:text-amber-500 mb-1">เทศบาลแก้ไขข้อมูล:</p>
                                                <p className="text-[0.6875rem] text-amber-700 dark:text-amber-400 leading-relaxed">{queue.adminNote}</p>
                                            </div>
                                        );
                                    })()}

                                    {(queue.rawStatus || queue.status) === 'AT_HOSPITAL' && queue.job?.id && (
                                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-gray-700">
                                            {!queue.job.returnPickupRequestedAt ? (
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleRequestReturnPickup(e, queue)}
                                                    disabled={isActioning}
                                                    className="w-full bg-[#1E7D55] hover:bg-[#165c40] text-white font-semibold py-2 px-3 rounded-lg transition-colors text-sm disabled:opacity-50"
                                                >
                                                    {queue.bookedOnBehalf ? 'เรียกรถกลับแทน' : 'เรียกรถกลับ'}
                                                </button>
                                            ) : (
                                                <p className="text-xs text-center text-amber-700 bg-amber-50 dark:bg-amber-900/20 rounded-lg py-2 px-3">
                                                    เรียกรถกลับแล้ว — รอคนขับมารับที่โรงพยาบาล
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {['APPROVED', 'PENDING', 'PENDING_MUNICIPAL', 'AI_MATCHING'].includes(queue.status || queue.rawStatus) && (
                                        <div className="mt-4 flex gap-2 pt-3 border-t border-slate-100 dark:border-gray-700">
                                            <button
                                                onClick={(e) => handleQuickCancel(e, queue.id.toString())}
                                                disabled={isActioning}
                                                className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 font-medium py-1.5 px-3 rounded-lg transition-colors text-xs disabled:opacity-50"
                                            >
                                                ยกเลิก
                                            </button>
                                            {queue.status === 'APPROVED' || queue.rawStatus === 'APPROVED' ? (
                                                <button
                                                    onClick={(e) => handleQuickConfirm(e, queue.id.toString())}
                                                    disabled={isActioning}
                                                    className="flex-1 bg-[#1E7D55]/10 hover:bg-[#1E7D55]/20 text-[#1E7D55] font-medium py-1.5 px-3 rounded-lg transition-colors text-xs disabled:opacity-50"
                                                >
                                                    ยืนยันการแก้ไข
                                                </button>
                                            ) : null}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 p-6 text-center">
                            <p className="text-sm text-slate-500 dark:text-gray-400">ไม่มีรายการจองวันนี้</p>
                            <Link
                                href="/caregiver/confirm"
                                className="mt-2 inline-block text-xs text-[#1E7D55] font-medium hover:underline"
                            >
                                ดูประวัติการจองทั้งหมด
                            </Link>
                        </div>
                    )}
                </div>


                {selectedQueue && (
                    <BookingDetailModal
                        isOpen={!!selectedQueue}
                        onClose={() => setSelectedQueue(null)}
                        onBookingAction={() => {
                            setSelectedQueue(null);
                            loadStatsAndBookings();
                        }}
                        booking={{
                            id: selectedQueue.id.toString(),
                            patientName: selectedQueue.user?.firstName
                                ? `${selectedQueue.user.firstName} ${selectedQueue.user.lastName || ''}`.trim()
                                : (selectedQueue.patientName || user?.displayName || 'คุณ'),
                            patientPictureUrl: selectedQueue.user?.pictureUrl || selectedQueue.patientPictureUrl || user?.pictureUrl,
                            patientMobilityStatus: (selectedQueue.user?.mobilityStatus || selectedQueue.patientMobilityStatus || 'WALKING') as any,
                            bookingType: selectedQueue.hasAppointment ? 'มีใบนัด' : 'ไม่มีใบนัด',
                            hospitalName: selectedQueue.hospital?.name || selectedQueue.hospitalName || 'โรงพยาบาล',
                            bookingDate: formatDate(selectedQueue.requestDate || selectedQueue.bookingDate),
                            bookingTime: formatTime(selectedQueue.bookingTime, selectedQueue.requestDate || selectedQueue.bookingDate),
                            status: selectedQueue.status as any,
                            rawStatus: selectedQueue.rawStatus || selectedQueue.status,
                            jobId: selectedQueue.job?.id,
                            bookedOnBehalf: selectedQueue.bookedOnBehalf,
                            returnPickupRequestedAt: selectedQueue.job?.returnPickupRequestedAt,
                            requiredEquipment: Array.isArray(selectedQueue.requiredEquipment)
                                ? selectedQueue.requiredEquipment
                                : (selectedQueue.requiredEquipment ? selectedQueue.requiredEquipment.split(',') : []),
                            appointmentImage: selectedQueue.appointmentImage || undefined,
                            returnEvidenceUrl: selectedQueue.returnEvidenceUrl || undefined,
                            wantCareU: selectedQueue.wantCareU,
                            volunteer: selectedQueue.volunteer ? {
                                name: selectedQueue.volunteer.name || '-',
                                role: selectedQueue.volunteer.role || 'จิตอาสา',
                                phone: selectedQueue.volunteer.phone,
                                pictureUrl: selectedQueue.volunteer.pictureUrl,
                            } : undefined,
                            careUVolunteer: selectedQueue.careUVolunteer ? {
                                name: selectedQueue.careUVolunteer.name || '-',
                                phone: selectedQueue.careUVolunteer.phone,
                                pictureUrl: selectedQueue.careUVolunteer.pictureUrl,
                            } : undefined,
                        }}
                    />
                )}

            </div>
        </LayoutWithSidebar>
    );
}
