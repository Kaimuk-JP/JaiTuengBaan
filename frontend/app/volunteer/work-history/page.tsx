'use client';

import { useState } from 'react';
import WorkHistory from '@/components/volunteer/work-history/WorkHistory';
import HeaderVolunteer from '@/components/volunteer/header/HeaderVolunteer';
import { VolunteerSidebar } from '@/components/volunteer/sidebar';
import ProtectedRoute from '@/components/shared/ProtectedRoute';

export default function Page() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ProtectedRoute allowedRoles={['DRIVE', 'ADMIN']}>
      <div className="min-h-screen w-full bg-white">
        <VolunteerSidebar user={null} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <HeaderVolunteer onToggleSidebar={() => setSidebarOpen(true)} />
        <WorkHistory />
      </div>
    </ProtectedRoute>
  );
}