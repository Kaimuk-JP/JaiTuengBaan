import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum SwitchableRole {
    USERS = 'USERS',
    CAREGIVER = 'CAREGIVER',
}

export class SwitchRoleDto {
    @ApiProperty({
        enum: SwitchableRole,
        description: 'บทบาทที่ต้องการเปลี่ยน (เฉพาะ USERS และ CAREGIVER เท่านั้น)',
        example: 'CAREGIVER',
    })
    @IsEnum(SwitchableRole, { message: 'สามารถเปลี่ยนได้เฉพาะบทบาท USERS และ CAREGIVER เท่านั้น' })
    @IsNotEmpty()
    role: SwitchableRole;
}
