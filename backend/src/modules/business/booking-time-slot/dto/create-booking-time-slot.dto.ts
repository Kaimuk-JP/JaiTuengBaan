import { IsString, IsOptional, IsBoolean, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBookingTimeSlotDto {
    @ApiProperty({ description: 'ข้อความแสดงผล เช่น "รอบที่ 1: 04:00 – 06:00 น."' })
    @IsString()
    label: string;

    @ApiPropertyOptional({ description: 'ลำดับการแสดงผล', default: 0 })
    @IsOptional()
    @IsInt()
    @Min(0)
    sortOrder?: number;

    @ApiPropertyOptional({ description: 'เปิด/ปิดใช้งาน', default: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
