export interface VolunteerDetail {
    id: number;
    iamUserId: string;
    displayName: string;
    firstName: string | null;
    lastName: string | null;
    pictureUrl: string | null;
    phone: string | null;
    addressDetail: string | null;
    gender: string | null;
    birthDate: string | null;
    pointsBalance: number;
    role: string;
    createdAt: string;
}

export interface Job {
    id: number;
    status: string;
    queue?: {
        user?: {
            displayName: string;
            firstName?: string;
            lastName?: string;
        };
        bookingType: string;
        requestDate: string;
        bookingTime: string;
        rejectReason?: string | null;
        adminNote?: string | null;
    };
    completedAt?: string;
    patientDroppedOffAt?: string;
    vltId?: number;
    rejectReason?: string | null;
}
