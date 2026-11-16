import {
    IsString,
    IsOptional,
    IsNumber,
    IsEnum,
    MaxLength,
    IsDateString,
    IsArray,
} from 'class-validator';
import { MobilityStatus, Role } from '@prisma/client';

export class UpdateUserDto {
    @IsString()
    @IsOptional()
    @MaxLength(13)
    idCard?: string;

    @IsString()
    @IsOptional()
    @MaxLength(50)
    firstName?: string;

    @IsString()
    @IsOptional()
    @MaxLength(50)
    lastName?: string;


    @IsString()
    @IsOptional()
    @MaxLength(10)
    phone?: string;

    @IsString()
    @IsOptional()
    @MaxLength(10)
    relativePhone?: string;

    @IsString()
    @IsOptional()
    @MaxLength(100)
    relativeName?: string;

    @IsDateString()
    @IsOptional()
    birthDate?: string;

    @IsString()
    @IsOptional()
    gender?: string;

    @IsString()
    @IsOptional()
    @MaxLength(100)
    villageName?: string;

    @IsString()
    @IsOptional()
    @MaxLength(100)
    placeName?: string;

    @IsString()
    @IsOptional()
    @MaxLength(50)
    houseNo?: string;

    @IsString()
    @IsOptional()
    @MaxLength(100)
    road?: string;

    @IsString()
    @IsOptional()
    @MaxLength(100)
    neighbourhood?: string;

    @IsString()
    @IsOptional()
    @MaxLength(100)
    postalCode?: string;

    @IsString()
    @IsOptional()
    @MaxLength(100)
    subdistrictName?: string;

    @IsString()
    @IsOptional()
    @MaxLength(100)
    districtName?: string;

    @IsString()
    @IsOptional()
    @MaxLength(100)
    provinceName?: string;

    @IsString()
    @IsOptional()
    @MaxLength(100)
    country?: string;

    @IsString()
    @IsOptional()
    @MaxLength(255)
    addressDetail?: string;

    @IsNumber()
    @IsOptional()
    lat?: number;

    @IsNumber()
    @IsOptional()
    lng?: number;

    @IsEnum(MobilityStatus)
    @IsOptional()
    mobilityStatus?: MobilityStatus;

    @IsArray()
    @IsNumber({}, { each: true })
    @IsOptional()
    diseaseIds?: number[];

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    customDiseases?: string[];

    @IsString()
    @IsOptional()
    pictureUrl?: string;

    @IsDateString()
    @IsOptional()
    privacyAcceptedAt?: string;

    @IsString()
    @IsOptional()
    privacyVersion?: string;

    @IsEnum(Role)
    @IsOptional()
    role?: Role;
}
