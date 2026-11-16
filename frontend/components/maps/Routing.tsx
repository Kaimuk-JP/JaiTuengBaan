import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Source, Layer, useMap } from 'react-map-gl/mapbox';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

interface RoutingProps {
    pathPoints: [number, number][];
    driverLocation?: [number, number] | null;
    onNavigationUpdate?: (info: NavigationInfo | null) => void;
    onReroute?: () => void;
    onRouteCoordinatesUpdate?: (coords: [number, number][]) => void;
}

export interface NavigationInfo {
    distanceToDestination: number;
    durationToDestination: number;
    currentInstruction: string;
    nextInstruction: string | null;
    distanceToNextTurn: number;
    maneuver: string;
    isOffRoute?: boolean;
    destinationName?: string;
}

interface RouteStepManeuver {
    type: string;
    modifier?: string;
    location: [number, number];
}

interface RouteStep {
    distance: number;
    duration: number;
    maneuver: RouteStepManeuver;
    name?: string;
}

const translateManeuver = (type: string, modifier?: string): string => {
    const translations: Record<string, string> = {
        'turn-left': 'เลี้ยวซ้าย',
        'turn-right': 'เลี้ยวขวา',
        'turn-slight left': 'เบี่ยงซ้ายเล็กน้อย',
        'turn-slight right': 'เบี่ยงขวาเล็กน้อย',
        'turn-sharp left': 'เลี้ยวซ้ายมาก',
        'turn-sharp right': 'เลี้ยวขวามาก',
        'uturn': 'กลับรถ',
        'straight': 'ตรงไป',
        'depart': 'ออกเดินทาง',
        'arrive': 'ถึงจุดหมาย',
        'merge-left': 'เข้าร่วมทางซ้าย',
        'merge-right': 'เข้าร่วมทางขวา',
        'fork-left': 'แยกซ้าย',
        'fork-right': 'แยกขวา',
        'ramp-left': 'ทางลาดซ้าย',
        'ramp-right': 'ทางลาดขวา',
        'roundabout': 'วงเวียน',
        'rotary': 'วงเวียน',
        'end of road-left': 'สุดถนนเลี้ยวซ้าย',
        'end of road-right': 'สุดถนนเลี้ยวขวา',
        'continue': 'ตรงไปต่อ',
        'new name': 'ตรงไป',
    };

    const key = modifier ? `${type}-${modifier}` : type;
    return translations[key] || translations[type] || 'ตรงไป';
};

export const getManeuverIcon = (maneuver: string): React.ReactNode => {
    if (maneuver.includes('left')) {
        return (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5m0 0l7-7m-7 7l7 7" />
            </svg>
        );
    }
    if (maneuver.includes('right')) {
        return (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14m0 0l-7-7m7 7l-7 7" />
            </svg>
        );
    }
    if (maneuver.includes('uturn')) {
        return (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 14L4 9l5-5" />
                <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
            </svg>
        );
    }
    if (maneuver.includes('roundabout') || maneuver.includes('rotary')) {
        return (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                <path d="M16 8h5V3" />
            </svg>
        );
    }
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19V5m0 0l-7 7m7-7l7 7" />
        </svg>
    );
};

const pointToLineDistance = (
    point: [number, number],
    lineStart: [number, number],
    lineEnd: [number, number]
): number => {
    const [px, py] = point;
    const [x1, y1] = lineStart;
    const [x2, y2] = lineEnd;

    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) {
        param = dot / lenSq;
    }

    let xx, yy;

    if (param < 0) {
        xx = x1;
        yy = y1;
    } else if (param > 1) {
        xx = x2;
        yy = y2;
    } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;

    return Math.sqrt(dx * dx + dy * dy) * 111000;
};

const isDriverOffRoute = (
    driverPos: [number, number],
    routeCoordinates: [number, number][],
    thresholdMeters: number = 50
): boolean => {
    if (routeCoordinates.length < 2) return false;

    let minDistance = Infinity;

    for (let i = 0; i < routeCoordinates.length - 1; i++) {
        const distance = pointToLineDistance(
            driverPos,
            routeCoordinates[i],
            routeCoordinates[i + 1]
        );
        minDistance = Math.min(minDistance, distance);
    }

    return minDistance > thresholdMeters;
};

const OFF_ROUTE_THRESHOLD = 40;
const OFF_ROUTE_CONFIRM_TIME = 4000;
const REROUTE_COOLDOWN = 5000;

const reverseGeocode = async (lat: number, lng: number): Promise<string | null> => {
    try {
        const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&language=th&types=poi,address&limit=1`
        );

        if (response.ok) {
            const data = await response.json();
            if (data.features && data.features.length > 0) {
                return data.features[0].text || data.features[0].place_name?.split(',')[0] || null;
            }
        }
        return null;
    } catch (error) {
        console.error('Reverse geocoding error:', error);
        return null;
    }
};

const routeLayerStyle = {
    id: 'route-line',
    type: 'line' as const,
    paint: {
        'line-color': '#3b82f6',
        'line-width': 6,
        'line-opacity': 0.9,
    },
    layout: {
        'line-cap': 'round',
        'line-join': 'round',
    },
};

const rerouteLayerStyle = {
    id: 'route-line-reroute',
    type: 'line' as const,
    paint: {
        'line-color': '#FFA500',
        'line-width': 6,
        'line-opacity': 0.9,
    },
    layout: {
        'line-cap': 'round',
        'line-join': 'round',
    },
};

export default function Routing({ pathPoints, driverLocation, onNavigationUpdate, onReroute, onRouteCoordinatesUpdate }: RoutingProps) {
    const { current: mapRef } = useMap();
    const [routeGeoJSON, setRouteGeoJSON] = useState<GeoJSON.Feature<GeoJSON.LineString> | null>(null);
    const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
    const [steps, setSteps] = useState<RouteStep[]>([]);
    const [isRerouting, setIsRerouting] = useState(false);
    const [destinationName, setDestinationName] = useState<string | null>(null);
    const lastRerouteTimeRef = useRef<number>(0);
    const currentRouteKeyRef = useRef<string>('');
    const offRouteStartTimeRef = useRef<number | null>(null);
    const lastGeocodedEndRef = useRef<string>('');
    const onNavigationUpdateRef = useRef(onNavigationUpdate);
    const onRouteCoordinatesUpdateRef = useRef(onRouteCoordinatesUpdate);
    const lastNavInfoRef = useRef<NavigationInfo | null>(null);
    const lastDestinationsKeyRef = useRef<string>('');
    const lastFittedEndRef = useRef<string>('');

    useEffect(() => {
        onNavigationUpdateRef.current = onNavigationUpdate;
    }, [onNavigationUpdate]);

    useEffect(() => {
        onRouteCoordinatesUpdateRef.current = onRouteCoordinatesUpdate;
    }, [onRouteCoordinatesUpdate]);

    useEffect(() => {
        if (!pathPoints || pathPoints.length < 2) return;
        const end = pathPoints[pathPoints.length - 1];
        const endKey = `${end[0]},${end[1]}`;
        if (endKey !== lastGeocodedEndRef.current) {
            lastGeocodedEndRef.current = endKey;
            reverseGeocode(end[0], end[1]).then(name => {
                if (name) {
                    setDestinationName(name);
                }
            });
        }
    }, [pathPoints]);

    const fetchRoute = useCallback(async (
        points: [number, number][],
        isReroute: boolean = false,
        shouldFitBounds: boolean = false
    ) => {
        if (!points || points.length < 2 || !MAPBOX_TOKEN) {
            return;
        }

        const destinationsKey = points.slice(1).map(pt => `${pt[0].toFixed(5)},${pt[1].toFixed(5)}`).join('-');
        const routeKey = points.map(pt => `${pt[0].toFixed(4)},${pt[1].toFixed(4)}`).join('-');

        if (!isReroute && lastDestinationsKeyRef.current === destinationsKey) {
            return;
        }

        currentRouteKeyRef.current = routeKey;
        lastDestinationsKeyRef.current = destinationsKey;

        try {
            if (isReroute) {
                setIsRerouting(true);
            }

            const coordinatesString = points.map(pt => `${pt[1]},${pt[0]}`).join(';');
            const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinatesString}?overview=full&geometries=geojson&steps=true&access_token=${MAPBOX_TOKEN}&language=th`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
                const route = data.routes[0];
                const coordinates: [number, number][] = route.geometry.coordinates.map(
                    (coord: [number, number]) => [coord[1], coord[0]]
                );

                if (coordinates.length >= 2) {
                    setRouteCoordinates(coordinates);
                    onRouteCoordinatesUpdateRef.current?.(coordinates);
                    setRouteGeoJSON({
                        type: 'Feature',
                        properties: {},
                        geometry: route.geometry,
                    });
                    currentRouteKeyRef.current = routeKey;
                } else {
                    const fallbackCoords: [number, number][] = [
                        [points[0][1], points[0][0]],
                        [points[points.length - 1][1], points[points.length - 1][0]]
                    ];
                    setRouteGeoJSON({
                        type: 'Feature',
                        properties: {},
                        geometry: {
                            type: 'LineString',
                            coordinates: fallbackCoords,
                        },
                    });
                    setRouteCoordinates([points[0], points[points.length - 1]]);
                }

                if (route.legs) {
                    const allSteps = route.legs.flatMap((leg: any) => leg.steps || []);
                    setSteps(allSteps);
                }

                if (shouldFitBounds && mapRef) {
                    const allLngs = route.geometry.coordinates.map((c: number[]) => c[0]);
                    const allLats = route.geometry.coordinates.map((c: number[]) => c[1]);
                    const bounds: [[number, number], [number, number]] = [
                        [Math.min(...allLngs), Math.min(...allLats)],
                        [Math.max(...allLngs), Math.max(...allLats)]
                    ];
                    mapRef.fitBounds(bounds, { padding: 50, duration: 1000 });
                }

                if (isReroute && onReroute) {
                    onReroute();
                }
            } else {
                const fallbackCoords: [number, number][] = [
                    [points[0][1], points[0][0]],
                    [points[points.length - 1][1], points[points.length - 1][0]]
                ];
                setRouteGeoJSON({
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'LineString',
                        coordinates: fallbackCoords,
                    },
                });
                setRouteCoordinates([points[0], points[points.length - 1]]);
                setSteps([]);
            }
        } catch (error) {
            console.error('Error fetching route:', error);
            const fallbackCoords: [number, number][] = [
                [points[0][1], points[0][0]],
                [points[points.length - 1][1], points[points.length - 1][0]]
            ];
            setRouteGeoJSON({
                type: 'Feature',
                properties: {},
                geometry: {
                    type: 'LineString',
                    coordinates: fallbackCoords,
                },
            });
            setRouteCoordinates([points[0], points[points.length - 1]]);
            setSteps([]);
        } finally {
            setIsRerouting(false);
        }
    }, [mapRef, onReroute]);

    useEffect(() => {
        if (!mapRef || !pathPoints || pathPoints.length < 2) return;

        const end = pathPoints[pathPoints.length - 1];
        const endKey = `${end[0].toFixed(6)},${end[1].toFixed(6)}`;
        const isNewDestination = lastFittedEndRef.current !== endKey;

        if (isNewDestination) {
            lastFittedEndRef.current = endKey;
        }

        fetchRoute(pathPoints, false, isNewDestination);
    }, [mapRef, pathPoints, fetchRoute]);

    useEffect(() => {
        if (!driverLocation || routeCoordinates.length < 2 || isRerouting) return;

        const now = Date.now();

        if (now - lastRerouteTimeRef.current < REROUTE_COOLDOWN) {
            offRouteStartTimeRef.current = null;
            return;
        }

        const offRoute = isDriverOffRoute(driverLocation, routeCoordinates, OFF_ROUTE_THRESHOLD);

        if (offRoute) {
            if (offRouteStartTimeRef.current === null) {
                offRouteStartTimeRef.current = now;
            } else {
                const offRouteDuration = now - offRouteStartTimeRef.current;
                if (offRouteDuration >= OFF_ROUTE_CONFIRM_TIME) {
                    lastRerouteTimeRef.current = now;
                    offRouteStartTimeRef.current = null;
                    if (pathPoints && pathPoints.length >= 2) {
                        const newPoints: [number, number][] = [driverLocation, ...pathPoints.slice(1)];
                        fetchRoute(newPoints, true, false);
                    }
                }
            }
        } else {
            if (offRouteStartTimeRef.current !== null) {
                offRouteStartTimeRef.current = null;
            }
        }
    }, [driverLocation, routeCoordinates, pathPoints, fetchRoute, isRerouting]);

    const findCurrentStep = useCallback((driverPos: [number, number], allSteps: RouteStep[]) => {
        if (!allSteps.length) return null;

        const stepsWithDistance = allSteps.map((step, index) => {
            if (step.maneuver && step.maneuver.location) {
                const stepLat = step.maneuver.location[1];
                const stepLng = step.maneuver.location[0];
                const distance = Math.sqrt(
                    Math.pow(driverPos[0] - stepLat, 2) +
                    Math.pow(driverPos[1] - stepLng, 2)
                ) * 111000;
                return { step, index, distance };
            }
            return { step, index, distance: Infinity };
        });

        let currentStepIndex = 0;
        const PASSED_THRESHOLD = 30;

        for (let i = 0; i < stepsWithDistance.length; i++) {
            const { distance } = stepsWithDistance[i];
            if (distance < PASSED_THRESHOLD && i < allSteps.length - 1) {
                currentStepIndex = i + 1;
            } else if (distance < 500) {
                currentStepIndex = i;
                break;
            }
        }

        currentStepIndex = Math.min(currentStepIndex, allSteps.length - 1);

        let remainingDistance = 0;
        let remainingDuration = 0;
        for (let i = currentStepIndex; i < allSteps.length; i++) {
            remainingDistance += allSteps[i].distance;
            remainingDuration += allSteps[i].duration;
        }

        const currentStep = allSteps[currentStepIndex];
        const nextStep = allSteps[currentStepIndex + 1] || null;

        const maneuverType = currentStep?.maneuver?.type || 'straight';
        const maneuverModifier = currentStep?.maneuver?.modifier || '';

        const currentStepDistance = stepsWithDistance[currentStepIndex]?.distance || currentStep?.distance || 0;

        return {
            distanceToDestination: remainingDistance,
            durationToDestination: remainingDuration,
            currentInstruction: translateManeuver(maneuverType, maneuverModifier),
            nextInstruction: nextStep ? translateManeuver(
                nextStep.maneuver?.type || 'straight',
                nextStep.maneuver?.modifier
            ) : null,
            distanceToNextTurn: Math.round(currentStepDistance),
            maneuver: maneuverModifier ? `${maneuverType}-${maneuverModifier}` : maneuverType,
            isOffRoute: isRerouting,
            destinationName: destinationName || undefined,
        };
    }, [isRerouting, destinationName]);

    useEffect(() => {
        if (driverLocation && steps.length > 0) {
            const navInfo = findCurrentStep(driverLocation, steps);

            const hasChanged = !lastNavInfoRef.current ||
                lastNavInfoRef.current.distanceToDestination !== navInfo?.distanceToDestination ||
                lastNavInfoRef.current.currentInstruction !== navInfo?.currentInstruction ||
                lastNavInfoRef.current.distanceToNextTurn !== navInfo?.distanceToNextTurn ||
                lastNavInfoRef.current.isOffRoute !== navInfo?.isOffRoute;

            if (hasChanged && navInfo) {
                lastNavInfoRef.current = navInfo;
                onNavigationUpdateRef.current?.(navInfo);
            }
        } else if (steps.length === 0 && lastNavInfoRef.current !== null) {
            lastNavInfoRef.current = null;
            onNavigationUpdateRef.current?.(null);
        }
    }, [driverLocation, steps, findCurrentStep]);

    if (!routeGeoJSON) {
        return null;
    }

    const layerStyle = isRerouting ? rerouteLayerStyle : routeLayerStyle;

    return (
        <Source id="route-source" type="geojson" data={routeGeoJSON}>
            <Layer {...(layerStyle as any)} />
        </Source>
    );
}
