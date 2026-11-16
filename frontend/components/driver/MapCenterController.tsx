'use client';

import { useEffect, useRef } from 'react';
import { useMap } from 'react-map-gl/mapbox';

interface MapCenterControllerProps {
    center: [number, number] | null;
    tracking: boolean;
    bearing?: number | null;
    pitch?: number;
    zoom?: number;
    onUserInteraction?: () => void;
    onBearingChange?: (bearing: number) => void;
}

export default function MapCenterController({
    center,
    tracking,
    bearing = null,
    pitch = 0,
    zoom,
    onUserInteraction,
    onBearingChange,
}: MapCenterControllerProps) {
    const { current: mapRef } = useMap();
    const hasCenteredRef = useRef(false);
    const isAutoMovingRef = useRef(false);

    useEffect(() => {
        if (!mapRef || !onUserInteraction) return;

        const handleDragStart = () => {
            if (!isAutoMovingRef.current) {
                onUserInteraction();
            }
        };

        const handleZoomStart = () => {
            if (!isAutoMovingRef.current) {
                onUserInteraction();
            }
        };

        mapRef.on('dragstart', handleDragStart);
        mapRef.on('zoomstart', handleZoomStart);

        return () => {
            mapRef.off('dragstart', handleDragStart);
            mapRef.off('zoomstart', handleZoomStart);
        };
    }, [mapRef, onUserInteraction]);

    useEffect(() => {
        if (!mapRef || !onBearingChange) return;

        const handleMove = () => {
            onBearingChange(mapRef.getBearing());
        };

        mapRef.on('move', handleMove);
        return () => {
            mapRef.off('move', handleMove);
        };
    }, [mapRef, onBearingChange]);

    useEffect(() => {
        if (!center || !mapRef) return;

        if (tracking) {
            isAutoMovingRef.current = true;

            mapRef.easeTo({
                center: [center[1], center[0]],
                ...(bearing !== null ? { bearing } : {}),
                pitch,
                zoom: zoom ?? 17,
                duration: 300,
                padding: { top: 200, bottom: 250, left: 0, right: 0 },
            });

            setTimeout(() => {
                isAutoMovingRef.current = false;
            }, 400);
        } else if (!hasCenteredRef.current) {
            mapRef.flyTo({
                center: [center[1], center[0]],
                zoom: zoom ?? 13,
                bearing: bearing ?? 0,
                pitch: 0,
                duration: 1000,
            });
            hasCenteredRef.current = true;
        }
    }, [center, mapRef, tracking, bearing, pitch, zoom]);

    const prevTrackingRef = useRef(tracking);
    useEffect(() => {
        if (!mapRef) return;
        if (prevTrackingRef.current && !tracking) {
            mapRef.easeTo({
                pitch: 0,
                bearing: 0,
                duration: 600,
            });
        }
        prevTrackingRef.current = tracking;
    }, [tracking, mapRef]);

    return null;
}
