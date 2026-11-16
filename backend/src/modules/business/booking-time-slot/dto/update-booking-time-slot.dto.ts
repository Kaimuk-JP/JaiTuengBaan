import { PartialType } from '@nestjs/swagger';
import { CreateBookingTimeSlotDto } from './create-booking-time-slot.dto';

export class UpdateBookingTimeSlotDto extends PartialType(CreateBookingTimeSlotDto) {}
