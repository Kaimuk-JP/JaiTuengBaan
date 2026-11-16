import { RideRequest, DriverLocation } from '@/components/driver/types';
import { getDateKey, getRoundGroup, getHosp } from './jobHelpers';

export type TripQueuePhase = 'pickup' | 'dropoff' | 'hospitalReturn';
export type TripQueueMode = 'auto' | 'manual';

export const PICKUP_STATUSES = ['ASSIGNED', 'ACCEPTED', 'PICKING_UP'];
export const ACTIVE_DROPOFF_STATUSES = ['RETURN_HOME'];
export const DROPOFF_ORDER_STATUSES = ['RETURN_HOME', 'AT_PATIENT_HOME'];
export const DROPOFF_STATUSES = ACTIVE_DROPOFF_STATUSES;

export function getTripGroupKey(req: RideRequest): string {
    const date = getDateKey(req.queue.requestDate);
    const round = getRoundGroup(req.queue.bookingTime);
    const hosp = getHosp(req.queue);
    return `${date}|${round}|${hosp}`;
}

export function filterTripGroup(
    rideRequests: RideRequest[],
    referenceReq: RideRequest,
    userId?: number,
    isStaffView = false
): RideRequest[] {
    const key = getTripGroupKey(referenceReq);
    return rideRequests.filter((req) => {
        if (userId && req.vlt?.id !== userId && !isStaffView) return false;
        return getTripGroupKey(req) === key;
    });
}

export function sortByNearest(
    passengers: RideRequest[],
    originLat: number,
    originLng: number
): RideRequest[] {
    const validPassengers = passengers.filter(
        (p) => p.queue.user.lat != null && p.queue.user.lng != null
    );
    const ordered: RideRequest[] = [];
    let currentLoc = { lat: originLat, lng: originLng };
    let remaining = [...validPassengers];

    while (remaining.length > 0) {
        remaining.sort((a, b) => {
            const distA =
                Math.pow(a.queue.user.lat - currentLoc.lat, 2) +
                Math.pow(a.queue.user.lng - currentLoc.lng, 2);
            const distB =
                Math.pow(b.queue.user.lat - currentLoc.lat, 2) +
                Math.pow(b.queue.user.lng - currentLoc.lng, 2);
            return distA - distB;
        });
        const nextHop = remaining.shift()!;
        ordered.push(nextHop);
        currentLoc = { lat: nextHop.queue.user.lat, lng: nextHop.queue.user.lng };
    }
    return ordered;
}

export function sortDropoffByHospital(
    passengers: RideRequest[],
    hospitalLat: number,
    hospitalLng: number
): RideRequest[] {
    return passengers
        .filter((p) => p.queue.user.lat != null && p.queue.user.lng != null)
        .slice()
        .sort((a, b) => {
            const distA =
                Math.pow(a.queue.user.lat - hospitalLat, 2) +
                Math.pow(a.queue.user.lng - hospitalLng, 2);
            const distB =
                Math.pow(b.queue.user.lat - hospitalLat, 2) +
                Math.pow(b.queue.user.lng - hospitalLng, 2);
            return distA - distB;
        });
}

export function resolveTripOrder({
    mode,
    manualIds,
    candidates,
    phase,
    driverLocation,
    hospital,
}: {
    mode: TripQueueMode;
    manualIds: number[];
    candidates: RideRequest[];
    phase: TripQueuePhase;
    driverLocation: DriverLocation | null;
    hospital: { lat: number; lng: number } | null;
}): RideRequest[] {
    if (candidates.length === 0) return [];

    let autoOrdered: RideRequest[];
    if (phase === 'pickup' && driverLocation) {
        autoOrdered = sortByNearest(candidates, driverLocation.lat, driverLocation.lng);
    } else if (phase === 'dropoff' && hospital) {
        autoOrdered = sortDropoffByHospital(candidates, hospital.lat, hospital.lng);
    } else if (driverLocation) {
        autoOrdered = sortByNearest(candidates, driverLocation.lat, driverLocation.lng);
    } else {
        autoOrdered = [...candidates];
    }

    if (mode === 'auto') return autoOrdered;

    const idToReq = new Map(candidates.map((r) => [r.id, r]));
    const ordered: RideRequest[] = [];
    for (const id of manualIds) {
        const req = idToReq.get(id);
        if (req) ordered.push(req);
    }
    for (const req of autoOrdered) {
        if (!ordered.some((r) => r.id === req.id)) ordered.push(req);
    }
    return ordered;
}

export function getNextInQueue(ordered: RideRequest[]): RideRequest | null {
    return ordered.length > 0 ? ordered[0] : null;
}

export function getNextPickupActionTarget(orderedPickup: RideRequest[]): RideRequest | null {
    return getNextInQueue(orderedPickup);
}

export function getNextDropoffActionTarget(orderedDropoff: RideRequest[]): RideRequest | null {
    const active = orderedDropoff.filter((r) =>
        ACTIVE_DROPOFF_STATUSES.includes(r.job?.status || ''),
    );
    return getNextInQueue(active);
}

export function filterActiveDropoff(passengers: RideRequest[]): RideRequest[] {
    return passengers.filter((r) => ACTIVE_DROPOFF_STATUSES.includes(r.job?.status || ''));
}

export function filterHospitalReturnCandidates(passengers: RideRequest[]): RideRequest[] {
    return passengers.filter(
        (r) => r.job?.status === 'AT_HOSPITAL' && r.job?.returnPickupRequestedAt
    );
}

export function sortByReturnPickupRequested(passengers: RideRequest[]): RideRequest[] {
    return passengers.slice().sort((a, b) => {
        const aTime = a.job?.returnPickupRequestedAt
            ? new Date(a.job.returnPickupRequestedAt).getTime()
            : Infinity;
        const bTime = b.job?.returnPickupRequestedAt
            ? new Date(b.job.returnPickupRequestedAt).getTime()
            : Infinity;
        return aTime - bTime;
    });
}

export function resolveHospitalReturnOrder({
    mode,
    manualIds,
    candidates,
}: {
    mode: TripQueueMode;
    manualIds: number[];
    candidates: RideRequest[];
}): RideRequest[] {
    if (candidates.length === 0) return [];

    const autoOrdered = sortByReturnPickupRequested(candidates);
    if (mode === 'auto') return autoOrdered;

    const idToReq = new Map(candidates.map((r) => [r.id, r]));
    const ordered: RideRequest[] = [];
    for (const id of manualIds) {
        const req = idToReq.get(id);
        if (req) ordered.push(req);
    }
    for (const req of autoOrdered) {
        if (!ordered.some((r) => r.id === req.id)) ordered.push(req);
    }
    return ordered;
}

export function getNextHospitalReturnTarget(
    passengers: RideRequest[],
    ordered?: RideRequest[],
): RideRequest | null {
    const list =
        ordered ??
        sortByReturnPickupRequested(filterHospitalReturnCandidates(passengers));
    return list.length > 0 ? list[0] : null;
}

export function orderDisplayRequests(
    requests: RideRequest[],
    orderedPickup: RideRequest[],
    orderedDropoff: RideRequest[],
    orderedHospitalReturn?: RideRequest[],
): RideRequest[] {
    const pickupIdOrder = new Map(orderedPickup.map((r, i) => [r.id, i]));
    const dropoffIdOrder = new Map(orderedDropoff.map((r, i) => [r.id, i]));
    const hospitalReturnOrder = new Map(
        (orderedHospitalReturn ??
            sortByReturnPickupRequested(filterHospitalReturnCandidates(requests))).map((r, i) => [
            r.id,
            i,
        ]),
    );

    const getPriority = (req: RideRequest): number => {
        const status = req.job?.status || '';
        if (PICKUP_STATUSES.includes(status)) {
            return pickupIdOrder.get(req.id) ?? 1000;
        }
        if (status === 'IN_TRANSIT') return 200;
        const hospitalReturnIdx = hospitalReturnOrder.get(req.id);
        if (hospitalReturnIdx !== undefined) return 200 + hospitalReturnIdx;
        if (status === 'AT_HOSPITAL') return 300;
        if (DROPOFF_ORDER_STATUSES.includes(status)) {
            return 500 + (dropoffIdOrder.get(req.id) ?? 1000);
        }
        if (status === 'RETURN_OFFICE') return 900;
        return 1000;
    };

    return [...requests].sort((a, b) => getPriority(a) - getPriority(b));
}
