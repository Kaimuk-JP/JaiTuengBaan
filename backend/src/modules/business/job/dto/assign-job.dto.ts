import { IsNumber, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignJobDto {
  @ApiProperty({ description: 'Volunteer ID ที่จะมอบหมายงาน', example: 'abc123' })
  @IsString()
  @IsNotEmpty()
  vltId: string;

  @ApiProperty({ description: 'Staff ID ที่ทำการมอบหมาย', example: 'def456', required: false })
  @IsString()
  @IsOptional()
  assignedBy?: string;

  @ApiProperty({ description: 'CareU ID จิตอาสาแคร์ยู ที่จะมอบหมายงาน', example: 'xyz789', required: false })
  @IsString()
  @IsOptional()
  careuId?: string;

  @ApiProperty({ description: 'Vehicle ID สำหรับงาน (ถ้ามี)', example: 1, required: false })
  @IsOptional()
  @IsNumber()
  vehicleId?: number;
}

