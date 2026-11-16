import { IsEnum, IsNotEmpty, IsOptional, IsString, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role, RoleRequestStatus } from '@prisma/client';

export class CreateRoleRequestDto {
    @ApiProperty({
        enum: Role,
        description: 'บทบาทที่ต้องการขอสิทธิ์ เช่น DRIVE, CAREU, CAREGIVER, STAFF',
        example: 'DRIVE',
    })
    @IsEnum(Role)
    @IsNotEmpty()
    requestedRole: Role;

    @ApiPropertyOptional({
        description: 'เหตุผลหรือข้อมูลเพิ่มเติมในการขอสิทธิ์',
        example: 'มีใบขับขี่และต้องการเข้าร่วมเป็นจิตอาสาขับรถ',
    })
    @IsOptional()
    @IsString()
    reason?: string;

    @ApiPropertyOptional({
        description: 'รายการ URL เอกสารแนบ เช่น รูปถ่ายใบขับขี่ หรือเอกสารรับรอง',
        type: [String],
        example: ['/uploads/license.jpg'],
    })
    @IsOptional()
    @IsArray()
    documents?: string[];

    @ApiPropertyOptional({
        description: 'หมายเหตุเพิ่มเติม',
    })
    @IsOptional()
    @IsString()
    note?: string;
}

export class ReviewRoleRequestDto {
    @ApiProperty({
        enum: RoleRequestStatus,
        description: 'ผลการตรวจสอบ (APPROVED หรือ REJECTED)',
        example: 'APPROVED',
    })
    @IsEnum(RoleRequestStatus)
    @IsNotEmpty()
    status: RoleRequestStatus;

    @ApiPropertyOptional({
        description: 'เหตุผลกรณีปฏิเสธ',
        example: 'เอกสารไม่ชัดเจน กรุณาอัปโหลดรูปใบขับขี่ใหม่',
    })
    @IsOptional()
    @IsString()
    rejectReason?: string;

    @ApiPropertyOptional({
        description: 'หมายเหตุของเจ้าหน้าที่',
    })
    @IsOptional()
    @IsString()
    note?: string;
}
