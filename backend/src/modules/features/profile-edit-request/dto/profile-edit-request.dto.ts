import { IsNotEmpty, IsOptional, IsString, IsEnum } from 'class-validator';

export class CreateProfileEditRequestDto {
    @IsNotEmpty()
    requestedChanges: Record<string, any>;

    @IsOptional()
    @IsString()
    newPictureUrl?: string;
}

export class ReviewProfileEditRequestDto {
    @IsNotEmpty()
    @IsEnum(['approve', 'reject'])
    action: 'approve' | 'reject';

    @IsOptional()
    @IsString()
    rejectReason?: string;
}
