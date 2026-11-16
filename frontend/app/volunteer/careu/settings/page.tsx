'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { getApiUrl } from '@/lib/api';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import LayoutWithSidebar from '@/components/shared/LayoutWithSidebar';

import RoleSwitcherCard from '@/components/shared/role/RoleSwitcherCard';

const CareUSidebar = dynamic(
    () => import('@/components/careu/Sidebar/CareUSidebar'),
    { ssr: false }
);
const CareUHeader = dynamic(
    () => import('@/components/careu/Header/CareUHeader'),
    { ssr: false }
);
const SettingsPanel = dynamic(
    () => import('gov-layout').then((mod) => ({ default: mod.SettingsPanel })),
    { ssr: false }
);

function CareUSettingsContent() {
    const [user, setUser] = useState<any>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch(`${getApiUrl()}/auth/profile`, { credentials: 'include' });
                if (res.ok) {
                    setUser(await res.json());
                }
            } catch (err) {
                console.error('Error fetching user:', err);
            }
        };
        fetchUser();
    }, []);

    return (
        <LayoutWithSidebar role="CAREU" showSidebar={false} user={user}>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative pb-16">
                <CareUSidebar user={user} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

                <div className="bg-gradient-to-bl from-[#3AAE7D] to-[#346D55] dark:from-slate-800 dark:to-slate-900 relative text-white">
                    <CareUHeader user={user} onToggleSidebar={() => setSidebarOpen(true)} />
                </div>

                <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
                    <RoleSwitcherCard />
                    <SettingsPanel />
                </div>
            </div>
        </LayoutWithSidebar>
    );
}

export default function CareUSettingsPage() {
    return (
        <ProtectedRoute allowedRoles={['CAREU', 'ADMIN']}>
            <CareUSettingsContent />
        </ProtectedRoute>
    );
}
