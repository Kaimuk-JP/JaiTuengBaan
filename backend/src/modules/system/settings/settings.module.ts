import { Module } from '@nestjs/common';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { PrismaModule } from '../../../core/prisma/prisma.module';
import { ConfigModule } from '../../../core/config/config.module';

@Module({
    imports: [PrismaModule, ConfigModule],
    controllers: [SettingsController],
    providers: [SettingsService],
    exports: [SettingsService],
})
export class SettingsModule { }
