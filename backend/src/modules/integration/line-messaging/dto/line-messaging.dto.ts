import { IsString, IsNumber, IsOptional, IsArray, MaxLength, Min } from 'class-validator';

export class SendMessageDto {
    @IsOptional()
    @IsString()
    iamUserId?: string;

    @IsOptional()
    @IsString()
    userId?: string;

    @IsString()
    @MaxLength(5000)
    message: string;
}

export class SendFlexMessageDto {
    @IsOptional()
    @IsString()
    iamUserId?: string;

    @IsOptional()
    @IsString()
    userId?: string;

    @IsString()
    @MaxLength(200)
    altText: string;

    flexMessage: any;
}

export class BroadcastMessageDto {
    @IsString()
    @MaxLength(5000)
    message: string;
}

export class MulticastMessageDto {
    @IsArray()
    @IsString({ each: true })
    userIds: string[];

    @IsString()
    @MaxLength(5000)
    message: string;
}

export class CreateRichMenuDto {
    size: {
        width: 2500 | 1200;
        height: number;
    };

    @IsOptional()
    selected?: boolean;

    @IsString()
    @MaxLength(100)
    name: string;

    @IsString()
    @MaxLength(14)
    chatBarText: string;

    @IsArray()
    areas: Array<{
        bounds: {
            x: number;
            y: number;
            width: number;
            height: number;
        };
        action: {
            type: 'uri' | 'message' | 'postback' | 'richmenuswitch';
            uri?: string;
            text?: string;
            data?: string;
            label?: string;
            richMenuAliasId?: string;
        };
    }>;
}

export class LinkLineOauthDto {
    @IsString()
    code: string;

    @IsString()
    redirectUri: string;
}

export class LinkLineLiffDto {
    @IsOptional()
    @IsString()
    idToken?: string;

    @IsOptional()
    @IsString()
    lineUserId?: string;

    @IsOptional()
    @IsString()
    displayName?: string;

    @IsOptional()
    @IsString()
    pictureUrl?: string;
}
