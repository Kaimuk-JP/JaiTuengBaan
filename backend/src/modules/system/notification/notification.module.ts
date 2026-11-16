import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { NotificationGateway } from './notification.gateway';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { PrismaModule } from '../../../core/prisma/prisma.module';
import { LineMessagingModule } from '@/modules/integration/line-messaging/line-messaging.module';
import { AppointmentReminderService } from './appointment-reminder.service';
import { ConfigModule, ConfigService } from '../../../core/config';

@Module({
    imports: [
        PrismaModule,
        LineMessagingModule,
        ConfigModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.jwtSecret,
            }),
        }),
    ],
    controllers: [NotificationController],
    providers: [NotificationGateway, NotificationService, AppointmentReminderService],
    exports: [NotificationService, NotificationGateway],
})
export class NotificationModule { }
