import { IsOptional, IsString, IsNumber, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchResidenceDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  municipalityId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  provinceId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  districtId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  subdistrictId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lng?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  radiusMeters?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Max(50)
  limit?: number;
}
