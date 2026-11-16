import type { Socket } from 'socket.io-client';

export const LOCATION_EMIT_INTERVAL_MS = 3000;

export type JobLocationSource = 'DRIVE' | 'CAREU';

export type PendingJobLocation = {
    id?: number;
    jobId: number;
    lat: number;
    lng: number;
    recordedAt: string;
    source: JobLocationSource;
};

const DB_NAME = 'volunteer-smart-location';
const DB_VERSION = 1;
const STORE_NAME = 'pending-job-locations';

function openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
        };
    });
}

export function getJobLocationEvent(source: JobLocationSource): string {
    return source === 'CAREU' ? 'careu:update_location' : 'driver:update_location';
}

export async function enqueuePendingJobLocation(point: PendingJobLocation): Promise<void> {
    if (typeof indexedDB === 'undefined') return;
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).add(point);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
    db.close();
}

export async function readPendingJobLocations(): Promise<PendingJobLocation[]> {
    if (typeof indexedDB === 'undefined') return [];
    const db = await openDb();
    const rows = await new Promise<PendingJobLocation[]>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const request = tx.objectStore(STORE_NAME).getAll();
        request.onsuccess = () => resolve(request.result as PendingJobLocation[]);
        request.onerror = () => reject(request.error);
    });
    db.close();
    return rows.sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
}

async function deletePendingJobLocation(id: number): Promise<void> {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
    db.close();
}

export async function emitJobLocationUpdate(
    socket: Socket | null,
    isConnected: boolean,
    jobId: number,
    lat: number,
    lng: number,
    source: JobLocationSource,
): Promise<boolean> {
    const recordedAt = new Date().toISOString();
    const payload = { jobId, lat, lng, recordedAt };
    const event = getJobLocationEvent(source);

    if (socket && isConnected) {
        socket.emit(event, payload);
        return true;
    }

    await enqueuePendingJobLocation({ jobId, lat, lng, recordedAt, source });
    return false;
}

export async function flushPendingJobLocations(
    socket: Socket | null,
    isConnected: boolean,
): Promise<void> {
    if (!socket || !isConnected || typeof indexedDB === 'undefined') return;

    const pending = await readPendingJobLocations();
    for (const point of pending) {
        if (point.id == null) continue;
        socket.emit(getJobLocationEvent(point.source), {
            jobId: point.jobId,
            lat: point.lat,
            lng: point.lng,
            recordedAt: point.recordedAt,
        });
        await deletePendingJobLocation(point.id);
    }
}
