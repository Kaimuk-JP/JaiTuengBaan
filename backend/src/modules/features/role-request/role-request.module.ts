import { Module } from '@nestjs/common';
import { RoleRequestService } from './role-request.service';
import { RoleRequestController } from './role-request.controller';
import { PrismaModule } from '../../../core/prisma/prisma.module';
import { NotificationModule } from '../../system/notification/notification.module';
import { ActivityLogModule } from '../../system/activity-log/activity-log.module';

@Module({
    imports: [
        PrismaModule,
        NotificationModule,
        ActivityLogModule,
    ],
    controllers: [RoleRequestController],
    providers: [RoleRequestService],
    exports: [RoleRequestService],
})
export class RoleRequestModule { }
