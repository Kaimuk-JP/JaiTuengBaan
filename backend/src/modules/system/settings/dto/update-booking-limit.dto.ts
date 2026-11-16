import { IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateBookingLimitDto {
    @ApiProperty({ description: 'จำนวนจองสูงสุดต่อวัน', example: 10 })
    @IsInt({ message: 'limit ต้องเป็นจำนวนเต็ม' })
    @Min(1, { message: 'limit ต้องมีค่าอย่างน้อย 1' })
    @Max(1000, { message: 'limit ต้องไม่เกิน 1000' })
    limit: number;
}
