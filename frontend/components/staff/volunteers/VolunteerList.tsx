'use client';

import { useRouter } from 'next/navigation';
import VolunteerCard from './VolunteerCard';

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

interface VolunteerListProps {
    volunteers: Volunteer[];
    loading: boolean;
}

export default function VolunteerList({ volunteers, loading }: VolunteerListProps) {
    const router = useRouter();

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64 p-6 bg-white min-h-[calc(100vh-280px)]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
        );
    }

    if (volunteers.length === 0) {
        return (
            <div className="text-center py-20 text-slate-500 p-6 bg-white min-h-[calc(100vh-280px)]">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">ไม่พบจิตอาสา</h3>
                <p className="text-sm text-slate-500">ไม่พบจิตอาสาที่ตรงกับการค้นหา</p>
            </div>
        );
    }

    return (
        <div className="p-6 bg-white min-h-[calc(100vh-280px)]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                {volunteers.map((volunteer) => (
                    <div
                        key={volunteer.id}
                        onClick={() => router.push(`/staff/volunteers/${volunteer.id}`)}
                        className="cursor-pointer"
                    >
                        <VolunteerCard volunteer={volunteer} />
                    </div>
                ))}
            </div>
        </div>
    );
}
