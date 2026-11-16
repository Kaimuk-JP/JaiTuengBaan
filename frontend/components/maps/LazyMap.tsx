'use client';

import dynamic from 'next/dynamic';

const MapLoadingFallback = () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">กำลังโหลดแผนที่...</p>
        </div>
    </div>
);

export const LazyElderlyMapPicker = dynamic(() => import('@/components/maps/MapPicker'), { loading: MapLoadingFallback, ssr: false });
export const LazyCaregiverMapPicker = dynamic(() => import('@/components/maps/MapPicker'), { loading: MapLoadingFallback, ssr: false });
export const LazyElderlyLocationPickerMap = dynamic(() => import('@/components/elderly/profile/LocationPickerMap'), { loading: MapLoadingFallback, ssr: false });
export const LazyCaregiverLocationPickerMap = dynamic(() => import('@/components/caregiver/profile/LocationPickerMap'), { loading: MapLoadingFallback, ssr: false });
export const LazyDriverMapView = dynamic(() => import('@/components/driver/MapView'), { loading: MapLoadingFallback, ssr: false });
export const LazyRealTimeMap = dynamic(() => import('@/components/maps/RealTimeMap'), { loading: MapLoadingFallback, ssr: false });
export const LazyViewMapModal = dynamic(() => import('@/components/maps/ViewMapModal'), { loading: MapLoadingFallback, ssr: false });
