import { Module } from '@nestjs/common';
import { QueueController } from './queue.controller';
import { QueueService } from './queue.service';
import { PrismaModule } from '../../../core/prisma/prisma.module';
import { NotificationModule } from '@/modules/system/notification/notification.module';
import { SettingsModule } from '@/modules/system/settings/settings.module';

@Module({
    imports: [PrismaModule, NotificationModule, SettingsModule],
    controllers: [QueueController],
    providers: [QueueService],
    exports: [QueueService],
})
export class QueueModule { }

