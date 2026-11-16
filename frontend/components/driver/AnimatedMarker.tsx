'use client';

import { useEffect, useState, useRef } from 'react';
import { Marker } from 'react-map-gl/mapbox';

interface AnimatedMarkerProps {
    position: [number, number];
    children: React.ReactNode;
    anchor?: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    rotationAlignment?: 'map' | 'viewport';
    pitchAlignment?: 'map' | 'viewport';
}

export function useAnimatedPosition(position: [number, number], duration = 300): [number, number] {
    const [currentPos, setCurrentPos] = useState<[number, number]>(position);
    const requestRef = useRef<number>(0);
    const previousTimeRef = useRef<number>(0);
    const startPosRef = useRef<[number, number]>(position);
    const targetPosRef = useRef<[number, number]>(position);

    useEffect(() => {
        startPosRef.current = currentPos;
        targetPosRef.current = position;
        previousTimeRef.current = 0;

        const animate = (time: number) => {
            if (previousTimeRef.current === 0) {
                previousTimeRef.current = time;
            }

            const elapsed = time - previousTimeRef.current;
            const progress = Math.min(elapsed / duration, 1);

            const eased = 1 - Math.pow(1 - progress, 3);

            const lat = startPosRef.current[0] + (targetPosRef.current[0] - startPosRef.current[0]) * eased;
            const lng = startPosRef.current[1] + (targetPosRef.current[1] - startPosRef.current[1]) * eased;

            setCurrentPos([lat, lng]);

            if (progress < 1) {
                requestRef.current = requestAnimationFrame(animate);
            }
        };

        requestRef.current = requestAnimationFrame(animate);

        return () => {
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
        };
    }, [position[0], position[1], duration]);

    return currentPos;
}

export default function AnimatedMarker({
    position,
    children,
    anchor = 'center',
    rotationAlignment = 'map',
    pitchAlignment = 'map',
}: AnimatedMarkerProps) {
    const currentPos = useAnimatedPosition(position);

    return (
        <Marker
            longitude={currentPos[1]}
            latitude={currentPos[0]}
            anchor={anchor}
            rotationAlignment={rotationAlignment}
            pitchAlignment={pitchAlignment}
        >
            {children}
        </Marker>
    );
}
