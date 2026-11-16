import {
  IsString,
  IsEnum,
  IsOptional,
  IsInt,
  IsNumber,
  Min,
  IsBoolean,
} from 'class-validator';



export enum FuelType {
  BENZENE = 'BENZENE',
  GASOHOL_91 = 'GASOHOL_91',
  GASOHOL_95 = 'GASOHOL_95',
  GASOHOL_E20 = 'GASOHOL_E20',
  GASOHOL_E85 = 'GASOHOL_E85',
  DIESEL = 'DIESEL',
  ELECTRIC = 'ELECTRIC',
}

export enum VehicleStatus {
  READY = 'READY',
  MAINTENANCE = 'MAINTENANCE',
  INACTIVE = 'INACTIVE',
}

export class CreateVehicleDto {
  @IsString()
  licensePlate: string;

  @IsString()
  name: string;

  @IsString()
  type: string;

  @IsEnum(FuelType)
  @IsOptional()
  fuelType?: FuelType;

  @IsString()
  @IsOptional()
  brand?: string;

  @IsString()
  @IsOptional()
  model?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  capacity?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  totalMileageKm?: number;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsEnum(VehicleStatus)
  @IsOptional()
  status?: VehicleStatus;
}

export class UpdateVehicleDto {
  @IsString()
  @IsOptional()
  licensePlate?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsEnum(FuelType)
  @IsOptional()
  fuelType?: FuelType;

  @IsString()
  @IsOptional()
  brand?: string;

  @IsString()
  @IsOptional()
  model?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  capacity?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  totalMileageKm?: number;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsEnum(VehicleStatus)
  @IsOptional()
  status?: VehicleStatus;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
