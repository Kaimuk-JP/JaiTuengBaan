import { Module } from '@nestjs/common';
import { RewardController } from './reward.controller';
import { RewardService } from './reward.service';
import { PrismaModule } from '../../../core/prisma/prisma.module';
import { NotificationModule } from '@/modules/system/notification/notification.module';

@Module({
    imports: [PrismaModule, NotificationModule],
    controllers: [RewardController],
    providers: [RewardService],
    exports: [RewardService],
})
export class RewardModule { }
