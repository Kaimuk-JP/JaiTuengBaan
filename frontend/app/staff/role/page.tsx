'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StaffRoleRequestsPageRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/staff/petition?tab=role');
    }, [router]);

    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
        </div>
    );
}
