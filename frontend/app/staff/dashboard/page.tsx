'use client';

import ProtectedRoute from '@/components/shared/ProtectedRoute';
import StaffLayout from '@/components/staff/layout/StaffLayout';
import StaffDashboard from '@/components/staff/dashboard/StaffDashboard';
import StaffHeader from '@/components/staff/layout/StaffHeader';
import { useAuth } from '@/contexts/AuthContext';

function DashboardPage() {
    const { user: currentUser } = useAuth();

    return (
        <StaffLayout user={currentUser}>
            { }
            <StaffHeader
                title="Dashboard ภาพรวม"
                subtitle="ระบบช่วยเหลือรับส่งประชาชน"
            />

            { }
            <StaffDashboard />
        </StaffLayout>
    );
}

export default function DashboardPageWrapper() {
    return (
        <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
            <DashboardPage />
        </ProtectedRoute>
    );
}
