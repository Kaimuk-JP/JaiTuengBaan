import { Module, forwardRef } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { PrismaModule } from '../../../core/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { UploadModule } from '../../features/upload/upload.module';

@Module({
    imports: [PrismaModule, forwardRef(() => AuthModule), UploadModule],
    controllers: [UserController],
    providers: [UserService],
    exports: [UserService],
})
export class UserModule { }
