import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { CreateBookingTimeSlotDto } from './dto/create-booking-time-slot.dto';
import { UpdateBookingTimeSlotDto } from './dto/update-booking-time-slot.dto';

@Injectable()
export class BookingTimeSlotService {
    constructor(private prisma: PrismaService) {}


    async getActiveSlots(organizationId?: string) {
        if (organizationId) {
            const orgSlots = await this.prisma.bookingTimeSlot.findMany({
                where: {
                    isActive: true,
                    organizationId,
                },
                orderBy: { sortOrder: 'asc' },
            });
            if (orgSlots.length > 0) {
                return orgSlots;
            }
        }

        const globalSlots = await this.prisma.bookingTimeSlot.findMany({
            where: {
                isActive: true,
                organizationId: null,
            },
            orderBy: { sortOrder: 'asc' },
        });
        if (globalSlots.length > 0) {
            return globalSlots;
        }

        return this.prisma.bookingTimeSlot.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
        });
    }


    async getAllSlots(organizationId?: string) {
        if (organizationId) {
            const orgSlots = await this.prisma.bookingTimeSlot.findMany({
                where: { organizationId },
                orderBy: { sortOrder: 'asc' },
            });
            if (orgSlots.length > 0) {
                return orgSlots;
            }
        }

        const globalSlots = await this.prisma.bookingTimeSlot.findMany({
            where: { organizationId: null },
            orderBy: { sortOrder: 'asc' },
        });
        if (globalSlots.length > 0) {
            return globalSlots;
        }

        return this.prisma.bookingTimeSlot.findMany({
            orderBy: { sortOrder: 'asc' },
        });
    }


    async create(dto: CreateBookingTimeSlotDto, organizationId?: string) {
        return this.prisma.bookingTimeSlot.create({
            data: {
                label: dto.label,
                sortOrder: dto.sortOrder ?? 0,
                isActive: dto.isActive ?? true,
                organizationId: organizationId || null,
            },
        });
    }


    async update(id: number, dto: UpdateBookingTimeSlotDto) {
        const slot = await this.prisma.bookingTimeSlot.findUnique({ where: { id } });
        if (!slot) {
            throw new NotFoundException(`ไม่พบช่วงเวลา ID: ${id}`);
        }

        return this.prisma.bookingTimeSlot.update({
            where: { id },
            data: {
                ...(dto.label !== undefined && { label: dto.label }),
                ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
                ...(dto.isActive !== undefined && { isActive: dto.isActive }),
            },
        });
    }


    async remove(id: number) {
        const slot = await this.prisma.bookingTimeSlot.findUnique({ where: { id } });
        if (!slot) {
            throw new NotFoundException(`ไม่พบช่วงเวลา ID: ${id}`);
        }

        return this.prisma.bookingTimeSlot.delete({ where: { id } });
    }


    async seedDefaults(organizationId?: string) {
        const existing = await this.prisma.bookingTimeSlot.count({
            where: organizationId ? { organizationId } : {},
        });

        if (existing > 0) {
            return { message: 'มีข้อมูลช่วงเวลาอยู่แล้ว    ', seeded: false };
        }

        const defaults = [
            { label: 'รอบที่ 1: 04:00 – 06:00 น.', sortOrder: 1 },
            { label: 'รอบที่ 2: 06:00 – 08:00 น.', sortOrder: 2 },
            { label: 'รอบที่ 3: 08:00 – 10:00 น.', sortOrder: 3 },
            { label: 'รอบที่ 4: 10:00 – 12:00 น.', sortOrder: 4 },
            { label: 'รอบที่ 5: 12:00 – 14:00 น.', sortOrder: 5 },
            { label: 'รอบที่ 6: 14:00 – 16:00 น.', sortOrder: 6 },
        ];

        await this.prisma.bookingTimeSlot.createMany({
            data: defaults.map(d => ({
                ...d,
                organizationId: organizationId || null,
            })),
        });

        return { message: 'สร้างช่วงเวลาเริ่มต้นสำเร็จ', seeded: true, count: defaults.length };
    }
}
