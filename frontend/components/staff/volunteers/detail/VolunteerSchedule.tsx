'use client';

import type { Job } from './types';

interface VolunteerScheduleProps {
    jobs: Job[];
}

export default function VolunteerSchedule({ jobs }: VolunteerScheduleProps) {
    if (jobs.length === 0) {
        return (
            <div>
                <h2 className="text-xl font-bold text-text-primary mb-4">ตารางงาน</h2>
                <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                    </div>
                    <p className="text-text-tertiary">ยังไม่มีตารางงาน</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <h2 className="text-xl font-bold text-text-primary mb-4">ตารางงาน</h2>
            <div className="space-y-3">
                {jobs.map((job) => (
                    <div key={job.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex items-start justify-between mb-2">
                            <div>
                                <p className="font-medium text-text-primary">
                                    {job.queue?.user?.displayName || 'ไม่ระบุชื่อ'}
                                </p>
                                <p className="text-sm text-text-tertiary">
                                    {job.queue?.bookingType === 'WITH_APPOINTMENT' ? 'มีใบนัด' : 'ไม่มีใบนัด'}
                                </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium
                                ${job.status === 'ASSIGNED' ? 'bg-saffron-soft text-saffron-dark' : ''}
                                ${job.status === 'ACCEPTED' ? 'bg-glacier-light text-glacier-dark' : ''}
                                ${job.status === 'IN_PROGRESS' ? 'bg-apple-soft text-apple-dark' : ''}
                            `}>
                                {job.status === 'ASSIGNED' && 'รอรับงาน'}
                                {job.status === 'ACCEPTED' && 'รับงานแล้ว'}
                                {job.status === 'IN_PROGRESS' && 'กำลังดำเนินการ'}
                            </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-text-secondary">
                            <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                </svg>
                                {job.queue?.requestDate ? new Date(job.queue.requestDate).toLocaleDateString('th-TH') : '-'}
                            </span>
                            <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12 6 12 12 16 14"></polyline>
                                </svg>
                                {job.queue?.bookingTime || '-'}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
