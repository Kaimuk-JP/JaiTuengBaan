'use client';

import ProtectedRoute from '@/components/shared/ProtectedRoute';
import StaffLayout from '@/components/staff/layout/StaffLayout';
import NotificationContainer from '@/components/staff/notifications/NotificationContainer';

export default function StaffNotificationsPage() {
    return (
        <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
            <StaffLayout>
                <NotificationContainer />
            </StaffLayout>
        </ProtectedRoute>
    );
}
