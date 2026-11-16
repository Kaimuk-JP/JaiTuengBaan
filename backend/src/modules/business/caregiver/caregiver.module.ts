import { Module } from '@nestjs/common';
import { CaregiverController } from './caregiver.controller';
import { CaregiverService } from './caregiver.service';
import { PrismaModule } from '../../../core/prisma/prisma.module';
import { NotificationModule } from '@/modules/system/notification/notification.module';

@Module({
    imports: [PrismaModule, NotificationModule],
    controllers: [CaregiverController],
    providers: [CaregiverService],
    exports: [CaregiverService],
})
export class CaregiverModule { }
