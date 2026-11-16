'use client';

import { useState, useEffect, useRef } from 'react';
import Map, { Marker, useMap } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

import Routing, { NavigationInfo } from '../maps/Routing';
import MapCenterController from './MapCenterController';
import { PassengerMarker, HospitalMarker, MunicipalityMarker } from './MapIcons';
import VehicleModel from './VehicleModel';
import { useAuth } from '@/contexts/AuthContext';
import { filterActiveDropoff } from '@/utils/tripQueueOrder';
import { canDriverCompleteTrip, hasCareUAwaitingPhotoConfirmation } from '@/utils/jobHelpers';
import { applyMapboxThaiLanguage } from '@/lib/mapboxThaiLanguage';
import type { RideRequest, DriverLocation } from './types';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const MAPBOX_STYLE = process.env.NEXT_PUBLIC_MAPBOX_STYLE || 'mapbox://styles/mapbox/satellite-streets-v12';

const calculateBearing = (startLat: number, startLng: number, destLat: number, destLng: number): number => {
    const startLatRad = (startLat * Math.PI) / 180;
    const startLngRad = (startLng * Math.PI) / 180;
    const destLatRad = (destLat * Math.PI) / 180;
    const destLngRad = (destLng * Math.PI) / 180;

    const y = Math.sin(destLngRad - startLngRad) * Math.cos(destLatRad);
    const x = Math.cos(startLatRad) * Math.sin(destLatRad) -
        Math.sin(startLatRad) * Math.cos(destLatRad) * Math.cos(destLngRad - startLngRad);

    let bearing = (Math.atan2(y, x) * 180) / Math.PI;
    return (bearing + 360) % 360;
};

interface MapViewProps {
    center: [number, number];
    driverLocation: DriverLocation | null;
    rideRequests: RideRequest[];
    activeRequest: RideRequest | null;
    isTracking: boolean;
    onUserInteraction?: () => void;
    isBottomSheetOpen?: boolean;
    onNavigationUpdate?: (info: NavigationInfo | null) => void;
    deviceHeading?: number | null;
    isStaffView?: boolean;
    showTraffic?: boolean;
    orderedPickup?: RideRequest[];
    orderedDropoff?: RideRequest[];
    orderedHospitalReturn?: RideRequest[];
}

export default function MapView({
    center,
    driverLocation,
    rideRequests,
    activeRequest,
    isTracking,
    onUserInteraction,
    isBottomSheetOpen = true,
    onNavigationUpdate,
    deviceHeading = null,
    isStaffView = false,
    showTraffic = false,
    orderedPickup: orderedPickupProp,
    orderedDropoff: orderedDropoffProp,
    orderedHospitalReturn: orderedHospitalReturnProp,
}: MapViewProps) {
    const [isMounted, setIsMounted] = useState(false);
    const [hospitalLocation, setHospitalLocation] = useState<[number, number] | null>(null);
    const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
    const { user } = useAuth();

    const muniLat = user?.organization?.lat || 13.5606244;
    const muniLng = user?.organization?.lng || 99.8396245;

    const prevLocation = useRef<DriverLocation | null>(null);
    const [rotationAngle, setRotationAngle] = useState(0);
    const prevHospitalNameRef = useRef<string | null>(null);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const { current: mapInstance } = useMap();
    useEffect(() => {
        if (!mapInstance) return;
        const map = mapInstance.getMap();
        if (map.getLayer('traffic-layer')) {
            map.setLayoutProperty('traffic-layer', 'visibility', showTraffic ? 'visible' : 'none');
        }
    }, [showTraffic, mapInstance]);

    useEffect(() => {
        const prevLoc = prevLocation.current;
        if (driverLocation) {
            prevLocation.current = driverLocation;
        }

        if (deviceHeading !== null) {
            setRotationAngle(deviceHeading);
            return;
        }

        if (driverLocation && prevLoc) {
            const { lat: prevLat, lng: prevLng } = prevLoc;
            const { lat: currLat, lng: currLng } = driverLocation;

            const dist = Math.sqrt(Math.pow(currLat - prevLat, 2) + Math.pow(currLng - prevLng, 2));
            if (dist > 0.00002) {
                const bearing = calculateBearing(prevLat, prevLng, currLat, currLng);
                setRotationAngle(bearing);
            }
        }
    }, [driverLocation, deviceHeading]);

    useEffect(() => {
        const fetchHospitalLocation = async () => {
            if (!activeRequest) {
                setHospitalLocation(null);
                return;
            }

            const hospital = activeRequest.queue.hospital;
            const hospitalName = hospital?.name || activeRequest.queue.hospitalName;

            if (!hospitalName) {
                setHospitalLocation(null);
                return;
            }

            if (hospitalLocation && hospitalName === prevHospitalNameRef.current) {
                return;
            }

            if (hospital?.lat && hospital?.lng) {
                setHospitalLocation([hospital.lat, hospital.lng]);
                prevHospitalNameRef.current = hospitalName;
                return;
            }

            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL;
                const response = await fetch(`${API_URL}/hospitals?search=${encodeURIComponent(hospitalName)}&limit=1`);
                const data = await response.json();

                const hospitals = Array.isArray(data) ? data : data.data;

                if (hospitals && hospitals.length > 0 && hospitals[0].lat && hospitals[0].lng) {
                    const { lat, lng } = hospitals[0];
                    setHospitalLocation([lat, lng]);
                } else {
                    console.warn(`Hospital "${hospitalName}" not found in database`);
                    setHospitalLocation(null);
                }
            } catch (error) {
                console.error("Error fetching hospital location:", error);
                setHospitalLocation(null);
            }
            prevHospitalNameRef.current = hospitalName;
        };

        fetchHospitalLocation();
    }, [activeRequest?.job?.status, activeRequest?.queue.hospitalName, activeRequest]);

    if (!isMounted) {
        return (
            <div className="h-full w-full flex items-center justify-center bg-background-tertiary">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto mb-2"></div>
                    <p className="text-text-secondary">กำลังโหลดแผนที่...</p>
                </div>
            </div>
        );
    }

    interface PathResult {
        points: [number, number][];
        orderedPassengers: RideRequest[];
    }

    const getPathData = (): PathResult | null => {
        if (!activeRequest || !driverLocation) return null;

        const status = activeRequest.job?.status;

        const getHosp = (q: any) => q.hospital?.name || q.hospitalName || '-';
        const getRoundGroup = (timeStr?: string | null) => {
            if (!timeStr) return 'none';
            return timeStr.replace(/[–—]/g, '-').replace(/\s+/g, ' ').trim();
        };

        const getDateKey = (dateStr?: string | null) => {
            if (!dateStr) return 'none';
            return new Date(dateStr).toISOString().split('T')[0];
        };

        const currentTripRequests = rideRequests.filter(req =>
            (isStaffView || req.vlt?.id === user?.id) &&
            getDateKey(req.queue.requestDate) === getDateKey(activeRequest.queue.requestDate) &&
            getRoundGroup(req.queue.bookingTime) === getRoundGroup(activeRequest.queue.bookingTime) &&
            getHosp(req.queue) === getHosp(activeRequest.queue)
        );

        const stillNeedPickup = orderedPickupProp?.length
            ? orderedPickupProp
            : currentTripRequests.filter(req =>
                ['ASSIGNED', 'ACCEPTED', 'PICKING_UP'].includes(req.job?.status || '')
            );
        const stillNeedDropOff = orderedDropoffProp?.length
            ? filterActiveDropoff(orderedDropoffProp)
            : currentTripRequests.filter(req =>
                req.job?.status === 'RETURN_HOME'
            );
        const allInTransit = currentTripRequests.length > 0 &&
            currentTripRequests.every(req => req.job?.status === 'IN_TRANSIT');

        if (stillNeedPickup.length > 0) {
            const ordered = stillNeedPickup;
            if (ordered.length > 0) {
                return {
                    points: [
                        [driverLocation.lat, driverLocation.lng],
                        [ordered[0].queue.user.lat, ordered[0].queue.user.lng] as [number, number]
                    ],
                    orderedPassengers: ordered,
                };
            }
        }

        const stillNeedHospitalPickup = orderedHospitalReturnProp?.length
            ? orderedHospitalReturnProp
            : currentTripRequests.filter(
                (req) =>
                    req.job?.status === 'AT_HOSPITAL' &&
                    (req.job as { returnPickupRequestedAt?: string | null })?.returnPickupRequestedAt
            );

        if (stillNeedHospitalPickup.length > 0 && hospitalLocation) {
            return {
                points: [[driverLocation.lat, driverLocation.lng], hospitalLocation as [number, number]],
                orderedPassengers: stillNeedHospitalPickup,
            };
        }

        if (allInTransit || status === 'IN_TRANSIT') {
            const dest = hospitalLocation || [activeRequest.queue.user.lat, activeRequest.queue.user.lng];
            return {
                points: [[driverLocation.lat, driverLocation.lng], dest as [number, number]],
                orderedPassengers: [],
            };
        }

        if (stillNeedDropOff.length > 0) {
            const ordered = stillNeedDropOff;
            if (ordered.length > 0) {
                return {
                    points: [
                        [driverLocation.lat, driverLocation.lng],
                        [ordered[0].queue.user.lat, ordered[0].queue.user.lng] as [number, number]
                    ],
                    orderedPassengers: ordered,
                };
            }
        }

        if (hasCareUAwaitingPhotoConfirmation(currentTripRequests)) {
            const pending = currentTripRequests.find(
                (req) =>
                    req.job?.status === 'AT_PATIENT_HOME' &&
                    !!(req.job?.careuId || req.careu?.id),
            );
            if (pending?.queue.user.lat != null && pending.queue.user.lng != null) {
                return {
                    points: [
                        [driverLocation.lat, driverLocation.lng],
                        [pending.queue.user.lat, pending.queue.user.lng] as [number, number],
                    ],
                    orderedPassengers: [pending],
                };
            }
        }

        if (canDriverCompleteTrip(currentTripRequests)) {
            return {
                points: [[driverLocation.lat, driverLocation.lng], [muniLat, muniLng]],
                orderedPassengers: [],
            };
        }

        return null;
    };

    const pathData = getPathData();
    const pathPoints = pathData?.points || null;
    const orderedPassengers = pathData?.orderedPassengers || [];

    const getHospitalCoordsForRequest = (req: RideRequest): [number, number] | null => {
        const hosp = req.queue.hospital;
        if (hosp?.lat != null && hosp?.lng != null) return [hosp.lat, hosp.lng];
        if (hospitalLocation) return hospitalLocation;
        return null;
    };

    const shouldShowMarkerAtHospital = (req: RideRequest) =>
        req.job?.status === 'AT_HOSPITAL' && getHospitalCoordsForRequest(req) !== null;

    const getPassengerMarkerPosition = (req: RideRequest): { lat: number; lng: number } | null => {
        if (shouldShowMarkerAtHospital(req)) {
            const coords = getHospitalCoordsForRequest(req)!;
            return { lat: coords[0], lng: coords[1] };
        }
        if (req.queue.user.lat != null && req.queue.user.lng != null) {
            return { lat: req.queue.user.lat, lng: req.queue.user.lng };
        }
        return null;
    };

    const getMarkerOffsets = (requests: RideRequest[]) => {
        const keyCounts: Record<string, number> = {};
        const keyIndexes: Record<string, number> = {};
        const result: Record<number, { lat: number; lng: number }> = {};

        const withPos = requests
            .map((req) => {
                const pos = getPassengerMarkerPosition(req);
                return pos ? { id: req.id, lat: pos.lat, lng: pos.lng } : null;
            })
            .filter((item): item is { id: number; lat: number; lng: number } => item !== null);

        withPos.forEach(({ lat, lng }) => {
            const key = `${lat},${lng}`;
            keyCounts[key] = (keyCounts[key] || 0) + 1;
        });

        withPos.forEach(({ id, lat, lng }) => {
            const key = `${lat},${lng}`;
            if (keyCounts[key] > 1) {
                const idx = keyIndexes[key] || 0;
                keyIndexes[key] = idx + 1;
                const radius = 0.00015;
                const angle = (2 * Math.PI * idx) / keyCounts[key];
                result[id] = {
                    lat: lat + radius * Math.cos(angle),
                    lng: lng + radius * Math.sin(angle),
                };
            } else {
                result[id] = { lat, lng };
            }
        });

        return result;
    };

    const orderedMarkerCoords = getMarkerOffsets(orderedPassengers);
    const allMarkerCoords = getMarkerOffsets(rideRequests);
    const hasHospitalPickupMarkers = orderedPassengers.some((req) => shouldShowMarkerAtHospital(req));

    const snapDriverToRoute = (
        pos: [number, number],
        coords: [number, number][]
    ): { lat: number; lng: number; bearing: number } | null => {
        if (coords.length < 2) return null;
        let minDist = Infinity;
        let snappedLat = pos[0];
        let snappedLng = pos[1];
        let snappedBearing = 0;
        for (let i = 0; i < coords.length - 1; i++) {
            const [lat1, lng1] = coords[i];
            const [lat2, lng2] = coords[i + 1];
            const A = pos[0] - lat1, B = pos[1] - lng1;
            const C = lat2 - lat1, D = lng2 - lng1;
            const lenSq = C * C + D * D;
            const param = lenSq !== 0 ? Math.max(0, Math.min(1, (A * C + B * D) / lenSq)) : 0;
            const cLat = lat1 + param * C;
            const cLng = lng1 + param * D;
            const dist = Math.sqrt(Math.pow(pos[0] - cLat, 2) + Math.pow(pos[1] - cLng, 2));
            if (dist < minDist) {
                minDist = dist;
                snappedLat = cLat;
                snappedLng = cLng;
                snappedBearing = calculateBearing(lat1, lng1, lat2, lng2);
            }
        }
        const MAX_SNAP_DIST = 0.0005;
        return minDist < MAX_SNAP_DIST ? { lat: snappedLat, lng: snappedLng, bearing: snappedBearing } : null;
    };

    const snapped = driverLocation && routeCoords.length >= 2
        ? snapDriverToRoute([driverLocation.lat, driverLocation.lng], routeCoords)
        : null;
    const displayDriverPos: [number, number] = snapped
        ? [snapped.lat, snapped.lng]
        : driverLocation ? [driverLocation.lat, driverLocation.lng] : [0, 0];

    const trueHeading = snapped ? snapped.bearing : rotationAngle;

    const mapTargetBearing = isTracking
        ? (typeof deviceHeading === 'number' ? deviceHeading : trueHeading)
        : null;

    return (
        <Map
            initialViewState={{
                longitude: center[1],
                latitude: center[0],
                zoom: 13,
                pitch: 0,
                bearing: 0,
            }}
            padding={{ top: 0, bottom: isBottomSheetOpen ? 320 : 220, left: 0, right: 0 }}
            style={{ width: '100%', height: '100%' }}
            mapStyle={MAPBOX_STYLE}
            mapboxAccessToken={MAPBOX_TOKEN}
            minZoom={5}
            maxPitch={60}
            pitchWithRotate={true}
            dragRotate={true}
            touchPitch={true}
            maxBounds={[[96.5, 5.0], [106.5, 21.0]]}
            attributionControl={false}
            onLoad={e => {
                const map = e.target;

                applyMapboxThaiLanguage(map);
                map.on('style.load', () => applyMapboxThaiLanguage(map));

                try {
                    const map = e.target;
                    if (!map.getSource('mapbox-traffic')) {
                        map.addSource('mapbox-traffic', {
                            type: 'vector',
                            url: 'mapbox://mapbox.mapbox-traffic-v1'
                        });
                        map.addLayer({
                            id: 'traffic-layer',
                            type: 'line',
                            source: 'mapbox-traffic',
                            'source-layer': 'traffic',
                            layout: {
                                'line-join': 'round',
                                'line-cap': 'round',
                                'visibility': showTraffic ? 'visible' : 'none'
                            },
                            paint: {
                                'line-color': [
                                    'match',
                                    ['get', 'congestion'],
                                    'low', '#10B981',
                                    'moderate', '#F59E0B',
                                    'heavy', '#EF4444',
                                    'severe', '#991B1B',
                                    '#64748B'
                                ],
                                'line-width': 3,
                                'line-opacity': 0.75
                            }
                        });
                    }
                } catch (trafficErr) {
                    console.warn('Traffic layer:', trafficErr);
                }
            }}
        >
            <MapCenterController
                center={driverLocation ? [driverLocation.lat, driverLocation.lng] : null}
                tracking={isTracking}
                bearing={mapTargetBearing}
                pitch={isTracking ? 55 : 0}
                zoom={isTracking ? 17 : 15}
                onUserInteraction={onUserInteraction}
            />

            {driverLocation && (
                <VehicleModel id="driver-vehicle" position={displayDriverPos} heading={trueHeading} />
            )}

            {orderedPassengers.length > 0 ? (
                orderedPassengers
                    .filter((req) => getPassengerMarkerPosition(req) !== null)
                    .map((req) => {
                        const pos = getPassengerMarkerPosition(req)!;
                        return (
                        <Marker
                            key={`passenger-${req.id}`}
                            longitude={orderedMarkerCoords[req.id]?.lng ?? pos.lng}
                            latitude={orderedMarkerCoords[req.id]?.lat ?? pos.lat}
                            anchor="bottom"
                        >
                            <PassengerMarker pictureUrl={req.queue.user.pictureUrl} />
                        </Marker>
                        );
                    })
            ) : (
                activeRequest?.job?.status && !['IN_TRANSIT', 'RETURN_OFFICE', 'COMPLETED'].includes(activeRequest.job.status) ? (
                    rideRequests
                        .filter((req) => {
                            const st = req.job?.status || '';
                            return getPassengerMarkerPosition(req) !== null &&
                                ['ASSIGNED', 'ACCEPTED', 'PICKING_UP', 'RETURN_HOME', 'AT_HOSPITAL'].includes(st);
                        })
                        .map((req) => {
                            const pos = getPassengerMarkerPosition(req)!;
                            return (
                            <Marker
                                key={`patient-${req.id}`}
                                longitude={allMarkerCoords[req.id]?.lng ?? pos.lng}
                                latitude={allMarkerCoords[req.id]?.lat ?? pos.lat}
                                anchor="bottom"
                            >
                                <PassengerMarker pictureUrl={req.queue.user.pictureUrl} />
                            </Marker>
                            );
                        })
                ) : null
            )}

            {activeRequest && (
                <>
                    {hospitalLocation && !hasHospitalPickupMarkers && (
                        (activeRequest.job?.status === 'IN_TRANSIT' ||
                            (activeRequest.job?.status === 'AT_HOSPITAL' && !activeRequest.job?.returnPickupRequestedAt)) && (
                        <Marker
                            longitude={hospitalLocation[1]}
                            latitude={hospitalLocation[0]}
                            anchor="bottom"
                        >
                            <HospitalMarker />
                        </Marker>
                    ))}

                    {orderedPassengers.length === 0 && activeRequest.job?.status === 'RETURN_OFFICE' && (
                        <Marker
                            longitude={muniLng}
                            latitude={muniLat}
                            anchor="bottom"
                        >
                            <MunicipalityMarker />
                        </Marker>
                    )}
                </>
            )}

            {activeRequest && driverLocation && pathPoints && pathPoints.length >= 2 && (
                <Routing
                    pathPoints={pathPoints}
                    driverLocation={[driverLocation.lat, driverLocation.lng]}
                    onNavigationUpdate={onNavigationUpdate}
                    onRouteCoordinatesUpdate={setRouteCoords}
                />
            )}

            {!activeRequest && rideRequests
                .filter((req) => getPassengerMarkerPosition(req) !== null)
                .map((req) => {
                    const pos = getPassengerMarkerPosition(req)!;
                    return (
                    <Marker
                        key={req.id}
                        longitude={allMarkerCoords[req.id]?.lng ?? pos.lng}
                        latitude={allMarkerCoords[req.id]?.lat ?? pos.lat}
                        anchor="bottom"
                    >
                        <PassengerMarker pictureUrl={req.queue.user.pictureUrl} />
                    </Marker>
                    );
                })}
        </Map>
    );
}
