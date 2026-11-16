'use client';

import { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/auth';
import Image from 'next/image';
import BookingDetailModal from '../history/BookingDetailModal';

interface Job {
    id: number;
    status: string;
    queue: {
        id: number;
        requestDate: string;
        hospitalName: string;
        user: {
            id: number;
            displayName: string;
            pictureUrl?: string;
        };
    };
}

interface VolunteerAssignedJobsProps {
    volunteerId: number;
}

const statusLabels: Record<string, string> = {
    'OPEN': 'รอให้บริการ',
    'ASSIGNED': 'รอให้บริการ',
    'ACCEPTED': 'กำลังดำเนินการ',
    'PICKING_UP': 'กำลังไปรับประชาชน',
    'PICKED_UP': 'รับประชาชนแล้ว',
    'IN_TRANSIT': 'กำลังเดินทางไปโรงพยาบาล',
    'RETURN_HOME': 'กำลังพาประชาชนกลับบ้าน',
    'RETURN_OFFICE': 'กำลังกลับศูนย์',
    'COMPLETED': 'เสร็จสิ้น',
    'REJECTED': 'ปฏิเสธ',
    'CANCELLED': 'ยกเลิก',
};

const statusColors: Record<string, string> = {
    'OPEN': 'bg-yellow-100 text-yellow-700',
    'ASSIGNED': 'bg-yellow-100 text-yellow-700',
    'ACCEPTED': 'bg-blue-100 text-blue-700',
    'PICKING_UP': 'bg-orange-100 text-orange-700',
    'PICKED_UP': 'bg-sky-100 text-sky-700',
    'IN_TRANSIT': 'bg-sky-100 text-sky-700',
    'RETURN_HOME': 'bg-purple-100 text-purple-700',
    'RETURN_OFFICE': 'bg-indigo-100 text-indigo-700',
    'COMPLETED': 'bg-green-600 text-white',
    'REJECTED': 'bg-red-100 text-red-700',
    'CANCELLED': 'bg-gray-100 text-gray-700',
};

export default function VolunteerAssignedJobs({ volunteerId }: VolunteerAssignedJobsProps) {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
    const [selectedQueueId, setSelectedQueueId] = useState<number | null>(null);

    useEffect(() => {
        fetchJobs();
    }, [volunteerId]);

    const fetchJobs = async () => {
        try {
            const response = await fetchWithAuth(`/jobs?vltId=${volunteerId}`);
            if (response.ok) {
                const result = await response.json();
                const data = result.jobs || result.data || (Array.isArray(result) ? result : []);
                setJobs(data);
            }
        } catch (error) {
            console.error('Error fetching jobs:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatDateKey = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    };

    const toggleDate = (dateKey: string) => {
        const newExpanded = new Set(expandedDates);
        if (newExpanded.has(dateKey)) {
            newExpanded.delete(dateKey);
        } else {
            newExpanded.add(dateKey);
        }
        setExpandedDates(newExpanded);
    };

    const filteredJobs = jobs.filter(job => {
        const patientName = job.queue?.user?.displayName || '';
        const dateStr = formatDate(job.queue?.requestDate);
        return patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            dateStr.includes(searchQuery);
    });

    const jobsByDate = filteredJobs.reduce((acc, job) => {
        const dateKey = formatDateKey(job.queue?.requestDate);
        if (!acc[dateKey]) {
            acc[dateKey] = [];
        }
        acc[dateKey].push(job);
        return acc;
    }, {} as Record<string, Job[]>);

    const sortedDates = Object.keys(jobsByDate).sort((a, b) =>
        new Date(b).getTime() - new Date(a).getTime()
    );

    if (loading) {
        return (
            <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
            </div>
        );
    }

    return (
        <div>
            { }
            <h3 className="text-[1.75rem] font-normal text-text-primary leading-[140%] mb-4">
                งานที่ได้รับมอบหมาย
            </h3>

            { }
            <div className="mb-4">
                <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-placeholder" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="ค้นหาด้วยชื่อ ประชาชน หรือ วันที่"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-border-default rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none"
                    />
                </div>
            </div>

            { }
            {sortedDates.length === 0 ? (
                <div className="text-center py-8 text-text-tertiary">
                    ยังไม่มีงานที่ได้รับมอบหมาย
                </div>
            ) : (
                <div className="space-y-3">
                    {sortedDates.map((dateKey) => {
                        const dateJobs = jobsByDate[dateKey];
                        const displayDate = formatDate(dateJobs[0]?.queue?.requestDate);
                        const isExpanded = expandedDates.has(displayDate);

                        return (
                            <div key={dateKey} className="border border-border-default rounded-xl overflow-hidden">
                                { }
                                <button
                                    onClick={() => toggleDate(displayDate)}
                                    className={`w-full px-4 py-3 flex items-center justify-between transition-colors ${isExpanded ? 'bg-brand-primary text-white' : 'bg-white hover:bg-gray-50'
                                        }`}
                                >
                                    <span className="font-medium">วันที่ {displayDate}</span>
                                    <svg
                                        className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                { }
                                {isExpanded && (
                                    <div className="divide-y divide-border-default">
                                        {dateJobs.map((job) => (
                                            <div
                                                key={job.id}
                                                onClick={() => setSelectedQueueId(job.queue.id)}
                                                className="p-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors"
                                            >
                                                { }
                                                <div className="w-14 h-14 rounded-full bg-fuji-light flex items-center justify-center overflow-hidden border border-border-default">
                                                    {job.queue?.user?.pictureUrl ? (
                                                        <Image
                                                            src={job.queue.user.pictureUrl}
                                                            alt={job.queue.user.displayName}
                                                            width={56}
                                                            height={56}
                                                            className="object-cover"
                                                            unoptimized
                                                        />
                                                    ) : (
                                                        <svg className="w-8 h-8 text-text-placeholder" viewBox="0 0 24 24" fill="currentColor">
                                                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                                        </svg>
                                                    )}
                                                </div>

                                                { }
                                                <div className="flex-1">
                                                    <p className="font-medium text-text-primary">
                                                        {job.queue?.user?.displayName || 'ไม่ระบุชื่อ'}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-sm text-text-tertiary">สถานะการจอง :</span>
                                                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[job.status] || 'bg-gray-100 text-gray-600'}`}>
                                                            {statusLabels[job.status] || job.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            { }
            {selectedQueueId && (
                <BookingDetailModal
                    queueId={selectedQueueId.toString()}
                    onClose={() => setSelectedQueueId(null)}
                />
            )}
        </div>
    );
}
