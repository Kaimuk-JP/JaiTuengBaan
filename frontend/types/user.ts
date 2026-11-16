export type Role = 'USERS' | 'CAREGIVER' | 'DRIVE' | 'CAREU' | 'STAFF' | 'EXECUTIVE' | 'ADMIN';

export interface UserDisease {
    type: 'db' | 'custom';
    id?: number;
    name: string;
}

export interface UserDiseaseEntry {
    diseaseId: number;
    disease: { id: number; name: string };
}

export interface UserOrganization {
    id?: number;
    name?: string;
    lat?: number;
    lng?: number;
}

export interface UserAddressParts {
    addressDetail?: string;
    placeName?: string;
    houseNo?: string;
    road?: string;
    neighbourhood?: string;
    villageName?: string;
    subdistrictName?: string;
    districtName?: string;
    provinceName?: string;
    postalCode?: string;
    country?: string;
}

export interface UserCaregiver {
    id: number;
    firstName?: string;
    lastName?: string;
    displayName?: string;
    phone?: string;
    pictureUrl?: string;
}

export interface UserQueue {
    id: number;
    status: string;
    severityLevel: string;
    hospitalId: number;
    userId: number;
    jobId: number | null;
    patientId: number;
}

export interface User extends UserAddressParts {
    id: number;
    iamUserId?: string;
    displayName?: string;
    firstName?: string;
    lastName?: string;
    pictureUrl?: string | null;
    lineUserId?: string | null;
    lineDisplayName?: string | null;
    linePictureUrl?: string | null;
    lineConnectedAt?: string | null;
    phone?: string | null;
    role?: Role;
    idCard?: string;
    birthDate?: string;
    gender?: string;
    residenceId?: string;
    provinceId?: number;
    districtId?: number;
    subdistrictId?: number;
    placeName?: string;
    lat?: number | string | null;
    lng?: number | string | null;
    medicalConditions?: string | string[];
    specialNeeds?: string;
    mobilityStatus?: 'WALKING' | 'WHEELCHAIR' | 'BEDRIDDEN';
    allDiseases?: UserDisease[];
    diseases?: Array<UserDiseaseEntry>;
    customDiseases?: string[];
    pointsBalance?: number;
    pointsBreakdown?: {
        volunteer: number;
        driver: number;
        careu: number;
    };
    roles?: Role[];
    allowedRoles?: Role[];
    relativeName?: string;
    relativePhone?: string;
    organizationId?: number;
    organization?: UserOrganization;
    caregiver?: UserCaregiver;
    queues?: UserQueue[];
    patientCaregivers?: unknown[];
    privacyAcceptedAt?: string | null;
    privacyVersion?: string | null;
    createdAt?: string;
}

export type RoleRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface RoleRequest {
    id: string;
    userId: string;
    requestedRole: Role;
    currentRole?: Role | null;
    status: RoleRequestStatus;
    reason?: string | null;
    documents?: string[];
    note?: string | null;
    rejectReason?: string | null;
    reviewedById?: string | null;
    reviewedAt?: string | null;
    createdAt: string;
    updatedAt: string;
    user?: User;
    reviewedBy?: {
        id: string;
        firstName?: string;
        lastName?: string;
    };
}

export interface UserProfileFormData extends UserAddressParts {
    firstName: string;
    lastName: string;
    idCard: string;
    phone: string;
    relativeName: string;
    relativePhone: string;
    gender: 'male' | 'female';
    diseases: UserDisease[];
    mobilityStatus: 'WALKING' | 'WHEELCHAIR' | 'BEDRIDDEN';
    birthDate: string;
    address: string;
    lat: number | null;
    lng: number | null;
}

export interface UserUpdatePayload {
    firstName?: string | null;
    lastName?: string | null;
    idCard?: string | null;
    phone?: string | null;
    relativeName?: string | null;
    relativePhone?: string | null;
    gender?: 'male' | 'female' | null;
    diseaseIds?: Array<number | undefined>;
    customDiseases?: string[];
    mobilityStatus?: 'WALKING' | 'WHEELCHAIR' | 'BEDRIDDEN' | null;
    birthDate?: string | null;
    addressDetail?: string | null;
    placeName?: string | null;
    houseNo?: string | null;
    road?: string | null;
    neighbourhood?: string | null;
    villageName?: string | null;
    subdistrictName?: string | null;
    districtName?: string | null;
    provinceName?: string | null;
    postalCode?: string | null;
    country?: string | null;
    lat?: number | null;
    lng?: number | null;
    newPictureUrl?: string;
}
