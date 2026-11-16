import { IsNotEmpty, IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AcceptJobDto {
  @ApiProperty({ description: 'Volunteer ID ที่ยอมรับงาน', example: 'abc123' })
  @IsString()
  @IsNotEmpty()
  vltId: string;

  @ApiProperty({ description: 'Latitude ของจิตอาสาตอนรับงาน', example: 13.736717, required: false })
  @IsOptional()
  @IsNumber()
  lat?: number;

  @ApiProperty({ description: 'Longitude ของจิตอาสาตอนรับงาน', example: 100.523186, required: false })
  @IsOptional()
  @IsNumber()
  lng?: number;
}

