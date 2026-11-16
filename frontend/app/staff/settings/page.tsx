'use client';

import dynamic from 'next/dynamic';
import { useAuth } from '@/contexts/AuthContext';
import { SettingsProvider } from '@/contexts/SettingsContext';

const StaffLayout = dynamic(() => import('@/components/staff/layout/StaffLayout'), { ssr: false });
const SettingsContainer = dynamic(() => import('@/components/staff/settings/SettingsContainer'), { ssr: false });

export default function StaffSettingsPage() {
    const { user } = useAuth();

    return (
        <StaffLayout user={user}>
            <SettingsProvider>
                <SettingsContainer />
            </SettingsProvider>
        </StaffLayout>
    );
}
