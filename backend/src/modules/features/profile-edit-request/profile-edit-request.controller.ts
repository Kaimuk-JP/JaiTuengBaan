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
    ParseIntPipe,
    ForbiddenException,
} from '@nestjs/common';
import { ProfileEditRequestService } from './profile-edit-request.service';
import { CreateProfileEditRequestDto, ReviewProfileEditRequestDto } from './dto/profile-edit-request.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { getStaffOrganizationId } from '../../../common/helpers/org-id.helper';

@Controller('profile-edit-requests')
@UseGuards(JwtAuthGuard)
export class ProfileEditRequestController {
    constructor(private readonly service: ProfileEditRequestService, private readonly prisma: PrismaService) { }

        @Post()
    async create(@Req() req: any, @Body() dto: CreateProfileEditRequestDto) {
        return this.service.create(req.user.userId, dto);
    }

        @Get()
    @UseGuards(RolesGuard)
    @Roles('STAFF', 'ADMIN')
    async findAll(
        @Req() req: any,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('status') status?: string,
    ) {
        const orgId = await getStaffOrganizationId(req, this.prisma);
        return this.service.findAll({
            page: page ? parseInt(page) : undefined,
            limit: limit ? parseInt(limit) : undefined,
            status,
            organizationId: orgId,
        });
    }

        @Get('user/me')
    async findMyRequests(@Req() req: any) {
        return this.service.findByUserId(req.user.userId);
    }

            @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
        const request = await this.service.findOne(id);

        if (!request) return null;

        const isStaffOrAdmin = ['STAFF', 'ADMIN'].includes(req.user.role);
        if (!isStaffOrAdmin && request.userId !== req.user.userId) {
            throw new ForbiddenException('คุณไม่มีสิทธิ์ดูคำร้องนี้');
        }

        if (req.user.role === 'STAFF') {
            const staffOrgId = await getStaffOrganizationId(req, this.prisma);
            if (request.user?.organizationId !== staffOrgId) {
                throw new ForbiddenException('คุณไม่มีสิทธิ์ดูคำร้องนี้ (คนละเขตเทศบาล)');
            }
        }

        return request;
    }

        @Put(':id/review')
    @UseGuards(RolesGuard)
    @Roles('STAFF', 'ADMIN')
    async review(
        @Param('id', ParseIntPipe) id: number,
        @Req() req: any,
        @Body() dto: ReviewProfileEditRequestDto,
    ) {
        const request = await this.service.findOne(id);
        if (req.user.role === 'STAFF') {
            const staffOrgId = await getStaffOrganizationId(req, this.prisma);
            if (request?.user?.organizationId !== staffOrgId) {
                throw new ForbiddenException('คุณไม่มีสิทธิ์ดำเนินการคำร้องนี้ (คนละเขตเทศบาล)');
            }
        }
        return this.service.review(id, req.user.userId, dto);
    }
}
