'use client';

import { useState } from 'react';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import CareUHeader from '@/components/careu/Header/CareUHeader';
import CareUSidebar from '@/components/careu/Sidebar/CareUSidebar';
import WorkHistory from '@/components/volunteer/work-history/WorkHistory';
import { useAuth } from '@/contexts/AuthContext';

export default function CareUWorkHistoryPage() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { user } = useAuth();

    return (
        <ProtectedRoute allowedRoles={['CAREU', 'ADMIN']}>
            <div className="min-h-screen w-full bg-white">
                <CareUSidebar user={user} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <CareUHeader user={user} onToggleSidebar={() => setSidebarOpen(true)} />
                <WorkHistory variant="careu" />
            </div>
        </ProtectedRoute>
    );
}
