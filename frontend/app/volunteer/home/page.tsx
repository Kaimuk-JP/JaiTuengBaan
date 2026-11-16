'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import VolunteerHomeContent from '@/components/volunteer/home/VolunteerHomeContent';

export default function VolunteerHomePage() {
    const router = useRouter();
    const { user, loading } = useAuth();

    useEffect(() => {
        if (!loading && user) {
            if (!user.phone) {
                router.push('/volunteer/verify');
            }
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <ProtectedRoute allowedRoles={['DRIVE', 'ADMIN']}>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
                </div>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute allowedRoles={['DRIVE', 'ADMIN']}>
            <VolunteerHomeContent />
        </ProtectedRoute>
    );
}
