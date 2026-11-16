import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class AdminLoginDto {
  @ApiProperty({ description: 'เลขบัตรประชาชน 13 หลัก', example: '1234567890123' })
  @IsString()
  @IsNotEmpty()
  idCard: string;

  @ApiProperty({ description: 'เบอร์โทรศัพท์ 10 หลัก', example: '0812345678' })
  @IsString()
  @IsNotEmpty()
  phone: string;
}
