import { IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RateMunicipalDto {
  @ApiProperty({ description: 'ความตรงต่อเวลา (1-5)', example: 5, minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  punctuality: number;

  @ApiProperty({ description: 'ความสะดวกในการจองคิว (1-5)', example: 4, minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  bookingEase: number;

  @ApiProperty({ description: 'ความสะอาดของยานพาหนะ (1-5)', example: 5, minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  vehicleClean: number;

  @ApiProperty({ description: 'ความปลอดภัยระหว่างเดินทาง (1-5)', example: 5, minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  safety: number;

  @ApiProperty({ description: 'ความเอาใจใส่ของเจ้าหน้าที่ (1-5)', example: 4, minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  staffAttitude: number;

  @ApiProperty({ description: 'ความพึงพอใจโดยรวม (1-5)', example: 5, minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  overallScore: number;

  @ApiPropertyOptional({ description: 'ข้อเสนอแนะเพิ่มเติม', example: 'บริการดีมากค่ะ ขอบคุณเทศบาล' })
  @IsOptional()
  @IsString()
  comment?: string;
}
