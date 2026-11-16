import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { HistoryService } from './history.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { getStaffOrganizationId } from '../../../common/helpers/org-id.helper';
import { PrismaService } from '../../../core/prisma/prisma.service';

@Controller('history')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HistoryController {
    constructor(
        private readonly historyService: HistoryService,
        private readonly prisma: PrismaService,
    ) { }

    @Get()
    @Roles(Role.STAFF, Role.ADMIN)
    async getHistory(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '20',
        @Query('types') types?: string,
        @Query('statuses') statuses?: string,
        @Query('search') search?: string,
        @Request() req?: any,
    ) {
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const selectedTypes = types ? types.split(',') : ['booking', 'caregiver', 'profile_edit', 'role'];
        const selectedStatuses = statuses ? statuses.split(',') : undefined;
        const searchQuery = search?.trim() || undefined;

        const orgId = await getStaffOrganizationId(req, this.prisma);

        return this.historyService.getHistory(pageNum, limitNum, selectedTypes, selectedStatuses, searchQuery, orgId);
    }
}
