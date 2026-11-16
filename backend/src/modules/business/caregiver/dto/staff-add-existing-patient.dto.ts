import {
    IsString,
    IsOptional,
    IsEnum,
    MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StaffAddExistingPatientDto {
    @ApiProperty({ description: 'ID ของผู้ดูแลประชาชน' })
    @IsString()
    caregiverId: string;

    @ApiProperty({ description: 'ID ของประชาชน' })
    @IsString()
    patientId: string;

    @ApiProperty({
        description: 'ความสัมพันธ์',
        enum: ['FAMILY', 'RELATIVE', 'CLOSE_PERSON']
    })
    @IsEnum(['FAMILY', 'RELATIVE', 'CLOSE_PERSON'])
    relationship: 'FAMILY' | 'RELATIVE' | 'CLOSE_PERSON';

    @ApiPropertyOptional({ description: 'รายละเอียดเพิ่มเติม' })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    additionalDetails?: string;
}
