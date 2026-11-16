'use client';

import ProtectedRoute from '@/components/shared/ProtectedRoute';
import StaffLayout from '@/components/staff/layout/StaffLayout';
import VolunteerDetailContainer from '@/components/staff/volunteers/detail/VolunteerDetailContainer';

export default function VolunteerDetailPage() {
    return (
        <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
            <StaffLayout>
                <VolunteerDetailContainer />
            </StaffLayout>
        </ProtectedRoute>
    );
}
