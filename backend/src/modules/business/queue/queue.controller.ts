import { Body, Controller, Delete, ForbiddenException, Get, NotFoundException, Param, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { QueueService } from './queue.service';
import {
    ApproveQueueDto,
    CreateQueueDto,
    ExecutiveRejectQueueDto,
    GetQueuesQueryDto,
    RejectQueueDto,
    UpdateQueueDto,
} from './dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { getStaffOrganizationId } from '../../../common/helpers/org-id.helper';

@ApiTags('Queues')
@ApiBearerAuth('JWT-auth')
@Controller('queues')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QueueController {
    constructor(
        private readonly queueService: QueueService,
        private readonly prisma: PrismaService,
    ) { }

    private parseQueueId(id: string) {
        return Number.parseInt(id, 10);
    }

    private async ensureStaffOwnsQueue(req: any, queue: { user?: { organizationId?: number | string | null } } | null, message: string) {
        if (!['STAFF', 'EXECUTIVE'].includes(req?.user?.role)) return;
        const staffOrgId = await getStaffOrganizationId(req, this.prisma);
        if (queue?.user?.organizationId != null && String(queue.user.organizationId) !== String(staffOrgId)) {
            throw new ForbiddenException(message);
        }
    }

    private async ensureOwnerOrCaregiver(req: any, queueUserId: string) {
        const isOwner = String(req.user.userId) === String(queueUserId);
        if (isOwner) return true;
        const caregiverPatients = await this.queueService.getCaregiverPatients(req.user.userId);
        return caregiverPatients.some((p) => String(p.patientId) === String(queueUserId) && p.status === 'APPROVED');
    }

    @Get()
    @Roles('STAFF', 'ADMIN')
    @ApiOperation({ summary: 'ดึงรายการคิวทั้งหมด', description: 'เฉพาะ Staff/Admin พร้อม filter และ pagination' })
    @ApiResponse({ status: 200, description: 'รายการคิว' })
    async getAllQueues(@Query() query: GetQueuesQueryDto, @Request() req: any) {
        const orgId = await getStaffOrganizationId(req, this.prisma);
        if (['STAFF', 'EXECUTIVE'].includes(req.user.role) && !orgId) {
            return {
                data: [],
                pagination: { total: 0, page: query.page ?? 1, limit: query.limit ?? 0, totalPages: 1, hasNextPage: false, hasPrevPage: false },
            };
        }
        return this.queueService.getAllQueues({
            status: query.status,
            severityLevel: query.severityLevel,
            startDate: query.startDate,
            endDate: query.endDate,
            page: query.page,
            limit: query.limit,
            organizationId: orgId,
        });
    }

    @Get('pending/review')
    @Roles('STAFF', 'ADMIN')
    @ApiOperation({ summary: 'ดูคิวที่รอตรวจสอบ', description: 'Staff ดูรายการคิวที่รอการตรวจสอบ' })
    @ApiResponse({ status: 200, description: 'รายการคิว' })
    async getPendingQueues(@Request() req: any) {
        const orgId = await getStaffOrganizationId(req, this.prisma);
        if (['STAFF', 'EXECUTIVE'].includes(req.user.role) && !orgId) {
            return { data: [], pagination: { total: 0, page: 1, limit: 0, totalPages: 1 } };
        }
        return this.queueService.getPendingQueues(undefined, undefined, orgId);
    }

    @Get('availability')
    @Roles('USERS', 'CAREGIVER', 'STAFF', 'ADMIN')
    @ApiOperation({ summary: 'ตรวจสอบวันที่ว่างสำหรับจอง', description: 'สำหรับแสดงปฏิทินการจอง' })
    @ApiQuery({ name: 'year', description: 'ปี', example: '2026' })
    @ApiQuery({ name: 'month', description: 'เดือน (1-12)', example: '1' })
    @ApiResponse({ status: 200, description: 'ข้อมูลวันที่ว่าง' })
    async getBookingAvailability(
        @Query('year') year: string,
        @Query('month') month: string,
        @Request() req: any,
    ) {
        const orgId = req.user?.organizationId || undefined;
        return this.queueService.getBookingAvailability(Number(year), Number(month), orgId);
    }

    @Get('user/:userId')
    @Roles('USERS', 'CAREGIVER', 'STAFF', 'ADMIN')
    @ApiOperation({ summary: 'ดึงคิวของผู้ใช้', description: 'ดูได้เฉพาะคิวของตัวเอง หรือ Staff/Admin ดูได้ทั้งหมด' })
    @ApiParam({ name: 'userId', description: 'User ID' })
    @ApiResponse({ status: 200, description: 'รายการคิวของผู้ใช้' })
    @ApiResponse({ status: 403, description: 'ไม่มีสิทธิ์ดูข้อมูลผู้ใช้นี้' })
    async getQueuesByUserId(
        @Param('userId') userId: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('search') search?: string,
        @Request() req?,
    ) {
        const isStaffOrAdmin = ['STAFF', 'EXECUTIVE', 'ADMIN'].includes(req?.user?.role);
        if (!isStaffOrAdmin && req?.user?.userId !== userId) {
            throw new ForbiddenException('คุณไม่มีสิทธิ์ดูข้อมูลผู้ใช้นี้');
        }

        if (['STAFF', 'EXECUTIVE'].includes(req?.user?.role)) {
            const staffOrgId = await getStaffOrganizationId(req, this.prisma);
            const targetOrgId = await this.queueService.getUserOrganizationId(userId);
            if (!targetOrgId) {
                throw new NotFoundException('ไม่พบประชาชน');
            }
            if (targetOrgId !== staffOrgId) {
                throw new ForbiddenException('คุณไม่มีสิทธิ์ดูข้อมูลผู้ใช้นี้');
            }
        }
        return this.queueService.getQueuesByUserId(
            userId,
            page ? Number(page) : undefined,
            limit ? Number(limit) : undefined,
            search,
        );
    }

    @Get('user/:userId/latest')
    @Roles('USERS', 'CAREGIVER', 'STAFF', 'ADMIN')
    @ApiOperation({ summary: 'ดึงคิวล่าสุดของผู้ใช้', description: 'ดูได้เฉพาะคิวของตัวเอง หรือ Staff/Admin' })
    @ApiParam({ name: 'userId', description: 'User ID' })
    @ApiResponse({ status: 200, description: 'คิวล่าสุด' })
    @ApiResponse({ status: 403, description: 'ไม่มีสิทธิ์ดูข้อมูลผู้ใช้นี้' })
    async getLatestQueueByUserId(@Param('userId') userId: string, @Request() req) {
        const isStaffOrAdmin = ['STAFF', 'EXECUTIVE', 'ADMIN'].includes(req?.user?.role);
        if (!isStaffOrAdmin && req?.user?.userId !== userId) {
            throw new ForbiddenException('คุณไม่มีสิทธิ์ดูข้อมูลผู้ใช้นี้');
        }

        if (['STAFF', 'EXECUTIVE'].includes(req?.user?.role)) {
            const staffOrgId = await getStaffOrganizationId(req, this.prisma);
            const targetOrgId = await this.queueService.getUserOrganizationId(userId);
            if (!targetOrgId) {
                throw new NotFoundException('ไม่พบประชาชน');
            }
            if (targetOrgId !== staffOrgId) {
                throw new ForbiddenException('คุณไม่มีสิทธิ์ดูข้อมูลผู้ใช้นี้');
            }
        }
        return this.queueService.getLatestQueueByUserId(userId);
    }

    @Get(':id')
    @Roles('USERS', 'CAREGIVER', 'STAFF', 'ADMIN', 'DRIVE')
    @ApiOperation({ summary: 'ดึงคิวตาม ID' })
    @ApiParam({ name: 'id', description: 'Queue ID' })
    @ApiResponse({ status: 200, description: 'ข้อมูลคิว' })
    @ApiResponse({ status: 403, description: 'ไม่มีสิทธิ์ดูข้อมูลคิวนี้' })
    async getQueueById(@Param('id') id: string, @Request() req) {
        const queueId = this.parseQueueId(id);
        const queue = await this.queueService.getQueueById(queueId);

        if (!queue) {
            return null;
        }

        await this.ensureStaffOwnsQueue(req, queue, 'คุณไม่มีสิทธิ์ดูข้อมูลคิวนี้');
        const isStaffOrAdmin = ['STAFF', 'ADMIN'].includes(req?.user?.role);
        const isOwner = req?.user?.userId === queue.userId;

        let isCaregiver = false;
        if (!isOwner && !isStaffOrAdmin) {
            isCaregiver = await this.ensureOwnerOrCaregiver(req, queue.userId);
        }

        let isAssignedVolunteer = false;
        if (queue.job) {
            isAssignedVolunteer = queue.job.vltId === req.user.userId;
        }

        if (!isStaffOrAdmin && !isOwner && !isCaregiver && !isAssignedVolunteer) {
            throw new ForbiddenException('คุณไม่มีสิทธิ์ดูข้อมูลคิวนี้');
        }

        return queue;
    }

    @Post()
    @Roles('USERS', 'CAREGIVER', 'STAFF', 'ADMIN')
    @ApiOperation({ summary: 'สร้างคิวใหม่', description: 'ประชาชนจองคิวรับ-ส่ง' })
    @ApiResponse({ status: 201, description: 'สร้างคิวสำเร็จ' })
    async createQueue(@Request() req, @Body() createQueueDto: CreateQueueDto) {
        const callerRole = req.user.role;
        const callerId = req.user.userId;

        if (callerRole === 'USERS') {
            createQueueDto.userId = callerId;
        }

        createQueueDto.createdBy = callerId !== createQueueDto.userId ? callerId : undefined;

        return this.queueService.createQueue(createQueueDto);
    }

    @Put(':id')
    @Roles('STAFF', 'ADMIN')
    @ApiOperation({ summary: 'อัพเดทคิว', description: 'เฉพาะ Staff/Admin' })
    @ApiParam({ name: 'id', description: 'Queue ID' })
    @ApiResponse({ status: 200, description: 'อัพเดทสำเร็จ' })
    async updateQueue(
        @Param('id') id: string,
        @Body() updateQueueDto: UpdateQueueDto,
        @Request() req: any,
    ) {
        const queue = await this.queueService.getQueueById(Number(id));
        if (req?.user?.role === 'STAFF') {
            const staffOrgId = await getStaffOrganizationId(req, this.prisma);
            if (queue?.user?.organizationId !== staffOrgId) {
                throw new ForbiddenException('คุณไม่มีสิทธิ์แก้ไขข้อมูลคิวนี้ (คนละเขตเทศบาล)');
            }
        }
        return this.queueService.updateQueue(Number(id), updateQueueDto);
    }

    @Put(':id/approve')
    @Roles('STAFF', 'ADMIN')
    @ApiOperation({ summary: 'อนุมัติคิว', description: 'Staff อนุมัติการจองคิว' })
    @ApiParam({ name: 'id', description: 'Queue ID' })
    @ApiResponse({ status: 200, description: 'อนุมัติสำเร็จ' })
    async approveQueue(
        @Param('id') id: string,
        @Body() approveQueueDto: ApproveQueueDto,
        @Request() req: any,
    ) {
        const queue = await this.queueService.getQueueById(Number(id));
        if (req?.user?.role === 'STAFF') {
            const staffOrgId = await getStaffOrganizationId(req, this.prisma);
            if (queue?.user?.organizationId !== staffOrgId) {
                throw new ForbiddenException('คุณไม่มีสิทธิ์อนุมัติข้อมูลคิวนี้ (คนละเขตเทศบาล)');
            }
        }
        return this.queueService.approveQueue(Number(id), approveQueueDto);
    }

    @Put(':id/reject')
    @Roles('STAFF', 'ADMIN')
    @ApiOperation({ summary: 'ปฏิเสธคิว', description: 'Staff ปฏิเสธการจองคิว' })
    @ApiParam({ name: 'id', description: 'Queue ID' })
    @ApiResponse({ status: 200, description: 'ปฏิเสธสำเร็จ' })
    async rejectQueue(
        @Param('id') id: string,
        @Body() rejectQueueDto: RejectQueueDto,
        @Request() req: any,
    ) {
        const queue = await this.queueService.getQueueById(Number(id));
        if (req?.user?.role === 'STAFF') {
            const staffOrgId = await getStaffOrganizationId(req, this.prisma);
            if (queue?.user?.organizationId !== staffOrgId) {
                throw new ForbiddenException('คุณไม่มีสิทธิ์ปฏิเสธข้อมูลคิวนี้ (คนละเขตเทศบาล)');
            }
        }
        return this.queueService.rejectQueue(Number(id), rejectQueueDto);
    }

    @Put(':id/executive-approve')
    @Roles('EXECUTIVE', 'ADMIN')
    @ApiOperation({ summary: 'ผู้บริหารอนุมัติคิว', description: 'ผู้บริหารอนุมัติคิวหลังเจ้าหน้าที่ตรวจสอบแล้ว' })
    @ApiParam({ name: 'id', description: 'Queue ID' })
    @ApiResponse({ status: 200, description: 'ผู้บริหารอนุมัติสำเร็จ' })
    async approveQueueByExecutive(
        @Param('id') id: string,
        @Request() req: any,
    ) {
        const queue = await this.queueService.getQueueById(Number(id));
        await this.ensureStaffOwnsQueue(req, queue, 'คุณไม่มีสิทธิ์อนุมัติข้อมูลคิวนี้ (คนละเขตเทศบาล)');
        return this.queueService.approveQueueByExecutive(Number(id), req.user.userId);
    }

    @Put(':id/executive-reject')
    @Roles('EXECUTIVE', 'ADMIN')
    @ApiOperation({ summary: 'ผู้บริหารปฏิเสธคิว', description: 'ผู้บริหารปฏิเสธคิวหลังเจ้าหน้าที่ตรวจสอบแล้ว' })
    @ApiParam({ name: 'id', description: 'Queue ID' })
    @ApiResponse({ status: 200, description: 'ผู้บริหารปฏิเสธสำเร็จ' })
    async rejectQueueByExecutive(
        @Param('id') id: string,
        @Body() rejectQueueDto: ExecutiveRejectQueueDto,
        @Request() req: any,
    ) {
        const queue = await this.queueService.getQueueById(Number(id));
        await this.ensureStaffOwnsQueue(req, queue, 'คุณไม่มีสิทธิ์ปฏิเสธข้อมูลคิวนี้ (คนละเขตเทศบาล)');
        return this.queueService.rejectQueueByExecutive(Number(id), {
            executiveId: req.user.userId,
            rejectReason: rejectQueueDto.rejectReason,
        });
    }

    @Put(':id/resubmit-executive')
    @Roles('STAFF', 'ADMIN')
    @ApiOperation({ summary: 'ส่งคิวกลับผู้บริหาร', description: 'เจ้าหน้าที่แก้ไขแล้วส่งคิวกลับให้ผู้บริหารอนุมัติอีกครั้ง' })
    @ApiParam({ name: 'id', description: 'Queue ID' })
    @ApiResponse({ status: 200, description: 'ส่งกลับผู้บริหารสำเร็จ' })
    async resubmitQueueToExecutive(
        @Param('id') id: string,
        @Request() req: any,
    ) {
        const queue = await this.queueService.getQueueById(Number(id));
        if (req?.user?.role === 'STAFF') {
            const staffOrgId = await getStaffOrganizationId(req, this.prisma);
            if (queue?.user?.organizationId !== staffOrgId) {
                throw new ForbiddenException('คุณไม่มีสิทธิ์ดำเนินการกับคิวนี้ (คนละเขตเทศบาล)');
            }
        }
        return this.queueService.resubmitQueueToExecutive(Number(id), req.user.userId);
    }

    @Put(':id/confirm')
    @Roles('USERS', 'CAREGIVER', 'ADMIN')
    @ApiOperation({ summary: 'ยืนยันคิว', description: 'ประชาชนหรือผู้ดูแลประชาชนยืนยันนัดหมาย' })
    @ApiParam({ name: 'id', description: 'Queue ID' })
    @ApiResponse({ status: 200, description: 'ยืนยันสำเร็จ' })
    @ApiResponse({ status: 403, description: 'ไม่มีสิทธิ์ยืนยันคิวนี้' })
    @ApiResponse({ status: 400, description: 'คิวนี้ถูกยืนยันแล้ว' })
    async confirmQueue(@Param('id') id: string, @Request() req) {
        const queue = await this.queueService.getQueueById(Number(id));
        if (!queue) {
            throw new ForbiddenException('ไม่พบคิวที่ระบุ');
        }

        if (queue.status === 'CONFIRMED') {
            return { message: 'คิวนี้ได้รับการยืนยันแล้ว', queue };
        }

        const isOwner = queue.userId === req.user.userId;

        let isCaregiver = false;
        if (!isOwner) {
            const caregiverPatients = await this.queueService.getCaregiverPatients(req.user.userId);
            isCaregiver = caregiverPatients.some(p => p.patientId === queue.userId && p.status === 'APPROVED');
        }

        if (queue.createdBy && queue.createdBy !== queue.userId) {
            if (isOwner) {
                throw new ForbiddenException('คิวนี้จองโดยผู้ดูแล ผู้ดูแลเท่านั้นที่สามารถยืนยันการแก้ไขข้อมูลได้');
            }
            if (!isCaregiver && req.user.userId !== queue.createdBy) {
                throw new ForbiddenException('คุณไม่มีสิทธิ์ยืนยันคิวนี้');
            }
        } else {
            if (!isOwner && !isCaregiver) {
                throw new ForbiddenException('คุณไม่มีสิทธิ์ยืนยันคิวนี้');
            }
        }

        return this.queueService.confirmQueue(Number(id));
    }

    @Delete(':id')
    @Roles('USERS', 'CAREGIVER', 'STAFF', 'ADMIN')
    @ApiOperation({ summary: 'ยกเลิกคิว', description: 'ประชาชนหรือเจ้าหน้าที่ยกเลิกคิว' })
    @ApiParam({ name: 'id', description: 'Queue ID' })
    @ApiResponse({ status: 200, description: 'ยกเลิกสำเร็จ' })
    @ApiResponse({ status: 403, description: 'ไม่มีสิทธิ์ยกเลิกคิวนี้' })
    @ApiResponse({ status: 404, description: 'ไม่พบคิว' })
    async cancelQueue(@Param('id') id: string, @Request() req) {
        const queue = await this.queueService.getQueueById(Number(id));
        if (!queue) {
            throw new NotFoundException('ไม่พบคิวที่ระบุ');
        }

        const isStaffOrAdmin = ['STAFF', 'ADMIN'].includes(req?.user?.role);
        const isOwner = queue.userId === req.user.userId;

        let isCaregiver = false;
        if (!isOwner && !isStaffOrAdmin) {
            const caregiverPatients = await this.queueService.getCaregiverPatients(req.user.userId);
            isCaregiver = caregiverPatients.some(p => p.patientId === queue.userId && p.status === 'APPROVED');
        }

        if (req?.user?.role === 'STAFF') {
            const staffOrgId = await getStaffOrganizationId(req, this.prisma);
            if (queue.user?.organizationId !== staffOrgId) {
                throw new ForbiddenException('คุณไม่มีสิทธิ์ยกเลิกคิวนี้ (คนละเขตเทศบาล)');
            }
        }

        if (!isStaffOrAdmin && !isOwner && !isCaregiver) {
            throw new ForbiddenException('คุณไม่มีสิทธิ์ยกเลิกคิวนี้');
        }

        return this.queueService.cancelQueue(Number(id), req.user.userId, req.user.role);
    }
}
