'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import StaffLayout from '@/components/staff/layout/StaffLayout';
import { useAuth } from '@/contexts/AuthContext';
import StaffHeader from '@/components/staff/layout/StaffHeader';
import DisbursementReport from '@/components/staff/disbursement-report/DisbursementReport';
import StaffHistoryContent from '@/components/staff/history/StaffHistoryContent';
import RewardHistoryContainer from '@/components/staff/rewards/history/RewardHistoryContainer';
import RatingsReport from '@/components/staff/ratings-report/RatingsReport';

const TABS = [
    {
        id: 'disbursement',
        label: 'รายงานการทำงาน',
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" fill="currentColor" />
            </svg>
        ),
    },
    {
        id: 'history',
        label: 'ประวัติคำร้อง',
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z" fill="currentColor" />
            </svg>
        ),
    },
    {
        id: 'rewards',
        label: 'ประวัติรางวัล',
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" />
            </svg>
        ),
    },
    {
        id: 'ratings',
        label: 'คะแนนประเมิน',
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z" fill="currentColor" />
            </svg>
        ),
    },
];

function ReportsPage() {
    const { user: currentUser } = useAuth();
    const searchParams = useSearchParams();
    const router = useRouter();
    const initialTab = searchParams.get('tab') || 'disbursement';
    const [activeTab, setActiveTab] = useState(initialTab);

    const handleTabChange = (tabId: string) => {
        setActiveTab(tabId);
        const params = new URLSearchParams(searchParams.toString());
        if (tabId === 'disbursement') {
            params.delete('tab');
        } else {
            params.set('tab', tabId);
        }
        const newUrl = params.toString() ? `/staff/reports?${params.toString()}` : '/staff/reports';
        router.replace(newUrl, { scroll: false });
    };

    return (
        <StaffLayout user={currentUser}>
            <StaffHeader
                title="รายงานและประวัติ"
                icon={
                    <div className="w-12 h-12 bg-emerald-50 rounded-square flex items-center justify-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" fill="#1E7D55" />
                        </svg>
                    </div>
                }
            />

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
                            {activeTab === tab.id && (
                                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-brand-primary rounded-t-full" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {activeTab === 'disbursement' && <DisbursementReport />}
            {activeTab === 'history' && <StaffHistoryContent />}
            {activeTab === 'rewards' && <RewardHistoryContainer />}
            {activeTab === 'ratings' && <RatingsReport />}
        </StaffLayout>
    );
}

export default function ReportsPageWrapper() {
    return (
        <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
            <Suspense fallback={
                <div className="flex min-h-screen items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
                </div>
            }>
                <ReportsPage />
            </Suspense>
        </ProtectedRoute>
    );
}
