'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { fetchWithAuth } from '@/lib/auth';
import { getRoundGroup, getVolunteerJobStatusDisplay, formatVehicleInfo } from '@/utils/jobHelpers';
import { getImageUrl } from '@/utils/image';

interface Job {
    id: number;
    status: string;
    queue?: {
        id: number;
        requestDate: string;
        bookingTime: string | null;
        hospitalName?: string;
        hospital?: { name: string };
        hasAppointment?: boolean;
        severityLevel?: string;
        user?: {
            firstName?: string;
            lastName?: string;
            pictureUrl?: string;
            phone?: string;
            mobilityStatus?: string;
        };
    };
    careu?: {
        firstName?: string;
        lastName?: string;
        phone?: string;
        pictureUrl?: string;
    };
    careuId?: string;
    vehicle?: {
        brand?: string;
        model?: string;
        licensePlate?: string;
    };
    patientDroppedOffAt?: string;
    returnPickupRequestedAt?: string | null;
    returnEvidenceUrl?: string;
}

interface GroupedJob {
    key: string;
    hospital: string;
    bookingTime: string;
    jobs: Job[];
    status: string;
}

export default function LatestJobCard() {
    const { user } = useAuth();
    const router = useRouter();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

    useEffect(() => {
        if (user?.id) {
            fetchLatestJob(user.id);
        }
    }, [user]);

    const { socket } = useSocket();
    useEffect(() => {
        if (!socket || !user?.id) return;

        const handleRealtimeUpdate = () => {
            fetchLatestJob(user.id);
        };

        socket.on('notification', handleRealtimeUpdate);
        socket.on('refresh_jobs', handleRealtimeUpdate);

        return () => {
            socket.off('notification', handleRealtimeUpdate);
            socket.off('refresh_jobs', handleRealtimeUpdate);
        };
    }, [socket, user?.id]);

    const fetchLatestJob = async (userId: number) => {
        try {
            const response = await fetchWithAuth(`/jobs/assigned-to/${userId}`);

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
            const allJobs: Job[] = Array.isArray(data) ? data : (data.jobs || data.data || []);

            const today = new Date();
            const todayJobs = allJobs.filter((j) => {
                if (!j.queue?.requestDate) return false;
                const d = new Date(j.queue.requestDate);
                return d.getDate() === today.getDate() &&
                    d.getMonth() === today.getMonth() &&
                    d.getFullYear() === today.getFullYear();
            });

            const activeStatuses = ['ACCEPTED', 'PICKING_UP', 'PICKED_UP', 'IN_TRANSIT', 'AT_HOSPITAL', 'ASSIGNED', 'IN_PROGRESS', 'RETURN_HOME', 'AT_PATIENT_HOME', 'RETURN_OFFICE'];
            const activeJobs = todayJobs.filter((j) => activeStatuses.includes(j.status));

            if (activeJobs.length > 0) {
                setJobs(activeJobs);
            } else if (todayJobs.length > 0) {
                setJobs(todayJobs);
            } else {
                setJobs([]);
            }
        } catch (err) {
            console.error('Error fetching latest job:', err);
        } finally {
            setLoading(false);
        }
    };

    const groupedJobs = useMemo(() => {
        const groupsMap = new Map<string, GroupedJob>();

        jobs.forEach(job => {
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

    const getSeverityBadge = (level?: string) => {
        if (level === 'RED' || level === 'BEDRIDDEN') return { text: 'ต้องดูแลใกล้ชิด', color: 'bg-red-500' };
        if (level === 'YELLOW' || level === 'WHEELCHAIR') return { text: 'ต้องดูแลเพิ่ม', color: 'bg-yellow-500' };
        return { text: 'ทั่วไป', color: 'bg-[#15803d]' };
    };

    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-gray-700 flex items-center justify-center min-h-[160px]">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-primary"></div>
            </div>
        );
    }

    if (jobs.length === 0) {
        return (
            <div className="bg-gradient-to-b from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 rounded-[2rem] p-8 shadow-sm border border-slate-100 dark:border-slate-700 text-center flex flex-col items-center justify-center min-h-[220px]">
                <div className="w-20 h-20 rounded-[1.5rem] bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center mb-5 rotate-3 hover:rotate-0 transition-transform">
                    <svg className="w-10 h-10 text-slate-300 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h3 className="text-slate-800 dark:text-slate-200 font-bold text-lg mb-1">ยังไม่มีงานในวันนี้</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-5">คุณยังไม่มีงานที่ต้องดูแล ณ ปัจจุบัน</p>
                <button
                    onClick={() => router.push('/volunteer/driver')}
                    className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm px-6 py-2.5 rounded-full hover:scale-105 active:scale-95 transition-transform"
                >
                    ดูตารางงานทั้งหมด
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {groupedJobs.map((group) => {
                const statusDisplay = getVolunteerJobStatusDisplay(group.status, group.jobs[0]?.returnPickupRequestedAt);

                return (
                    <div
                        key={group.key}
                        className="bg-white dark:bg-slate-700 rounded-[1.5rem] p-5 border border-gray-200 dark:border-slate-600 shadow-sm transition-shadow"
                    >
                        <div className="flex justify-between items-start border-b border-gray-100 dark:border-slate-600 pb-3 mb-3 gap-2">
                            <div>
                                <p className="text-slate-800 dark:text-white font-bold text-[15px]">
                                    {group.hospital}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">เวลาจอง: {group.bookingTime}</p>
                            </div>
                            <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${statusDisplay.color}`}>
                                {statusDisplay.label}
                            </span>
                        </div>

                        <div className="flex flex-col gap-3">
                            {group.jobs.map((job, index) => {
                                const elderlyName = job.queue?.user
                                    ? `${job.queue.user.firstName || ''} ${job.queue.user.lastName || ''}`.trim()
                                    : 'ไม่ระบุชื่อ';

                                return (
                                    <div key={job.id} className={`flex flex-col gap-2 ${index !== group.jobs.length - 1 ? 'border-b border-gray-50 dark:border-slate-600 pb-3' : ''}`}>
                                        <div className="flex gap-4">
                                            <div className="flex-shrink-0 mt-1">
                                                <div className="w-14 h-14 bg-[#E3F2FD] dark:bg-slate-800 rounded-xl flex items-center justify-center overflow-hidden border border-slate-100 shadow-sm relative">
                                                    {job.queue?.user?.pictureUrl ? (
                                                        <img
                                                            src={getImageUrl(job.queue.user.pictureUrl)}
                                                            alt="User Profile"
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

                                            <div className="flex-1 text-sm space-y-1 text-slate-600 dark:text-slate-300">
                                                <div className="flex gap-2 items-start">
                                                    <span className="text-[#060D26] dark:text-gray-200 font-medium min-w-[70px] shrink-0">ชื่อ - สกุล:</span>
                                                    <span className="text-[#060D26] dark:text-gray-100 font-medium">{elderlyName}</span>
                                                </div>

                                                <div className="flex gap-2 items-center">
                                                    <span className="text-[#060D26] dark:text-gray-200 font-medium min-w-[70px]">เบอร์โทร:</span>
                                                    {job.queue?.user?.phone ? (
                                                        <a href={`tel:${job.queue.user.phone}`} className="flex items-center gap-1.5 text-brand-primary font-medium">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                                            </svg>
                                                            <span className="underline">{job.queue.user.phone}</span>
                                                        </a>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {job.patientDroppedOffAt && (
                                            <div className="flex gap-2 items-center text-xs mt-1 pl-[72px]">
                                                <span className="text-slate-500 dark:text-gray-400 font-medium">เวลาส่งถึงบ้าน:</span>
                                                <span className="text-brand-primary font-bold text-sm">
                                                    {new Date(job.patientDroppedOffAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.'}
                                                </span>
                                            </div>
                                        )}
                                        {job.returnEvidenceUrl && (
                                            <div className="flex flex-col gap-1 mt-1 pl-[72px]">
                                                <span className="text-xs text-slate-500 dark:text-gray-400 font-medium">รูปส่งกลับบ้าน:</span>
                                                <div className="relative w-40 h-28 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-800 mt-0.5">
                                                    <img
                                                        src={getImageUrl(job.returnEvidenceUrl)}
                                                        alt="รูปส่งกลับบ้าน"
                                                        className="object-contain w-full h-full cursor-pointer hover:opacity-90 transition-opacity"
                                                        onClick={() => setPreviewImageUrl(getImageUrl(job.returnEvidenceUrl!))}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {(() => {
                            const firstJob = group.jobs[0];
                            const careuName = firstJob.careu ? `${firstJob.careu.firstName || ''} ${firstJob.careu.lastName || ''}`.trim() : null;
                            const vehicleInfo = formatVehicleInfo(firstJob.vehicle);
                            const hasInfo = firstJob.careuId || vehicleInfo;

                            if (!hasInfo) return null;

                            return (
                                <div className="border-t border-gray-100 dark:border-slate-600 mt-3 pt-3 text-sm space-y-3">
                                    {firstJob.careuId && (
                                        <div className="flex flex-col gap-2">
                                            <span className="text-[#060D26] dark:text-gray-200 font-medium text-xs">จิตอาสาแคร์ยู:</span>
                                            <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-800 p-2.5 rounded-xl border border-gray-100 dark:border-slate-600">
                                                <div className="w-10 h-10 bg-green-50 dark:bg-slate-700 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 relative border border-gray-200 dark:border-slate-600">
                                                    {firstJob.careu?.pictureUrl ? (
                                                        <img
                                                            src={getImageUrl(firstJob.careu.pictureUrl)}
                                                            alt={careuName || 'CareU Profile'}
                                                            className="object-cover w-full h-full"
                                                        />
                                                    ) : (
                                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                        </svg>
                                                    )}
                                                </div>

                                                <div className="text-left flex-1 min-w-0">
                                                    <p className="font-semibold text-slate-800 dark:text-gray-200 text-sm truncate">
                                                        {careuName || 'มีจิตอาสาแคร์ยู'}
                                                    </p>
                                                    {firstJob.careu?.phone ? (
                                                        <button
                                                            onClick={async () => {
                                                                const SwalLib = (await import('@/lib/swal')).default;
                                                                const result = await SwalLib.fire({
                                                                    title: 'โทรหาจิตอาสาแคร์ยู?',
                                                                    text: `ต้องการโทรหา ${firstJob.careu?.phone} หรือไม่?`,
                                                                    icon: 'question',
                                                                    showCancelButton: true,
                                                                    confirmButtonColor: '#1E7D55',
                                                                    cancelButtonColor: '#6B7280',
                                                                    confirmButtonText: 'โทร',
                                                                    cancelButtonText: 'ยกเลิก',
                                                                });
                                                                if (result.isConfirmed) {
                                                                    window.location.href = `tel:${firstJob.careu?.phone}`;
                                                                }
                                                            }}
                                                            className="flex items-center gap-1.5 text-xs text-brand-primary hover:text-brand-primary/80 transition-colors cursor-pointer mt-0.5"
                                                        >
                                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                                            </svg>
                                                            <span className="underline font-medium">{firstJob.careu?.phone}</span>
                                                        </button>
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
                                            <span className="text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-gray-100 dark:border-slate-600 text-xs">
                                                {vehicleInfo}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                );
            })}

            {previewImageUrl && (
                <div
                    className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
                    onClick={() => setPreviewImageUrl(null)}
                >
                    <div className="relative max-w-2xl max-h-[90vh]">
                        <button
                            type="button"
                            onClick={() => setPreviewImageUrl(null)}
                            className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
                            aria-label="ปิด"
                        >
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                        <img
                            src={previewImageUrl}
                            alt="รูปส่งกลับบ้าน"
                            className="max-w-full max-h-[80vh] rounded-lg shadow-2xl object-contain"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
