'use client';

import ElderlyHeader from '@/components/elderly/header/ElderlyHeader';
import ElderlySidebar from '@/components/elderly/sidebar/ElderlySidebar';
import { EmptyQueueState } from '@/components/elderly/confirm';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { fetchWithAuth } from '@/lib/auth';
import { getImageUrl } from '@/utils/image';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import Swal from '@/lib/swal';
import LiveTrackingModal from '@/components/elderly/LiveTrackingModal';

interface Queue {
    id: number;
    userId?: string;
    createdBy?: string | null;
    status: string;
    requestDate: string;
    bookingTime: string | null;
    appointmentType?: string;
    department?: string;
    hospital?: { name: string };
    user?: { firstName?: string; lastName?: string };
    requiredEquipment?: string;
    adminNote?: string | null;
    job?: any;
}

export default function ElderlyConfirmPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [queues, setQueues] = useState<Queue[]>([]);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [editNotifications, setEditNotifications] = useState<any[]>([]);
    const [isConfirming, setIsConfirming] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [isRequestingPickup, setIsRequestingPickup] = useState(false);
    const [selectedTrackingQueue, setSelectedTrackingQueue] = useState<Queue | null>(null);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    const { socket } = useSocket();

    useEffect(() => {
        if (user?.id) {
            fetchQueues(user.id);
            fetchEditNotification();
        }
    }, [user]);

    useEffect(() => {
        if (!socket || !user?.id) return;

        const handleRealtimeUpdate = () => {
            fetchQueues(user.id);
            fetchEditNotification();
        };

        socket.on('notification', handleRealtimeUpdate);
        socket.on('refresh_queues', handleRealtimeUpdate);
        socket.on('refresh_dashboard', handleRealtimeUpdate);
        socket.on('refresh_jobs', handleRealtimeUpdate);

        return () => {
            socket.off('notification', handleRealtimeUpdate);
            socket.off('refresh_queues', handleRealtimeUpdate);
            socket.off('refresh_dashboard', handleRealtimeUpdate);
            socket.off('refresh_jobs', handleRealtimeUpdate);
        };
    }, [socket, user?.id]);

    const fetchEditNotification = async () => {
        try {
            const response = await fetchWithAuth('/notifications?page=1&limit=50');
            if (!response.ok) return;
            const result = await response.json();
            const notifications = result.data || [];
            const editNotifs = notifications.filter(
                (n: any) => n.type === 'QUEUE_EDITED'
            );
            setEditNotifications(editNotifs);
        } catch (err) {
            console.error('Error fetching edit notifications:', err);
        }
    };

    const fetchQueues = async (uid: number) => {
        try {
            const response = await fetchWithAuth(`/queues/user/${uid}`);
            if (!response.ok) {
                setLoading(false);
                return;
            }

            const text = await response.text();
            if (!text || text.trim() === '') {
                setLoading(false);
                return;
            }

            const data = JSON.parse(text);
            const allQueues = Array.isArray(data) ? data : (data.queues || data.data || []);

            const now = new Date();
            const toDateStr = (d: Date) =>
                `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            const todayStr = toDateStr(now);
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowStr = toDateStr(tomorrow);

            const activeQueueStatuses = ['PENDING_MUNICIPAL', 'APPROVED', 'PENDING_EXECUTIVE', 'CONFIRMED'];
            const completedJobStatuses = ['COMPLETED', 'CANCELLED', 'RETURN_OFFICE'];

            const filterByDate = (dateStr: string) =>
                allQueues.filter((q: any) => {
                    if (!q.requestDate) return false;
                    const qDate = q.requestDate.substring(0, 10);
                    if (qDate !== dateStr) return false;
                    if (!activeQueueStatuses.includes(q.status)) return false;
                    const job = Array.isArray(q.job) ? q.job[0] : q.job;
                    if (job && completedJobStatuses.includes(job.status)) return false;
                    return true;
                });

            const todayActiveQueues = filterByDate(todayStr);

            if (todayActiveQueues.length > 0) {
                todayActiveQueues.sort((a: any, b: any) => b.id - a.id);
                setQueues(todayActiveQueues);
            } else {
                const tomorrowActiveQueues = filterByDate(tomorrowStr);
                tomorrowActiveQueues.sort((a: any, b: any) => b.id - a.id);
                setQueues(tomorrowActiveQueues);
            }
        } catch (err) {
            console.error('Error fetching queues:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        const day = d.getDate();
        const months = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
        const month = months[d.getMonth()];
        const year = d.getFullYear() + 543;
        return `${day} ${month} ${year}`;
    };

    const getStatusDisplay = (queue: Queue, editNotification?: any) => {
        if (queue.status === 'PENDING_MUNICIPAL' || queue.status === 'PENDING') {
            return { text: 'รอเทศบาลตรวจสอบ', bg: 'bg-[#E5F3FF]', color: 'text-[#007AFF]' };
        }

        if (queue.status === 'APPROVED') {
            if (editNotification) {
                return { text: 'รอยืนยันการแก้ไข', bg: 'bg-[#FFF3E0]', color: 'text-[#E65100]' };
            }
            return { text: 'รอประชาชนยืนยัน', bg: 'bg-[#E5F3FF]', color: 'text-[#007AFF]' };
        }

        if (queue.status === 'PENDING_EXECUTIVE') {
            return { text: 'รอผู้บริหารอนุมัติ', bg: 'bg-[#EDE7F6]', color: 'text-[#6A1B9A]' };
        }

        if (queue.status === 'EXECUTIVE_REJECTED') {
            return { text: 'ผู้บริหารปฏิเสธ', bg: 'bg-red-50', color: 'text-red-600' };
        }

        if (['CONFIRMED', 'ASSIGNED', 'ACCEPTED'].includes(queue.status)) {
            const job = (Array.isArray(queue.job) ? queue.job[0] : queue.job) || {};

            if (job.status === 'COMPLETED' || job.status === 'RETURN_OFFICE') return { text: 'ให้บริการเสร็จสิ้น', bg: 'bg-[#E8F5E9]', color: 'text-[#2E7D32]' };
            if (job.status === 'AT_PATIENT_HOME') return { text: 'ถึงบ้านแล้ว รอคนขับยืนยัน', bg: 'bg-[#E8F5E9]', color: 'text-[#2E7D32]' };
            if (job.status === 'RETURN_HOME') return { text: 'กำลังเดินทางกลับบ้าน', bg: 'bg-[#E5F3FF]', color: 'text-[#007AFF]' };
            if (job.status === 'AT_HOSPITAL') {
                if (job.returnPickupRequestedAt) return { text: 'รอคนขับมารับที่โรงพยาบาล', bg: 'bg-[#FFF3E0]', color: 'text-[#E65100]' };
                return { text: 'อยู่ที่โรงพยาบาล', bg: 'bg-[#E5F3FF]', color: 'text-[#007AFF]' };
            }
            if (job.status === 'PICKED_UP' || job.status === 'IN_TRANSIT') return { text: 'กำลังเดินทางไปโรงพยาบาล', bg: 'bg-[#E5F3FF]', color: 'text-[#007AFF]' };
            if (job.status === 'PICKING_UP' || job.status === 'IN_PROGRESS') return { text: 'กำลังเดินทางไปรับ', bg: 'bg-[#FFF3E0]', color: 'text-[#E65100]' };
            if (job.status === 'ACCEPTED') return { text: 'จิตอาสารับงานแล้ว', bg: 'bg-[#E8F5E9]', color: 'text-[#2E7D32]' };
            if (job.status === 'ASSIGNED') return { text: 'มอบหมายจิตอาสาแล้ว', bg: 'bg-[#E8F5E9]', color: 'text-[#1E7D55]' };

            return { text: 'รอมอบหมายจิตอาสา', bg: 'bg-[#FFF8E1]', color: 'text-[#F9A825]' };
        }

        const map: any = {
            REJECTED: { text: 'ปฏิเสธ', bg: 'bg-red-50', color: 'text-red-600' },
            CANCELLED_BY_USER: { text: 'ผู้ใช้ยกเลิก', bg: 'bg-slate-100', color: 'text-slate-600' },
            CANCELLED_BY_MUNICIPAL: { text: 'เทศบาลยกเลิก', bg: 'bg-slate-100', color: 'text-slate-600' },
            CANCELLED_BY_STAFF: { text: 'เทศบาลยกเลิก', bg: 'bg-slate-100', color: 'text-slate-600' },
            CANCELLED: { text: 'ยกเลิก', bg: 'bg-slate-100', color: 'text-slate-600' },
            COMPLETED: { text: 'ให้บริการเสร็จสิ้น', bg: 'bg-[#E8F5E9]', color: 'text-[#2E7D32]' },
        };

        return map[queue.status] || { text: 'รอให้บริการ', bg: 'bg-[#E5F3FF]', color: 'text-[#007AFF]' };
    };

    const handleConfirmEdit = async (queue: Queue, editNotification?: any) => {
        if (isConfirming || isCancelling) return;
        try {
            setIsConfirming(true);
            const queueId = editNotification?.data?.queueId || queue.id;
            if (queueId) {
                await fetchWithAuth(`/queues/${queueId}/confirm`, { method: 'PUT' });
            }
            if (editNotification?.id) {
                await fetchWithAuth(`/notifications/${editNotification.id}/read`, { method: 'PATCH' }).catch(() => {});
            }
            await Swal.fire({
                icon: 'success',
                title: 'ยืนยันสำเร็จ!',
                text: 'คุณได้ยืนยันข้อมูลการจองเรียบร้อยแล้ว',
                confirmButtonColor: '#1E7D55',
                timer: 2000,
            });
            if (editNotification) {
                setEditNotifications(prev => prev.filter(n => n.id !== editNotification.id));
            }
            if (user?.id) fetchQueues(user.id);
        } catch (error) {
            console.error('Error confirming edit:', error);
            await Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: 'กรุณาลองใหม่อีกครั้ง', confirmButtonColor: '#1E7D55' });
        } finally {
            setIsConfirming(false);
        }
    };

    const handleCancelBooking = async (queue: Queue, editNotification?: any) => {
        if (isConfirming || isCancelling) return;
        try {
            setIsCancelling(true);
            const queueId = editNotification?.data?.queueId || queue.id;
            if (!queueId) throw new Error('ไม่พบคิว');

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
            if (!result.isConfirmed) { setIsCancelling(false); return; }

            const response = await fetchWithAuth(`/queues/${queueId}`, { method: 'DELETE' });
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.message || 'ไม่สามารถยกเลิกได้');
            }

            if (editNotification) {
                await fetchWithAuth(`/notifications/${editNotification.id}/read`, { method: 'PATCH' }).catch(() => { });
            }

            await Swal.fire({
                icon: 'success',
                title: 'ยกเลิกสำเร็จ!',
                text: 'คุณได้ยกเลิกการจองแล้ว',
                confirmButtonColor: '#1E7D55',
                timer: 2000,
            });
            if (editNotification) {
                setEditNotifications(prev => prev.filter(n => n.id !== editNotification.id));
            }
            if (user?.id) fetchQueues(user.id);
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

    const handleRequestReturnPickup = async (jobId: number) => {
        if (!jobId) return;
        const result = await Swal.fire({
            icon: 'question',
            title: 'เรียกรถกลับ?',
            text: 'ยืนยันเรียกรถมารับที่โรงพยาบาล',
            showCancelButton: true,
            confirmButtonColor: '#1E7D55',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'เรียกรถกลับ',
            cancelButtonText: 'ยกเลิก',
        });
        if (!result.isConfirmed) return;

        try {
            setIsRequestingPickup(true);
            const response = await fetchWithAuth(`/jobs/${jobId}/request-return-pickup`, { method: 'POST' });
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
            if (user?.id) fetchQueues(user.id);
        } catch (error: any) {
            await Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: error.message || 'ไม่สามารถเรียกรถกลับได้',
                confirmButtonColor: '#1E7D55',
            });
        } finally {
            setIsRequestingPickup(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-primary border-t-transparent"></div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900">
            <ElderlyHeader user={user} onToggleSidebar={() => setSidebarOpen(true)} />
            <ElderlySidebar user={user} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="p-4">
                <div className="max-w-lg mx-auto">
                    <h1 className="text-xl font-bold text-center text-brand-primary mb-4">
                        ข้อมูลการจอง
                    </h1>

                    {queues.length === 0 ? (
                        <EmptyQueueState onBookNew={() => router.push('/elderly/booking')} />
                    ) : (
                        <div className="space-y-4">
                            {queues.map((queue) => {
                                const editNotification = editNotifications.find((n: any) => n.data?.queueId === queue.id);
                                const parsedChanges = (() => {
                                    if (editNotification?.data?.changes) return editNotification.data.changes;
                                    const note = queue.adminNote;
                                    if (note) {
                                        try {
                                            const parsed = JSON.parse(note);
                                            if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
                                                return parsed;
                                            }
                                        } catch (e) { }
                                    }
                                    return null;
                                })();

                                const statusDisplay = getStatusDisplay(queue, editNotification || parsedChanges);
                                const job = (Array.isArray(queue.job) ? queue.job[0] : queue.job) || null;
                                const volunteer = job?.vlt;
                                const userName = queue.user?.firstName
                                    ? `${queue.user.firstName} ${queue.user.lastName || ''}`.trim()
                                    : (user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'ไม่ระบุชื่อ');

                                const canRequestReturnPickup =
                                    ['CONFIRMED', 'ASSIGNED', 'ACCEPTED'].includes(queue.status) &&
                                    job?.status === 'AT_HOSPITAL' &&
                                    !job?.returnPickupRequestedAt;

                                return (
                                    <div key={queue.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 overflow-hidden">
                                        <div className="flex justify-between items-center px-4 py-3 border-b border-slate-100 dark:border-gray-700">
                                            <h4 className="font-bold text-slate-900 dark:text-gray-100 text-[0.9375rem]">
                                                คิว {queue.id} : {userName.includes('คุณ') ? userName : `คุณ ${userName}`}
                                            </h4>
                                        </div>

                                        <div className="px-4 py-4 space-y-2">
                                            <div className="flex items-center gap-4">
                                                <span className="text-slate-600 dark:text-gray-400 text-sm min-w-[70px]">สถานะ :</span>
                                                <span className={`text-[0.8125rem] font-medium px-3 py-1 rounded-full ${statusDisplay.bg} ${statusDisplay.color}`}>
                                                    {statusDisplay.text}
                                                </span>
                                            </div>

                                            <div className="flex items-start gap-4">
                                                <span className="text-slate-600 dark:text-gray-400 text-sm min-w-[70px] mt-0.5">วันที่ :</span>
                                                <span className="text-slate-900 dark:text-gray-100 text-sm font-medium leading-relaxed">
                                                    {formatDate(queue.requestDate)}
                                                </span>
                                            </div>

                                            <div className="flex items-start gap-4">
                                                <span className="text-slate-600 dark:text-gray-400 text-sm min-w-[70px] mt-0.5">เวลานัด :</span>
                                                <span className="text-slate-900 dark:text-gray-100 text-sm font-medium leading-relaxed">
                                                    {queue.bookingTime ? (queue.bookingTime.includes('น.') ? queue.bookingTime : `${queue.bookingTime} น.`) : 'ไม่ระบุ'}
                                                </span>
                                            </div>

                                            {queue.department && (
                                                <div className="flex items-start gap-4">
                                                    <span className="text-slate-600 dark:text-gray-400 text-sm min-w-[70px] mt-0.5">แผนก :</span>
                                                    <span className="text-slate-900 dark:text-gray-100 text-sm font-medium leading-relaxed">
                                                        {queue.department}
                                                    </span>
                                                </div>
                                            )}

                                            {queue.hospital?.name && (
                                                <div className="flex items-start gap-4">
                                                    <span className="text-slate-600 dark:text-gray-400 text-sm min-w-[70px] mt-0.5">สถานที่ :</span>
                                                    <span className="text-slate-900 dark:text-gray-100 text-sm font-medium leading-relaxed">
                                                        {queue.hospital.name}
                                                    </span>
                                                </div>
                                            )}

                                            <div className="flex items-start gap-4">
                                                <span className="text-slate-600 dark:text-gray-400 text-sm min-w-[70px] mt-0.5">อุปกรณ์ :</span>
                                                <span className="text-slate-900 dark:text-gray-100 text-sm font-medium leading-relaxed">
                                                    {queue.requiredEquipment ? queue.requiredEquipment.split(',').join(', ') : '-'}
                                                </span>
                                            </div>

                                            {job?.patientDroppedOffAt && (
                                                <div className="flex items-start gap-4">
                                                    <span className="text-slate-600 dark:text-gray-400 text-sm min-w-[70px] mt-0.5">ถึงบ้านเวลา :</span>
                                                    <span className="text-slate-900 dark:text-gray-100 text-sm font-medium leading-relaxed text-brand-primary">
                                                        {new Date(job.patientDroppedOffAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                                                    </span>
                                                </div>
                                            )}

                                            {job?.completedAt && (
                                                <div className="flex items-start gap-4">
                                                    <span className="text-slate-600 dark:text-gray-400 text-sm min-w-[70px] mt-0.5">ถึงเทศบาลเวลา :</span>
                                                    <span className="text-[#2E7D32] text-sm font-semibold leading-relaxed">
                                                        {new Date(job.completedAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {canRequestReturnPickup && (
                                            <div className="px-4 pb-4">
                                                <button
                                                    onClick={() => handleRequestReturnPickup(job.id)}
                                                    disabled={isRequestingPickup}
                                                    className="w-full bg-brand-primary hover:bg-[#166D45] text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
                                                >
                                                    {isRequestingPickup ? 'กำลังเรียกรถ...' : 'เรียกรถกลับ'}
                                                </button>
                                                <p className="text-xs text-slate-500 dark:text-gray-400 mt-2 text-center">
                                                    กดเมื่อเสร็จคิวที่โรงพยาบาล เพื่อเรียกคนขับมารับ
                                                </p>
                                            </div>
                                        )}

                                        {queue.status === 'APPROVED' && (
                                            <>
                                                <div className="border-t-2 border-orange-300 dark:border-orange-600"></div>
                                                <div className="px-4 py-4 bg-orange-50 dark:bg-orange-900/20">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                                        <h4 className="text-sm font-bold text-orange-800 dark:text-orange-300">
                                                            {parsedChanges ? 'เทศบาลได้แก้ไขข้อมูลการจอง' : 'เทศบาลตรวจสอบ/แก้ไขข้อมูลแล้ว — รอยืนยัน'}
                                                        </h4>
                                                    </div>
                                                    {parsedChanges ? (
                                                        <div className="space-y-2">
                                                            {parsedChanges.hospitalName && (
                                                                <div className="bg-white dark:bg-gray-700 p-3 rounded-lg border border-orange-100 dark:border-orange-700 shadow-sm">
                                                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">โรงพยาบาล</p>
                                                                    <p className="text-sm text-red-500 line-through">เดิม: {parsedChanges.hospitalName.from}</p>
                                                                    <div className="flex items-center gap-1 mt-1">
                                                                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                                                                        <span className="text-sm text-green-600 font-bold">ใหม่: {parsedChanges.hospitalName.to}</span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {parsedChanges.requestDate && (
                                                                <div className="bg-white dark:bg-gray-700 p-3 rounded-lg border border-orange-100 dark:border-orange-700 shadow-sm">
                                                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">วันที่จอง</p>
                                                                    <p className="text-sm text-red-500 line-through">เดิม: {parsedChanges.requestDate.from}</p>
                                                                    <div className="flex items-center gap-1 mt-1">
                                                                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                                                                        <span className="text-sm text-green-600 font-bold">ใหม่: {parsedChanges.requestDate.to}</span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {parsedChanges.bookingTime && (
                                                                <div className="bg-white dark:bg-gray-700 p-3 rounded-lg border border-orange-100 dark:border-orange-700 shadow-sm">
                                                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">ช่วงเวลาที่จอง</p>
                                                                    <p className="text-sm text-red-500 line-through">เดิม: {parsedChanges.bookingTime.from}</p>
                                                                    <div className="flex items-center gap-1 mt-1">
                                                                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                                                                        <span className="text-sm text-green-600 font-bold">ใหม่: {parsedChanges.bookingTime.to}</span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-orange-700 dark:text-orange-300">
                                                            กรุณาตรวจสอบข้อมูลและกดยืนยันเพื่อดำเนินการต่อ
                                                        </p>
                                                    )}
                                                    <div className="flex gap-3 mt-4">
                                                        {queue.createdBy && queue.createdBy !== queue.userId ? (
                                                            <div className="w-full text-center py-3 px-4 bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300 text-sm rounded-xl font-medium border border-orange-200 dark:border-orange-800/50">
                                                                การจองนี้ทำโดยผู้ดูแล กรุณาให้ผู้ดูแลของคุณเป็นผู้ยืนยันการแก้ไข
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    onClick={() => handleCancelBooking(queue, editNotification)}
                                                                    disabled={isConfirming || isCancelling}
                                                                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                                                >
                                                                    {isCancelling ? 'กำลังยกเลิก...' : 'ยกเลิกการจอง'}
                                                                </button>
                                                                <button
                                                                    onClick={() => handleConfirmEdit(queue, editNotification)}
                                                                    disabled={isConfirming || isCancelling}
                                                                    className="flex-1 bg-brand-primary hover:bg-[#166D45] text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                                                >
                                                                    {isConfirming ? 'กำลังยืนยัน...' : 'ยืนยันการแก้ไข'}
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        {job?.vehicle && (
                                            <>
                                                <div className="border-t border-slate-100 dark:border-gray-700"></div>
                                                <div className="px-4 py-4 flex items-center justify-between bg-slate-50 dark:bg-gray-800/50">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 overflow-hidden shrink-0 border border-slate-100 dark:border-gray-700 flex items-center justify-center">
                                                            <DirectionsCarIcon className="text-blue-500" style={{ fontSize: 28 }} />
                                                        </div>
                                                        <div>
                                                            <p className="text-slate-500 dark:text-gray-400 text-sm mb-1">รถที่ให้บริการ</p>
                                                            <p className="text-slate-700 dark:text-gray-300 text-sm font-medium mt-1">
                                                                {job.vehicle.brand} {job.vehicle.model} {job.vehicle.color ? `(สี${job.vehicle.color})` : ''}
                                                            </p>
                                                            <p className="text-slate-900 dark:text-gray-100 text-base font-bold flex items-center gap-2 mt-1">
                                                                <span className="text-sm font-normal px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full border border-blue-200">ทะเบียน</span>
                                                                {job.vehicle.licensePlate}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        <div className="border-t border-slate-100 dark:border-gray-700 px-4 py-4 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 overflow-hidden shrink-0 border border-slate-100 dark:border-gray-700">
                                                    {volunteer?.pictureUrl ? (
                                                        <img
                                                            src={getImageUrl(volunteer.pictureUrl)}
                                                            alt="volunteer"
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }}
                                                        />
                                                    ) : null}
                                                    <svg className={`w-full h-full text-orange-300 p-2 ${volunteer?.pictureUrl ? 'hidden' : ''}`} fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <p className="text-slate-500 dark:text-gray-400 text-xs mb-0.5">เจ้าหน้าที่ขับรถ</p>
                                                    <p className="text-slate-900 dark:text-gray-100 text-sm font-bold">
                                                        {volunteer ? `${volunteer.firstName || ''} ${volunteer.lastName || ''}`.trim() : 'รอเทศบาลมอบหมาย'}
                                                    </p>
                                                </div>
                                            </div>

                                            {volunteer?.phone && (
                                                <a
                                                    href={`tel:${volunteer.phone}`}
                                                    className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center shrink-0 shadow-sm active:scale-95 transition-transform"
                                                >
                                                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                    </svg>
                                                </a>
                                            )}
                                        </div>

                                        {job?.careu && (
                                            <>
                                                <div className="border-t border-slate-100 dark:border-gray-700"></div>
                                                <div className="px-4 py-4 flex items-center justify-between bg-pink-50/50 dark:bg-pink-900/10">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 rounded-lg bg-pink-100 dark:bg-pink-900/30 overflow-hidden shrink-0 border border-slate-100 dark:border-gray-700">
                                                            {job.careu.pictureUrl ? (
                                                                <img
                                                                    src={getImageUrl(job.careu.pictureUrl)}
                                                                    alt="careu"
                                                                    className="w-full h-full object-cover"
                                                                    onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }}
                                                                />
                                                            ) : null}
                                                            <svg className={`w-full h-full text-pink-300 p-2 ${job.careu.pictureUrl ? 'hidden' : ''}`} fill="currentColor" viewBox="0 0 24 24">
                                                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                                            </svg>
                                                        </div>
                                                        <div>
                                                            <p className="text-slate-500 dark:text-gray-400 text-xs mb-0.5">จิตอาสาแคร์ยู</p>
                                                            <p className="text-slate-900 dark:text-gray-100 text-sm font-bold">
                                                                {`${job.careu.firstName || ''} ${job.careu.lastName || ''}`.trim()}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {job.careu.phone && (
                                                        <a
                                                            href={`tel:${job.careu.phone}`}
                                                            className="w-10 h-10 bg-pink-500 rounded-xl flex items-center justify-center shrink-0 shadow-sm active:scale-95 transition-transform"
                                                        >
                                                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                            </svg>
                                                        </a>
                                                    )}
                                                </div>
                                            </>
                                        )}

                                        {job && ['PICKING_UP', 'IN_PROGRESS', 'PICKED_UP', 'IN_TRANSIT', 'AT_HOSPITAL', 'RETURN_HOME'].includes(job.status) && (
                                            <div className="p-3.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 dark:from-emerald-950/40 dark:via-teal-950/40 dark:to-emerald-950/40 border-t border-emerald-100 dark:border-emerald-900/50">
                                                <button
                                                    onClick={() => setSelectedTrackingQueue(queue)}
                                                    type="button"
                                                    className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#1E7D55] to-[#13603F] hover:from-[#196B49] hover:to-[#0F4E33] active:scale-[0.99] text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all cursor-pointer"
                                                >
                                                    <span className="relative flex h-3 w-3">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-300"></span>
                                                    </span>
                                                    <span className="text-sm tracking-wide">ดูตำแหน่งเจ้าหน้าที่ (GPS เรียลไทม์)</span>
                                                    <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {selectedTrackingQueue && (
                <LiveTrackingModal
                    queue={selectedTrackingQueue}
                    onClose={() => setSelectedTrackingQueue(null)}
                />
            )}
        </div>
    );
}

