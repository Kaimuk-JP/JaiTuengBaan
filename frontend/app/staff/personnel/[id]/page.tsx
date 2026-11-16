'use client';

import { use } from 'react';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import StaffLayout from '@/components/staff/layout/StaffLayout';
import PersonnelDetailContainer from '@/components/staff/personnel/detail/PersonnelDetailContainer';

export default function PersonnelDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);

    return (
        <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
            <StaffLayout>
                <PersonnelDetailContainer id={id} />
            </StaffLayout>
        </ProtectedRoute>
    );
}
