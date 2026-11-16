import JobStatusBadge from './JobStatusBadge';

interface VolunteerInfoCardProps {
    volunteer?: {
        displayName: string;
        firstName?: string;
        lastName?: string;
        phone?: string;
    } | null;
    jobStatus?: string;
    hasLocation?: boolean;
}

export default function VolunteerInfoCard({ volunteer, jobStatus, hasLocation }: VolunteerInfoCardProps) {
    return (
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 0C6.13401 0 3 3.13401 3 7C3 10.866 6.13401 14 10 14C13.866 14 17 10.866 17 7C17 3.13401 13.866 0 10 0ZM10 12C7.23858 12 5 9.76142 5 7C5 4.23858 7.23858 2 10 2C12.7614 2 15 4.23858 15 7C15 9.76142 12.7614 12 10 12Z" fill="#2563EB" />
                    <path d="M10 16C5.58172 16 2 17.7909 2 20H18C18 17.7909 14.4183 16 10 16Z" fill="#2563EB" />
                </svg>
                ข้อมูลจิตอาสา
            </h3>
            {volunteer ? (
                <div className="space-y-2 text-sm">
                    <div className="flex items-start">
                        <span className="font-medium text-slate-600 w-20">ชื่อ :</span>
                        <span className="text-slate-900">
                            {volunteer.displayName || `${volunteer.firstName || ''} ${volunteer.lastName || ''}`.trim() || 'ไม่ระบุ'}
                        </span>
                    </div>
                    <div className="flex items-start">
                        <span className="font-medium text-slate-600 w-20">เบอร์:</span>
                        <span className="text-slate-900">{volunteer.phone || '-'}</span>
                    </div>
                    {jobStatus && (
                        <div className="flex items-start">
                            <span className="font-medium text-slate-600 w-20">สถานะ:</span>
                            <JobStatusBadge status={jobStatus} />
                        </div>
                    )}
                    {hasLocation === false && (
                        <div className="mt-2 flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 p-2 rounded-md border border-amber-200">
                            <svg className="w-4 h-4 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                            </svg>
                            <span>ไม่พบพิกัดปัจจุบัน (จิตอาสายังไม่เปิดแชร์พิกัดหน้างาน)</span>
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center py-8">
                    <div className="text-slate-400 mb-2">
                        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <p className="text-sm text-slate-500">ยังไม่ได้มอบหมายจิตอาสา</p>
                </div>
            )}
        </div>
    );
}
