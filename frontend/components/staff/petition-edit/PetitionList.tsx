'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchWithAuth } from '@/lib/auth';
import Swal from '@/lib/swal';
import PetitionFilter from './PetitionFilter';
import PetitionTable, { EditRequest } from './PetitionTable';
import PetitionDetailModal from './PetitionDetailModal';

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

export default function PetitionList() {
    const { user: currentUser } = useAuth();
    const [requests, setRequests] = useState<EditRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    const [pagination, setPagination] = useState<Pagination>({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
    });

    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

    const [selectedRequest, setSelectedRequest] = useState<EditRequest | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchRequests();
    }, [currentPage, selectedStatuses]);

    const fetchRequests = async () => {
        try {
            setLoading(true);

            const params = new URLSearchParams();
            params.append('page', currentPage.toString());
            params.append('limit', itemsPerPage.toString());

            if (selectedStatuses.length > 0) {
                selectedStatuses.forEach(status => params.append('status', status));
            }

            const response = await fetchWithAuth(`/profile-edit-requests?${params.toString()}`);
            const result = await response.json();

            setRequests(result.data || []);
            setPagination(result.pagination || {
                page: 1,
                limit: 10,
                total: 0,
                totalPages: 0,
                hasNextPage: false,
                hasPrevPage: false,
            });
            setLoading(false);
        } catch (error) {
            console.error('Error fetching edit requests:', error);
            setLoading(false);
        }
    };

    const toggleStatusFilter = (status: string) => {
        setSelectedStatuses(prev =>
            prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
        );
        setCurrentPage(1);
    };

    const clearFilters = () => {
        setSelectedStatuses([]);
        setCurrentPage(1);
    };

    const handleApprove = async (requestId: number) => {
        try {
            const result = await Swal.fire({
                title: 'ยืนยันการอนุมัติ?',
                text: 'คุณต้องการอนุมัติคำร้องขอแก้ไขข้อมูลนี้หรือไม่? ข้อมูลจะถูกอัปเดตทันที',
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#16a34a',
                cancelButtonColor: '#6b7280',
                confirmButtonText: 'อนุมัติ',
                cancelButtonText: 'ยกเลิก',
            });

            if (!result.isConfirmed) return;

            const response = await fetchWithAuth(`/profile-edit-requests/${requestId}/review`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'approve' }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'ไม่สามารถอนุมัติคำร้องได้');
            }

            Swal.fire({
                icon: 'success',
                title: 'สำเร็จ!',
                text: 'อนุมัติคำร้องเรียบร้อยแล้ว ข้อมูลผู้ใช้ได้รับการอัปเดต',
                timer: 2000,
                showConfirmButton: false,
            });

            setIsModalOpen(false);
            fetchRequests();
        } catch (error: any) {
            console.error('Error approving request:', error);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: error.message || 'ไม่สามารถอนุมัติคำร้องได้',
            });
        }
    };

    const handleReject = async (requestId: number) => {
        try {
            const result = await Swal.fire({
                title: 'ปฏิเสธคำร้อง',
                input: 'textarea',
                inputLabel: 'กรุณาระบุเหตุผลในการปฏิเสธ',
                inputPlaceholder: 'พิมพ์เหตุผล...',
                showCancelButton: true,
                confirmButtonColor: '#dc2626',
                cancelButtonColor: '#6b7280',
                confirmButtonText: 'ยืนยันการปฏิเสธ',
                cancelButtonText: 'ยกเลิก',
                inputValidator: (value: string) => {
                    if (!value) {
                        return 'กรุณาระบุเหตุผล';
                    }
                }
            });

            if (!result.isConfirmed || !result.value) return;

            const response = await fetchWithAuth(`/profile-edit-requests/${requestId}/review`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'reject', rejectReason: result.value }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'ไม่สามารถปฏิเสธคำร้องได้');
            }

            Swal.fire({
                icon: 'success',
                title: 'สำเร็จ!',
                text: 'ปฏิเสธคำร้องเรียบร้อยแล้ว',
                timer: 2000,
                showConfirmButton: false,
            });

            setIsModalOpen(false);
            fetchRequests();
        } catch (error: any) {
            console.error('Error rejecting request:', error);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: error.message || 'ไม่สามารถปฏิเสธคำร้องได้',
            });
        }
    };

    const filteredRequests = requests.filter(req => {
        const fullName = req.user?.displayName || `${req.user?.firstName || ''} ${req.user?.lastName || ''}`.trim();

        const dateStr = new Date(req.createdAt).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });

        const searchTermLower = searchTerm.toLowerCase();

        const matchesSearch = !searchTerm ||
            fullName.toLowerCase().includes(searchTermLower) ||
            dateStr.includes(searchTerm);

        return matchesSearch;
    }).sort((a, b) => {
        if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
        if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
        return 0;
    });

    return (
        <main className="p-3x pb-20 bg-white min-h-screen">

            {}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">

                {}
                <PetitionFilter
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    selectedStatuses={selectedStatuses}
                    onStatusToggle={toggleStatusFilter}
                    onClearFilters={clearFilters}
                />

                {}
                <div className="bg-white min-h-[calc(100vh-280px)] overflow-x-auto">
                    <PetitionTable
                        loading={loading}
                        requests={filteredRequests}
                        onViewDetail={(req) => {
                            setSelectedRequest(req);
                            setIsModalOpen(true);
                        }}
                    />
                </div>
            </div>
            {}

            {}
            <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-between z-30">
                <span className="text-sm text-slate-500">
                    หน้า {currentPage} จาก {Math.max(1, pagination.totalPages)} หน้า
                </span>
                <div className="flex gap-2">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={!pagination.hasPrevPage}
                        className="px-4 py-2 text-sm bg-white border border-slate-200 rounded text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        ก่อนหน้า
                    </button>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                        disabled={!pagination.hasNextPage}
                        className="px-4 py-2 text-sm bg-white border border-slate-200 rounded text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        ถัดไป
                    </button>
                </div>
            </div>

            {}
            {isModalOpen && selectedRequest && (
                <PetitionDetailModal
                    request={selectedRequest}
                    onClose={() => setIsModalOpen(false)}
                    onApprove={handleApprove}
                    onReject={handleReject}
                />
            )}
        </main>
    );
}
