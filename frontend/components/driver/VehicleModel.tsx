'use client';

import { useEffect, useMemo, useState } from 'react';
import { Source, Layer, useMap } from 'react-map-gl/mapbox';
import type { ExpressionSpecification } from 'mapbox-gl';
import { useAnimatedPosition } from './AnimatedMarker';

const MODEL_ID = 'ambulance';
const MODEL_URL = '/models/ambulance.glb';

const MODEL_SCALE = [
    'interpolate', ['linear'], ['zoom'],
    ...Array.from({ length: 12 }, (_, i) => {
        const zoom = 10 + i;
        const k = Math.max(1, 8 * 2 ** (17 - zoom));
        return [zoom, ['literal', [k, k, k]]];
    }).flat(),
] as unknown as ExpressionSpecification;

interface VehicleModelProps {
    id: string;
    position: [number, number];
    heading: number;
}

export default function VehicleModel({ id, position, heading }: VehicleModelProps) {
    const { current: mapRef } = useMap();
    const [modelReady, setModelReady] = useState(false);
    const [lat, lng] = useAnimatedPosition(position);

    useEffect(() => {
        const map = mapRef?.getMap();
        if (!map) return;
        const addModel = () => {
            if (!map.hasModel(MODEL_ID)) map.addModel(MODEL_ID, MODEL_URL);
            setModelReady(true);
        };
        if (map.isStyleLoaded()) addModel();
        map.on('style.load', addModel);
        return () => {
            map.off('style.load', addModel);
        };
    }, [mapRef]);

    const data = useMemo<GeoJSON.Feature<GeoJSON.Point>>(() => ({
        type: 'Feature',
        properties: { rotation: [0, 0, heading - 90] },
        geometry: { type: 'Point', coordinates: [lng, lat] },
    }), [lat, lng, heading]);

    if (!modelReady) return null;

    return (
        <Source id={`${id}-source`} type="geojson" data={data}>
            <Layer
                id={`${id}-model`}
                type="model"
                layout={{ 'model-id': MODEL_ID }}
                paint={{
                    'model-type': 'common-3d',
                    'model-scale': MODEL_SCALE,
                    'model-rotation': ['get', 'rotation'] as ExpressionSpecification,
                    'model-emissive-strength': 1,
                }}
            />
        </Source>
    );
}
