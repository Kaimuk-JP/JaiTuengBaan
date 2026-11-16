'use client';

import ProtectedRoute from '@/components/shared/ProtectedRoute';
import StaffLayout from '@/components/staff/layout/StaffLayout';
import AddVolunteerContainer from '@/components/staff/volunteers/add/AddVolunteerContainer';

export default function AddVolunteerPage() {
    return (
        <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
            <StaffLayout>
                <AddVolunteerContainer />
            </StaffLayout>
        </ProtectedRoute>
    );
}
