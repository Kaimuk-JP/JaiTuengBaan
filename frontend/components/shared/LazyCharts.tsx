'use client';

import dynamic from 'next/dynamic';

const ChartLoadingFallback = () => (
    <div className="w-full h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-primary mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">กำลังโหลดกราฟ...</p>
        </div>
    </div>
);

export const LazyPatientTypeChart = dynamic(
    () => import('@/components/staff/dashboard/PatientTypeChart'),
    {
        loading: ChartLoadingFallback,
        ssr: false,
    }
);

export const LazyMonthlyBookingChart = dynamic(
    () => import('@/components/staff/dashboard/MonthlyBookingChart'),
    {
        loading: ChartLoadingFallback,
        ssr: false,
    }
);

export const LazyEquipmentDemandChart = dynamic(
    () => import('@/components/staff/dashboard/EquipmentDemandChart'),
    {
        loading: ChartLoadingFallback,
        ssr: false,
    }
);
