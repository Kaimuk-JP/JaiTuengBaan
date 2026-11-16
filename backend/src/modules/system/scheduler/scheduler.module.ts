import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { PrismaModule } from '../../../core/prisma/prisma.module';
import { NotificationModule } from '@/modules/system/notification/notification.module';

@Module({
    imports: [PrismaModule, NotificationModule],
    providers: [SchedulerService],
    exports: [SchedulerService],
})
export class SchedulerModule { }
