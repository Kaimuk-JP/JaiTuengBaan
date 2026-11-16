import {
    Controller,
    Get,
    Post,
    Put,
    Patch,
    Delete,
    Body,
    Query,
    Param,
    UseGuards,
    Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RewardService } from './reward.service';
import { CreateRewardDto, UpdateRewardDto, RedeemRewardDto, AdjustStockDto } from './dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { getStaffOrganizationId, getUserOrganizationId } from '../../../common/helpers/org-id.helper';

@ApiTags('Rewards')
@ApiBearerAuth('JWT-auth')
@Controller('rewards')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RewardController {
    constructor(private readonly rewardService: RewardService, private readonly prisma: PrismaService) { }


    @Get()
    @Roles('DRIVE', 'CAREU', 'STAFF', 'ADMIN')
    @ApiOperation({ summary: 'ดูรายการรางวัลที่พร้อมแลก', description: 'สำหรับจิตอาสาดูรางวัลที่ active' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'รายการรางวัล' })
    async getActiveRewards(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Request() req?: any,
    ) {
        const orgId = await getUserOrganizationId(req, this.prisma);
        return this.rewardService.getActiveRewards(
            Number(page) || 1,
            Number(limit) || 20,
            orgId,
        );
    }

    @Post('redeem')
    @Roles('DRIVE', 'CAREU', 'STAFF', 'ADMIN')
    @ApiOperation({ summary: 'แลกแต้มเป็นรางวัล', description: 'จิตอาสาแลกแต้มเป็นรางวัล' })
    @ApiResponse({ status: 201, description: 'แลกแต้มสำเร็จ' })
    @ApiResponse({ status: 400, description: 'แต้มไม่พอ/รางวัลหมด' })
    async redeemReward(@Request() req, @Body() dto: RedeemRewardDto) {
        return this.rewardService.redeemReward(req.user.userId, dto);
    }

    @Get('history')
    @Roles('DRIVE', 'CAREU', 'STAFF', 'ADMIN')
    @ApiOperation({ summary: 'ดูประวัติการแลกแต้ม', description: 'จิตอาสาดูประวัติการแลกของตัวเอง' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'ประวัติการแลก' })
    async getRedemptionHistory(
        @Request() req,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.rewardService.getRedemptionHistory(
            req.user.userId,
            Number(page) || 1,
            Number(limit) || 20,
        );
    }


    @Get('all')
    @Roles('STAFF', 'ADMIN')
    @ApiOperation({ summary: 'ดูรางวัลทั้งหมด', description: 'Staff ดูรางวัลทั้งหมด รวมที่ปิดใช้งาน' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'รายการรางวัลทั้งหมด' })
    async getAllRewards(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Request() req?: any,
    ) {
        const orgId = await getUserOrganizationId(req, this.prisma);
        return this.rewardService.getAllRewards(
            Number(page) || 1,
            Number(limit) || 20,
            orgId,
        );
    }

    @Post()
    @Roles('STAFF', 'ADMIN')
    @ApiOperation({ summary: 'สร้างรางวัลใหม่', description: 'Staff สร้างรางวัลใหม่' })
    @ApiResponse({ status: 201, description: 'สร้างรางวัลสำเร็จ' })
    async createReward(@Request() req, @Body() dto: CreateRewardDto) {
        const orgId = await getUserOrganizationId(req, this.prisma);
        return this.rewardService.createReward(dto, req.user.userId, orgId);
    }

    @Patch(':id')
    @Roles('STAFF', 'ADMIN')
    @ApiOperation({ summary: 'แก้ไขรางวัล', description: 'Staff แก้ไขรางวัล' })
    @ApiResponse({ status: 200, description: 'แก้ไขสำเร็จ' })
    async updateReward(@Request() req, @Param('id') id: string, @Body() dto: UpdateRewardDto) {
        const orgId = await getUserOrganizationId(req, this.prisma);
        return this.rewardService.updateReward(parseInt(id), dto, req.user.userId, orgId);
    }

    @Post(':id/adjust-stock')
    @Roles('STAFF', 'ADMIN')
    @ApiOperation({ summary: 'จัดการปรับปรุงสต๊อกของรางวัล (เพิ่ม/ลด/ปรับยอด พร้อมรูปหลักฐาน)' })
    @ApiResponse({ status: 200, description: 'ปรับปรุงสต๊อกสำเร็จ' })
    async adjustStock(
        @Param('id') id: string,
        @Body() dto: AdjustStockDto,
        @Request() req,
    ) {
        const orgId = await getUserOrganizationId(req, this.prisma);
        return this.rewardService.adjustStock(parseInt(id), dto, req.user.userId, orgId);
    }

    @Delete(':id')
    @Roles('STAFF', 'ADMIN')
    @ApiOperation({ summary: 'ลบรางวัล', description: 'Staff ลบรางวัล' })
    @ApiResponse({ status: 200, description: 'ลบสำเร็จ' })
    async deleteReward(@Param('id') id: string, @Request() req) {
        const orgId = await getUserOrganizationId(req, this.prisma);
        return this.rewardService.deleteReward(parseInt(id), orgId);
    }

    @Get('stock-history')
    @Roles('STAFF', 'ADMIN')
    @ApiOperation({ summary: 'ดูประวัติการเพิ่ม/แก้ไขรางวัลทั้งหมด' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'action', required: false, type: String })
    async getAllStockHistory(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('action') action?: string,
        @Request() req?: any,
    ) {
        const orgId = await getUserOrganizationId(req, this.prisma);
        return this.rewardService.getAllStockHistory(
            Number(page) || 1,
            Number(limit) || 50,
            orgId,
            action,
        );
    }

    @Get(':id/history')
    @Roles('STAFF', 'ADMIN')
    @ApiOperation({ summary: 'ดูประวัติการเพิ่ม/แก้ไขรางวัลเฉพาะรายการ' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async getRewardHistory(
        @Param('id') id: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Request() req?: any,
    ) {
        const orgId = await getUserOrganizationId(req, this.prisma);
        return this.rewardService.getStockHistory(
            parseInt(id),
            Number(page) || 1,
            Number(limit) || 20,
            orgId,
        );
    }

    @Get('redemptions')
    @Roles('STAFF', 'ADMIN')
    @ApiOperation({ summary: 'ดูคำขอแลกทั้งหมด', description: 'Staff ดูคำขอแลกของเจ้าหน้าที่รถทั้งหมด' })
    @ApiQuery({ name: 'status', required: false, description: 'PENDING, APPROVED, REJECTED, COMPLETED' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'รายการคำขอแลก' })
    async getAllRedemptions(
        @Request() req: any,
        @Query('status') status?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        const orgId = await getStaffOrganizationId(req, this.prisma);
        return this.rewardService.getAllRedemptions(
            status,
            Number(page) || 1,
            Number(limit) || 20,
            orgId
        );
    }

    @Put('redemptions/:id/approve')
    @Roles('STAFF', 'ADMIN')
    @ApiOperation({ summary: 'อนุมัติคำขอแลก', description: 'Staff อนุมัติการแลกแต้ม' })
    @ApiResponse({ status: 200, description: 'อนุมัติสำเร็จ' })
    async approveRedemption(@Param('id') id: string, @Request() req) {
        const orgId = await getStaffOrganizationId(req, this.prisma);
        return this.rewardService.approveRedemption(parseInt(id), req.user.userId, orgId);
    }

    @Put('redemptions/:id/reject')
    @Roles('STAFF', 'ADMIN')
    @ApiOperation({ summary: 'ปฏิเสธคำขอแลก', description: 'Staff ปฏิเสธการแลกแต้ม พร้อมคืนแต้ม' })
    @ApiResponse({ status: 200, description: 'ปฏิเสธสำเร็จ' })
    async rejectRedemption(
        @Param('id') id: string,
        @Body('reason') reason: string,
        @Request() req,
    ) {
        const orgId = await getStaffOrganizationId(req, this.prisma);
        return this.rewardService.rejectRedemption(parseInt(id), req.user.userId, reason, orgId);
    }

    @Put('redemptions/:id/complete')
    @Roles('STAFF', 'ADMIN')
    @ApiOperation({ summary: 'มอบรางวัลสำเร็จ', description: 'Staff ยืนยันว่ามอบรางวัลให้จิตอาสาแล้ว' })
    @ApiResponse({ status: 200, description: 'ดำเนินการสำเร็จ' })
    async completeRedemption(@Param('id') id: string, @Request() req) {
        const orgId = await getStaffOrganizationId(req, this.prisma);
        return this.rewardService.completeRedemption(parseInt(id), req.user.userId, orgId);
    }
}
