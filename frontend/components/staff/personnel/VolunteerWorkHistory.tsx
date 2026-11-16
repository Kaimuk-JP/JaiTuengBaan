'use client';

import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/auth';
import Image from 'next/image';

interface JobItem {
    id: number;
    name: string;
    severityBadge: string;
    severityColor: string;
    bookingType: string;
    hospital: string;
    bookingDate: string;
    bookingTime: string;
    pictureUrl?: string;
    requiredEquipment?: string[];
    status?: string;
    points?: number;
}

interface DateGroup {
    date: string;
    dateLabel: string;
}

interface VolunteerWorkHistoryProps {
    volunteerId: number;
    points: number;
}

const UserIcon = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);

const ChevronIcon = ({ isOpen }: { isOpen: boolean }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
        <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
);

export default function VolunteerWorkHistory({ volunteerId, points }: VolunteerWorkHistoryProps) {
    const [dateGroups, setDateGroups] = useState<DateGroup[]>([]);
    const [openDates, setOpenDates] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [loadedJobs, setLoadedJobs] = useState<Record<string, JobItem[]>>({});
    const [loadingDates, setLoadingDates] = useState<Set<string>>(new Set());

    useEffect(() => {
        const fetchHistoryDates = async () => {
            try {
                setIsLoading(true);
                const response = await fetchWithAuth(`/jobs/history-dates/${volunteerId}`);
                if (!response.ok) throw new Error('ไม่สามารถดึงข้อมูลประวัติได้');
                const dates: string[] = await response.json();

                const groups: DateGroup[] = dates.map(date => ({
                    date,
                    dateLabel: `วันที่ ${new Date(date).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                    })}`,
                }));

                setDateGroups(groups);
            } catch (error) {
                console.error('Failed to fetch history dates:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (volunteerId) {
            fetchHistoryDates();
        }
    }, [volunteerId]);

    const fetchJobsForDate = async (dateStr: string) => {
        if (loadedJobs[dateStr] || loadingDates.has(dateStr)) return;

        try {
            setLoadingDates(prev => new Set(prev).add(dateStr));
            const response = await fetchWithAuth(`/jobs/assigned-to/${volunteerId}?status=COMPLETED&date=${dateStr}`);
            if (!response.ok) throw new Error('ไม่สามารถดึงข้อมูลงานได้');
            const jobs = await response.json();

            const formattedJobs: JobItem[] = jobs.map((job: any) => {
                let severityBadge = 'ทั่วไป';
                let severityColor = 'bg-brand-primary';
                if (job.queue.severityLevel === 'RED') {
                    severityBadge = 'ต้องดูแลใกล้ชิด';
                    severityColor = 'bg-status-danger';
                } else if (job.queue.severityLevel === 'YELLOW') {
                    severityBadge = 'ต้องดูแลเพิ่ม';
                    severityColor = 'bg-status-warning';
                }

                return {
                    id: job.id,
                    name: job.queue.user?.displayName || `${job.queue.user?.firstName || ''} ${job.queue.user?.lastName || ''}`.trim() || 'ไม่ระบุชื่อ',
                    severityBadge,
                    severityColor,
                    bookingType: job.queue.hasAppointment ? 'มีใบนัด' : 'ไม่มีใบนัด',
                    hospital: job.queue.hospitalName || '-',
                    bookingDate: new Date(job.queue.requestDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }),
                    bookingTime: job.queue.bookingTime || '-',
                    pictureUrl: job.queue.user?.pictureUrl || '',
                    status: 'ให้บริการเสร็จสิ้น',
                    points: job.earnedPoints || 0,
                };
            });

            setLoadedJobs(prev => ({ ...prev, [dateStr]: formattedJobs }));
        } catch (error) {
            console.error(`Error fetching jobs for ${dateStr}:`, error);
        } finally {
            setLoadingDates(prev => {
                const newSet = new Set(prev);
                newSet.delete(dateStr);
                return newSet;
            });
        }
    };

    const toggleDate = (date: string) => {
        setOpenDates(prev => {
            const newSet = new Set(prev);
            if (newSet.has(date)) newSet.delete(date);
            else newSet.add(date);
            return newSet;
        });
        if (!loadedJobs[date]) fetchJobsForDate(date);
    };

    return (
        <div className="space-y-6">
            {}
            <h3 className="text-[1.75rem] font-normal text-text-primary leading-[140%]">คะแนนสะสม</h3>
            <div className="bg-white rounded-xl border border-brand-primary p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                    <h3 className="text-xl font-bold text-text-primary mb-1">คะแนนสะสม</h3>
                    <p className="text-4xl font-bold text-text-primary">{points ? points.toLocaleString() : 0}</p>
                </div>
                <button className="px-6 py-2 bg-[#1F7A53] hover:bg-[#186241] text-white rounded-lg font-medium transition-colors">
                    ประวัติการใช้คะแนน
                </button>
            </div>

            <h3 className="text-lg font-semibold text-text-primary">ประวัติการทำงาน</h3>

            <div className="space-y-4">
                {isLoading ? (
                    <div className="text-center py-8 text-gray-400">กำลังโหลดข้อมูล...</div>
                ) : dateGroups.length > 0 ? (
                    dateGroups.map(group => (
                        <div key={group.date} className="border border-border-default rounded-xl overflow-hidden">
                            <button
                                onClick={() => toggleDate(group.date)}
                                className={`w-full flex items-center justify-between px-6 py-4 transition-colors ${openDates.has(group.date) ? 'bg-[#1F7A53] text-white' : 'bg-white text-text-primary hover:bg-gray-50'
                                    }`}
                            >
                                <span className="font-medium text-lg">{group.dateLabel}</span>
                                <ChevronIcon isOpen={openDates.has(group.date)} />
                            </button>

                            {openDates.has(group.date) && (
                                <div className="bg-white p-4 space-y-4 border-t border-border-default">
                                    {loadingDates.has(group.date) ? (
                                        <div className="text-center py-4 text-gray-400">กำลังโหลด...</div>
                                    ) : loadedJobs[group.date]?.length > 0 ? (
                                        loadedJobs[group.date].map(job => (
                                            <div key={job.id} className="bg-white border boundary-gray-200 rounded-xl p-4 flex flex-col md:flex-row items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                                                {}
                                                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-100">
                                                    {job.pictureUrl ? (
                                                        <Image src={job.pictureUrl} alt={job.name} width={64} height={64} className="object-cover w-full h-full" unoptimized />
                                                    ) : (
                                                        <UserIcon className="text-blue-400" size={32} />
                                                    )}
                                                </div>

                                                {}
                                                <div className="flex-1 text-center md:text-left">
                                                    <h4 className="text-lg font-semibold text-text-primary">{job.name}</h4>
                                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-1">
                                                        <span className="text-gray-500 text-sm">สถานะการจอง : </span>
                                                        <span className="px-3 py-1 bg-green-50 text-green-600 text-sm rounded-full border border-green-100">
                                                            {job.status}
                                                        </span>
                                                    </div>
                                                </div>

                                                {}
                                                <div className="text-lg font-semibold text-text-primary">
                                                    ได้รับ {job.points} คะแนน
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-4 text-gray-400">ไม่พบงาน</div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8 text-gray-400">ไม่พบประวัติการทำงาน</div>
                )}
            </div>
        </div>
    );
}
