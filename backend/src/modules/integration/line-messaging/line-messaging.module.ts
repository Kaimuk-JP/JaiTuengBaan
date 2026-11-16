import { Module } from '@nestjs/common';
import { LineMessagingService } from './line-messaging.service';
import { LineMessagingController } from './line-messaging.controller';
import { PrismaModule } from '../../../core/prisma/prisma.module';
import { ConfigModule } from '../../../core/config/config.module';

@Module({
    imports: [PrismaModule, ConfigModule],
    controllers: [LineMessagingController],
    providers: [LineMessagingService],
    exports: [LineMessagingService],
})
export class LineMessagingModule { }
