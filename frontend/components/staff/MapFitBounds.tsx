'use client';

import { useEffect } from 'react';
import { useMap } from 'react-map-gl/mapbox';
import mapboxgl from 'mapbox-gl';
import type { LatLng } from '@/lib/sanitizeLocationTrail';

interface MapFitBoundsProps {
    points: LatLng[];
    minZoom?: number;
}

export default function MapFitBounds({ points, minZoom }: MapFitBoundsProps) {
    const { current: map } = useMap();
    const pointsKey = points.map((p) => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`).join('|');

    useEffect(() => {
        if (!map || points.length === 0) return;

        if (points.length === 1) {
            map.flyTo({
                center: [points[0].lng, points[0].lat],
                zoom: minZoom ?? 14,
                duration: 400,
            });
            return;
        }

        const bounds = new mapboxgl.LngLatBounds();
        points.forEach((p) => bounds.extend([p.lng, p.lat]));
        map.fitBounds(bounds, {
            padding: 48,
            maxZoom: minZoom ?? 15,
            duration: 400,
        });
    }, [map, pointsKey, minZoom]);

    return null;
}
