import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { LocationGateway } from './location.gateway';
import { ConfigModule, ConfigService } from '../../../core/config';

@Module({
    imports: [
        ConfigModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.jwtSecret,
            }),
        }),
    ],
    providers: [LocationGateway],
})
export class LocationModule { }
