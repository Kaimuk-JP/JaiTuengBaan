import { Module } from '@nestjs/common';
import { JobController } from './job.controller';
import { JobService } from './job.service';
import { JobQueryService } from './job-query.service';
import { JobAssignmentService } from './job-assignment.service';
import { JobLifecycleService } from './job-lifecycle.service';
import { JobReportService } from './job-report.service';
import { PrismaModule } from '../../../core/prisma/prisma.module';
import { NotificationModule } from '@/modules/system/notification/notification.module';
import { PointsModule } from '@/modules/features/points/points.module';

@Module({
    imports: [PrismaModule, NotificationModule, PointsModule],
    controllers: [JobController],
    providers: [
        JobService,
        JobQueryService,
        JobAssignmentService,
        JobLifecycleService,
        JobReportService,
    ],
    exports: [JobService],
})
export class JobModule { }
