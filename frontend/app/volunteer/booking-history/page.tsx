'use client';

import { useEffect, useState } from 'react';
import HeaderVolunteer from '@/components/volunteer/header/HeaderVolunteer';
import { VolunteerSidebar } from '@/components/volunteer/sidebar';
import { fetchWithAuth } from '@/lib/auth';
import ProtectedRoute from '@/components/shared/ProtectedRoute';

interface Job {
    id: number;
    status: string;
    queue: {
        id: number;
        hospitalName: string;
        requestDate: string;
        user: {
            displayName: string;
            phone: string;
        };
    };
    createdAt: string;
    completedAt?: string;
}

function BookingHistoryContent() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const profileRes = await fetchWithAuth('/auth/profile');
                if (!profileRes.ok) throw new Error('ไม่สามารถดึงข้อมูลโปรไฟล์ได้');
                const profile = await profileRes.json();

                const jobsRes = await fetchWithAuth(`/jobs/assigned-to/${profile.id}`);
                if (!jobsRes.ok) throw new Error('ไม่สามารถดึงข้อมูลงานได้');
                const jobsData = await jobsRes.json();

                setJobs(jobsData);
            } catch (err: any) {
                console.error('Error fetching booking history:', err);
                setError(err.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล');
            } finally {
                setLoading(false);
            }
        };

        fetchJobs();
    }, []);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ASSIGNED':
                return <span className="px-2x py-1x bg-glacier-light text-glacier-dark rounded-circle typo-tags">ได้รับมอบหมาย</span>;
            case 'ACCEPTED':
                return <span className="px-2x py-1x bg-saffron-light text-saffron-dark rounded-circle typo-tags">รับงานแล้ว</span>;
            case 'PICKING_UP':
                return <span className="px-2x py-1x bg-fuji-light text-text-primary rounded-circle typo-tags">กำลังให้บริการ</span>;
            case 'COMPLETED':
                return <span className="px-2x py-1x bg-apple-soft text-brand-primary rounded-circle typo-tags">เสร็จสิ้น</span>;
            case 'REJECTED':
                return <span className="px-2x py-1x bg-fuan-light text-fuan-dark rounded-circle typo-tags">ปฏิเสธแล้ว</span>;
            default:
                return <span className="px-2x py-1x bg-field-default text-text-tertiary rounded-circle typo-tags">{status}</span>;
        }
    };

    return (
        <div className="p-3x md:p-4x pt-20 max-w-2xl mx-auto">
            <h1 className=" font-bold mb-3x text-text-primary">ข้อมูลการจองคิว</h1>

            {error && (
                <div className="bg-fuan-light text-fuan-dark p-3x rounded-square mb-3x">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="text-center py-6x">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-primary mx-auto"></div>
                    <p className="mt-2x typo-body text-text-tertiary">กำลังโหลดข้อมูล...</p>
                </div>
            ) : jobs.length === 0 ? (
                <div className="text-center py-6x bg-white rounded-square-hard shadow-smooth-low">
                    <p className="typo-body text-text-tertiary">ไม่พบประวัติการจองคิว</p>
                </div>
            ) : (
                <div className="grid gap-2x">
                    {jobs.map((job) => (
                        <div key={job.id} className="bg-white rounded-square-hard shadow-smooth-low p-3x hover:shadow-smooth-medium transition-shadow">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2x">
                                <div>
                                    <div className="flex items-center gap-1x mb-1x">
                                        <h3 className="font-bold typo-body text-text-primary">งาน #{job.id}</h3>
                                        {getStatusBadge(job.status)}
                                    </div>
                                    <p className="typo-menu text-text-tertiary mb-1x">
                                        <span className="font-semibold">ประชาชน:</span> {job.queue.user.displayName}
                                    </p>
                                    <p className="typo-menu text-text-tertiary mb-1x">
                                        <span className="font-semibold">สถานที่:</span> {job.queue.hospitalName}
                                    </p>
                                    <p className="typo-menu text-text-tertiary">
                                        <span className="font-semibold">วันที่:</span> {new Date(job.queue.requestDate).toLocaleDateString('th-TH', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="typo-tags text-text-placeholder">สร้างเมื่อ: {new Date(job.createdAt).toLocaleDateString('th-TH')}</p>
                                    {job.completedAt && (
                                        <p className="typo-tags text-brand-primary font-medium">เสร็จสิ้นเมื่อ: {new Date(job.completedAt).toLocaleDateString('th-TH')}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function BookingHistoryPage() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <ProtectedRoute allowedRoles={['DRIVE']}>
            <div className="min-h-screen bg-white">
                <VolunteerSidebar user={null} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <HeaderVolunteer onToggleSidebar={() => setSidebarOpen(true)} />
                <BookingHistoryContent />
            </div>
        </ProtectedRoute>
    );
}
