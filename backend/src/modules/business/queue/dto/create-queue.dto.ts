import { IsNumber, IsString, IsOptional, IsBoolean, IsEnum, IsNotEmpty } from 'class-validator';

export enum SeverityLevel {
  GREEN = 'GREEN',
  YELLOW = 'YELLOW',
  RED = 'RED',
}

export class CreateQueueDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsOptional()
  createdBy?: string;

  @IsNumber()
  @IsNotEmpty()
  hospitalId: number;

  @IsString()
  @IsNotEmpty()
  requestDate: string;

  @IsString()
  @IsOptional()
  bookingTime?: string;

  @IsBoolean()
  @IsOptional()
  hasAppointment?: boolean;

  @IsString()
  @IsOptional()
  appointmentImage?: string;

  @IsString()
  @IsOptional()
  requiredEquipment?: string;

  @IsEnum(SeverityLevel)
  @IsOptional()
  severityLevel?: SeverityLevel;

  @IsBoolean()
  @IsOptional()
  wantCareU?: boolean;
}

