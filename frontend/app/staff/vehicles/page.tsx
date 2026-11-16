'use client';

import VehiclesClient from '@/components/staff/vehicles/VehiclesClient';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import StaffLayout from '@/components/staff/layout/StaffLayout';
import StaffHeader from '@/components/staff/layout/StaffHeader';
import { useAuth } from '@/contexts/AuthContext';

function VehiclesPage() {
    const { user: currentUser } = useAuth();

    return (
        <StaffLayout user={currentUser}>
            <StaffHeader
                title="การจัดการข้อมูลรถ"
                icon={
                    <div className="w-12 h-12 bg-blue-100 rounded-square-hard flex items-center justify-center flex-shrink-0 text-blue-600">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5H6.5C5.84 5 5.28 5.42 5.08 6.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.08 3.11H5.77L6.85 7zM19 17H5v-4.66l.12-.34h13.77l.11.34V17z" fill="currentColor" />
                            <circle cx="7.5" cy="14.5" r="1.5" fill="currentColor" />
                            <circle cx="16.5" cy="14.5" r="1.5" fill="currentColor" />
                        </svg>
                    </div>
                }
            />
            <div className="space-y-6 pt-6 px-4 sm:px-6 lg:px-8 pb-8">
                <VehiclesClient />
            </div>
        </StaffLayout>
    );
}

export default function VehiclesPageWrapper() {
    return (
        <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
            <VehiclesPage />
        </ProtectedRoute>
    );
}
