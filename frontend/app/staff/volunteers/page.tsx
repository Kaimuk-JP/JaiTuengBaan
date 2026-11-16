'use client';

import ProtectedRoute from '@/components/shared/ProtectedRoute';
import StaffLayout from '@/components/staff/layout/StaffLayout';
import VolunteerContainer from '@/components/staff/volunteers/VolunteerContainer';

export default function StaffVolunteersPage() {
    return (
        <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
            <StaffLayout>
                <VolunteerContainer />
            </StaffLayout>
        </ProtectedRoute>
    );
}
