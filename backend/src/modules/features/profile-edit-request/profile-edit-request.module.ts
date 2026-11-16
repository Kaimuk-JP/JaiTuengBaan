import { Module } from '@nestjs/common';
import { ProfileEditRequestController } from './profile-edit-request.controller';
import { ProfileEditRequestService } from './profile-edit-request.service';
import { PrismaModule } from '../../../core/prisma/prisma.module';
import { NotificationModule } from '@/modules/system/notification/notification.module';
import { UploadModule } from '../upload/upload.module';

@Module({
    imports: [PrismaModule, NotificationModule, UploadModule],
    controllers: [ProfileEditRequestController],
    providers: [ProfileEditRequestService],
    exports: [ProfileEditRequestService],
})
export class ProfileEditRequestModule { }
