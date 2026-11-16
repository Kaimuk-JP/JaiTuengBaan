'use client';

import React, { use } from 'react';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import StaffLayout from '@/components/staff/layout/StaffLayout';
import StaffHeader from '@/components/staff/layout/StaffHeader';
import { useAuth } from '@/contexts/AuthContext';
import RoleRequestDetail from '@/components/staff/role/RoleRequestDetail';
import { ShieldCheck } from 'lucide-react';

export default function StaffRoleRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { user: currentUser } = useAuth();

    return (
        <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
            <StaffLayout user={currentUser}>
                <StaffHeader
                    title="ตรวจสอบคำร้องขอสลับ / เพิ่มบทบาท"
                    icon={
                        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/40 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                    }
                />

                <div className="p-6">
                    <RoleRequestDetail requestId={id} />
                </div>
            </StaffLayout>
        </ProtectedRoute>
    );
}
