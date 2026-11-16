import { Controller, Get, Query, Param, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { ActivityLoggerService } from './activity-logger.service';

import { PrismaService } from '../../../core/prisma/prisma.service';
import { getStaffOrganizationId } from '../../../common/helpers/org-id.helper';

@ApiTags('Admin Logs')
@ApiBearerAuth('JWT-auth')
@Controller('admin/logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminLogsController {
  constructor(
    private readonly activityLogger: ActivityLoggerService,
    private readonly prisma: PrismaService,
  ) { }

  @Get()
  @ApiOperation({ summary: 'ดึงรายการ Activity Logs', description: 'สำหรับ Admin ดูประวัติกิจกรรมระบบ' })
  @ApiQuery({ name: 'category', required: false, enum: ['AUTH', 'QUEUE', 'JOB', 'CAREGIVER', 'USER', 'VEHICLE', 'REWARD', 'SETTING'] })
  @ApiQuery({ name: 'action', required: false, description: 'กรองตาม action' })
  @ApiQuery({ name: 'userId', required: false, description: 'กรองตามผู้ใช้' })
  @ApiQuery({ name: 'success', required: false, description: 'กรองตามสถานะสำเร็จ/ไม่สำเร็จ' })
  @ApiQuery({ name: 'startDate', required: false, description: 'วันที่เริ่มต้น (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'วันที่สิ้นสุด (ISO format)' })
  @ApiQuery({ name: 'search', required: false, description: 'ค้นหาจาก note, entityId, IP' })
  @ApiQuery({ name: 'page', required: false, description: 'หน้า', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'จำนวนต่อหน้า', example: 20 })
  @ApiResponse({ status: 200, description: 'รายการ logs' })
  async getLogs(
    @Query('category') category?: string,
    @Query('action') action?: string,
    @Query('userId') userId?: string,
    @Query('success') success?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Request() req?: any,
  ) {
    const orgId = await getStaffOrganizationId(req, this.prisma);
    return this.activityLogger.getLogs({
      category: category as any,
      action,
      userId,
      success: success === 'true' ? true : success === 'false' ? false : undefined,
      startDate,
      endDate,
      search,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      organizationId: orgId,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'ดึงรายละเอียด log เดียว', description: 'สำหรับดู before/after data' })
  @ApiParam({ name: 'id', description: 'Log ID', example: 1 })
  @ApiResponse({ status: 200, description: 'รายละเอียด log' })
  @ApiResponse({ status: 404, description: 'ไม่พบ log' })
  async getLogById(@Param('id') id: string) {
    const logId = parseInt(id);
    if (isNaN(logId)) {
      throw new BadRequestException('ID ไม่ถูกต้อง');
    }
    return this.activityLogger.getLogById(logId);
  }
}
