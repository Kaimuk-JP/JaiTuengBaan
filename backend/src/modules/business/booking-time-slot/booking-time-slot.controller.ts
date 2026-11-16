import {
    Controller, Get, Post, Put, Delete,
    Body, Param, Query, ParseIntPipe, Request, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BookingTimeSlotService } from './booking-time-slot.service';
import { CreateBookingTimeSlotDto } from './dto/create-booking-time-slot.dto';
import { UpdateBookingTimeSlotDto } from './dto/update-booking-time-slot.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { getUserOrganizationId, getStaffOrganizationId } from '../../../common/helpers/org-id.helper';

@ApiTags('Booking Time Slots')
@Controller('booking-time-slots')
export class BookingTimeSlotController {
    constructor(
        private readonly service: BookingTimeSlotService,
        private readonly prisma: PrismaService,
    ) {}

    @Get()
    @Public()
    @ApiOperation({ summary: 'ดึงช่วงเวลาจองที่เปิดใช้งาน (Public — ไม่ต้อง login)' })
    @ApiResponse({ status: 200, description: 'รายการช่วงเวลาที่ active' })
    async getActiveSlots(@Query('organizationId') organizationId?: string) {
        return this.service.getActiveSlots(organizationId);
    }

    @Get('all')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('STAFF', 'ADMIN')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'ดึงช่วงเวลาทั้งหมด รวม inactive (เฉพาะ Staff/Admin)' })
    @ApiResponse({ status: 200, description: 'รายการช่วงเวลาทั้งหมด' })
    async getAllSlots(@Request() req: any) {
        const orgId = await getStaffOrganizationId(req, this.prisma);
        return this.service.getAllSlots(orgId);
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('STAFF', 'ADMIN')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'เพิ่มช่วงเวลาจองใหม่ (เฉพาะ Staff/Admin)' })
    @ApiResponse({ status: 201, description: 'สร้างสำเร็จ' })
    async create(@Request() req: any, @Body() dto: CreateBookingTimeSlotDto) {
        const orgId = await getStaffOrganizationId(req, this.prisma);
        return this.service.create(dto, orgId);
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('STAFF', 'ADMIN')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'แก้ไขช่วงเวลาจอง (เฉพาะ Staff/Admin)' })
    @ApiResponse({ status: 200, description: 'แก้ไขสำเร็จ' })
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateBookingTimeSlotDto,
    ) {
        return this.service.update(id, dto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('STAFF', 'ADMIN')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'ลบช่วงเวลาจอง (เฉพาะ Staff/Admin)' })
    @ApiResponse({ status: 200, description: 'ลบสำเร็จ' })
    async remove(@Param('id', ParseIntPipe) id: number) {
        return this.service.remove(id);
    }

    @Post('seed-defaults')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('STAFF', 'ADMIN')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'สร้างช่วงเวลาเริ่มต้น 6 รอบ (ใช้ครั้งแรก)' })
    @ApiResponse({ status: 201, description: 'สร้างรอบเริ่มต้นสำเร็จ' })
    async seedDefaults(@Request() req: any) {
        const orgId = await getStaffOrganizationId(req, this.prisma);
        return this.service.seedDefaults(orgId);
    }
}
