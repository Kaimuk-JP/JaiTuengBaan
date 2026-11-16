'use client';

import { useState, useEffect, useCallback } from 'react';
import LocationMapModal from '@/components/staff/LocationMapModal';
import { fetchWithAuth } from '@/lib/auth';
import { useSocket, Notification } from '@/contexts/SocketContext';
import Swal from '@/lib/swal';
import JobReportFilter from './JobReportFilter';
import JobReportTable, { Job } from './JobReportTable';

export default function JobReportList() {
    const { socket } = useSocket();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const itemsPerPage = 20;

    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

    const fetchJobs = useCallback(async (page: number = 1) => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            params.append('page', page.toString());
            params.append('limit', itemsPerPage.toString());

            if (selectedStatuses.length > 0) {
                selectedStatuses.forEach(status => params.append('status', status));
            }

            const response = await fetchWithAuth(`/queues?${params.toString()}`);
            if (!response.ok) {
                throw new Error('ไม่สามารถดึงข้อมูลได้');
            }

            const data = await response.json();
            const queuesArray = data.data || [];

            const mappedJobs = queuesArray.map((q: any) => ({
                id: q.job?.id || q.id,
                queue: q,
                vlt: q.job?.vlt,
                status: q.job?.status || q.status,
                assignedAt: q.job?.createdAt || q.createdAt,
            }));

            const statusPriority: Record<string, number> = {
                'PENDING_MUNICIPAL': 1,
                'PENDING': 1,
                'APPROVED': 2,
                'CONFIRMED': 3,
                'OPEN': 4,
                'ASSIGNED': 5,
                'ACCEPTED': 6,
                'PICKING_UP': 7,
                'IN_PROGRESS': 7,
                'PICKED_UP': 8,
                'IN_TRANSIT': 9,
                'RETURN_HOME': 10,
                'RETURN_OFFICE': 11,
                'COMPLETED': 12,
                'REJECTED': 13,
                'CANCELLED': 14,
                'CANCELLED_BY_USER': 15
            };

            mappedJobs.sort((a: any, b: any) => {
                const priorityA = statusPriority[a.status] || 99;
                const priorityB = statusPriority[b.status] || 99;

                if (priorityA !== priorityB) {
                    return priorityA - priorityB;
                }

                return new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime();
            });

            setJobs(mappedJobs);

            if (data.pagination) {
                setTotal(data.pagination.total);
                setTotalPages(data.pagination.totalPages);
            } else {
                setTotal(queuesArray.length);
                setTotalPages(1);
            }
        } catch (error: any) {
            console.error('Error fetching jobs:', error);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: error.message || 'ไม่สามารถโหลดข้อมูลได้',
            });
        } finally {
            setLoading(false);
        }
    }, [selectedStatuses]);

    useEffect(() => {
        fetchJobs(currentPage);
    }, [currentPage, fetchJobs]);

    useEffect(() => {
        if (!socket) return;

        const handleNotification = (notification: Notification) => {
            fetchJobs(currentPage);
        };

        const handleRefresh = () => {
             fetchJobs(currentPage);
        };

        socket.on('notification', handleNotification);
        socket.on('refresh_queues', handleRefresh);
        socket.on('refresh_jobs', handleRefresh);

        return () => {
            socket.off('notification', handleNotification);
            socket.off('refresh_queues', handleRefresh);
            socket.off('refresh_jobs', handleRefresh);
        };
    }, [socket, currentPage, fetchJobs]);

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

    const handleShowLocation = (job: Job) => {
        setSelectedJob(job);
        setIsMapModalOpen(true);
    };

    const filteredJobs = jobs.filter(job => {
        const searchLower = searchTerm.toLowerCase();
        const userName = job.queue?.user?.displayName || `${job.queue?.user?.firstName || ''} ${job.queue?.user?.lastName || ''}`;
        return (
            userName.toLowerCase().includes(searchLower) ||
            job.queue?.hospitalName?.toLowerCase().includes(searchLower) ||
            job.queue?.hospital?.name?.toLowerCase().includes(searchLower) ||
            job.vlt?.displayName?.toLowerCase().includes(searchLower)
        );
    });

    return (
        <div className="p-3x pb-20">
            {}
            <div className="flex-1 bg-white rounded-square-hard border border-border-neutral shadow-smooth-low overflow-hidden min-h-[calc(92vh-160px)]">
                {}
                <JobReportFilter
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    selectedStatuses={selectedStatuses}
                    onStatusToggle={toggleStatusFilter}
                    onClearFilters={clearFilters}
                />

                {}
                <JobReportTable
                    loading={loading}
                    jobs={filteredJobs}
                    onShowLocation={handleShowLocation}
                />
            </div>

            {}
            <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-between z-30">
                <div className="text-sm text-text-tertiary font-medium">
                    แสดงหน้า {currentPage} จาก {totalPages}
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 text-sm font-medium text-text-primary border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        ก่อนหน้า
                    </button>

                    {}
                    {(() => {
                        const pages: number[] = [];
                        let start = Math.max(1, currentPage - 2);
                        let end = Math.min(totalPages, currentPage + 2);

                        if (currentPage <= 2) {
                            end = Math.min(5, totalPages);
                        }
                        if (currentPage >= totalPages - 1) {
                            start = Math.max(1, totalPages - 4);
                        }

                        for (let i = start; i <= end; i++) {
                            if (i >= 1 && i <= totalPages) {
                                pages.push(i);
                            }
                        }

                        return pages.map(pageNum => (
                            <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${pageNum === currentPage
                                    ? 'bg-brand-primary text-white'
                                    : 'border border-slate-300 hover:bg-slate-50 text-text-primary'
                                    }`}
                            >
                                {pageNum}
                            </button>
                        ));
                    })()}

                    <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 text-sm font-medium text-text-primary border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        ถัดไป
                    </button>
                </div>
            </div>

            {}
            {
                isMapModalOpen && selectedJob && (
                    <>
                        {}
                        <div
                            className="fixed inset-0 bg-black/50 z-40"
                            onClick={() => setIsMapModalOpen(false)}
                        />

                        {}
                        <LocationMapModal
                            queue={{
                                id: selectedJob.id,
                                user: {
                                    id: selectedJob.queue.user.id || 0,
                                    displayName: selectedJob.queue.user.displayName,
                                    firstName: selectedJob.queue.user.firstName,
                                    lastName: selectedJob.queue.user.lastName,
                                    phone: selectedJob.queue.user.phone,
                                    addressDetail: selectedJob.queue.user.addressDetail,
                                    lat: selectedJob.queue.user.lat,
                                    lng: selectedJob.queue.user.lng,
                                    mobilityStatus: selectedJob.queue.user.mobilityStatus,
                                    pictureUrl: selectedJob.queue.user.pictureUrl,
                                },
                                hospitalName: selectedJob.queue.hospital?.name || selectedJob.queue.hospitalName,
                                requestDate: selectedJob.queue.requestDate,
                                bookingTime: selectedJob.queue.bookingTime,
                                job: selectedJob.vlt ? {
                                    id: selectedJob.id,
                                    status: selectedJob.status,
                                    vltId: selectedJob.vlt.id,
                                    vlt: {
                                        id: selectedJob.vlt.id || 0,
                                        displayName: selectedJob.vlt.displayName,
                                        phone: selectedJob.vlt.phone,
                                        lat: selectedJob.vlt.lat,
                                        lng: selectedJob.vlt.lng,
                                    }
                                } : undefined
                            }}
                            onClose={() => setIsMapModalOpen(false)}
                        />
                    </>
                )
            }
        </div >
    );
}
