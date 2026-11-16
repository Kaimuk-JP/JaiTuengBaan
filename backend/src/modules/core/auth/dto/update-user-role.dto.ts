import { IsString, IsNotEmpty, IsEnum } from 'class-validator';

export enum UserRole {
  USERS = 'USERS',
  CAREGIVER = 'CAREGIVER',
  DRIVE = 'DRIVE',
  CAREU = 'CAREU',
  STAFF = 'STAFF',
  EXECUTIVE = 'EXECUTIVE',
  ADMIN = 'ADMIN',
}

export class UpdateUserRoleDto {
  @IsString()
  @IsNotEmpty()
  iamUserId: string;

  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;
}


