'use client';

import ProtectedRoute from '@/components/shared/ProtectedRoute';
import StaffLayout from '@/components/staff/layout/StaffLayout';
import RewardHistoryContainer from '@/components/staff/rewards/history/RewardHistoryContainer';

export default function RewardHistoryPage() {
    return (
        <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
            <StaffLayout>
                <RewardHistoryContainer />
            </StaffLayout>
        </ProtectedRoute>
    );
}
