import { IsEnum, IsNumber, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum JobStatusUpdate {
  OPEN = 'OPEN',
  ASSIGNED = 'ASSIGNED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  PICKING_UP = 'PICKING_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  AT_HOSPITAL = 'AT_HOSPITAL',
  RETURN_HOME = 'RETURN_HOME',
  AT_PATIENT_HOME = 'AT_PATIENT_HOME',
  RETURN_OFFICE = 'RETURN_OFFICE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export class UpdateJobStatusDto {
  @ApiProperty({
    description: 'สถานะงานใหม่',
    enum: JobStatusUpdate,
    example: JobStatusUpdate.PICKING_UP,
  })
  @IsEnum(JobStatusUpdate)
  @IsNotEmpty()
  status: JobStatusUpdate;

  @ApiProperty({ description: 'Volunteer ID ที่อัพเดทสถานะ', example: 'abc123' })
  @IsString()
  @IsNotEmpty()
  vltId: string;

  @ApiPropertyOptional({ description: 'ละติจูดตำแหน่งปัจจุบัน', example: 13.7563 })
  @IsNumber()
  @IsOptional()
  lat?: number;

  @ApiPropertyOptional({ description: 'ลองจิจูดตำแหน่งปัจจุบัน', example: 100.5018 })
  @IsNumber()
  @IsOptional()
  lng?: number;

  @ApiPropertyOptional({ description: 'URL รูปภาพหลักฐานการส่งกลับ', example: '/uploads/evidence.jpg' })
  @IsString()
  @IsOptional()
  returnEvidenceUrl?: string;
}

