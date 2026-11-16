'use client';

import { JobStatusBadge } from '@/components/staff';

export interface Job {
    id: number;
    queue: {
        id?: number;
        user: {
            id?: number;
            displayName: string;
            firstName?: string;
            lastName?: string;
            phone?: string;
            address?: string;
            addressDetail?: string;
            lat?: number;
            lng?: number;
            mobilityStatus?: string;
            pictureUrl?: string;
        };
        hospitalName: string;
        hospital?: {
            name: string;
        };
        requestDate: string;
        bookingTime?: string;
    };
    vlt?: {
        id: number;
        displayName: string;
        phone?: string;
        lat?: number;
        lng?: number;
    };
    status: string;
    assignedAt: string;
    startedAt?: string;
    completedAt?: string;
}

interface JobReportTableProps {
    loading: boolean;
    jobs: Job[];
    onShowLocation: (job: Job) => void;
}

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH');
};

export default function JobReportTable({ loading, jobs, onShowLocation }: JobReportTableProps) {
    if (loading) {
        return (
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-text-tertiary">ชื่อ</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-text-tertiary">ประเภทคำขอ</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-text-tertiary">โรงพยาบาล</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-text-tertiary">ช่วงเวลา</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-text-tertiary">วันที่</th>
                            <th className="px-6 py-3 text-center text-sm font-semibold text-text-tertiary">สถานะ</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-text-tertiary">ตำแหน่ง</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        <tr>
                            <td colSpan={7} className="px-6 py-8 text-center text-text-tertiary">
                                กำลังโหลด...
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-text-tertiary">ชื่อ</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-text-tertiary">ประเภทคำขอ</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-text-tertiary">โรงพยาบาล</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-text-tertiary">ช่วงเวลา</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-text-tertiary">วันที่</th>
                        <th className="px-6 py-3 text-center text-sm font-semibold text-text-tertiary">สถานะ</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-text-tertiary">ตำแหน่ง</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {jobs.length === 0 ? (
                        <tr>
                            <td colSpan={7} className="px-6 py-8 text-center text-text-tertiary">
                                ไม่พบข้อมูล
                            </td>
                        </tr>
                    ) : (
                        jobs.map((job) => (
                            <tr key={job.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm text-text-primary">
                                    {job.queue?.user?.displayName || `${job.queue?.user?.firstName || ''} ${job.queue?.user?.lastName || ''}`.trim() || 'ไม่ระบุ'}
                                </td>
                                <td className="px-6 py-4 text-sm text-text-primary">
                                    {job.vlt?.displayName ? 'มีจิตอาสา' : 'ไม่มีจิตอาสา'}
                                </td>
                                <td className="px-6 py-4 text-sm text-text-primary">
                                    {job.queue?.hospital?.name || job.queue?.hospitalName || 'ไม่ระบุ'}
                                </td>
                                <td className="px-6 py-4 text-sm text-text-primary">
                                    {job.queue?.bookingTime || '-'}
                                </td>
                                <td className="px-6 py-4 text-sm text-text-primary">
                                    {formatDate(job.queue?.requestDate)}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <JobStatusBadge status={job.status} />
                                </td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => onShowLocation(job)}
                                        className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        ดูตำแหน่ง
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
