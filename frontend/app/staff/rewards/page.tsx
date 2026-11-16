'use client';

import ProtectedRoute from '@/components/shared/ProtectedRoute';
import StaffLayout from '@/components/staff/layout/StaffLayout';
import RewardList from '@/components/staff/rewards/RewardList';

export default function StaffRewardsPage() {
    return (
        <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
            <StaffLayout>
                <RewardList />
            </StaffLayout>
        </ProtectedRoute>
    );
}
