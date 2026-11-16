'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket, Notification } from '@/contexts/SocketContext';
import { fetchWithAuth } from '@/lib/auth';
import Swal from '@/lib/swal';
import PatientDetailModal from '@/components/staff/petition/PatientDetailModal';
import AssignVolunteerModal from '@/components/staff/petition/AssignVolunteerModal/index';
import LocationMapModal from '@/components/staff/LocationMapModal';
import PetitionFilter from './PetitionFilter';
import PetitionTable, { Queue } from './PetitionTable';
import { useExecutiveApprovalEnabled } from '@/hooks/useExecutiveApprovalEnabled';

export default function PetitionList() {
    const { user: currentUser } = useAuth();
    const { socket } = useSocket();
    const { executiveApprovalEnabled } = useExecutiveApprovalEnabled();
    const [requests, setRequests] = useState<Queue[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    const fetchLimit = 1000;

    const [pagination, setPagination] = useState({
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
    });

    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
    const [selectedMobilities, setSelectedMobilities] = useState<string[]>([]);

    const [selectedQueue, setSelectedQueue] = useState<Queue | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [approvedQueueId, setApprovedQueueId] = useState<number | null>(null);
    const [isReassignMode, setIsReassignMode] = useState(false);
    const [existingJobId, setExistingJobId] = useState<number | null>(null);
    const [mapQueue, setMapQueue] = useState<Queue | null>(null);
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);

    const fetchRequests = useCallback(async () => {
        try {
            setLoading(true);

            const params = new URLSearchParams();
            params.append('page', '1');
            params.append('limit', fetchLimit.toString());

            const allowedStatuses = ['PENDING_MUNICIPAL', 'APPROVED', 'PENDING_EXECUTIVE', 'EXECUTIVE_REJECTED', 'CONFIRMED'];
            if (selectedStatuses.length > 0) {
                selectedStatuses.forEach(status => params.append('status', status));
            } else {
                allowedStatuses.forEach(status => params.append('status', status));
            }

            if (selectedMobilities.length > 0) {
                selectedMobilities.forEach(mobility => params.append('mobilityStatus', mobility));
            }

            const response = await fetchWithAuth(`/queues?${params.toString()}`);
            const result = await response.json();

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const validData = (result.data || []).filter((req: Queue) => {
                const requestDate = new Date(req.requestDate);
                requestDate.setHours(0, 0, 0, 0);

                if (requestDate.getTime() < today.getTime()) {
                    return false;
                }

                if (req.status === 'PENDING_MUNICIPAL' || req.status === 'APPROVED' || req.status === 'PENDING_EXECUTIVE' || req.status === 'EXECUTIVE_REJECTED') return true;
                if (req.status === 'CONFIRMED') {
                    if (!req.job || req.job.status === 'OPEN' || !req.job.vltId || (req.wantCareU && !req.job.careuId)) return true;
                    return false;
                }
                return false;
            });

            setRequests(validData);
            setPagination(result.pagination || {
                total: 0,
                totalPages: 0,
                hasNextPage: false,
                hasPrevPage: false,
            });

            setLoading(false);
        } catch (error) {
            console.error('Error fetching requests:', error);
            setLoading(false);
        }
    }, [currentPage, selectedStatuses, selectedMobilities]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    useEffect(() => {
        if (!socket) return;

        const handleNotification = (notification: Notification) => {
            if (['QUEUE_CREATED', 'JOB_STATUS_UPDATED', 'QUEUE_STATUS_UPDATED', 'QUEUE_EXECUTIVE_REJECTED', 'QUEUE_PENDING_EXECUTIVE'].includes(notification.type)) {
                fetchRequests();
            } else {
                fetchRequests();
            }
        };

        const handleRefresh = () => {
            fetchRequests();
        };

        socket.on('notification', handleNotification);
        socket.on('refresh_queues', handleRefresh);
        socket.on('refresh_dashboard', handleRefresh);
        socket.on('refresh_jobs', handleRefresh);

        return () => {
            socket.off('notification', handleNotification);
            socket.off('refresh_queues', handleRefresh);
            socket.off('refresh_dashboard', handleRefresh);
            socket.off('refresh_jobs', handleRefresh);
        };
    }, [socket, fetchRequests]);

    const toggleStatusFilter = (status: string) => {
        setSelectedStatuses(prev =>
            prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
        );
        setCurrentPage(1);
    };

    const toggleMobilityFilter = (mobility: string) => {
        setSelectedMobilities(prev =>
            prev.includes(mobility) ? prev.filter(s => s !== mobility) : [...prev, mobility]
        );
        setCurrentPage(1);
    };

    const clearFilters = () => {
        setSelectedStatuses([]);
        setSelectedMobilities([]);
        setCurrentPage(1);
    };

    const handleCardClick = (queue: Queue) => {
        setSelectedQueue(queue);
        setIsModalOpen(true);
    };

    const handleApprove = async (queueId: number) => {
        try {
            if (!currentUser) return;

            const targetQueue = requests.find(r => r.id === queueId) || selectedQueue;
            const isExecutiveAction = (currentUser.role === 'EXECUTIVE' || currentUser.role === 'ADMIN') && targetQueue?.status === 'PENDING_EXECUTIVE';

            const endpoint = isExecutiveAction
                ? `/queues/${queueId}/executive-approve`
                : `/queues/${queueId}/approve`;
            const response = await fetchWithAuth(endpoint, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                ...(isExecutiveAction ? {} : { body: JSON.stringify({ staffId: currentUser.id }) }),
            });

            if (response.ok) {
                await fetchRequests();
                Swal.fire({
                    icon: 'success',
                    title: isExecutiveAction ? 'ผู้บริหารอนุมัติสำเร็จ' : 'ส่งต่อผู้บริหารสำเร็จ',
                    timer: 1500,
                    showConfirmButton: false,
                });
            } else {
                const errData = await response.json().catch(() => ({}));
                Swal.fire({ icon: 'error', title: 'ไม่สามารถรับคำร้องได้', text: errData.message || 'กรุณาลองใหม่' });
            }
        } catch (error) {
            console.error(error);
            Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: 'กรุณาลองใหม่' });
        }
    };

    const handleAssignClick = (queue: Queue) => {
        setApprovedQueueId(queue.id);
        setIsReassignMode(false);
        setExistingJobId(null);
        setIsAssignModalOpen(true);
    };

    const handleReassignClick = (queue: Queue) => {
        setApprovedQueueId(queue.id);
        setIsReassignMode(true);
        setExistingJobId(queue.job?.id || null);
        setIsAssignModalOpen(true);
    };

    const handleShowLocation = (queue: Queue) => {
        setMapQueue(queue);
        setIsMapModalOpen(true);
    };

    const handleCancelClick = async (queue: Queue) => {
        const result = await Swal.fire({
            title: 'ยกเลิกคำร้อง',
            html: `<p>คุณต้องการยกเลิกคำร้องของ <strong>${queue.user?.displayName || `${queue.user?.firstName || ''} ${queue.user?.lastName || ''}`.trim()}</strong> ใช่หรือไม่?</p>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'ยืนยันยกเลิก',
            cancelButtonText: 'ไม่ใช่',
        });

        if (!result.isConfirmed) return;

        try {
            const response = await fetchWithAuth(`/queues/${queue.id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                await fetchRequests();
                Swal.fire({ icon: 'success', title: 'ยกเลิกคำร้องสำเร็จ', timer: 1500, showConfirmButton: false });
            } else {
                const errData = await response.json().catch(() => ({}));
                Swal.fire({ icon: 'error', title: 'ไม่สามารถยกเลิกได้', text: errData.message || 'กรุณาลองใหม่' });
            }
        } catch (error) {
            console.error('Error cancelling queue:', error);
            Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: 'กรุณาลองใหม่' });
        }
    };

    const handleResubmitToExecutive = async (queueId: number) => {
        try {
            if (!currentUser) return;

            const response = await fetchWithAuth(`/queues/${queueId}/resubmit-executive`, {
                method: 'PUT',
            });

            if (response.ok) {
                await fetchRequests();
                Swal.fire({
                    icon: 'success',
                    title: 'ส่งกลับผู้บริหารสำเร็จ',
                    timer: 1500,
                    showConfirmButton: false,
                });
            } else {
                const errData = await response.json().catch(() => ({}));
                Swal.fire({ icon: 'error', title: 'ไม่สามารถส่งกลับผู้บริหารได้', text: errData.message || 'กรุณาลองใหม่' });
            }
        } catch (error) {
            console.error(error);
            Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: 'กรุณาลองใหม่' });
        }
    };

    const handleReject = async (queueId: number) => {
        try {
            if (!currentUser) return;

            const targetQueue = requests.find(r => r.id === queueId) || selectedQueue;
            const isExecutive = (currentUser.role === 'EXECUTIVE' || currentUser.role === 'ADMIN') && targetQueue?.status === 'PENDING_EXECUTIVE';
            const result = await Swal.fire({
                title: isExecutive ? 'ส่งกลับให้เจ้าหน้าที่แก้ไข' : 'ปฏิเสธคำร้อง',
                input: 'textarea',
                inputLabel: 'กรุณาระบุเหตุผล',
                inputPlaceholder: isExecutive ? 'ระบุสิ่งที่ต้องแก้ไข...' : 'พิมพ์เหตุผล...',
                showCancelButton: true,
                confirmButtonColor: '#dc2626',
                confirmButtonText: 'ยืนยัน',
                cancelButtonText: 'ยกเลิก',
                inputValidator: (value: string) => !value ? 'กรุณาระบุเหตุผล' : null
            });

            if (!result.isConfirmed || !result.value) return;

            const endpoint = isExecutive
                ? `/queues/${queueId}/executive-reject`
                : `/queues/${queueId}/reject`;
            const response = await fetchWithAuth(endpoint, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: isExecutive
                    ? JSON.stringify({ rejectReason: result.value })
                    : JSON.stringify({ staffId: currentUser.id, rejectReason: result.value }),
            });

            if (response.ok) {
                await fetchRequests();
                Swal.fire({
                    icon: 'success',
                    title: isExecutive ? 'ส่งกลับให้เจ้าหน้าที่แก้ไขแล้ว' : 'ปฏิเสธคำร้องแล้ว',
                    timer: 1500,
                    showConfirmButton: false,
                });
            }
        } catch (error) {
            console.error(error);
        }
    };

    const filteredRequests = requests.filter(req => {
        const fullName = req.user?.displayName || `${req.user?.firstName || ''} ${req.user?.lastName || ''}`.trim();
        const requestDateStr = new Date(req.requestDate).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });

        const matchesSearch = fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.hospitalName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.hospital?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            requestDateStr.includes(searchTerm);

        let matchesStatus = true;
        if (selectedStatuses.length > 0) {
            const jobStatus = (req as any).job?.status;
            matchesStatus = selectedStatuses.some(s => {
                const jobStatuses = ['ASSIGNED', 'ACCEPTED', 'PICKING_UP', 'IN_TRANSIT', 'RETURN_HOME', 'RETURN_OFFICE', 'COMPLETED'];
                if (jobStatuses.includes(s)) return jobStatus === s;
                return req.status === s;
            });
        }

        const matchesMobility = selectedMobilities.length === 0 || selectedMobilities.includes(req.user?.mobilityStatus);
        return matchesSearch && matchesStatus && matchesMobility;
    }).sort((a, b) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTime = today.getTime();

        const dateA = new Date(a.requestDate).getTime();
        const dateB = new Date(b.requestDate).getTime();

        const isPastA = dateA < todayTime;
        const isPastB = dateB < todayTime;

        if (isPastA && !isPastB) return 1;
        if (!isPastA && isPastB) return -1;

        const getPriority = (req: any) => {
            if (req.status === 'PENDING_MUNICIPAL') return 1;
            if (req.status === 'EXECUTIVE_REJECTED') return 1;
            if (req.status === 'PENDING_EXECUTIVE') return 2;
            if (req.status === 'CONFIRMED' && (!req.job?.status || req.job?.status === 'OPEN')) return 3;
            if (req.status === 'APPROVED') return 4;
            if (req.job?.status === 'ASSIGNED') return 4;
            return 5;
        };

        const priorityA = getPriority(a);
        const priorityB = getPriority(b);

        if (priorityA !== priorityB) {
            return priorityA - priorityB;
        }

        if (dateA !== dateB) {
            return dateA - dateB;
        }

        return a.id - b.id;
    });

    const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
    const paginatedRequests = filteredRequests.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );
    const canAssignQueues = currentUser?.role === 'STAFF' || currentUser?.role === 'ADMIN';

    return (
        <div className="p-3x pt-1x pb-40 bg-white min-h-screen">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <PetitionFilter
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    selectedStatuses={selectedStatuses}
                    onStatusToggle={toggleStatusFilter}
                    selectedMobilities={selectedMobilities}
                    onMobilityToggle={toggleMobilityFilter}
                    onClearFilters={clearFilters}
                    executiveApprovalEnabled={executiveApprovalEnabled}
                />

                <div className="bg-white min-h-[calc(100vh-280px)] overflow-x-auto">
                    <PetitionTable
                        loading={loading}
                        requests={paginatedRequests}
                        onViewDetail={handleCardClick}
                        onAssignClick={canAssignQueues ? handleAssignClick : undefined}
                        onReassignClick={canAssignQueues ? handleReassignClick : undefined}
                        onCancelClick={handleCancelClick}
                        currentUserRole={currentUser?.role}
                        executiveApprovalEnabled={executiveApprovalEnabled}
                    />
                </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-between z-30">
                <span className="text-sm text-slate-500">
                    หน้า {currentPage} จาก {Math.max(1, totalPages)} หน้า
                </span>
                <div className="flex gap-2">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 text-sm bg-white border border-slate-200 rounded text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        ก่อนหน้า
                    </button>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage >= totalPages}
                        className="px-4 py-2 text-sm bg-white border border-slate-200 rounded text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        ถัดไป
                    </button>
                </div>
            </div>

            <PatientDetailModal
                queue={selectedQueue}
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); fetchRequests(); }}
                onApprove={handleApprove}
                onReject={handleReject}
                onResubmitToExecutive={handleResubmitToExecutive}
                userRole={currentUser?.role}
                executiveApprovalEnabled={executiveApprovalEnabled}
            />

            <AssignVolunteerModal
                isOpen={isAssignModalOpen}
                onClose={() => { setIsAssignModalOpen(false); setIsReassignMode(false); setExistingJobId(null); }}
                queueId={approvedQueueId || 0}
                onAssign={() => {
                    fetchRequests();
                }}
                isReassign={isReassignMode}
                existingJobId={existingJobId || undefined}
            />

            {isMapModalOpen && mapQueue && (
                <LocationMapModal
                    queue={mapQueue as any}
                    onClose={() => {
                        setIsMapModalOpen(false);
                        setMapQueue(null);
                    }}
                />
            )}
        </div>
    );
}
