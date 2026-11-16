'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { fetchWithAuth } from '@/lib/auth';
import { getBangkokDateKey, getRoundGroup, formatVehicleInfo } from '@/utils/jobHelpers';
import { getImageUrl } from '@/utils/image';

interface TodayJob {
    id: number;
    status: string;
    returnPickupRequestedAt?: string | null;
    queue?: {
        requestDate?: string;
        bookingTime?: string | null;
        hospital?: { name?: string };
        hospitalName?: string;
        user?: {
            firstName?: string;
            lastName?: string;
            pictureUrl?: string;
            phone?: string;
        };
    };
    vlt?: {
        firstName?: string;
        lastName?: string;
        phone?: string;
        pictureUrl?: string;
    };
    vehicle?: {
        brand?: string;
        model?: string;
        licensePlate?: string;
    };
}

interface JobGroup {
    key: string;
    hospital: string;
    bookingTime: string;
    jobs: TodayJob[];
    status: string;
}

const ACTIVE_STATUSES = new Set([
    'ASSIGNED', 'ACCEPTED', 'PICKING_UP', 'IN_TRANSIT',
    'AT_HOSPITAL', 'RETURN_HOME', 'AT_PATIENT_HOME', 'RETURN_OFFICE',
]);

function PhoneLink({ phone }: { phone: string }) {
    return (
        <a href={`tel:${phone}`} className="flex items-center gap-1.5 text-brand-primary font-medium text-base">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <span className="underline">{phone}</span>
        </a>
    );
}

export default function CareUTodayJobsCard({
    onJobsChange,
}: {
    onJobsChange?: (info: { hasJobs: boolean; loading: boolean }) => void;
}) {
    const { user } = useAuth();
    const { socket } = useSocket();
    const [jobs, setJobs] = useState<TodayJob[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTodayJobs = async (userId: string) => {
        setLoading(true);
        try {
            const res = await fetchWithAuth(`/jobs/assigned-to/${userId}`);
            if (!res.ok) {
                setJobs([]);
                return;
            }
            const data = await res.json();
            const allJobs: TodayJob[] = Array.isArray(data) ? data : (data.jobs || data.data || []);
            const todayKey = getBangkokDateKey(new Date());

            const todayJobs = allJobs.filter((j) => {
                const dateKey = getBangkokDateKey(j.queue?.requestDate);
                if (dateKey !== todayKey) return false;
                if (['CANCELLED', 'REJECTED'].includes(j.status)) return false;
                return true;
            });

            const active = todayJobs.filter((j) => ACTIVE_STATUSES.has(j.status));
            const result = active.length > 0 ? active : todayJobs.filter((j) => j.status !== 'COMPLETED');
            setJobs(result);
        } catch {
            setJobs([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        onJobsChange?.({ hasJobs: jobs.length > 0, loading });
    }, [jobs, loading, onJobsChange]);

    useEffect(() => {
        if (user?.id) fetchTodayJobs(String(user.id));
    }, [user?.id]);

    useEffect(() => {
        if (!socket || !user?.id) return;
        const handleUpdate = () => fetchTodayJobs(String(user.id));
        socket.on('notification', handleUpdate);
        socket.on('refresh_jobs', handleUpdate);
        return () => {
            socket.off('notification', handleUpdate);
            socket.off('refresh_jobs', handleUpdate);
        };
    }, [socket, user?.id]);

    const groupedJobs = useMemo(() => {
        const groupsMap = new Map<string, JobGroup>();
        jobs.forEach((job) => {
            const hospital = job.queue?.hospital?.name || job.queue?.hospitalName || 'ไม่ระบุ';
            const roundGroup = getRoundGroup(job.queue?.bookingTime);
            const key = `${hospital}_${roundGroup}_${job.status}`;
            if (!groupsMap.has(key)) {
                groupsMap.set(key, {
                    key,
                    hospital,
                    bookingTime: job.queue?.bookingTime || '-',
                    jobs: [],
                    status: job.status,
                });
            }
            groupsMap.get(key)!.jobs.push(job);
        });
        return Array.from(groupsMap.values());
    }, [jobs]);

    const getStatusDisplay = (status: string) => {
        const map: Record<string, { text: string; bg: string; color: string }> = {
            ASSIGNED: { text: 'ได้รับมอบหมาย', bg: 'bg-[#E5F3FF]', color: 'text-[#007AFF]' },
            ACCEPTED: { text: 'รับงานแล้ว', bg: 'bg-[#E8F5E9]', color: 'text-[#2E7D32]' },
            PICKING_UP: { text: 'กำลังไปรับ', bg: 'bg-[#FFF3E0]', color: 'text-[#E65100]' },
            IN_TRANSIT: { text: 'กำลังเดินทาง', bg: 'bg-[#FFF3E0]', color: 'text-[#E65100]' },
            AT_HOSPITAL: { text: 'อยู่ที่โรงพยาบาล', bg: 'bg-cyan-50', color: 'text-cyan-700' },
            RETURN_HOME: { text: 'กำลังพากลับบ้าน', bg: 'bg-[#E5F3FF]', color: 'text-[#007AFF]' },
            AT_PATIENT_HOME: { text: 'ส่งถึงบ้าน รอถ่ายรูป', bg: 'bg-teal-50', color: 'text-teal-700' },
            RETURN_OFFICE: { text: 'เสร็จสิ้นภารกิจ', bg: 'bg-[#E8F5E9]', color: 'text-[#2E7D32]' },
            COMPLETED: { text: 'เสร็จสิ้น', bg: 'bg-[#E8F5E9]', color: 'text-[#2E7D32]' },
        };
        return map[status] || { text: status, bg: 'bg-slate-100', color: 'text-slate-600' };
    };

    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-[1.5rem] p-6 shadow-sm border border-slate-100 dark:border-gray-700 flex items-center justify-center min-h-[160px]">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-primary" />
            </div>
        );
    }

    if (jobs.length === 0) {
        return null;
    }

    return (
        <div className="flex flex-col gap-4">
            {groupedJobs.map((group) => {
                const statusDisplay = getStatusDisplay(group.status);
                const firstJob = group.jobs[0];
                const driverName = firstJob.vlt
                    ? `${firstJob.vlt.firstName || ''} ${firstJob.vlt.lastName || ''}`.trim()
                    : null;
                const vehicleInfo = formatVehicleInfo(firstJob.vehicle);

                return (
                    <div
                        key={group.key}
                        className="bg-white dark:bg-slate-700 rounded-[1.5rem] p-5 border border-gray-200 dark:border-slate-600 shadow-sm"
                    >
                        <div className="flex justify-between items-start border-b border-gray-100 dark:border-slate-600 pb-3 mb-3 gap-2">
                            <div className="min-w-0">
                                <p className="text-slate-800 dark:text-white font-bold text-[17px]">
                                    {group.hospital}
                                </p>
                                <p className="text-base text-gray-500 dark:text-gray-400 mt-1">เวลาจอง: {group.bookingTime}</p>
                            </div>
                            <span className={`shrink-0 text-sm font-semibold px-2.5 py-1 rounded-full ${statusDisplay.bg} ${statusDisplay.color}`}>
                                {statusDisplay.text}
                            </span>
                        </div>

                        <div className="flex flex-col gap-3">
                            {group.jobs.map((job, index) => {
                                const patientName = job.queue?.user
                                    ? `${job.queue.user.firstName || ''} ${job.queue.user.lastName || ''}`.trim()
                                    : 'ไม่ระบุชื่อ';

                                return (
                                    <div
                                        key={job.id}
                                        className={`flex flex-col gap-2 ${index !== group.jobs.length - 1 ? 'border-b border-gray-50 dark:border-slate-600 pb-3' : ''}`}
                                    >
                                        <div className="flex gap-4">
                                            <div className="flex-shrink-0 mt-1">
                                                <div className="w-14 h-14 bg-[#E3F2FD] dark:bg-slate-800 rounded-xl flex items-center justify-center overflow-hidden border border-slate-100 shadow-sm">
                                                    {job.queue?.user?.pictureUrl ? (
                                                        <img
                                                            src={getImageUrl(job.queue.user.pictureUrl)}
                                                            alt=""
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).style.display = 'none';
                                                            }}
                                                        />
                                                    ) : (
                                                        <svg className="w-8 h-8 text-[#94A3B8]" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                                        </svg>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex-1 text-base space-y-1.5 text-slate-600 dark:text-slate-300">
                                                <div className="flex gap-2 items-start">
                                                    <span className="text-[#060D26] dark:text-gray-200 font-medium min-w-[80px] shrink-0">ชื่อ - สกุล:</span>
                                                    <span className="text-[#060D26] dark:text-gray-100 font-semibold">{patientName}</span>
                                                </div>
                                                <div className="flex gap-2 items-center">
                                                    <span className="text-[#060D26] dark:text-gray-200 font-medium min-w-[80px] shrink-0">เบอร์โทร:</span>
                                                    {job.queue?.user?.phone ? (
                                                        <PhoneLink phone={job.queue.user.phone} />
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {(driverName || vehicleInfo) && (
                            <div className="border-t border-gray-100 dark:border-slate-600 mt-3 pt-3 text-base space-y-3">
                                {driverName && (
                                    <div className="flex flex-col gap-2">
                                        <span className="text-[#060D26] dark:text-gray-200 font-medium text-sm">เจ้าหน้าที่ขับรถ:</span>
                                        <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-800 p-2.5 rounded-xl border border-gray-100 dark:border-slate-600">
                                            <div className="w-10 h-10 bg-green-50 dark:bg-slate-700 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-200 dark:border-slate-600">
                                                {firstJob.vlt?.pictureUrl ? (
                                                    <img
                                                        src={getImageUrl(firstJob.vlt.pictureUrl)}
                                                        alt={driverName || 'คนขับ'}
                                                        className="object-cover w-full h-full"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).style.display = 'none';
                                                        }}
                                                    />
                                                ) : (
                                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                )}
                                            </div>
                                            <div className="text-left flex-1 min-w-0">
                                                <p className="font-semibold text-slate-800 dark:text-gray-200 text-base truncate">{driverName}</p>
                                                {firstJob.vlt?.phone ? (
                                                    <div className="mt-0.5">
                                                        <PhoneLink phone={firstJob.vlt.phone} />
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-gray-400">-</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {vehicleInfo && (
                                    <div className="flex gap-2 items-center">
                                        <span className="text-[#060D26] dark:text-gray-200 font-medium min-w-[85px] shrink-0">รถที่ใช้:</span>
                                        <span className="text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-gray-100 dark:border-slate-600 text-sm">
                                            {vehicleInfo}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}

            {jobs.length > 5 && (
                <Link
                    href="/volunteer/careu/jobs"
                    className="text-center text-base font-semibold text-brand-primary py-2 hover:underline"
                >
                    ดูงานทั้งหมด ({jobs.length} รายการ)
                </Link>
            )}
        </div>
    );
}
