export type TrailPoint = { lat: number; lng: number; recordedAt: string; leg?: string; source?: string };
export type LatLng = { lat: number; lng: number };
export type LocationLeg = 'dispatch' | 'pickup' | 'to_hospital' | 'return' | 'return_office';

export const TRAIL_LEG_COLORS: Record<LocationLeg, string> = {
    dispatch: '#0ea5e9',
    pickup: '#f59e0b',
    to_hospital: '#16a34a',
    return: '#9333ea',
    return_office: '#4f46e5',
};

export const TRAIL_LEG_LABELS: Record<LocationLeg, string> = {
    dispatch: 'ออกเดินทาง',
    pickup: 'ไปรับประชาชน',
    to_hospital: 'ไปโรงพยาบาล',
    return: 'ส่งกลับบ้าน',
    return_office: 'กลับเทศบาล',
};

export const ALL_TRAIL_LEGS: LocationLeg[] = [
    'dispatch',
    'pickup',
    'to_hospital',
    'return',
    'return_office',
];

export function normalizeLocationLeg(leg?: string): LocationLeg {
    if (leg === 'dispatch' || leg === 'pickup' || leg === 'to_hospital' || leg === 'return' || leg === 'return_office') {
        return leg;
    }
    return 'pickup';
}

export function jobStatusToLeg(status?: string): LocationLeg {
    switch (status) {
        case 'ASSIGNED':
        case 'ACCEPTED':
            return 'dispatch';
        case 'PICKING_UP':
            return 'pickup';
        case 'IN_TRANSIT':
        case 'AT_HOSPITAL':
            return 'to_hospital';
        case 'RETURN_HOME':
        case 'AT_PATIENT_HOME':
            return 'return';
        case 'RETURN_OFFICE':
            return 'return_office';
        default:
            return 'dispatch';
    }
}

const TH_LAT_MIN = 5;
const TH_LAT_MAX = 21;
const TH_LNG_MIN = 97;
const TH_LNG_MAX = 106;

const MAX_ANCHOR_DISTANCE_METERS = 80_000;
const MAX_CONSECUTIVE_GAP_METERS = 3_000;

export function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6_371_000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function isPlausibleThailandCoordinate(lat: number, lng: number): boolean {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false;
    if (Math.abs(lat) < 1e-6 && Math.abs(lng) < 1e-6) return false;
    return lat >= TH_LAT_MIN && lat <= TH_LAT_MAX && lng >= TH_LNG_MIN && lng <= TH_LNG_MAX;
}

function minDistanceToAnchors(lat: number, lng: number, anchors: LatLng[]): number {
    if (anchors.length === 0) return 0;
    return Math.min(...anchors.map((a) => haversineMeters(lat, lng, a.lat, a.lng)));
}

export function isPlausibleTrailPoint(lat: number, lng: number, anchors: LatLng[] = []): boolean {
    if (!isPlausibleThailandCoordinate(lat, lng)) return false;
    if (anchors.length > 0 && minDistanceToAnchors(lat, lng, anchors) > MAX_ANCHOR_DISTANCE_METERS) {
        return false;
    }
    return true;
}

export function sumTrailMeters(points: TrailPoint[]): number {
    const sanitized = sanitizeTrailPoints(points, []);
    let total = 0;
    for (let i = 1; i < sanitized.length; i++) {
        total += haversineMeters(
            sanitized[i - 1].lat,
            sanitized[i - 1].lng,
            sanitized[i].lat,
            sanitized[i].lng,
        );
    }
    return total;
}

export function thinTrailPointsForDisplay(points: TrailPoint[], minMeters = 12): TrailPoint[] {
    const sanitized = sanitizeTrailPoints(points, []);
    if (sanitized.length === 0) return [];

    const result: TrailPoint[] = [sanitized[0]];
    for (let i = 1; i < sanitized.length; i++) {
        const prev = result[result.length - 1];
        const next = sanitized[i];
        const gap = haversineMeters(prev.lat, prev.lng, next.lat, next.lng);
        if (gap >= minMeters) {
            result.push(next);
        }
    }

    const last = sanitized[sanitized.length - 1];
    const tail = result[result.length - 1];
    if (tail.lat !== last.lat || tail.lng !== last.lng) {
        result.push(last);
    }

    return result;
}

export function sanitizeTrailPoints(points: TrailPoint[], anchors: LatLng[] = []): TrailPoint[] {
    const result: TrailPoint[] = [];

    for (const point of points) {
        if (!isPlausibleThailandCoordinate(point.lat, point.lng)) continue;

        if (anchors.length > 0 && minDistanceToAnchors(point.lat, point.lng, anchors) > MAX_ANCHOR_DISTANCE_METERS) {
            continue;
        }

        const prev = result[result.length - 1];
        if (prev && haversineMeters(prev.lat, prev.lng, point.lat, point.lng) > MAX_CONSECUTIVE_GAP_METERS) {
            continue;
        }

        result.push(point);
    }

    return result;
}

export function splitTrailIntoSegments(
    points: TrailPoint[],
    maxGapMeters = MAX_CONSECUTIVE_GAP_METERS,
): TrailPoint[][] {
    if (points.length < 2) return [];

    const segments: TrailPoint[][] = [];
    let current: TrailPoint[] = [points[0]];

    for (let i = 1; i < points.length; i++) {
        const prev = current[current.length - 1];
        const next = points[i];
        const gap = haversineMeters(prev.lat, prev.lng, next.lat, next.lng);

        if (gap > maxGapMeters) {
            if (current.length >= 2) segments.push(current);
            current = [next];
        } else {
            current.push(next);
        }
    }

    if (current.length >= 2) segments.push(current);
    return segments;
}

export function groupTrailByLeg(points: TrailPoint[]): { leg: LocationLeg; points: TrailPoint[] }[] {
    const groups: { leg: LocationLeg; points: TrailPoint[] }[] = [];

    for (const point of points) {
        const leg = normalizeLocationLeg(point.leg);
        const last = groups[groups.length - 1];
        if (last && last.leg === leg) {
            last.points.push(point);
        } else {
            groups.push({ leg, points: [point] });
        }
    }

    return groups;
}

export function buildLegColoredTrailSegments(
    points: TrailPoint[],
): { leg: LocationLeg; coords: [number, number][] }[] {
    if (points.length < 2) return [];

    const segments: { leg: LocationLeg; coords: [number, number][] }[] = [];
    let currentLeg = normalizeLocationLeg(points[0].leg);
    let coords: [number, number][] = [[points[0].lng, points[0].lat]];

    for (let i = 1; i < points.length; i++) {
        const point = points[i];
        const leg = normalizeLocationLeg(point.leg);
        const coord: [number, number] = [point.lng, point.lat];

        if (leg !== currentLeg) {
            if (coords.length >= 2) {
                segments.push({ leg: currentLeg, coords: [...coords] });
            }
            const bridge = coords[coords.length - 1];
            currentLeg = leg;
            coords = [bridge, coord];
        } else {
            coords.push(coord);
        }
    }

    if (coords.length >= 2) {
        segments.push({ leg: currentLeg, coords });
    }

    return segments;
}

export type TripMilestoneKind =
    | 'office_depart'
    | 'patient_pickup'
    | 'hospital_arrival'
    | 'return_depart'
    | 'home_delivery'
    | 'office_arrival';

export const TRIP_MILESTONE_LABELS: Record<TripMilestoneKind, string> = {
    office_depart: 'ออกเทศบาล',
    patient_pickup: 'รับปชช.ขึ้นรถ',
    hospital_arrival: 'ถึงโรงพยาบาล',
    return_depart: 'เรียกกลับ/ออกรพ.',
    home_delivery: 'ส่งถึงบ้าน',
    office_arrival: 'กลับถึงเทศบาล',
};

export const TRIP_MILESTONE_COLORS: Record<TripMilestoneKind, string> = {
    office_depart: TRAIL_LEG_COLORS.dispatch,
    patient_pickup: TRAIL_LEG_COLORS.pickup,
    hospital_arrival: TRAIL_LEG_COLORS.to_hospital,
    return_depart: TRAIL_LEG_COLORS.return,
    home_delivery: '#7c3aed',
    office_arrival: TRAIL_LEG_COLORS.return_office,
};

export type RegisteredWaypointKind = 'patient_home' | 'hospital' | 'office';

export const REGISTERED_WAYPOINT_LABELS: Record<RegisteredWaypointKind, string> = {
    patient_home: 'บ้านประชาชน',
    hospital: 'โรงพยาบาล',
    office: 'เทศบาล',
};

export interface TripMilestone {
    kind: TripMilestoneKind;
    lat: number;
    lng: number;
    recordedAt?: string;
    source: 'gps' | 'registered';
}

function firstPointOfLeg(points: TrailPoint[], leg: LocationLeg): TrailPoint | null {
    return points.find((p) => normalizeLocationLeg(p.leg) === leg) ?? null;
}

function lastPointOfLeg(points: TrailPoint[], leg: LocationLeg): TrailPoint | null {
    for (let i = points.length - 1; i >= 0; i--) {
        if (normalizeLocationLeg(points[i].leg) === leg) return points[i];
    }
    return null;
}

export function extractTripMilestones(points: TrailPoint[]): TripMilestone[] {
    const sanitized = sanitizeTrailPoints(points, []);
    if (sanitized.length === 0) return [];

    const milestones: TripMilestone[] = [];
    const push = (kind: TripMilestoneKind, point: TrailPoint | null) => {
        if (!point) return;
        milestones.push({
            kind,
            lat: point.lat,
            lng: point.lng,
            recordedAt: point.recordedAt,
            source: 'gps',
        });
    };

    push('office_depart', firstPointOfLeg(sanitized, 'dispatch') ?? sanitized[0]);
    push('patient_pickup', lastPointOfLeg(sanitized, 'pickup'));
    push('hospital_arrival', lastPointOfLeg(sanitized, 'to_hospital'));
    push('return_depart', firstPointOfLeg(sanitized, 'return'));
    push('home_delivery', lastPointOfLeg(sanitized, 'return'));
    push('office_arrival', lastPointOfLeg(sanitized, 'return_office'));

    const deduped: TripMilestone[] = [];
    for (const m of milestones) {
        const prev = deduped[deduped.length - 1];
        if (
            prev &&
            prev.kind === m.kind &&
            haversineMeters(prev.lat, prev.lng, m.lat, m.lng) < 3
        ) {
            continue;
        }
        if (
            deduped.some(
                (d) =>
                    d.kind === m.kind &&
                    haversineMeters(d.lat, d.lng, m.lat, m.lng) < 3,
            )
        ) {
            continue;
        }
        deduped.push(m);
    }

    return deduped;
}

const MARKER_CLUSTER_METERS = 28;
const MARKER_SPREAD_METERS = 24;

export function spreadMarkerPositions<T extends { lat: number; lng: number }>(
    items: T[],
    clusterRadiusMeters = MARKER_CLUSTER_METERS,
    spreadMeters = MARKER_SPREAD_METERS,
): T[] {
    const result = items.map((item) => ({ ...item }));

    for (let i = 1; i < result.length; i++) {
        let clusterIndex = 0;
        for (let j = 0; j < i; j++) {
            if (
                haversineMeters(result[i].lat, result[i].lng, result[j].lat, result[j].lng) <
                clusterRadiusMeters
            ) {
                clusterIndex++;
            }
        }
        if (clusterIndex === 0) continue;

        const angle = ((clusterIndex * 72 - 90) * Math.PI) / 180;
        const latRad = (result[i].lat * Math.PI) / 180;
        const dLat = (spreadMeters / 111_000) * Math.sin(angle);
        const dLng = (spreadMeters / (111_000 * Math.cos(latRad))) * Math.cos(angle);
        result[i] = {
            ...result[i],
            lat: result[i].lat + dLat,
            lng: result[i].lng + dLng,
        };
    }

    return result;
}

export function trailHasLeg(points: TrailPoint[], leg: LocationLeg): boolean {
    return points.some((p) => normalizeLocationLeg(p.leg) === leg);
}

export function buildDrawableTrailSegments(points: TrailPoint[]): {
    leg: LocationLeg;
    coords: [number, number][];
    key: string;
}[] {
    const sanitized = sanitizeTrailPoints(points, []);
    const chunks = splitTrailIntoSegments(sanitized);
    const segments: { leg: LocationLeg; coords: [number, number][]; key: string }[] = [];

    chunks.forEach((chunk, chunkIdx) => {
        buildLegColoredTrailSegments(chunk).forEach((segment, segIdx) => {
            segments.push({
                leg: segment.leg,
                coords: segment.coords,
                key: `${chunkIdx}-${segment.leg}-${segIdx}`,
            });
        });
    });

    return segments;
}
