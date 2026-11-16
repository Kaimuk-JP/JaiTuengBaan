'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Map, { Layer, Marker, Source } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useSocket } from '@/contexts/SocketContext';
import { fetchWithAuth } from '@/lib/auth';
import VehicleModel from '@/components/driver/VehicleModel';
import { PassengerMarker, HospitalMarker } from '@/components/driver/MapIcons';
import MapFitBounds from '@/components/staff/MapFitBounds';
import { getJobMapDisplayConfig } from '@/lib/jobTrackingMapConfig';
import {
    buildDrawableTrailSegments,
    extractTripMilestones,
    isPlausibleTrailPoint,
    jobStatusToLeg,
    sanitizeTrailPoints,
    sumTrailMeters,
    thinTrailPointsForDisplay,
    TRAIL_LEG_COLORS,
    TRAIL_LEG_LABELS,
    TRIP_MILESTONE_COLORS,
    TRIP_MILESTONE_LABELS,
    spreadMarkerPositions,
    trailHasLeg,
    ALL_TRAIL_LEGS,
    haversineMeters,
    normalizeLocationLeg,
    type LatLng,
    type LocationLeg,
    type RegisteredWaypointKind,
    type TrailPoint,
    type TripMilestone,
    type TripMilestoneKind,
} from '@/lib/sanitizeLocationTrail';
import { applyMapboxThaiLanguage, THAILAND_MAP_BOUNDS, THAILAND_MAP_MIN_ZOOM } from '@/lib/mapboxThaiLanguage';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const MAPBOX_STYLE = process.env.NEXT_PUBLIC_MAPBOX_STYLE || 'mapbox://styles/mapbox/streets-v12';

interface JobTrackingMapProps {
    jobId: number;
    jobStatus?: string;
    patientLatLng: LatLng | null;
    hospitalLatLng: LatLng | null;
    isLive: boolean;
    patientPictureUrl?: string;
    patientName?: string;
    className?: string;
}

function calculateBearing(startLat: number, startLng: number, destLat: number, destLng: number): number {
    const startLatRad = (startLat * Math.PI) / 180;
    const startLngRad = (startLng * Math.PI) / 180;
    const destLatRad = (destLat * Math.PI) / 180;
    const destLngRad = (destLng * Math.PI) / 180;

    const y = Math.sin(destLngRad - startLngRad) * Math.cos(destLatRad);
    const x =
        Math.cos(startLatRad) * Math.sin(destLatRad) -
        Math.sin(startLatRad) * Math.cos(destLatRad) * Math.cos(destLngRad - startLngRad);

    return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

async function fetchPlannedRoute(waypoints: LatLng[]): Promise<[number, number][]> {
    if (!MAPBOX_TOKEN || waypoints.length < 2) return [];
    const coords = waypoints.map((w) => `${w.lng},${w.lat}`).join(';');
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}?overview=full&geometries=geojson&language=th&access_token=${MAPBOX_TOKEN}`;
    try {
        const res = await fetch(url);
        if (!res.ok) return [];
        const data = await res.json();
        return data.routes?.[0]?.geometry?.coordinates ?? [];
    } catch {
        return [];
    }
}

function formatTrailTime(recordedAt?: string): string | null {
    if (!recordedAt) return null;
    const d = new Date(recordedAt);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}

function TrailEndpointMarker({
    title,
    color,
    timeLabel,
    subtitle,
}: {
    title: string;
    color: string;
    timeLabel?: string | null;
    subtitle?: string | null;
}) {
    return (
        <div className="flex flex-col items-center pointer-events-none">
            <div
                className="min-w-[28px] h-7 px-1.5 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-[10px] font-bold text-white"
                style={{ backgroundColor: color }}
            >
                {title}
            </div>
            {timeLabel && (
                <span className="mt-1 px-1.5 py-0.5 rounded bg-white/95 text-[9px] font-semibold text-slate-700 shadow border border-slate-200 whitespace-nowrap">
                    {timeLabel}
                </span>
            )}
            {subtitle && (
                <span className="mt-0.5 px-1.5 py-0.5 rounded bg-amber-50 text-[9px] font-medium text-amber-800 border border-amber-200 whitespace-nowrap max-w-[140px] text-center">
                    {subtitle}
                </span>
            )}
        </div>
    );
}

function TrailDirectionArrow({ bearing }: { bearing: number }) {
    return (
        <div
            className="pointer-events-none text-slate-800 drop-shadow-md"
            style={{ transform: `rotate(${bearing}deg)` }}
        >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 2l7 18-7-4-7 4 7-18z" />
            </svg>
        </div>
    );
}

type JobWaypoints = {
    patientHome: LatLng | null;
    hospital: LatLng | null;
    office: LatLng | null;
    jobStart: LatLng | null;
    hospitalName?: string | null;
    officeName?: string | null;
};

type JobTrailTimestamps = {
    returnPickupRequestedAt: string | null;
    patientDroppedOffAt: string | null;
    completedAt: string | null;
};

function TripWaypointMarker({
    title,
    color,
    timeLabel,
    variant,
    subtitle,
}: {
    title: string;
    color: string;
    timeLabel?: string | null;
    variant: 'registered' | 'gps';
    subtitle?: string | null;
}) {
    const isRegistered = variant === 'registered';
    return (
        <div className="flex flex-col items-center pointer-events-none max-w-[120px]">
            <div
                className={`min-w-[26px] h-7 px-1.5 flex items-center justify-center text-[9px] font-bold text-white shadow-lg ${
                    isRegistered
                        ? 'rounded-md border-2 border-dashed border-white/90'
                        : 'rounded-full border-2 border-white'
                }`}
                style={{ backgroundColor: color }}
            >
                {title}
            </div>
            {timeLabel && (
                <span className="mt-1 px-1.5 py-0.5 rounded bg-white/95 text-[9px] font-semibold text-slate-700 shadow border border-slate-200 whitespace-nowrap">
                    {timeLabel}
                </span>
            )}
            {subtitle && (
                <span className="mt-0.5 px-1.5 py-0.5 rounded bg-slate-50 text-[8px] font-medium text-slate-600 border border-slate-200 whitespace-nowrap text-center leading-tight">
                    {subtitle}
                </span>
            )}
        </div>
    );
}

function formatMilestoneTime(recordedAt?: string | null): string | null {
    if (!recordedAt) return null;
    const d = new Date(recordedAt);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}

const REGISTERED_WAYPOINT_COLORS: Record<RegisteredWaypointKind, string> = {
    patient_home: '#d97706',
    hospital: '#15803d',
    office: '#4338ca',
};

const MILESTONE_NEAR_REGISTERED_METERS = 45;

export default function JobTrackingMap({
    jobId,
    jobStatus,
    patientLatLng,
    hospitalLatLng,
    isLive,
    patientPictureUrl,
    patientName,
    className = 'h-64 w-full',
}: JobTrackingMapProps) {
    const { socket, isConnected } = useSocket();
    const [trail, setTrail] = useState<TrailPoint[]>([]);
    const [driverPos, setDriverPos] = useState<LatLng | null>(null);
    const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
    const [plannedRoute, setPlannedRoute] = useState<[number, number][]>([]);
    const [loadingTrail, setLoadingTrail] = useState(true);
    const [rotationAngle, setRotationAngle] = useState(0);
    const [jobWaypoints, setJobWaypoints] = useState<JobWaypoints | null>(null);
    const [jobTimestamps, setJobTimestamps] = useState<JobTrailTimestamps | null>(null);
    const prevDriverPosRef = useRef<LatLng | null>(null);

    const displayConfig = useMemo(
        () => getJobMapDisplayConfig(jobStatus, patientLatLng, hospitalLatLng, driverPos, patientName),
        [jobStatus, patientLatLng, hospitalLatLng, driverPos, patientName],
    );

    const isCompletedJob = jobStatus === 'COMPLETED';
    const showPlannedRoute = !isCompletedJob;

    const trailAnchors = useMemo(() => {
        const anchors: LatLng[] = [];
        if (patientLatLng) anchors.push(patientLatLng);
        if (hospitalLatLng) anchors.push(hospitalLatLng);
        if (driverPos) anchors.push(driverPos);
        return anchors;
    }, [patientLatLng, hospitalLatLng, driverPos]);

    const loadTrailFromApi = useCallback(async () => {
        setLoadingTrail(true);
        try {
            const res = await fetchWithAuth(`/jobs/${jobId}/location-trail`);
            if (!res.ok) return;
            const data = await res.json();
            const points: TrailPoint[] = data.points || [];
            setTrail(points);
            if (data.waypoints) {
                setJobWaypoints({
                    patientHome: data.waypoints.patientHome ?? null,
                    hospital: data.waypoints.hospital ?? null,
                    office: data.waypoints.office ?? null,
                    jobStart: data.waypoints.jobStart ?? null,
                    hospitalName: data.waypoints.hospitalName ?? null,
                    officeName: data.waypoints.officeName ?? null,
                });
            }
            if (data.timestamps) {
                setJobTimestamps({
                    returnPickupRequestedAt: data.timestamps.returnPickupRequestedAt ?? null,
                    patientDroppedOffAt: data.timestamps.patientDroppedOffAt ?? null,
                    completedAt: data.timestamps.completedAt ?? null,
                });
            }
            if (data.latest) {
                setDriverPos({ lat: data.latest.lat, lng: data.latest.lng });
                setLastUpdatedAt(data.latest.recordedAt);
            } else if (points.length > 0) {
                const last = points[points.length - 1];
                setDriverPos({ lat: last.lat, lng: last.lng });
                setLastUpdatedAt(last.recordedAt);
            }
        } finally {
            setLoadingTrail(false);
        }
    }, [jobId]);

    useEffect(() => {
        void loadTrailFromApi();
    }, [loadTrailFromApi]);

    const plannedRouteKey = useMemo(() => {
        const waypoints = displayConfig.routeWaypoints;
        if (waypoints.length < 2) return '';
        const precision = displayConfig.phase === 'pickup' ? 2 : 3;
        return waypoints
            .map((w) => `${w.lat.toFixed(precision)},${w.lng.toFixed(precision)}`)
            .join(';');
    }, [displayConfig.routeWaypoints, displayConfig.phase]);

    useEffect(() => {
        if (!showPlannedRoute || !plannedRouteKey) {
            if (!showPlannedRoute) setPlannedRoute([]);
            return;
        }
        let cancelled = false;
        fetchPlannedRoute(displayConfig.routeWaypoints).then((coords) => {
            if (!cancelled) setPlannedRoute(coords);
        });
        return () => {
            cancelled = true;
        };
    }, [plannedRouteKey, displayConfig.routeWaypoints, showPlannedRoute]);

    useEffect(() => {
        if (!isLive || !socket || !isConnected || !jobId) return;

        socket.emit('join_job', { jobId });

        const onTrail = (data: { jobId: number; points: TrailPoint[] }) => {
            if (data.jobId !== jobId) return;
            const incoming = data.points || [];
            setTrail((prev) => (incoming.length >= prev.length ? incoming : prev));
            setLoadingTrail(false);
            const last = incoming[incoming.length - 1];
            if (last) {
                setDriverPos({ lat: last.lat, lng: last.lng });
                setLastUpdatedAt(last.recordedAt);
            }
        };

        const onUpdated = (data: {
            jobId: number;
            lat: number;
            lng: number;
            recordedAt: string;
            leg?: string;
        }) => {
            if (data.jobId !== jobId) return;
            setDriverPos({ lat: data.lat, lng: data.lng });
            setLastUpdatedAt(data.recordedAt);
            const leg = data.leg || jobStatusToLeg(jobStatus);
            setTrail((prev) => {
                const last = prev[prev.length - 1];
                if (last && last.lat === data.lat && last.lng === data.lng) return prev;
                return [...prev, { lat: data.lat, lng: data.lng, recordedAt: data.recordedAt, leg }];
            });
        };

        socket.on('location:trail', onTrail);
        socket.on('location:updated', onUpdated);

        return () => {
            socket.emit('leave_job', { jobId });
            socket.off('location:trail', onTrail);
            socket.off('location:updated', onUpdated);
        };
    }, [isLive, socket, isConnected, jobId, jobStatus]);

    useEffect(() => {
        const prev = prevDriverPosRef.current;
        if (driverPos) {
            if (prev) {
                const dist = Math.sqrt(
                    Math.pow(driverPos.lat - prev.lat, 2) + Math.pow(driverPos.lng - prev.lng, 2),
                );
                if (dist > 0.00002) {
                    setRotationAngle(calculateBearing(prev.lat, prev.lng, driverPos.lat, driverPos.lng));
                }
            }
            prevDriverPosRef.current = driverPos;
        }
    }, [driverPos]);

    const sanitizedTrail = useMemo(
        () => sanitizeTrailPoints(trail, []),
        [trail],
    );

    const displayTrail = useMemo(
        () => thinTrailPointsForDisplay(trail),
        [trail],
    );

    const legTrailSegments = useMemo(
        () => buildDrawableTrailSegments(displayTrail),
        [displayTrail],
    );

    const fullTrailCoords = useMemo<[number, number][]>(
        () => displayTrail.map((p) => [p.lng, p.lat] as [number, number]),
        [displayTrail],
    );

    const trailDotFeatures = useMemo(
        () =>
            sanitizedTrail.map((p, index) => ({
                type: 'Feature' as const,
                geometry: { type: 'Point' as const, coordinates: [p.lng, p.lat] as [number, number] },
                properties: {
                    index,
                    color: TRAIL_LEG_COLORS[normalizeLocationLeg(p.leg)],
                },
            })),
        [sanitizedTrail],
    );

    const hasGpsTrail = sanitizedTrail.length >= 1;
    const hasDrawableTrailLine = fullTrailCoords.length >= 2;
    const trailDistanceKm = useMemo(() => sumTrailMeters(trail) / 1000, [trail]);

    const trailEndpoints = useMemo(() => {
        if (sanitizedTrail.length === 0) return null;
        const start = sanitizedTrail[0];
        const end = sanitizedTrail[sanitizedTrail.length - 1];
        const spreadMeters = haversineMeters(start.lat, start.lng, end.lat, end.lng);
        const sameSpot = sanitizedTrail.length === 1 || spreadMeters < 3;
        const parkedCluster =
            sanitizedTrail.length >= 2 && trailDistanceKm < 0.05 && spreadMeters < 80;
        const bearing = sameSpot ? null : calculateBearing(start.lat, start.lng, end.lat, end.lng);
        const arrowPos = sameSpot
            ? null
            : {
                lat: start.lat + (end.lat - start.lat) * 0.55,
                lng: start.lng + (end.lng - start.lng) * 0.55,
            };
        const startTime = formatTrailTime(start.recordedAt);
        const endTime = formatTrailTime(end.recordedAt);
        return { start, end, sameSpot, parkedCluster, spreadMeters, bearing, arrowPos, startTime, endTime };
    }, [sanitizedTrail, trailDistanceKm]);

    const showTrailEndpoints = hasGpsTrail && trailEndpoints != null;
    const trailLineCap: 'butt' | 'round' = isCompletedJob ? 'butt' : 'round';

    const resolvedWaypoints = useMemo<JobWaypoints>(() => ({
        patientHome: jobWaypoints?.patientHome ?? patientLatLng,
        hospital: jobWaypoints?.hospital ?? hospitalLatLng,
        office: jobWaypoints?.office ?? null,
        jobStart: jobWaypoints?.jobStart ?? null,
        hospitalName: jobWaypoints?.hospitalName ?? null,
        officeName: jobWaypoints?.officeName ?? null,
    }), [jobWaypoints, patientLatLng, hospitalLatLng]);

    const gpsMilestones = useMemo(() => extractTripMilestones(trail), [trail]);

    const registeredWaypointMarkers = useMemo(() => {
        const gpsFor = (kind: TripMilestoneKind) =>
            gpsMilestones.find((m) => m.kind === kind);

        const items: {
            id: string;
            kind: RegisteredWaypointKind;
            lat: number;
            lng: number;
            label: string;
            subtitle?: string | null;
            timeLabel?: string | null;
        }[] = [];

        if (resolvedWaypoints.patientHome) {
            const pickup = gpsFor('patient_pickup');
            const home = gpsFor('home_delivery');
            const pickupNear =
                pickup &&
                haversineMeters(
                    pickup.lat,
                    pickup.lng,
                    resolvedWaypoints.patientHome.lat,
                    resolvedWaypoints.patientHome.lng,
                ) < MILESTONE_NEAR_REGISTERED_METERS;
            const homeNear =
                home &&
                haversineMeters(
                    home.lat,
                    home.lng,
                    resolvedWaypoints.patientHome.lat,
                    resolvedWaypoints.patientHome.lng,
                ) < MILESTONE_NEAR_REGISTERED_METERS;

            items.push({
                id: 'reg-patient',
                kind: 'patient_home',
                lat: resolvedWaypoints.patientHome.lat,
                lng: resolvedWaypoints.patientHome.lng,
                label: 'บ้านปชช.',
                subtitle: 'ที่อยู่ในระบบ',
                timeLabel: homeNear
                    ? formatMilestoneTime(home?.recordedAt)
                    : pickupNear
                        ? formatMilestoneTime(pickup?.recordedAt)
                        : null,
            });
        }
        if (resolvedWaypoints.hospital) {
            const atHosp = gpsFor('hospital_arrival');
            const returnDepart = gpsFor('return_depart');
            const atNear =
                atHosp &&
                haversineMeters(
                    atHosp.lat,
                    atHosp.lng,
                    resolvedWaypoints.hospital.lat,
                    resolvedWaypoints.hospital.lng,
                ) < MILESTONE_NEAR_REGISTERED_METERS;
            const returnNear =
                returnDepart &&
                haversineMeters(
                    returnDepart.lat,
                    returnDepart.lng,
                    resolvedWaypoints.hospital.lat,
                    resolvedWaypoints.hospital.lng,
                ) < MILESTONE_NEAR_REGISTERED_METERS;

            items.push({
                id: 'reg-hospital',
                kind: 'hospital',
                lat: resolvedWaypoints.hospital.lat,
                lng: resolvedWaypoints.hospital.lng,
                label: 'รพ.',
                subtitle: returnNear
                    ? 'เรียกกลับ/ออกรพ.'
                    : atNear
                        ? 'ถึงรพ. (GPS)'
                        : resolvedWaypoints.hospitalName || 'ที่อยู่ในระบบ',
                timeLabel: returnNear
                    ? formatMilestoneTime(returnDepart?.recordedAt)
                    : atNear
                        ? formatMilestoneTime(atHosp?.recordedAt)
                        : null,
            });
        }
        if (resolvedWaypoints.office) {
            const officeArr = gpsFor('office_arrival');
            const officeDepart = gpsFor('office_depart');
            const arrNear =
                officeArr &&
                haversineMeters(
                    officeArr.lat,
                    officeArr.lng,
                    resolvedWaypoints.office.lat,
                    resolvedWaypoints.office.lng,
                ) < MILESTONE_NEAR_REGISTERED_METERS;
            const departNear =
                officeDepart &&
                haversineMeters(
                    officeDepart.lat,
                    officeDepart.lng,
                    resolvedWaypoints.office.lat,
                    resolvedWaypoints.office.lng,
                ) < MILESTONE_NEAR_REGISTERED_METERS;

            items.push({
                id: 'reg-office',
                kind: 'office',
                lat: resolvedWaypoints.office.lat,
                lng: resolvedWaypoints.office.lng,
                label: 'เทศบาล',
                subtitle: arrNear
                    ? 'กลับถึงเทศบาล'
                    : departNear
                        ? 'ออกเทศบาล'
                        : resolvedWaypoints.officeName || 'ที่อยู่ในระบบ',
                timeLabel: arrNear
                    ? formatMilestoneTime(officeArr?.recordedAt)
                    : departNear
                        ? formatMilestoneTime(officeDepart?.recordedAt)
                        : null,
            });
        }
        return items;
    }, [resolvedWaypoints, gpsMilestones]);

    const gpsMilestoneMarkers = useMemo(() => {
        const nearRegistered = (m: TripMilestone, kinds: RegisteredWaypointKind[]) => {
            for (const w of registeredWaypointMarkers) {
                if (!kinds.includes(w.kind)) continue;
                if (haversineMeters(m.lat, m.lng, w.lat, w.lng) < MILESTONE_NEAR_REGISTERED_METERS) {
                    return true;
                }
            }
            return false;
        };

        const skipKinds: Partial<Record<TripMilestoneKind, RegisteredWaypointKind[]>> = {
            patient_pickup: ['patient_home'],
            hospital_arrival: ['hospital'],
            home_delivery: ['patient_home'],
            office_depart: ['office'],
            office_arrival: ['office'],
            return_depart: ['hospital'],
        };

        return gpsMilestones
            .filter((m) => !nearRegistered(m, skipKinds[m.kind] ?? []))
            .map((m) => ({
                ...m,
                label: TRIP_MILESTONE_LABELS[m.kind],
                color: TRIP_MILESTONE_COLORS[m.kind],
                timeLabel: formatMilestoneTime(m.recordedAt),
            }));
    }, [gpsMilestones, registeredWaypointMarkers]);

    const systemEventMarkers = useMemo(() => {
        const atHosp = gpsMilestones.find((m) => m.kind === 'hospital_arrival');
        if (!atHosp) return [] as {
            id: string;
            lat: number;
            lng: number;
            label: string;
            color: string;
            timeLabel: string | null;
            subtitle: string;
            variant: 'gps';
        }[];

        const hasReturnLeg = trailHasLeg(trail, 'return');
        const hasReturnOfficeLeg = trailHasLeg(trail, 'return_office');
        const markers: {
            id: string;
            lat: number;
            lng: number;
            label: string;
            color: string;
            timeLabel: string | null;
            subtitle: string;
            variant: 'gps';
        }[] = [];

        if (!hasReturnLeg && jobTimestamps?.returnPickupRequestedAt) {
            markers.push({
                id: 'sys-return-call',
                lat: atHosp.lat,
                lng: atHosp.lng,
                label: 'เรียกกลับ',
                color: TRIP_MILESTONE_COLORS.return_depart,
                timeLabel: formatMilestoneTime(jobTimestamps.returnPickupRequestedAt),
                subtitle: 'กดในระบบ',
                variant: 'gps',
            });
        }

        if (!hasReturnLeg && jobTimestamps?.patientDroppedOffAt) {
            markers.push({
                id: 'sys-home-confirm',
                lat: atHosp.lat,
                lng: atHosp.lng,
                label: 'ยืนยันส่ง',
                color: TRIP_MILESTONE_COLORS.home_delivery,
                timeLabel: formatMilestoneTime(jobTimestamps.patientDroppedOffAt),
                subtitle: 'ยังไม่มี GPS กลับ',
                variant: 'gps',
            });
        }

        if (!hasReturnOfficeLeg && jobTimestamps?.completedAt) {
            markers.push({
                id: 'sys-completed',
                lat: atHosp.lat,
                lng: atHosp.lng,
                label: 'จบงาน',
                color: TRIP_MILESTONE_COLORS.office_arrival,
                timeLabel: formatMilestoneTime(jobTimestamps.completedAt),
                subtitle: hasReturnLeg ? 'ยังไม่มี GPS กลับเทศบาล' : 'จบที่รพ. (ไม่มี GPS กลับ)',
                variant: 'gps',
            });
        }

        return markers;
    }, [gpsMilestones, trail, jobTimestamps]);

    const mapMarkers = useMemo(() => {
        const raw: {
            key: string;
            lat: number;
            lng: number;
            label: string;
            color: string;
            timeLabel?: string | null;
            subtitle?: string | null;
            variant: 'registered' | 'gps';
        }[] = [];

        registeredWaypointMarkers.forEach((w) => {
            raw.push({
                key: w.id,
                lat: w.lat,
                lng: w.lng,
                label: w.label,
                color: REGISTERED_WAYPOINT_COLORS[w.kind],
                timeLabel: w.timeLabel,
                subtitle: w.subtitle,
                variant: 'registered',
            });
        });

        gpsMilestoneMarkers.forEach((m) => {
            raw.push({
                key: `gps-${m.kind}`,
                lat: m.lat,
                lng: m.lng,
                label: m.label,
                color: m.color,
                timeLabel: m.timeLabel,
                variant: 'gps',
            });
        });

        systemEventMarkers.forEach((m) => {
            raw.push({
                key: m.id,
                lat: m.lat,
                lng: m.lng,
                label: m.label,
                color: m.color,
                timeLabel: m.timeLabel,
                subtitle: m.subtitle,
                variant: 'gps',
            });
        });

        return spreadMarkerPositions(raw).map((m) => ({
            ...m,
            key: m.key,
        }));
    }, [registeredWaypointMarkers, gpsMilestoneMarkers, systemEventMarkers]);

    const hasReturnGpsTrail = useMemo(
        () => trailHasLeg(trail, 'return') || trailHasLeg(trail, 'return_office'),
        [trail],
    );

    const milestoneSummary = useMemo(() => {
        const rows: { label: string; detail: string; color: string }[] = [];

        const pushRow = (label: string, detail: string, color: string) => {
            rows.push({ label, detail: detail || 'ยังไม่มีข้อมูล', color });
        };

        const gpsFor = (kind: TripMilestoneKind) =>
            gpsMilestones.find((m) => m.kind === kind);

        const fmt = (iso?: string | null) => formatMilestoneTime(iso) ?? '—';

        pushRow(
            'บ้านประชาชน',
            resolvedWaypoints.patientHome ? 'ที่อยู่ลงทะเบียน' : '',
            REGISTERED_WAYPOINT_COLORS.patient_home,
        );
        const pickup = gpsFor('patient_pickup');
        pushRow(
            'รับปชช.ขึ้นรถ',
            pickup ? `GPS ${fmt(pickup.recordedAt)}` : '',
            TRIP_MILESTONE_COLORS.patient_pickup,
        );

        pushRow(
            'โรงพยาบาล',
            resolvedWaypoints.hospital
                ? resolvedWaypoints.hospitalName || 'ที่อยู่ลงทะเบียน'
                : '',
            REGISTERED_WAYPOINT_COLORS.hospital,
        );
        const atHosp = gpsFor('hospital_arrival');
        pushRow(
            'ถึงโรงพยาบาล',
            atHosp ? `GPS ${fmt(atHosp.recordedAt)}` : '',
            TRIP_MILESTONE_COLORS.hospital_arrival,
        );

        const returnDepart = gpsFor('return_depart');
        const returnCallTime = jobTimestamps?.returnPickupRequestedAt;
        pushRow(
            'เรียกกลับ/ออกรพ.',
            returnDepart
                ? `GPS ${fmt(returnDepart.recordedAt)}`
                : returnCallTime
                    ? `กดในระบบ ${fmt(returnCallTime)}${hasReturnGpsTrail ? '' : ' (ยังไม่มี GPS ออกรพ.)'}`
                    : '',
            TRIP_MILESTONE_COLORS.return_depart,
        );

        const home = gpsFor('home_delivery');
        const droppedAt = jobTimestamps?.patientDroppedOffAt;
        pushRow(
            'ส่งถึงบ้าน',
            home
                ? `GPS ${fmt(home.recordedAt)}`
                : droppedAt
                    ? `ยืนยันในระบบ ${fmt(droppedAt)} (ไม่มี GPS ช่วงกลับ)`
                    : '',
            TRIP_MILESTONE_COLORS.home_delivery,
        );

        pushRow(
            'เทศบาล',
            resolvedWaypoints.office
                ? resolvedWaypoints.officeName || 'ที่อยู่หน่วยงาน'
                : '',
            REGISTERED_WAYPOINT_COLORS.office,
        );
        const officeArr = gpsFor('office_arrival');
        const completedAt = jobTimestamps?.completedAt;
        pushRow(
            'กลับถึงเทศบาล',
            officeArr
                ? `GPS ${fmt(officeArr.recordedAt)}`
                : completedAt
                    ? `จบในระบบ ${fmt(completedAt)}${hasReturnGpsTrail ? ' (ไม่มี GPS กลับเทศบาล)' : ' (จบที่รพ. ไม่มี GPS กลับ)'}`
                    : '',
            TRIP_MILESTONE_COLORS.office_arrival,
        );

        return rows;
    }, [resolvedWaypoints, gpsMilestones, jobTimestamps, hasReturnGpsTrail]);

    const showTripWaypoints = isCompletedJob || hasGpsTrail;

    const visibleLegs = useMemo(() => {
        const legs = new Set(legTrailSegments.map((s) => s.leg));
        return ALL_TRAIL_LEGS.filter((leg) => legs.has(leg));
    }, [legTrailSegments]);

    const driverMarkerPos = useMemo<[number, number] | null>(() => {
        if (!driverPos || !displayConfig.showDriver) return null;
        if (!isPlausibleTrailPoint(driverPos.lat, driverPos.lng, trailAnchors)) return null;
        return [driverPos.lat, driverPos.lng];
    }, [driverPos, displayConfig.showDriver, trailAnchors]);

    const fitPoints = useMemo(() => {
        if (isCompletedJob) {
            const points: LatLng[] = [];
            displayTrail.forEach((p) => points.push({ lat: p.lat, lng: p.lng }));
            mapMarkers.forEach((m) => points.push({ lat: m.lat, lng: m.lng }));
            if (points.length > 0) return points;
            if (sanitizedTrail.length > 0) {
                return sanitizedTrail.map((p) => ({ lat: p.lat, lng: p.lng }));
            }
            return [];
        }

        const points: LatLng[] = [];
        if (displayConfig.showPatient && patientLatLng) points.push(patientLatLng);
        if (displayConfig.showHospital && hospitalLatLng) points.push(hospitalLatLng);
        if (driverMarkerPos) points.push({ lat: driverMarkerPos[0], lng: driverMarkerPos[1] });
        displayTrail.forEach((p) => points.push({ lat: p.lat, lng: p.lng }));

        if (displayTrail.length >= 2 && trailDistanceKm < 2) {
            return displayTrail.map((p) => ({ lat: p.lat, lng: p.lng }));
        }

        if (points.length === 0) return displayConfig.fitPoints;
        return points;
    }, [displayConfig, patientLatLng, hospitalLatLng, driverMarkerPos, displayTrail, trailDistanceKm, isCompletedJob, sanitizedTrail, mapMarkers]);

    const formattedLastUpdate = lastUpdatedAt
        ? new Date(lastUpdatedAt).toLocaleTimeString('th-TH', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        })
        : null;

    if (!MAPBOX_TOKEN) {
        return (
            <div className={`flex items-center justify-center bg-slate-100 rounded-xl text-sm text-slate-500 ${className}`}>
                ไม่พบ Mapbox token
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div className={`overflow-hidden rounded-xl border border-slate-200 ${className}`}>
                {loadingTrail && trail.length === 0 && !driverPos ? (
                    <div className="h-full flex items-center justify-center bg-slate-50 text-sm text-slate-500">
                        กำลังโหลดเส้นทาง...
                    </div>
                ) : isCompletedJob && !hasGpsTrail ? (
                    <div className="h-full flex items-center justify-center bg-slate-50 text-sm text-amber-700 px-6 text-center">
                        งานนี้ไม่มีข้อมูลเส้นทาง GPS บันทึกไว้
                    </div>
                ) : (
                    <Map
                        mapboxAccessToken={MAPBOX_TOKEN}
                        initialViewState={{ longitude: 100.5, latitude: 13.7, zoom: 10 }}
                        mapStyle={MAPBOX_STYLE}
                        style={{ width: '100%', height: '100%' }}
                        attributionControl={false}
                        minZoom={THAILAND_MAP_MIN_ZOOM}
                        maxBounds={THAILAND_MAP_BOUNDS}
                        onLoad={(e) => {
                            applyMapboxThaiLanguage(e.target);
                            e.target.on('style.load', () => applyMapboxThaiLanguage(e.target));
                        }}
                    >
                        <MapFitBounds
                            points={fitPoints}
                            minZoom={trailDistanceKm < 0.05 ? 17 : undefined}
                        />

                        {showPlannedRoute && plannedRoute.length >= 2 && (
                            <Source
                                id="planned-route"
                                type="geojson"
                                data={{
                                    type: 'Feature',
                                    properties: {},
                                    geometry: {
                                        type: 'LineString',
                                        coordinates: plannedRoute,
                                    },
                                }}
                            >
                                <Layer
                                    id="planned-route-casing"
                                    type="line"
                                    layout={{ 'line-cap': 'round', 'line-join': 'round' }}
                                    paint={{
                                        'line-color': '#ffffff',
                                        'line-width': hasGpsTrail ? 7 : 10,
                                        'line-opacity': hasGpsTrail ? 0.5 : 0.95,
                                    }}
                                />
                                <Layer
                                    id="planned-route-line"
                                    type="line"
                                    layout={{ 'line-cap': 'round', 'line-join': 'round' }}
                                    paint={{
                                        'line-color': '#2563eb',
                                        'line-width': hasGpsTrail ? 4 : 6,
                                        'line-opacity': hasGpsTrail ? 0.45 : 1,
                                    }}
                                />
                            </Source>
                        )}

                        {hasDrawableTrailLine && !isCompletedJob && (
                            <Source
                                id="trail-full"
                                type="geojson"
                                data={{
                                    type: 'Feature',
                                    properties: {},
                                    geometry: { type: 'LineString', coordinates: fullTrailCoords },
                                }}
                            >
                                <Layer
                                    id="trail-full-casing"
                                    type="line"
                                    layout={{ 'line-cap': 'round', 'line-join': 'round' }}
                                    paint={{
                                        'line-color': '#0f172a',
                                        'line-width': 12,
                                        'line-opacity': 0.75,
                                    }}
                                />
                                <Layer
                                    id="trail-full-line"
                                    type="line"
                                    layout={{ 'line-cap': 'round', 'line-join': 'round' }}
                                    paint={{
                                        'line-color': '#ea580c',
                                        'line-width': 7,
                                        'line-opacity': 1,
                                    }}
                                />
                            </Source>
                        )}

                        {trailDotFeatures.length > 0 &&
                            (!isCompletedJob || (trailEndpoints?.parkedCluster ?? false)) && (
                            <Source
                                id="trail-dots"
                                type="geojson"
                                data={{ type: 'FeatureCollection', features: trailDotFeatures }}
                            >
                                <Layer
                                    id="trail-dots-layer"
                                    type="circle"
                                    paint={{
                                        'circle-radius': 6,
                                        'circle-color': ['get', 'color'],
                                        'circle-stroke-width': 2,
                                        'circle-stroke-color': '#ffffff',
                                        'circle-opacity': 0.95,
                                    }}
                                />
                            </Source>
                        )}

                        {legTrailSegments.map((segment) => (
                            <Source
                                key={segment.key}
                                id={`trail-${segment.key}`}
                                type="geojson"
                                data={{
                                    type: 'Feature',
                                    properties: {},
                                    geometry: { type: 'LineString', coordinates: segment.coords },
                                }}
                            >
                                <Layer
                                    id={`trail-casing-${segment.key}`}
                                    type="line"
                                    layout={{ 'line-cap': trailLineCap, 'line-join': 'round' }}
                                    paint={{
                                        'line-color': '#ffffff',
                                        'line-width': 9,
                                        'line-opacity': 0.92,
                                    }}
                                />
                                <Layer
                                    id={`trail-line-${segment.key}`}
                                    type="line"
                                    layout={{ 'line-cap': trailLineCap, 'line-join': 'round' }}
                                    paint={{
                                        'line-color': TRAIL_LEG_COLORS[segment.leg],
                                        'line-width': 6,
                                        'line-opacity': 1,
                                    }}
                                />
                            </Source>
                        ))}

                        {showTrailEndpoints && trailEndpoints && (
                            <>
                                <Marker
                                    longitude={trailEndpoints.start.lng}
                                    latitude={trailEndpoints.start.lat}
                                    anchor="bottom"
                                >
                                    {trailEndpoints.sameSpot ? (
                                        <TrailEndpointMarker
                                            title="เริ่ม-จบ"
                                            color="#16a34a"
                                            timeLabel={
                                                trailEndpoints.startTime && trailEndpoints.endTime
                                                    ? trailEndpoints.startTime === trailEndpoints.endTime
                                                        ? trailEndpoints.startTime
                                                        : `${trailEndpoints.startTime} – ${trailEndpoints.endTime}`
                                                    : trailEndpoints.startTime
                                            }
                                            subtitle={
                                                trailEndpoints.parkedCluster
                                                    ? `จอดอยู่ที่เดิม · ${sanitizedTrail.length} จุด`
                                                    : null
                                            }
                                        />
                                    ) : (
                                        <TrailEndpointMarker
                                            title="เริ่ม"
                                            color="#16a34a"
                                            timeLabel={trailEndpoints.startTime}
                                        />
                                    )}
                                </Marker>
                                {!trailEndpoints.sameSpot && (
                                    <>
                                        {trailEndpoints.bearing != null && trailEndpoints.arrowPos && (
                                            <Marker
                                                longitude={trailEndpoints.arrowPos.lng}
                                                latitude={trailEndpoints.arrowPos.lat}
                                                anchor="center"
                                            >
                                                <TrailDirectionArrow bearing={trailEndpoints.bearing} />
                                            </Marker>
                                        )}
                                        <Marker
                                            longitude={trailEndpoints.end.lng}
                                            latitude={trailEndpoints.end.lat}
                                            anchor="bottom"
                                        >
                                            <TrailEndpointMarker
                                                title="จบ"
                                                color="#dc2626"
                                                timeLabel={trailEndpoints.endTime}
                                            />
                                        </Marker>
                                    </>
                                )}
                            </>
                        )}

                        {displayConfig.showPatient && patientLatLng && (
                            <Marker longitude={patientLatLng.lng} latitude={patientLatLng.lat} anchor="bottom">
                                <PassengerMarker pictureUrl={patientPictureUrl} />
                            </Marker>
                        )}

                        {displayConfig.showHospital && hospitalLatLng && (
                            <Marker longitude={hospitalLatLng.lng} latitude={hospitalLatLng.lat} anchor="bottom">
                                <HospitalMarker />
                            </Marker>
                        )}

                        {driverMarkerPos && (
                            <VehicleModel id="tracked-vehicle" position={driverMarkerPos} heading={rotationAngle} />
                        )}

                        {showTripWaypoints && mapMarkers.map((m) => (
                            <Marker
                                key={m.key}
                                longitude={m.lng}
                                latitude={m.lat}
                                anchor="bottom"
                            >
                                <TripWaypointMarker
                                    title={m.label}
                                    color={m.color}
                                    variant={m.variant}
                                    timeLabel={m.timeLabel}
                                    subtitle={m.subtitle}
                                />
                            </Marker>
                        ))}
                    </Map>
                )}
            </div>

            {showTripWaypoints && milestoneSummary.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                    {!hasReturnGpsTrail && jobTimestamps?.returnPickupRequestedAt && (
                        <p className="mb-2 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 leading-relaxed">
                            งานนี้กดเรียกกลับ/จบงานที่รพ. แต่ไม่มี GPS ช่วงกลับ — หมุดที่รพ. จึงอยู่ใกล้กัน
                            (กดในระบบ ≠ ขับรถจริง) คนขับต้องเปิดแผนที่ตลอางานกลับจึงจะเห็นเส้นส่งบ้าน/กลับเทศบาล
                        </p>
                    )}
                    <div className="text-xs font-semibold text-slate-700 mb-2">จุดสำคัญตลอดเส้นทาง</div>
                    <div className="grid gap-1.5 sm:grid-cols-2">
                        {milestoneSummary.map((row) => (
                            <div key={row.label} className="flex items-start gap-2 text-[11px]">
                                <span
                                    className="mt-1 w-2.5 h-2.5 rounded-full shrink-0 border border-white shadow-sm"
                                    style={{ backgroundColor: row.color }}
                                />
                                <div className="min-w-0">
                                    <span className="font-semibold text-slate-800">{row.label}</span>
                                    <span className="text-slate-600"> · {row.detail}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="mt-2 text-[10px] text-slate-500 leading-relaxed">
                        เส้นประ = ที่อยู่ในระบบ · วงกลม = จุดจาก GPS จริง · เวลาเรียกกลับมาจากการกดเรียกรถกลับ
                    </p>
                </div>
            )}

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                <span className="font-medium text-slate-700">{displayConfig.phaseLabel}</span>
                {isLive && (
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        เรียลไทม์
                    </span>
                )}
                {formattedLastUpdate && !isCompletedJob && (
                    <span>อัปเดตล่าสุด: {formattedLastUpdate}</span>
                )}
                {isCompletedJob && trailEndpoints?.endTime && (
                    <span>จบงาน {trailEndpoints.endTime} น.</span>
                )}
                {showPlannedRoute && (
                    <span className="inline-flex items-center gap-1">
                        <span className="w-3 h-1.5 bg-blue-600 rounded-full shadow-sm opacity-80" /> เส้นทางวางแผน
                    </span>
                )}
                {hasGpsTrail ? (
                    <>
                        {!isCompletedJob && (
                            <span className="inline-flex items-center gap-1 font-medium text-orange-700">
                                <span className="w-4 h-1.5 rounded-full bg-orange-600" />
                                เส้นทางจริง (GPS)
                                {trailDistanceKm > 0 && ` ${trailDistanceKm.toFixed(2)} กม.`}
                                {sanitizedTrail.length > 0 && ` · ${sanitizedTrail.length} จุด`}
                            </span>
                        )}
                        {isCompletedJob && (
                            <span className="font-medium text-slate-800">
                                ระยะทางรวม {trailDistanceKm.toFixed(2)} กม.
                                {sanitizedTrail.length > 0 && ` · ${sanitizedTrail.length} จุด`}
                            </span>
                        )}
                        {visibleLegs.map((leg) => (
                            <span key={leg} className="inline-flex items-center gap-1 font-medium text-slate-700">
                                <span
                                    className="w-4 h-1.5 rounded-full"
                                    style={{ backgroundColor: TRAIL_LEG_COLORS[leg] }}
                                />
                                {TRAIL_LEG_LABELS[leg]}
                            </span>
                        ))}
                        {showTrailEndpoints && (
                            <>
                                <span className="inline-flex items-center gap-1">
                                    <span className="w-3 h-3 rounded-full bg-green-600 border border-white shadow-sm" />
                                    เริ่ม
                                </span>
                                {!trailEndpoints?.sameSpot && (
                                    <>
                                        <span className="inline-flex items-center gap-1">
                                            <span className="w-3 h-3 rounded-full bg-red-600 border border-white shadow-sm" />
                                            จบ
                                        </span>
                                        <span className="text-slate-500">ลูกศร = ทิศทางเดินทาง</span>
                                    </>
                                )}
                            </>
                        )}
                    </>
                ) : (
                    !loadingTrail && (
                        <span className="text-amber-700">
                            {isCompletedJob
                                ? 'งานนี้ไม่มีข้อมูลเส้นทาง GPS บันทึกไว้'
                                : 'ยังไม่มีข้อมูล GPS — จะแสดงเมื่อคนขับเปิดแผนที่และเริ่มเดินทาง'}
                        </span>
                    )
                )}
            </div>
        </div>
    );
}
