import { Module } from '@nestjs/common';
import { BookingTimeSlotController } from './booking-time-slot.controller';
import { BookingTimeSlotService } from './booking-time-slot.service';
import { PrismaModule } from '../../../core/prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [BookingTimeSlotController],
    providers: [BookingTimeSlotService],
    exports: [BookingTimeSlotService],
})
export class BookingTimeSlotModule {}
