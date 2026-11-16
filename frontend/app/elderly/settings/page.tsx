'use client';

import React from 'react';
import { getApiUrl } from '@/lib/api';
import dynamic from 'next/dynamic';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import LayoutWithSidebar from '@/components/shared/LayoutWithSidebar';
import { useState, useEffect } from 'react';

import RoleSwitcherCard from '@/components/shared/role/RoleSwitcherCard';
import LineAccountCard from '@/components/shared/LineAccountCard';

const ElderlySidebar = dynamic(() => import('@/components/elderly/sidebar/ElderlySidebar'), { ssr: false });
const ElderlyHeader = dynamic(() => import('@/components/elderly/header/ElderlyHeader'), { ssr: false });
const SettingsPanel = dynamic(() => import('gov-layout').then(mod => ({ default: mod.SettingsPanel })), { ssr: false });

function ElderlySettingsPage() {
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
        <LayoutWithSidebar role="USERS" showSidebar={false} user={user}>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative pb-16">
                <ElderlySidebar user={user} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <ElderlyHeader user={user} variant="large" onToggleSidebar={() => setSidebarOpen(true)} />
                <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
                    <RoleSwitcherCard />
                    <LineAccountCard />
                    <SettingsPanel />
                </div>
            </div>
        </LayoutWithSidebar>
    );
}

export default function ElderlySettings() {
    return (
        <ProtectedRoute allowedRoles={['USERS', 'ADMIN']}>
            <ElderlySettingsPage />
        </ProtectedRoute>
    );
}
