'use client';

import { LazyRealTimeMap } from '@/components/maps/LazyMap';

export default function MapPage() {
    return (
        <div className="flex flex-col h-screen">
            <h1 className="text-2xl font-bold p-4 text-center z-10 bg-white shadow-md">
                Real-time Volunteer Map
            </h1>
            <div className="flex-grow">
                <LazyRealTimeMap />
            </div>
        </div>
    );
}
