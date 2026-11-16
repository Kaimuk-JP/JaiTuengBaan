interface PatientInfoCardProps {
    user: {
        displayName: string;
        firstName?: string;
        lastName?: string;
        phone?: string;
        address?: string;
        addressDetail?: string;
    };
    hospitalName?: string;
    hospital?: {
        name: string;
    };
}

export default function PatientInfoCard({ user, hospitalName, hospital }: PatientInfoCardProps) {
    return (
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 10C12.7614 10 15 7.76142 15 5C15 2.23858 12.7614 0 10 0C7.23858 0 5 2.23858 5 5C5 7.76142 7.23858 10 10 10Z" fill="#1E7D55" />
                    <path d="M10 12C4.47715 12 0 14.4772 0 17.5V20H20V17.5C20 14.4772 15.5228 12 10 12Z" fill="#1E7D55" />
                </svg>
                ข้อมูลประชาชน
            </h3>
            <div className="space-y-2 text-sm">
                <div className="flex items-start">
                    <span className="font-medium text-slate-600 w-20">ชื่อ :</span>
                    <span className="text-slate-900">
                        {user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'ไม่ระบุ'}
                    </span>
                </div>
                <div className="flex items-start">
                    <span className="font-medium text-slate-600 w-20">เบอร์:</span>
                    <span className="text-slate-900">{user.phone || '-'}</span>
                </div>
                <div className="flex items-start">
                    <span className="font-medium text-slate-600 w-20">ที่อยู่:</span>
                    <span className="text-slate-900 flex-1">{user.addressDetail || '-'}</span>
                </div>
                <div className="flex items-start">
                    <span className="font-medium text-slate-600 w-20">โรงพยาบาล:</span>
                    <span className="text-slate-900 flex-1">{hospital?.name || hospitalName || '-'}</span>
                </div>
            </div>
        </div>
    );
}
