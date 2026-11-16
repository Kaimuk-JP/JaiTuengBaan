export interface RideRequest {
    id: number;
    status: string;
    queue: {
        user: {
            id: number;
            displayName?: string;
            firstName?: string;
            lastName?: string;
            phone: string;
            lat: number;
            lng: number;
            addressDetail: string;
            mobilityStatus: string;
            pictureUrl?: string;
            organization?: { name?: string };
        };
        hospitalName?: string;
        hospital?: {
            name: string;
            lat?: number;
            lng?: number;
        };
        bookingTime?: string;
        severityLevel: string;
        hasAppointment: boolean;
        requestDate: string;
    };
    vlt: {
        id: number;
        displayName: string;
    } | null;
    job?: {
        id: number;
        status: string;
        startLat?: number;
        startLng?: number;
        careuId?: string | null;
        returnPickupRequestedAt?: string | null;
    };
    careu?: {
        id: string;
        firstName?: string;
        lastName?: string;
        phone?: string;
        pictureUrl?: string;
    } | null;
}

export interface DriverLocation {
    lat: number;
    lng: number;
}

export type JobStatus = 'ASSIGNED' | 'ACCEPTED' | 'PICKING_UP' | 'IN_TRANSIT' | 'AT_HOSPITAL' | 'RETURN_HOME' | 'AT_PATIENT_HOME' | 'RETURN_OFFICE' | 'COMPLETED';
