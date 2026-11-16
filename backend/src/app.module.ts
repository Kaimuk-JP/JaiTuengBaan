import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './core/config';
import { PrismaModule } from './core/prisma/prisma.module';
import { LocationModule } from './modules/integration/location/location.module';
import { UserModule } from './modules/core/user/user.module';
import { QueueModule } from './modules/business/queue/queue.module';
import { AuthModule } from './modules/core/auth/auth.module';
import { JobModule } from './modules/business/job/job.module';
import { SchedulerModule } from './modules/system/scheduler/scheduler.module';
import { UploadModule } from './modules/features/upload/upload.module';
import { NotificationModule } from './modules/system/notification/notification.module';
import { ProfileEditRequestModule } from './modules/features/profile-edit-request/profile-edit-request.module';
import { CaregiverModule } from './modules/business/caregiver/caregiver.module';
import { RewardModule } from './modules/features/reward/reward.module';
import { HospitalModule } from './modules/business/hospital/hospital.module';
import { GeocodeModule } from './modules/integration/geocode/geocode.module';
import { DiseaseModule } from './modules/business/disease/disease.module';
import { SettingsModule } from './modules/system/settings/settings.module';
import { LineMessagingModule } from './modules/integration/line-messaging/line-messaging.module';
import { HistoryModule } from './modules/system/history/history.module';
import { VehicleModule } from './modules/business/vehicle/vehicle.module';
import { EquipmentModule } from './modules/business/equipment/equipment.module';
import { ActivityLogModule } from './modules/system/activity-log/activity-log.module';
import { BookingTimeSlotModule } from './modules/business/booking-time-slot/booking-time-slot.module';
import { ResidenceModule } from './modules/integration/residence/residence.module';
import { RoleRequestModule } from './modules/features/role-request/role-request.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
    imports: [
        ThrottlerModule.forRoot([
            {
                name: 'default',
                ttl: 60_000,
                limit: 5000,
            },
        ]),
        ServeStaticModule.forRoot({
            rootPath: join(process.cwd(), 'uploads'),
            serveRoot: '/uploads',
            serveStaticOptions: {
                index: false,
            },
        }),
        ConfigModule,
        PrismaModule,
        LocationModule,
        UserModule,
        QueueModule,
        AuthModule,
        JobModule,
        SchedulerModule,
        UploadModule,
        NotificationModule,
        ProfileEditRequestModule,
        RoleRequestModule,
        CaregiverModule,
        RewardModule,
        HospitalModule,
        GeocodeModule,
        DiseaseModule,
        SettingsModule,
        LineMessagingModule,
        HistoryModule,
        VehicleModule,
        EquipmentModule,
        ActivityLogModule,
        BookingTimeSlotModule,
        ResidenceModule,
    ],
    controllers: [AppController],
    providers: [
        AppService,
        {
            provide: APP_GUARD,
            useClass: JwtAuthGuard,
        },
        {
            provide: APP_GUARD,
            useClass: RolesGuard,
        },
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
    ],
})
export class AppModule { }
