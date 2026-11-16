import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RejectJobDto {
  @ApiProperty({ description: 'Volunteer ID ที่ปฏิเสธงาน', example: 'abc123' })
  @IsString()
  @IsNotEmpty()
  vltId: string;

  @ApiPropertyOptional({
    description: 'เหตุผลในการปฏิเสธงาน',
    example: 'ติดภารกิจอื่น ไม่สะดวกในเวลาที่กำหนด',
  })
  @IsString()
  @IsOptional()
  reason?: string;
}

