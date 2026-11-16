export type LocationLeg = 'dispatch' | 'pickup' | 'to_hospital' | 'return' | 'return_office';

export const LOCATION_LOG_STATUSES = new Set([
    'ASSIGNED',
    'ACCEPTED',
    'PICKING_UP',
    'IN_TRANSIT',
    'AT_HOSPITAL',
    'AT_PATIENT_HOME',
    'RETURN_HOME',
    'RETURN_OFFICE',
]);

export function jobStatusToLeg(status: string): LocationLeg {
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

export type TrailPoint = { lat: number; lng: number; leg?: string | null };

const TH_LAT_MIN = 5;
const TH_LAT_MAX = 21;
const TH_LNG_MIN = 97;
const TH_LNG_MAX = 106;
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

function isPlausibleCoordinate(lat: number, lng: number): boolean {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
    if (Math.abs(lat) < 1e-6 && Math.abs(lng) < 1e-6) return false;
    return lat >= TH_LAT_MIN && lat <= TH_LAT_MAX && lng >= TH_LNG_MIN && lng <= TH_LNG_MAX;
}

function filterTrailPointsForDistance(points: TrailPoint[]): TrailPoint[] {
    const result: TrailPoint[] = [];

    for (const point of points) {
        if (!isPlausibleCoordinate(point.lat, point.lng)) continue;

        const prev = result[result.length - 1];
        if (
            prev &&
            haversineMeters(prev.lat, prev.lng, point.lat, point.lng) > MAX_CONSECUTIVE_GAP_METERS
        ) {
            continue;
        }

        result.push(point);
    }

    return result;
}

function normalizeLeg(leg?: string | null): LocationLeg {
    if (
        leg === 'dispatch' ||
        leg === 'pickup' ||
        leg === 'to_hospital' ||
        leg === 'return' ||
        leg === 'return_office'
    ) {
        return leg;
    }
    return 'pickup';
}

export function sumTrailDistanceKm(points: TrailPoint[]): number | null {
    const filtered = filterTrailPointsForDistance(points);
    if (filtered.length < 2) return null;

    let totalMeters = 0;
    for (let i = 1; i < filtered.length; i++) {
        totalMeters += haversineMeters(
            filtered[i - 1].lat,
            filtered[i - 1].lng,
            filtered[i].lat,
            filtered[i].lng,
        );
    }

    return Math.round((totalMeters / 1000) * 100) / 100;
}

export function sumTrailDistanceByLeg(points: TrailPoint[]): Partial<Record<LocationLeg, number>> {
    const filtered = filterTrailPointsForDistance(points);
    const byLeg: Partial<Record<LocationLeg, number>> = {};

    for (let i = 1; i < filtered.length; i++) {
        const prev = filtered[i - 1];
        const next = filtered[i];
        const leg = normalizeLeg(next.leg ?? prev.leg);
        const meters = haversineMeters(prev.lat, prev.lng, next.lat, next.lng);
        byLeg[leg] = (byLeg[leg] ?? 0) + meters;
    }

    const rounded: Partial<Record<LocationLeg, number>> = {};
    for (const [leg, meters] of Object.entries(byLeg)) {
        rounded[leg as LocationLeg] = Math.round((meters / 1000) * 100) / 100;
    }
    return rounded;
}
