import {
    IsString,
    IsOptional,
    IsEnum,
    IsNumber,
    IsDateString,
    IsArray,
    MinLength,
    MaxLength,
    Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterElderlyDto {

    @ApiProperty({ description: 'เลขบัตรประชาชน 13 หลัก' })
    @IsString()
    @MinLength(13)
    @MaxLength(13)
    @Matches(/^[0-9]{13}$/, { message: 'เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก' })
    idCard: string;

    @ApiProperty({ description: 'ชื่อ' })
    @IsString()
    @MinLength(1)
    @MaxLength(50)
    firstName: string;

    @ApiProperty({ description: 'นามสกุล' })
    @IsString()
    @MinLength(1)
    @MaxLength(50)
    lastName: string;

    @ApiProperty({ description: 'เพศ', enum: ['male', 'female'] })
    @IsEnum(['male', 'female'])
    gender: 'male' | 'female';

    @ApiProperty({ description: 'เบอร์โทรศัพท์ 10 หลัก' })
    @IsString()
    @MinLength(10)
    @MaxLength(10)
    @Matches(/^[0-9]{10}$/, { message: 'เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก' })
    phone: string;

    @ApiProperty({
        description: 'สถานะการเคลื่อนไหว',
        enum: ['WALKING', 'WHEELCHAIR', 'BEDRIDDEN']
    })
    @IsEnum(['WALKING', 'WHEELCHAIR', 'BEDRIDDEN'])
    mobilityStatus: 'WALKING' | 'WHEELCHAIR' | 'BEDRIDDEN';

    @ApiPropertyOptional({ description: 'ID โรคประจำตัวที่เลือกจากระบบ' })
    @IsOptional()
    @IsArray()
    @IsNumber({}, { each: true })
    diseaseIds?: number[];

    @ApiPropertyOptional({ description: 'โรคประจำตัวที่ระบุเอง (array of names)' })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    customDiseases?: string[];

    @ApiProperty({ description: 'วันเกิด (ISO date string)' })
    @IsDateString()
    birthDate: string;


    @ApiPropertyOptional({ description: 'ละติจูด' })
    @IsOptional()
    @IsNumber()
    lat?: number;

    @ApiPropertyOptional({ description: 'ลองจิจูด' })
    @IsOptional()
    @IsNumber()
    lng?: number;

    @ApiPropertyOptional({ description: 'หมู่บ้าน/ถนน' })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    villageName?: string;

    @ApiPropertyOptional({ description: 'ตำบล' })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    subdistrictName?: string;

    @ApiPropertyOptional({ description: 'อำเภอ' })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    districtName?: string;

    @ApiPropertyOptional({ description: 'จังหวัด' })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    provinceName?: string;

    @ApiPropertyOptional({ description: 'ประเทศ' })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    country?: string;

    @ApiPropertyOptional({ description: 'รายละเอียดที่อยู่เพิ่มเติม' })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    addressDetail?: string;

    @ApiPropertyOptional({ description: 'URL รูปโปรไฟล์' })
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

    @ApiPropertyOptional({ description: 'รหัสเทศบาล (Organization ID)' })
    @IsOptional()
    @IsString()
    organizationId?: string;

    @ApiPropertyOptional({ description: 'ชื่อเทศบาล (Organization Name)' })
    @IsOptional()
    @IsString()
    organizationName?: string;
}
