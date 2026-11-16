import type { User, UserDisease, UserProfileFormData, UserUpdatePayload, UserAddressParts } from '@/types/user';

export type AddressLike = UserAddressParts | string | null | undefined;

export type FormDataState = Omit<UserProfileFormData, keyof UserAddressParts> & {
    addressDetail: string;
    placeName: string;
    houseNo: string;
    road: string;
    neighbourhood: string;
    villageName: string;
    subdistrictName: string;
    districtName: string;
    provinceName: string;
    postalCode: string;
    country: string;
};
export type RequestedChanges = UserUpdatePayload;

function setRequestedField(payload: RequestedChanges, field: keyof FormDataState, value: FormDataState[keyof FormDataState]) {
    if (field === 'diseases' || field === 'address') return;
    if (value === '' || value === undefined) {
        payload[field as keyof RequestedChanges] = null as never;
        return;
    }
    payload[field as keyof RequestedChanges] = value as never;
}

export function normalizeDiseasesFromUser(currentUser: User): UserDisease[] {
    if (currentUser.allDiseases?.length) {
        return currentUser.allDiseases.map((d) => ({
            id: d.type === 'db' ? d.id : undefined,
            name: d.name,
            type: d.type,
        }));
    }

    if (currentUser.diseases?.length) {
        return currentUser.diseases.map((entry) => ({
            id: entry.diseaseId,
            name: entry.disease.name,
            type: 'db' as const,
        }));
    }

    if (currentUser.customDiseases?.length) {
        return currentUser.customDiseases.map((name) => ({ name, type: 'custom' as const }));
    }

    return [];
}

function isValidNumber(value: unknown): value is number {
    return typeof value === 'number' && !Number.isNaN(value);
}

export function normalizeUserToFormData(currentUser: User, getAddressString: (addr: AddressLike) => string): FormDataState {
    return {
        firstName: currentUser.firstName || '',
        lastName: currentUser.lastName || '',
        idCard: currentUser.idCard || '',
        phone: currentUser.phone || '',
        relativeName: currentUser.relativeName || '',
        relativePhone: currentUser.relativePhone || '',
        gender: currentUser.gender === 'female' ? 'female' : 'male',
        diseases: normalizeDiseasesFromUser(currentUser),
        mobilityStatus: currentUser.mobilityStatus || 'WALKING',
        birthDate: currentUser.birthDate ? new Date(currentUser.birthDate).toISOString().split('T')[0] : '',
        addressDetail: currentUser.addressDetail || '',
        placeName: currentUser.placeName || '',
        houseNo: currentUser.houseNo || '',
        road: currentUser.road || '',
        neighbourhood: currentUser.neighbourhood || '',
        villageName: currentUser.villageName || '',
        subdistrictName: currentUser.subdistrictName || '',
        districtName: currentUser.districtName || '',
        provinceName: currentUser.provinceName || '',
        postalCode: currentUser.postalCode || '',
        country: currentUser.country || '',
        address: getAddressString(currentUser),
        lat: isValidNumber(currentUser.lat) ? currentUser.lat : null,
        lng: isValidNumber(currentUser.lng) ? currentUser.lng : null,
    };
}

function haveDifferentDiseases(left: FormDataState['diseases'], right: FormDataState['diseases']) {
    return JSON.stringify(left) !== JSON.stringify(right);
}

export function buildRequestedChanges(formData: FormDataState, initialData: FormDataState): RequestedChanges {
    const requestedChanges: RequestedChanges = {};
    const fields: Array<keyof Omit<FormDataState, 'diseases' | 'address'>> = [
        'firstName', 'lastName', 'idCard', 'phone', 'relativeName', 'relativePhone', 'gender',
        'mobilityStatus', 'birthDate', 'addressDetail', 'placeName', 'houseNo', 'road',
        'neighbourhood', 'villageName', 'subdistrictName', 'districtName', 'provinceName',
        'postalCode', 'country', 'lat', 'lng',
    ];

    for (const field of fields) {
        if (formData[field] !== initialData[field]) {
            setRequestedField(requestedChanges, field, formData[field]);
        }
    }

    if (haveDifferentDiseases(formData.diseases, initialData.diseases)) {
        requestedChanges.diseaseIds = formData.diseases.filter((d) => d.id).map((d) => d.id);
        requestedChanges.customDiseases = formData.diseases.filter((d) => !d.id).map((d) => d.name);
    }

    return requestedChanges;
}
