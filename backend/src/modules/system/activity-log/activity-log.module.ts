import { Module, Global } from '@nestjs/common';
import { ActivityLoggerService } from './activity-logger.service';
import { AdminLogsController } from './admin-logs.controller';

@Global()
@Module({
  controllers: [AdminLogsController],
  providers: [ActivityLoggerService],
  exports: [ActivityLoggerService],
})
export class ActivityLogModule { }
