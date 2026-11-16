import { useState, useEffect, useCallback, useMemo } from 'react';
import { RideRequest, DriverLocation } from '../driver/types';
import {
    resolveTripOrder,
    resolveHospitalReturnOrder,
    filterHospitalReturnCandidates,
    getNextInQueue,
    getNextPickupActionTarget,
    getNextDropoffActionTarget,
    orderDisplayRequests,
    PICKUP_STATUSES,
    DROPOFF_ORDER_STATUSES,
    ACTIVE_DROPOFF_STATUSES,
    TripQueuePhase,
    TripQueueMode,
} from '@/utils/tripQueueOrder';

type TripQueueState = {
    pickupMode: TripQueueMode;
    dropoffMode: TripQueueMode;
    hospitalReturnMode: TripQueueMode;
    pickupOrder: number[];
    dropoffOrder: number[];
    hospitalReturnOrder: number[];
};

const DEFAULT_STATE: TripQueueState = {
    pickupMode: 'auto',
    dropoffMode: 'auto',
    hospitalReturnMode: 'auto',
    pickupOrder: [],
    dropoffOrder: [],
    hospitalReturnOrder: [],
};

function loadState(key: string): TripQueueState {
    try {
        const raw = sessionStorage.getItem(`tripQueue:${key}`);
        if (!raw) return DEFAULT_STATE;
        return { ...DEFAULT_STATE, ...JSON.parse(raw) };
    } catch {
        return DEFAULT_STATE;
    }
}

function saveState(key: string, state: TripQueueState) {
    try {
        sessionStorage.setItem(`tripQueue:${key}`, JSON.stringify(state));
    } catch {
    }
}

export function useTripQueue({
    tripGroupKey,
    tripRequests,
    driverLocation,
    hospitalLocation,
}: {
    tripGroupKey: string | null;
    tripRequests: RideRequest[];
    driverLocation: DriverLocation | null;
    hospitalLocation: { lat: number; lng: number } | null;
}) {
    const [state, setState] = useState<TripQueueState>(DEFAULT_STATE);

    useEffect(() => {
        if (!tripGroupKey) {
            setState(DEFAULT_STATE);
            return;
        }
        setState(loadState(tripGroupKey));
    }, [tripGroupKey]);

    const updateState = useCallback(
        (updater: (prev: TripQueueState) => TripQueueState) => {
            setState((prev) => {
                const newState = updater(prev);
                if (tripGroupKey) saveState(tripGroupKey, newState);
                return newState;
            });
        },
        [tripGroupKey]
    );

    const pickupCandidates = useMemo(
        () => tripRequests.filter((r) => PICKUP_STATUSES.includes(r.job?.status || '')),
        [tripRequests]
    );

    const dropoffOrderCandidates = useMemo(
        () => tripRequests.filter((r) => DROPOFF_ORDER_STATUSES.includes(r.job?.status || '')),
        [tripRequests]
    );

    const activeDropoffCandidates = useMemo(
        () => tripRequests.filter((r) => ACTIVE_DROPOFF_STATUSES.includes(r.job?.status || '')),
        [tripRequests]
    );

    const hospitalReturnCandidates = useMemo(
        () => filterHospitalReturnCandidates(tripRequests),
        [tripRequests]
    );

    const orderedPickup = useMemo(
        () =>
            resolveTripOrder({
                mode: state.pickupMode,
                manualIds: state.pickupOrder,
                candidates: pickupCandidates,
                phase: 'pickup',
                driverLocation,
                hospital: hospitalLocation,
            }),
        [state.pickupMode, state.pickupOrder, pickupCandidates, driverLocation, hospitalLocation]
    );

    const orderedDropoff = useMemo(
        () =>
            resolveTripOrder({
                mode: state.dropoffMode,
                manualIds: state.dropoffOrder,
                candidates: dropoffOrderCandidates,
                phase: 'dropoff',
                driverLocation,
                hospital: hospitalLocation,
            }),
        [state.dropoffMode, state.dropoffOrder, dropoffOrderCandidates, driverLocation, hospitalLocation]
    );

    const orderedHospitalReturn = useMemo(
        () =>
            resolveHospitalReturnOrder({
                mode: state.hospitalReturnMode,
                manualIds: state.hospitalReturnOrder,
                candidates: hospitalReturnCandidates,
            }),
        [state.hospitalReturnMode, state.hospitalReturnOrder, hospitalReturnCandidates]
    );

    const currentPhase: TripQueuePhase | null =
        pickupCandidates.length > 0
            ? 'pickup'
            : activeDropoffCandidates.length > 0
              ? 'dropoff'
              : null;

    const orderedDisplayRequests = useMemo(
        () => orderDisplayRequests(tripRequests, orderedPickup, orderedDropoff, orderedHospitalReturn),
        [tripRequests, orderedPickup, orderedDropoff, orderedHospitalReturn]
    );

    const reorderQueue = useCallback(
        (phase: TripQueuePhase, fromIndex: number, toIndex: number) => {
            const currentOrdered =
                phase === 'pickup'
                    ? orderedPickup
                    : phase === 'dropoff'
                      ? orderedDropoff
                      : orderedHospitalReturn;
            const ids = currentOrdered.map((r) => r.id);
            if (
                fromIndex === toIndex ||
                fromIndex < 0 ||
                toIndex < 0 ||
                fromIndex >= ids.length ||
                toIndex >= ids.length
            ) {
                return;
            }

            const newIds = [...ids];
            const [moved] = newIds.splice(fromIndex, 1);
            newIds.splice(toIndex, 0, moved);

            updateState((prev) => {
                if (phase === 'pickup') {
                    return { ...prev, pickupMode: 'manual', pickupOrder: newIds };
                }
                if (phase === 'dropoff') {
                    return { ...prev, dropoffMode: 'manual', dropoffOrder: newIds };
                }
                return { ...prev, hospitalReturnMode: 'manual', hospitalReturnOrder: newIds };
            });
        },
        [orderedPickup, orderedDropoff, orderedHospitalReturn, updateState]
    );

    const resetAuto = useCallback(
        (phase: TripQueuePhase) => {
            updateState((prev) => {
                if (phase === 'pickup') {
                    return { ...prev, pickupMode: 'auto', pickupOrder: [] };
                }
                if (phase === 'dropoff') {
                    return { ...prev, dropoffMode: 'auto', dropoffOrder: [] };
                }
                return { ...prev, hospitalReturnMode: 'auto', hospitalReturnOrder: [] };
            });
        },
        [updateState]
    );

    const removeCompletedId = useCallback(
        (jobId: number) => {
            updateState((prev) => ({
                ...prev,
                pickupOrder: prev.pickupOrder.filter((id) => id !== jobId),
                dropoffOrder: prev.dropoffOrder.filter((id) => id !== jobId),
                hospitalReturnOrder: prev.hospitalReturnOrder.filter((id) => id !== jobId),
            }));
        },
        [updateState]
    );

    return {
        orderedPickup,
        orderedDropoff,
        orderedHospitalReturn,
        orderedDisplayRequests,
        currentPhase,
        pickupMode: state.pickupMode,
        dropoffMode: state.dropoffMode,
        hospitalReturnMode: state.hospitalReturnMode,
        nextPickup: getNextInQueue(orderedPickup),
        nextDropoff: getNextInQueue(orderedDropoff),
        nextPickupActionTarget: getNextPickupActionTarget(orderedPickup),
        nextDropoffActionTarget: getNextDropoffActionTarget(orderedDropoff),
        reorderQueue,
        resetAuto,
        removeCompletedId,
    };
}
