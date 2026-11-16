import {
    Controller,
    Get,
    Post,
    Put,
    Body,
    Param,
    Query,
    UseGuards,
    Req,
    ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RoleRequestService } from './role-request.service';
import { CreateRoleRequestDto, ReviewRoleRequestDto } from './dto/role-request.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { getStaffOrganizationId } from '../../../common/helpers/org-id.helper';
import { RoleRequestStatus } from '@prisma/client';

@ApiTags('Role Requests')
@Controller('role-requests')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class RoleRequestController {
    constructor(
        private readonly service: RoleRequestService,
        private readonly prisma: PrismaService,
    ) { }

    @Post()
    @ApiOperation({ summary: 'ยื่นคำขอสลับ/เพิ่มบทบาทใหม่', description: 'ผู้ใช้ยื่นขอสิทธิ์เป็นคนขับรถ, แคร์ยู, ผู้ดูแล ฯลฯ' })
    @ApiResponse({ status: 201, description: 'ยื่นคำขอสำเร็จ' })
    async create(@Req() req: any, @Body() dto: CreateRoleRequestDto) {
        return this.service.create(req.user.userId, dto);
    }

    @Get('my')
    @ApiOperation({ summary: 'ดูประวัติคำขอสลับ/เพิ่มบทบาทของตนเอง' })
    @ApiResponse({ status: 200, description: 'รายการคำขอของฉัน' })
    async findMyRequests(@Req() req: any) {
        return this.service.findMyRequests(req.user.userId);
    }

    @Get()
    @UseGuards(RolesGuard)
    @Roles('STAFF', 'ADMIN')
    @ApiOperation({ summary: 'รายการคำขอสลับ/เพิ่มบทบาททั้งหมด (Staff/Admin)' })
    @ApiResponse({ status: 200, description: 'รายการคำขอทั้งหมด' })
    async findAll(
        @Req() req: any,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('status') status?: string,
        @Query('role') role?: string,
        @Query('search') search?: string,
    ) {
        const orgId = await getStaffOrganizationId(req, this.prisma);
        return this.service.findAll({
            page: page ? parseInt(page) : undefined,
            limit: limit ? parseInt(limit) : undefined,
            status,
            role,
            organizationId: orgId,
            search,
        });
    }

    @Get(':id')
    @ApiOperation({ summary: 'ดูรายละเอียดคำขอตาม ID' })
    @ApiResponse({ status: 200, description: 'ข้อมูลรายละเอียดคำขอ' })
    async findOne(@Param('id') id: string, @Req() req: any) {
        const request = await this.service.findOne(id);

        const isStaffOrAdmin = ['STAFF', 'ADMIN'].includes(req.user.role);
        if (!isStaffOrAdmin && request.userId !== req.user.userId) {
            throw new ForbiddenException('คุณไม่มีสิทธิ์ดูคำร้องนี้');
        }

        if (req.user.role === 'STAFF') {
            const staffOrgId = await getStaffOrganizationId(req, this.prisma);
            if (request.user?.organizationId && staffOrgId && request.user.organizationId !== staffOrgId) {
                throw new ForbiddenException('คุณไม่มีสิทธิ์ดูคำร้องนี้ (คนละเขตเทศบาล)');
            }
        }

        return request;
    }

    @Put(':id/review')
    @UseGuards(RolesGuard)
    @Roles('STAFF', 'ADMIN')
    @ApiOperation({ summary: 'อนุมัติหรือปฏิเสธคำขอ (Staff/Admin)' })
    @ApiResponse({ status: 200, description: 'ผลการดำเนินการ' })
    async review(
        @Param('id') id: string,
        @Req() req: any,
        @Body() dto: ReviewRoleRequestDto,
    ) {
        const request = await this.service.findOne(id);
        if (req.user.role === 'STAFF') {
            const staffOrgId = await getStaffOrganizationId(req, this.prisma);
            if (request?.user?.organizationId && staffOrgId && request.user.organizationId !== staffOrgId) {
                throw new ForbiddenException('คุณไม่มีสิทธิ์ดำเนินการคำร้องนี้ (คนละเขตเทศบาล)');
            }
        }
        return this.service.review(id, req.user.userId, dto);
    }

    @Post(':id/approve')
    @UseGuards(RolesGuard)
    @Roles('STAFF', 'ADMIN')
    @ApiOperation({ summary: 'อนุมัติคำขอ (Staff/Admin)' })
    async approve(
        @Param('id') id: string,
        @Req() req: any,
        @Body() body?: { note?: string },
    ) {
        return this.review(id, req, {
            status: RoleRequestStatus.APPROVED,
            note: body?.note,
        });
    }

    @Post(':id/reject')
    @UseGuards(RolesGuard)
    @Roles('STAFF', 'ADMIN')
    @ApiOperation({ summary: 'ปฏิเสธคำขอ (Staff/Admin)' })
    async reject(
        @Param('id') id: string,
        @Req() req: any,
        @Body() body: { rejectReason: string; note?: string },
    ) {
        return this.review(id, req, {
            status: RoleRequestStatus.REJECTED,
            rejectReason: body.rejectReason,
            note: body?.note,
        });
    }
}
