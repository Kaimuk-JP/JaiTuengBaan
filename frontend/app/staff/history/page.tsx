'use client';

import ProtectedRoute from '@/components/shared/ProtectedRoute';
import StaffLayout from '@/components/staff/layout/StaffLayout';
import StaffHistoryContent from '@/components/staff/history/StaffHistoryContent';

export default function StaffHistoryPage() {
    return (
        <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
            <StaffLayout>
                <StaffHistoryContent />
            </StaffLayout>
        </ProtectedRoute>
    );
}
