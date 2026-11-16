'use client';

import ProtectedRoute from '@/components/shared/ProtectedRoute';
import StaffLayout from '@/components/staff/layout/StaffLayout';
import RedemptionList from '@/components/staff/rewards/redemptions/RedemptionList';

export default function StaffRedemptionsPage() {
    return (
        <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
            <StaffLayout>
                <RedemptionList />
            </StaffLayout>
        </ProtectedRoute>
    );
}
