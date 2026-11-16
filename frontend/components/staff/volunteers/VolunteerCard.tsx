'use client';

import Image from 'next/image';

interface Volunteer {
    id: number;
    displayName: string;
    firstName: string | null;
    lastName: string | null;
    pictureUrl: string | null;
    phone: string | null;
    address: string | null;
    addressDetail: string | null;
}

interface VolunteerCardProps {
    volunteer: Volunteer;
}

export default function VolunteerCard({ volunteer }: VolunteerCardProps) {
    return (
        <div className="group bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md hover:border-green-200 transition-all cursor-pointer flex gap-5 items-start">
            <div className="flex-shrink-0">
                <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-100">
                    {volunteer.pictureUrl ? (
                        <Image
                            src={volunteer.pictureUrl}
                            alt={volunteer.displayName}
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }}
                        />
                    ) : null}
                    <svg className={`${volunteer.pictureUrl ? 'hidden' : ''}`} width="40" height="40" viewBox="0 0 24 24" fill="#94A3B8" stroke="none">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                </div>
            </div>

            <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-start">
                    <span className="text-sm text-text-primary w-24 flex-shrink-0">ชื่อ - สกุล</span>
                    <span className="text-sm font-medium text-text-primary truncate">
                        {volunteer.firstName || volunteer.lastName
                            ? `${volunteer.firstName || ''} ${volunteer.lastName || ''}`.trim()
                            : volunteer.displayName || '-'}
                    </span>
                </div>

                <div className="flex items-start">
                    <span className="text-sm text-text-primary w-24 flex-shrink-0">ที่อยู่</span>
                    <span className="text-sm text-text-primary truncate">
                        {volunteer.addressDetail || '-'}
                    </span>
                </div>

                <div className="flex items-start">
                    <span className="text-sm text-text-primary w-24 flex-shrink-0">เบอร์ โทร</span>
                    <span className="text-sm text-text-primary">{volunteer.phone || '-'}</span>
                </div>
            </div>
        </div>
    );
}
