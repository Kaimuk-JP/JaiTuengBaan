import { IsNumber, IsNotEmpty, Min, Max, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RateJobDto {
  @ApiPropertyOptional({
    description: 'คะแนนความพึงพอใจคนขับ (1-5)',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  driverRatingScore?: number;

  @ApiPropertyOptional({
    description: 'ความคิดเห็นคนขับ',
    example: 'คนขับขับรถดีมาก ปลอดภัย',
  })
  @IsOptional()
  @IsString()
  driverComment?: string;

  @ApiPropertyOptional({
    description: 'คะแนนความพึงพอใจ จิตอาสาแคร์ยู (1-5)',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  careuRatingScore?: number;

  @ApiPropertyOptional({
    description: 'ความคิดเห็น จิตอาสาแคร์ยู',
    example: 'บัดดี้ดูแลดีมาก ใส่ใจ',
  })
  @IsOptional()
  @IsString()
  careuComment?: string;

  @ApiProperty({ description: 'User ID ของผู้ให้คะแนน', example: 'abc123' })
  @IsString()
  @IsNotEmpty()
  userId: string;
}
