'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import HeaderVolunteer from '@/components/volunteer/header/HeaderVolunteer';
import { VolunteerSidebar } from '@/components/volunteer/sidebar';
import CareUHeader from '@/components/careu/Header/CareUHeader';
import CareUSidebar from '@/components/careu/Sidebar/CareUSidebar';
import { useAuth } from '@/contexts/AuthContext';

const DriverMap = dynamic(() => import('../../../components/maps/DriverMap'), {
    ssr: false,
    loading: () => (
        <div className="h-full w-full flex items-center justify-center bg-white">
            <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-brand-primary mx-auto mb-2x"></div>
                <p className="typo-body font-semibold text-text-tertiary">กำลังโหลดแผนที่...</p>
            </div>
        </div>
    )
});

const WorkCalendarApp = dynamic(() => import('../../../components/volunteer/calendar/WorkCalendarApp'), {
    ssr: false
});

function DriverMapPageInner() {
    const searchParams = useSearchParams();
    const shouldStartWithMap = searchParams.get('map') === 'true';
    const urlJobId = searchParams.get('jobId');

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'calendar' | 'map'>(shouldStartWithMap ? 'map' : 'calendar');
    const [selectedJobId, setSelectedJobId] = useState<number | null>(urlJobId ? parseInt(urlJobId) : null);
    const router = useRouter();
    const { user } = useAuth();

    useEffect(() => {
        if (shouldStartWithMap) {
            setViewMode('map');
            if (urlJobId) {
                setSelectedJobId(parseInt(urlJobId));
            }
        } else {
            setViewMode('calendar');
        }
    }, [shouldStartWithMap, urlJobId]);

    return (
        <ProtectedRoute allowedRoles={['DRIVE', 'CAREU', 'ADMIN']}>
            <div className="flex flex-col h-screen overflow-hidden relative bg-white w-full">

                {user?.role === 'CAREU' ? (
                    <CareUSidebar user={user} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                ) : (
                    <VolunteerSidebar user={user} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                )}
                {viewMode === 'calendar' && (
                    <div className="flex-none z-20 relative shadow-md">
                        {user?.role === 'CAREU' ? (
                            <CareUHeader user={user} onToggleSidebar={() => setSidebarOpen(true)} />
                        ) : (
                            <HeaderVolunteer user={user} onToggleSidebar={() => setSidebarOpen(true)} />
                        )}
                    </div>
                )}

                <div className="flex-1 relative z-0 overflow-y-auto bg-white">
                    {viewMode === 'calendar' ? (
                        <WorkCalendarApp onNavigateToMap={(jobId) => {
                            setSelectedJobId(jobId);
                            setViewMode('map');
                        }} />
                    ) : (
                        <div className="h-full w-full relative">
                            <button
                                onClick={() => router.back()}
                                className="absolute top-4 left-4 z-[1000] flex items-center gap-1.5 bg-white dark:bg-gray-800 text-brand-primary shadow-lg rounded-full px-4 py-2.5 hover:shadow-xl active:scale-95 transition-all border border-gray-200 dark:border-gray-600"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                                </svg>
                                <span className="text-sm font-semibold">ย้อนกลับ</span>
                            </button>
                            <DriverMap
                                initialJobId={selectedJobId}
                                onExitMap={() => setViewMode('calendar')}
                            />
                        </div>
                    )}
                </div>

            </div>
        </ProtectedRoute>
    );
}

export default function DriverMapPage() {
    return (
        <Suspense fallback={
            <div className="h-screen w-full flex items-center justify-center bg-white">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-brand-primary mx-auto mb-2"></div>
                    <p className="typo-body font-semibold text-text-tertiary">กำลังโหลด...</p>
                </div>
            </div>
        }>
            <DriverMapPageInner />
        </Suspense>
    );
}
