import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateResidenceClaimDto {
  @IsString()
  houseNo: string;

  @IsOptional()
  @IsString()
  moo?: string;

  @IsOptional()
  @IsString()
  villageName?: string;

  @IsOptional()
  @IsString()
  buildingName?: string;

  @IsOptional()
  @IsString()
  floor?: string;

  @IsOptional()
  @IsString()
  roomNo?: string;

  @IsOptional()
  @IsString()
  soi?: string;

  @IsOptional()
  @IsString()
  road?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsNumber()
  provinceId: number;

  @IsNumber()
  districtId: number;

  @IsNumber()
  subdistrictId: number;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  locationAccuracy?: string;
}
