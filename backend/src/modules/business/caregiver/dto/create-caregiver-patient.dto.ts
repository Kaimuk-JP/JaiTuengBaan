import { IsEnum, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCaregiverPatientDto {
    @ApiProperty({ description: 'ID ของประชาชน' })
    @IsString()
    patientId: string;

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
