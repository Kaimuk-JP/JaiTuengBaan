'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

const WorkCalendarApp = dynamic(() => import('@/components/volunteer/calendar/WorkCalendarApp'), { ssr: false });
const HeaderVolunteer = dynamic(() => import('@/components/volunteer/header/HeaderVolunteer'), { ssr: false });
const VolunteerSidebarDynamic = dynamic(
  () => import('@/components/volunteer/sidebar').then(mod => ({ default: mod.VolunteerSidebar })),
  { ssr: false }
);
import ProtectedRoute from '@/components/shared/ProtectedRoute';

export default function Page() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleNavigateToMap = (jobId: number) => {
    router.push(`/volunteer/driver?map=true&jobId=${jobId}`);
  };

  return (
    <ProtectedRoute allowedRoles={['DRIVE', 'ADMIN']}>
      <div className="min-h-screen bg-white text-gray-700">
        <VolunteerSidebarDynamic isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <HeaderVolunteer onToggleSidebar={() => setSidebarOpen(true)} />
        <div className="w-full">
          <WorkCalendarApp onNavigateToMap={handleNavigateToMap} />
        </div>
      </div>
    </ProtectedRoute>
  );
}