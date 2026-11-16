'use client';

import React, { useState, useEffect } from 'react';
import { getApiUrl } from '@/lib/api';
import dynamic from 'next/dynamic';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import LayoutWithSidebar from '@/components/shared/LayoutWithSidebar';

import RoleSwitcherCard from '@/components/shared/role/RoleSwitcherCard';

const VolunteerSidebarDynamic = dynamic(
  () => import('@/components/volunteer/sidebar').then(mod => ({ default: mod.VolunteerSidebar })),
  { ssr: false }
);
const HeaderVolunteer = dynamic(() => import('@/components/volunteer/header/HeaderVolunteer'), { ssr: false });
const SettingsPanel = dynamic(() => import('gov-layout').then(mod => ({ default: mod.SettingsPanel })), { ssr: false });

function VolunteerSettingsContent() {
    const [user, setUser] = useState<any>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch(`${getApiUrl()}/auth/profile`, { credentials: 'include' });
                if (res.ok) {
                    const data = await res.json();
                    setUser(data);
                }
            } catch (err) {
                console.error('Error fetching user:', err);
            }
        };
        fetchUser();
    }, []);

    return (
        <LayoutWithSidebar role="DRIVE" showSidebar={false} user={user}>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative pb-16">
                <VolunteerSidebarDynamic user={user} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <HeaderVolunteer onToggleSidebar={() => setSidebarOpen(true)} />
                <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
                    <RoleSwitcherCard />
                    <SettingsPanel />
                </div>
            </div>
        </LayoutWithSidebar>
    );
}

export default function VolunteerSettings() {
    return (
        <ProtectedRoute allowedRoles={['DRIVE', 'ADMIN']}>
            <VolunteerSettingsContent />
        </ProtectedRoute>
    );
}
