'use client';

import ProtectedRoute from '@/components/shared/ProtectedRoute';
import UnifiedProfile from '@/components/shared/profile/UnifiedProfile';
import HeaderVolunteer from '@/components/volunteer/header/HeaderVolunteer';
import { VolunteerSidebar } from '@/components/volunteer/sidebar';

export default function Page() {
  return (
    <ProtectedRoute allowedRoles={['DRIVE', 'ADMIN']}>
      <UnifiedProfile
        startEditing
        renderHeader={({ user, onToggleSidebar }) => (
          <HeaderVolunteer user={user} onToggleSidebar={onToggleSidebar} />
        )}
        renderSidebar={({ user, isOpen, onClose }) => (
          <VolunteerSidebar user={user} isOpen={isOpen} onClose={onClose} />
        )}
      />
    </ProtectedRoute>
  );
}