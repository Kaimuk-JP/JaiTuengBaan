import { IsNotEmpty, IsString } from 'class-validator';

export class ExecutiveRejectQueueDto {
  @IsString()
  @IsNotEmpty()
  rejectReason: string;
}
