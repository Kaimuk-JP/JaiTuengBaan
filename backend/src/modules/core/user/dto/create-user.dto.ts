import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsNotEmpty,
} from 'class-validator';

export enum MobilityStatus {
  WALKING = 'WALKING',
  WHEELCHAIR = 'WHEELCHAIR',
  BEDRIDDEN = 'BEDRIDDEN',
}

export enum Role {
  USERS = 'USERS',
  CAREGIVER = 'CAREGIVER',
  DRIVE = 'DRIVE',
  CAREU = 'CAREU',
  STAFF = 'STAFF',
  EXECUTIVE = 'EXECUTIVE',
  ADMIN = 'ADMIN',
}

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  lineUserId: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;


  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  relativePhone?: string;

  @IsString()
  @IsOptional()
  relativeName?: string;

  @IsString()
  @IsOptional()
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

  @IsEnum(Role)
  @IsOptional()
  role?: Role;
}
