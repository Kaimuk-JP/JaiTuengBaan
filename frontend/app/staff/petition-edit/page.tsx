'use client';

import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import StaffLayout from '@/components/staff/layout/StaffLayout';
import StaffHeader from '@/components/staff/layout/StaffHeader';
import PetitionList from '@/components/staff/petition-edit/PetitionList';

function PetitionEditPage() {
    const { user: currentUser } = useAuth();

    return (
        <StaffLayout user={currentUser}>
            {}
            <StaffHeader
                title="คำร้องขอแก้ไขข้อมูล"
                icon={
                    <div className="w-14 h-14 bg-glacier-light text-glacier-dark rounded-square flex items-center justify-center">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                }
            />

            {}
            <PetitionList />
        </StaffLayout>
    );
}

export default function PetitionEditPageWrapper() {
    return (
        <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
            <PetitionEditPage />
        </ProtectedRoute>
    );
}