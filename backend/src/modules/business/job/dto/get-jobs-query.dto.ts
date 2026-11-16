import { IsString, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetJobsQueryDto {
  @ApiPropertyOptional({
    description: 'กรองตามสถานะงาน',
    example: 'OPEN',
    enum: ['OPEN', 'ASSIGNED', 'ACCEPTED', 'REJECTED', 'PICKING_UP', 'COMPLETED', 'CANCELLED'],
  })
  @IsOptional()
  status?: string | string[];

  @ApiPropertyOptional({
    description: 'กรองตาม Volunteer ID',
    example: 5,
  })
  @IsString()
  @IsOptional()
  vltId?: string;

  @ApiPropertyOptional({
    description: 'กรองตาม Queue ID',
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  queueId?: number;

  @ApiPropertyOptional({
    description: 'กรองตาม User ID (ประชาชน)',
    example: 10,
  })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({
    description: 'หมายเลขหน้า (เริ่มจาก 1)',
    example: 1,
    default: 1,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({
    description: 'จำนวนรายการต่อหน้า',
    example: 30,
    default: 30,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}
