import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConfirmHomeDeliveryDto {
  @ApiProperty({ description: 'URL รูปภาพหลักฐานการส่งกลับ', example: '/uploads/return-evidence/photo.jpg' })
  @IsString()
  @IsNotEmpty()
  returnEvidenceUrl: string;
}
