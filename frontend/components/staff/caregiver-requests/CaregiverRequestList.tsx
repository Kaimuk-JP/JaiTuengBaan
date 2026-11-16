'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchWithAuth } from '@/lib/auth';
import { useSocket, Notification } from '@/contexts/SocketContext';
import Swal from '@/lib/swal';
import CaregiverRequestFilter from './CaregiverRequestFilter';
import CaregiverRequestTable, { CaregiverPatientRequest } from './CaregiverRequestTable';
import CaregiverRequestDetailModal from './CaregiverRequestDetailModal';

export default function CaregiverRequestList() {
    const { socket } = useSocket();
    const [requests, setRequests] = useState<CaregiverPatientRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
    const [selectedRequest, setSelectedRequest] = useState<CaregiverPatientRequest | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { user: currentUser } = useAuth();

    const fetchRequests = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (selectedStatuses.length > 0) {
                selectedStatuses.forEach(status => params.append('status', status));
            }

            const response = await fetchWithAuth(`/caregiver/requests?${params.toString()}`);
            if (response.ok) {
                const result = await response.json();
                const rawData = Array.isArray(result) ? result : (result.data || []);
                const data = rawData.map((req: any) => ({
                    ...req,
                    caregiver: req.caregiver ? {
                        ...req.caregiver,
                        displayName: req.caregiver.displayName ||
                            `${req.caregiver.firstName || ''} ${req.caregiver.lastName || ''}`.trim() || '-'
                    } : null,
                    patient: req.patient ? {
                        ...req.patient,
                        displayName: req.patient.displayName ||
                            `${req.patient.firstName || ''} ${req.patient.lastName || ''}`.trim() || '-'
                    } : null,
                }));
                setRequests(data);
            }
        } catch (error) {
            console.error('Error fetching caregiver requests:', error);
        } finally {
            setLoading(false);
        }
    }, [selectedStatuses]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    useEffect(() => {
        if (!socket) return;

        const handleNotification = (notification: Notification) => {
            fetchRequests();
        };

        const handleRefresh = () => {
            fetchRequests();
        };

        socket.on('notification', handleNotification);
        socket.on('refresh_caregiver_requests', handleRefresh);

        return () => {
            socket.off('notification', handleNotification);
            socket.off('refresh_caregiver_requests', handleRefresh);
        };
    }, [socket, fetchRequests]);

    const handleApprove = async (requestId: number) => {
        try {
            const result = await Swal.fire({
                title: 'ยืนยันการอนุมัติ',
                text: 'คุณต้องการอนุมัติคำขอนี้หรือไม่?',
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#1E7D55',
                cancelButtonColor: '#6B7280',
                confirmButtonText: 'อนุมัติ',
                cancelButtonText: 'ยกเลิก',
            });

            if (!result.isConfirmed) return;

            const response = await fetchWithAuth(`/caregiver/requests/${requestId}/approve`, {
                method: 'PUT',
            });

            if (response.ok) {
                await Swal.fire({
                    icon: 'success',
                    title: 'อนุมัติสำเร็จ',
                    text: 'ผู้ดูแลประชาชนสามารถดูแลประชาชนได้แล้ว',
                    timer: 2000,
                    showConfirmButton: false,
                });
                setIsModalOpen(false);
                fetchRequests();
            }
        } catch (error) {
            console.error('Error approving request:', error);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถอนุมัติได้',
            });
        }
    };

    const handleReject = async (requestId: number) => {
        try {
            const result = await Swal.fire({
                title: 'ปฏิเสธคำขอ',
                input: 'textarea',
                inputLabel: 'กรุณาระบุเหตุผล',
                inputPlaceholder: 'พิมพ์เหตุผล...',
                showCancelButton: true,
                confirmButtonColor: '#EF4444',
                confirmButtonText: 'ปฏิเสธ',
                cancelButtonText: 'ยกเลิก',
                inputValidator: (value: string) => (!value ? 'กรุณาระบุเหตุผล' : null),
            });

            if (!result.isConfirmed || !result.value) return;

            const response = await fetchWithAuth(`/caregiver/requests/${requestId}/reject`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rejectReason: result.value }),
            });

            if (response.ok) {
                await Swal.fire({
                    icon: 'success',
                    title: 'ปฏิเสธคำขอแล้ว',
                    timer: 2000,
                    showConfirmButton: false,
                });
                setIsModalOpen(false);
                fetchRequests();
            }
        } catch (error) {
            console.error('Error rejecting request:', error);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถปฏิเสธได้',
            });
        }
    };

    const toggleStatusFilter = (status: string) => {
        setSelectedStatuses(prev =>
            prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
        );
    };

    const clearFilters = () => {
        setSelectedStatuses([]);
    };

    const filteredRequests = requests.filter((req) => {
        const createdAtStr = new Date(req.createdAt).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        const matchesSearch =
            req.caregiver?.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.patient?.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            createdAtStr.includes(searchTerm);
        return matchesSearch;
    }).sort((a, b) => {
        if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
        if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
        return 0;
    });

    return (
        <div className="p-3x pt-1x pb-40 bg-white min-h-screen">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                { }
                <CaregiverRequestFilter
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    selectedStatuses={selectedStatuses}
                    onStatusToggle={toggleStatusFilter}
                    onClearFilters={clearFilters}
                />

                { }
                <div className="bg-white min-h-[calc(100vh-280px)] overflow-x-auto">
                    <CaregiverRequestTable
                        loading={loading}
                        requests={filteredRequests}
                        onViewDetail={(req) => {
                            setSelectedRequest(req);
                            setIsModalOpen(true);
                        }}
                    />
                </div>
            </div>

            { }
            <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-between z-30">
                <span className="text-sm text-slate-500">
                    หน้า 1 จาก 1 หน้า
                </span>
                <div className="flex gap-2">
                    <button
                        disabled
                        className="px-4 py-2 text-sm bg-white border border-slate-200 rounded text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        ก่อนหน้า
                    </button>
                    <button
                        disabled
                        className="px-4 py-2 text-sm bg-white border border-slate-200 rounded text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        ถัดไป
                    </button>
                </div>
            </div>

            { }
            {isModalOpen && selectedRequest && (
                <CaregiverRequestDetailModal
                    request={selectedRequest}
                    onClose={() => setIsModalOpen(false)}
                    onApprove={handleApprove}
                    onReject={handleReject}
                />
            )}
        </div>
    );
}
