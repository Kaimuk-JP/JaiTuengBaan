import { IsOptional, IsString, IsDateString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateQueueDto {
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    hospitalId?: number;

    @IsOptional()
    @IsString()
    hospitalName?: string;

    @IsOptional()
    @IsDateString()
    requestDate?: string;

    @IsOptional()
    @IsString()
    bookingTime?: string;

    @IsOptional()
    @IsString()
    requiredEquipment?: string;

    @IsOptional()
    @IsString()
    adminNote?: string;
}
