"use client";

import ProtectedRoute from '@/components/shared/ProtectedRoute';
import UnifiedProfile from '@/components/shared/profile/UnifiedProfile';
import CareUHeader from '@/components/careu/Header/CareUHeader';
import CareUSidebar from '@/components/careu/Sidebar/CareUSidebar';

export default function CareUProfilePage() {
    return (
        <ProtectedRoute allowedRoles={['CAREU', 'ADMIN']}>
            <UnifiedProfile
                renderHeader={({ user, onToggleSidebar }) => (
                    <CareUHeader user={user} onToggleSidebar={onToggleSidebar} iconColor="white" />
                )}
                renderSidebar={({ user, isOpen, onClose }) => (
                    <CareUSidebar user={user} isOpen={isOpen} onClose={onClose} />
                )}
            />
        </ProtectedRoute>
    );
}
