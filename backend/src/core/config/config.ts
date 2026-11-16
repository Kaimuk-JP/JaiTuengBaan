import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class ConfigService {
    constructor(private configService: NestConfigService) { }

    get databaseUrl(): string {
        return this.configService.get<string>('DATABASE_URL') || '';
    }

    get jwtSecret(): string {
        const secret = this.configService.get<string>('JWT_SECRET');
        if (!secret) {
            throw new Error('JWT_SECRET environment variable is required');
        }
        return secret;
    }

    get jwtExpiresIn(): string {
        return this.configService.get<string>('JWT_EXPIRES_IN') || '30m';
    }



    get lineMessagingChannelId(): string {
        return this.configService.get<string>('LINE_MESSAGING_CHANNEL_ID') || this.configService.get<string>('LINE_CHANNEL_ID') || '';
    }

    get lineMessagingChannelSecret(): string {
        return this.configService.get<string>('LINE_MESSAGING_CHANNEL_SECRET') || this.configService.get<string>('LINE_CHANNEL_SECRET') || '';
    }

    get lineMessagingAccessToken(): string {
        return this.configService.get<string>('LINE_MESSAGING_ACCESS_TOKEN') || '';
    }

    get lineChannelId(): string {
        return this.configService.get<string>('LINE_CHANNEL_ID') || this.configService.get<string>('LINE_MESSAGING_CHANNEL_ID') || '';
    }

    get lineChannelSecret(): string {
        return this.configService.get<string>('LINE_CHANNEL_SECRET') || this.configService.get<string>('LINE_MESSAGING_CHANNEL_SECRET') || '';
    }

    get lineCallbackUrl(): string {
        return this.configService.get<string>('LINE_CALLBACK_URL') || '';
    }

    get port(): number {
        return this.configService.get<number>('PORT') || 3001;
    }

    get nodeEnv(): string {
        return this.configService.get<string>('NODE_ENV') || 'development';
    }

    get frontendUrl(): string {
        return this.configService.get<string>('FRONTEND_URL') || '';
    }

    get iamGovApiUrl(): string {
        return this.configService.get<string>('IAM_GOV_API_URL') || '';
    }

    get eServiceApiKey(): string {
        return this.configService.get<string>('E_SERVICE_API_KEY') || '';
    }

    get eServiceCode(): string {
        return this.configService.get<string>('E_SERVICE_CODE') || '';
    }

    get eServiceMunicipalityId(): string {
        return this.configService.get<string>('E_SERVICE_MUNICIPALITY_ID') || '';
    }

    validateConfig(): void {
        const requiredEnvVars = [
            'DATABASE_URL',
            'JWT_SECRET',
        ];

        const missingEnvVars = requiredEnvVars.filter(
            (envVar) => !this.configService.get<string>(envVar),
        );

        if (missingEnvVars.length > 0) {
            throw new Error(
                `Missing required environment variables: ${missingEnvVars.join(', ')}`,
            );
        }
    }
}
