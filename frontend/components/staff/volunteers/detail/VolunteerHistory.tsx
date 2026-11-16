'use client';

import type { Job } from './types';

interface VolunteerHistoryProps {
    jobs: Job[];
}

export default function VolunteerHistory({ jobs }: VolunteerHistoryProps) {
    if (jobs.length === 0) {
        return (
            <div>
                <h2 className="text-xl font-bold text-text-primary mb-4">ประวัติการทำงาน</h2>
                <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                    </div>
                    <p className="text-text-tertiary">ยังไม่มีประวัติการทำงาน</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <h2 className="text-xl font-bold text-text-primary mb-4">ประวัติการทำงาน</h2>
            <div className="space-y-3">
                {jobs.map((job) => (
                    <div key={job.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex items-start justify-between mb-2">
                            <div>
                                <p className="font-medium text-text-primary">
                                    {job.queue?.user?.displayName ||
                                        (job.queue?.user?.firstName ? `${job.queue.user.firstName} ${job.queue.user.lastName || ''}`.trim() : 'ไม่ระบุชื่อ')}
                                </p>
                                <p className="text-sm text-text-tertiary">
                                    {job.queue?.bookingType === 'WITH_APPOINTMENT' ? 'มีใบนัด' : 'ไม่มีใบนัด'}
                                </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium
                                ${job.status === 'COMPLETED' ? 'bg-apple-soft text-apple-dark' : ''}
                                ${job.status === 'CANCELLED' || job.status === 'REJECTED' ? 'bg-rose-100 text-rose-700' : ''}
                                ${!['COMPLETED', 'CANCELLED', 'REJECTED'].includes(job.status) ? 'bg-blue-100 text-blue-700' : ''}
                            `}>
                                {job.status === 'COMPLETED' && 'เสร็จสิ้น'}
                                {job.status === 'CANCELLED' && 'ยกเลิก'}
                                {job.status === 'REJECTED' && 'ปฏิเสธงาน'}
                                {!['COMPLETED', 'CANCELLED', 'REJECTED'].includes(job.status) && job.status}
                            </span>
                        </div>

                        {(job.rejectReason || job.queue?.rejectReason) && (
                            <div className="mb-2 p-2 rounded bg-rose-50 border border-rose-100 text-xs text-rose-700 font-medium">
                                ⚠️ {job.rejectReason || job.queue?.rejectReason}
                            </div>
                        )}

                        <div className="flex items-center gap-4 text-sm text-text-secondary flex-wrap">
                            <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                </svg>
                                {job.queue?.requestDate ? new Date(job.queue.requestDate).toLocaleDateString('th-TH') : '-'}
                            </span>
                            {job.patientDroppedOffAt && (
                                <span className="flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                                    </svg>
                                    {new Date(job.patientDroppedOffAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.'}
                                </span>
                            )}
                            {job.completedAt && (
                                <span className="flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <polyline points="12 6 12 12 16 14"></polyline>
                                    </svg>
                                    {new Date(job.completedAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.'}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
