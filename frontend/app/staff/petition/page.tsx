'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import StaffLayout from '@/components/staff/layout/StaffLayout';
import { useAuth } from '@/contexts/AuthContext';
import StaffHeader from '@/components/staff/layout/StaffHeader';
import PetitionList from '@/components/staff/petition/PetitionList';
import PetitionEditList from '@/components/staff/petition-edit/PetitionList';
import CaregiverRequestList from '@/components/staff/caregiver-requests/CaregiverRequestList';
import RedemptionList from '@/components/staff/rewards/redemptions/RedemptionList';
import RoleRequestList from '@/components/staff/role/RoleRequestList';

const TABS = [
    {
        id: 'booking', label: 'คำร้องการจอง', icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="currentColor" />
            </svg>
        )
    },
    {
        id: 'edit', label: 'แก้ไขข้อมูล', icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 17.25V21H6.75L17.81 9.94L14.06 6.19L3 17.25ZM20.71 7.04C21.1 6.65 21.1 6.02 20.71 5.63L18.37 3.29C17.98 2.9 17.35 2.9 16.96 3.29L15.13 5.12L18.88 8.87L20.71 7.04Z" fill="currentColor" />
            </svg>
        )
    },
    {
        id: 'caregiver', label: 'ผู้ดูแลประชาชน', icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor" />
            </svg>
        )
    },
    {
        id: 'role', label: 'คำร้องเปลี่ยนโรล', icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 3h5v5" />
                <path d="M4 20L21 3" />
                <path d="M21 16v5h-5" />
                <path d="M15 15l6 6" />
                <path d="M4 4l5 5" />
            </svg>
        )
    },
    {
        id: 'redemptions', label: 'แลกของรางวัล', icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 12 7.4 15.38 12 17 10.83 14.92 8H20v6z" fill="currentColor" />
            </svg>
        )
    },
];

function PetitionPage() {
    const { user: currentUser } = useAuth();
    const searchParams = useSearchParams();
    const router = useRouter();
    const initialTab = searchParams.get('tab') || 'booking';
    const [activeTab, setActiveTab] = useState(initialTab);

    const handleTabChange = (tabId: string) => {
        setActiveTab(tabId);
        const params = new URLSearchParams(searchParams.toString());
        if (tabId === 'booking') {
            params.delete('tab');
        } else {
            params.set('tab', tabId);
        }
        const newUrl = params.toString() ? `/staff/petition?${params.toString()}` : '/staff/petition';
        router.replace(newUrl, { scroll: false });
    };

    return (
        <StaffLayout user={currentUser}>
            { }
            <StaffHeader
                title="ตรวจสอบคำร้อง"
                icon={
                    <div className="w-12 h-12 bg-glacier-light rounded-square flex items-center justify-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 17.25V21H6.75L17.81 9.94L14.06 6.19L3 17.25ZM20.71 7.04C21.1 6.65 21.1 6.02 20.71 5.63L18.37 3.29C17.98 2.9 17.35 2.9 16.96 3.29L15.13 5.12L18.88 8.87L20.71 7.04Z" fill="#1C1B1F" />
                        </svg>
                    </div>
                }
            />

            { }
            <div className="px-3x bg-white border-b border-slate-200 sticky top-0 z-20">
                <div className="flex gap-1">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id)}
                            className={`
                                relative flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-all duration-200
                                ${activeTab === tab.id
                                    ? 'text-brand-primary'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                }
                            `}
                        >
                            <span className={activeTab === tab.id ? 'text-brand-primary' : 'text-slate-400'}>
                                {tab.icon}
                            </span>
                            {tab.label}
                            { }
                            {activeTab === tab.id && (
                                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-brand-primary rounded-t-full" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            { }
            {activeTab === 'booking' && <PetitionList />}
            {activeTab === 'edit' && <PetitionEditList />}
            {activeTab === 'caregiver' && <CaregiverRequestList />}
            {activeTab === 'role' && (
                <div className="p-6">
                    <RoleRequestList />
                </div>
            )}
            {activeTab === 'redemptions' && <RedemptionList />}
        </StaffLayout>
    );
}

export default function PetitionPageWrapper() {
    return (
        <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
            <Suspense fallback={
                <div className="flex min-h-screen items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
                </div>
            }>
                <PetitionPage />
            </Suspense>
        </ProtectedRoute>
    );
}