import {
    IsString,
    IsOptional,
    IsEnum,
    IsInt,
    IsDateString,
    MinLength,
    MaxLength,
    Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StaffRegisterCaregiverDto {

    @ApiProperty({ description: 'ID ของผู้ดูแลประชาชนที่จะเพิ่มประชาชนให้' })
    @IsString()
    patientId: string;


    @ApiProperty({ description: 'เลขบัตรประชาชน 13 หลักของผู้ดูแลประชาชน' })
    @IsString()
    @MinLength(13)
    @MaxLength(13)
    @Matches(/^[0-9]{13}$/, { message: 'เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก' })
    idCard: string;

    @ApiProperty({ description: 'ชื่อผู้ดูแลประชาชน' })
    @IsString()
    @MinLength(1)
    @MaxLength(50)
    firstName: string;

    @ApiProperty({ description: 'นามสกุลผู้ดูแลประชาชน' })
    @IsString()
    @MinLength(1)
    @MaxLength(50)
    lastName: string;

    @ApiProperty({ description: 'เพศผู้ดูแลประชาชน', enum: ['male', 'female'] })
    @IsEnum(['male', 'female'])
    gender: 'male' | 'female';

    @ApiProperty({ description: 'เบอร์โทรศัพท์ผู้ดูแลประชาชน 10 หลัก' })
    @IsString()
    @MinLength(10)
    @MaxLength(10)
    @Matches(/^[0-9]{10}$/, { message: 'เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก' })
    phone: string;

    @ApiPropertyOptional({ description: 'วันเกิดผู้ดูแลประชาชน (ISO date string)' })
    @IsOptional()
    @IsDateString()
    birthDate?: string;

    @ApiPropertyOptional({ description: 'URL รูปโปรไฟล์ผู้ดูแลประชาชน' })
    @IsOptional()
    @IsString()
    pictureUrl?: string;


    @ApiProperty({
        description: 'ความสัมพันธ์กับประชาชน',
        enum: ['FAMILY', 'RELATIVE', 'CLOSE_PERSON']
    })
    @IsEnum(['FAMILY', 'RELATIVE', 'CLOSE_PERSON'])
    relationship: 'FAMILY' | 'RELATIVE' | 'CLOSE_PERSON';

    @ApiPropertyOptional({ description: 'รายละเอียดเพิ่มเติม' })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    additionalDetails?: string;

    @ApiPropertyOptional({ description: 'URL หลักฐานยืนยันความสัมพันธ์' })
    @IsOptional()
    @IsString()
    documentUrl?: string;
}
