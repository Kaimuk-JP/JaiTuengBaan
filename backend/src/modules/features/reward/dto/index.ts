import { IsString, IsNumber, IsOptional, IsBoolean, Min, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRewardDto {
    @ApiProperty({ description: 'ชื่อรางวัล', example: 'คูปองส่วนลด 100 บาท' })
    @IsString()
    name: string;

    @ApiPropertyOptional({ description: 'รายละเอียดรางวัล' })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional({ description: 'URL รูปภาพรางวัล' })
    @IsString()
    @IsOptional()
    imageUrl?: string;

    @ApiProperty({ description: 'จำนวนแต้มที่ต้องใช้', example: 100 })
    @IsNumber()
    @Min(1)
    pointsCost: number;

    @ApiPropertyOptional({ description: 'จำนวนรางวัลคงเหลือ (-1 = ไม่จำกัด)', default: -1 })
    @IsNumber()
    @IsOptional()
    stock?: number;

    @ApiPropertyOptional({ description: 'เปิดใช้งานหรือไม่', default: true })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @ApiPropertyOptional({ description: 'URL รูปภาพหลักฐานการเพิ่มสต๊อก' })
    @IsString()
    @IsOptional()
    evidenceUrl?: string;

    @ApiPropertyOptional({ description: 'หมายเหตุการเพิ่มสต๊อก' })
    @IsString()
    @IsOptional()
    note?: string;
}

export class UpdateRewardDto {
    @ApiPropertyOptional({ description: 'ชื่อรางวัล' })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiPropertyOptional({ description: 'รายละเอียดรางวัล' })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional({ description: 'URL รูปภาพรางวัล' })
    @IsString()
    @IsOptional()
    imageUrl?: string;

    @ApiPropertyOptional({ description: 'จำนวนแต้มที่ต้องใช้' })
    @IsNumber()
    @Min(1)
    @IsOptional()
    pointsCost?: number;

    @ApiPropertyOptional({ description: 'จำนวนรางวัลคงเหลือ' })
    @IsNumber()
    @IsOptional()
    stock?: number;

    @ApiPropertyOptional({ description: 'เปิดใช้งานหรือไม่' })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @ApiPropertyOptional({ description: 'URL รูปภาพหลักฐานการแก้ไข/ปรับสต๊อก' })
    @IsString()
    @IsOptional()
    evidenceUrl?: string;

    @ApiPropertyOptional({ description: 'หมายเหตุการปรับปรุง' })
    @IsString()
    @IsOptional()
    note?: string;
}

export class AdjustStockDto {
    @ApiProperty({ description: 'ประเภทการปรับปรุงสต๊อก: ADD_STOCK (เพิ่ม), DEDUCT_STOCK (ลด/ตัดจำหน่าย), SET_STOCK (ปรับยอดตรง)' })
    @IsString()
    @IsIn(['ADD_STOCK', 'DEDUCT_STOCK', 'SET_STOCK'])
    action: 'ADD_STOCK' | 'DEDUCT_STOCK' | 'SET_STOCK';

    @ApiProperty({ description: 'จำนวนที่ปรับเปลี่ยน (ต้องมากกว่า 0 สำหรับ ADD/DEDUCT, หรือ >= 0 สำหรับ SET_STOCK)' })
    @IsNumber()
    quantity: number;

    @ApiPropertyOptional({ description: 'เหตุผล / หมายเหตุการจัดการสต๊อก' })
    @IsString()
    @IsOptional()
    note?: string;

    @ApiPropertyOptional({ description: 'URL รูปภาพหลักฐานการจัดการสต๊อก (บังคับถ่ายรูปก่อนบันทึก)' })
    @IsString()
    @IsOptional()
    evidenceUrl?: string;
}

export class RedeemRewardDto {
    @ApiProperty({ description: 'ID ของรางวัลที่ต้องการแลก', example: 1 })
    @IsNumber()
    rewardId: number;
}
