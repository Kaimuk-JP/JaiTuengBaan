'use client';

import ProtectedRoute from '@/components/shared/ProtectedRoute';
import StaffLayout from '@/components/staff/layout/StaffLayout';
import PersonnelContainer from '@/components/staff/personnel/PersonnelContainer';

export default function PersonnelPage() {
    return (
        <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
            <StaffLayout>
                <PersonnelContainer />
            </StaffLayout>
        </ProtectedRoute>
    );
}
