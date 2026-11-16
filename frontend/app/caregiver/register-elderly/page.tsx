'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getApiUrl } from '@/lib/api';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import LayoutWithSidebar from '@/components/shared/LayoutWithSidebar';
import { CaregiverSidebar } from '@/components/caregiver/sidebar';
import { CaregiverHeader } from '@/components/caregiver/header';
import { RegisterElderlyForm } from '@/components/caregiver/form';

function RegisterElderlyPageContent() {
    const searchParams = useSearchParams();
    const namePrefill = searchParams.get('name');

    const [user, setUser] = useState<any>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await fetch(`${getApiUrl()}/auth/profile`, {
                    credentials: 'include',
                });
                if (response.ok) {
                    const userData = await response.json();
                    setUser(userData);
                }
            } catch (err) {
                console.error('Error fetching user:', err);
            }
        };
        fetchUser();
    }, []);

    return (
        <LayoutWithSidebar role="CAREGIVER" showSidebar={false} user={user}>
            <div className="min-h-screen bg-white">
                <CaregiverSidebar user={user} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <CaregiverHeader user={user} onToggleSidebar={() => setSidebarOpen(true)} />

                <div className="px-[16px] py-[16px]">
                    <h1 className="text-center text-brand-primary font-bold mb-3x">
                        เพิ่มประชาชนในความดูแล
                    </h1>
                    <RegisterElderlyForm prefillName={namePrefill} />
                </div>
            </div>
        </LayoutWithSidebar>
    );
}

export default function RegisterElderlyPage() {
    return (
        <ProtectedRoute allowedRoles={['CAREGIVER', 'ADMIN']}>
            <Suspense
                fallback={
                    <div className="min-h-screen bg-white flex items-center justify-center">
                        <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                }
            >
                <RegisterElderlyPageContent />
            </Suspense>
        </ProtectedRoute>
    );
}
