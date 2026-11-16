'use client';

import { useRouter } from 'next/navigation';
import PersonnelCard from '@/components/staff/personnel/PersonnelCard';
import { User } from '@/types/user';

interface PersonnelListProps {
    users: User[];
    loading: boolean;
}

export default function PersonnelList({ users, loading }: PersonnelListProps) {
    const router = useRouter();

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64 p-6 bg-white min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
            </div>
        );
    }

    if (users.length === 0) {
        return (
            <div className="text-center py-20 text-text-tertiary p-6 bg-white min-h-[400px]">
                <p>ไม่พบข้อมูลบุคลากร</p>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 min-h-[400px]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {users.map((user) => (
                    <div key={user.id} onClick={() => router.push(`/staff/personnel/${user.id}`)} className="cursor-pointer">
                        <PersonnelCard user={user} />
                    </div>
                ))}
            </div>
        </div>
    );
}
