import { IsString, IsNotEmpty } from 'class-validator';

export class RejectQueueDto {
  @IsString()
  @IsNotEmpty()
  staffId: string;

  @IsString()
  @IsNotEmpty()
  rejectReason: string;
}

