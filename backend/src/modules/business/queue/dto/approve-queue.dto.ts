import { IsNumber, IsString, IsOptional, IsNotEmpty, Min } from 'class-validator';

export class ApproveQueueDto {
  @IsString()
  @IsNotEmpty()
  staffId: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  requiredVolunteers?: number;

  @IsString()
  @IsOptional()
  adminNote?: string;
}

