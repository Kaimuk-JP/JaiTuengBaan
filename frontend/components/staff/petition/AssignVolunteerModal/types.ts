export interface Queue {
    id: number;
    requestDate: string;
    bookingTime: string | null;
    status: string;
    requiredEquipment: string | null;
    user: {
        id: string;
        firstName: string;
        lastName: string;
        displayName?: string;
        phone: string | null;
        mobilityStatus: string | null;
        pictureUrl: string | null;
        addressDetail: string | null;
        lat: number | null;
        lng: number | null;
    };
    hospital: {
        id: number;
        name: string;
    } | null;
    job?: {
        id: number;
        status: string;
        vltId?: string | null;
        careuId?: string | null;
        vehicleId?: number | null;
        vlt?: {
            id: string;
            firstName: string;
            lastName: string;
        };
        careu?: {
            id: string;
            firstName: string;
            lastName: string;
        };
        vehicle?: {
            id: number;
            licensePlate: string;
            name: string;
        };
    };
    wantCareU?: boolean;
}

export interface Volunteer {
    id: string;
    firstName: string;
    lastName: string;
    displayName?: string;
    phone: string;
    pictureUrl?: string;
    latitude?: number;
    longitude?: number;
    distance?: number;
}

export interface Vehicle {
    id: number;
    licensePlate: string;
    name: string;
    brand: string | null;
    model: string | null;
    type: 'STANDARD_VAN' | 'WHEELCHAIR_VAN' | 'AMBULANCE' | 'OTHER';
    capacity: number;
    isActive: boolean;
    color: string | null;
    status?: string;
}
