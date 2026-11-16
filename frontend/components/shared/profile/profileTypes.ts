import type { UserAddressParts, UserDisease } from '@/types/user';

export type AddressLike = UserAddressParts | string | null | undefined;

export type FormDataState = {
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
    address: string;
    lat: number | null;
    lng: number | null;
};
