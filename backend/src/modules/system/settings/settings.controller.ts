import { Controller, Get, Put, Delete, Body, Param, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UpdateBookingLimitDto } from './dto/update-booking-limit.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadedFile, UseInterceptors, Request, Post } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { getStaffOrganizationId } from '../../../common/helpers/org-id.helper';
import * as fs from 'fs';

@ApiTags('Settings')
@Controller('settings')
export class SettingsController {
    constructor(
        private readonly settingsService: SettingsService,
        private readonly prisma: PrismaService
    ) { }

    private async resolveOrgId(req: any): Promise<string> {
        let orgId = req.user.organizationId;
        if (!orgId) {
            const user = await this.prisma.user.findUnique({
                where: { id: req.user.userId },
                select: { organizationId: true }
            });
            orgId = user?.organizationId;
        }
        if (!orgId) {
            const firstOrg = await this.prisma.organization.findFirst({ select: { id: true } });
            if (firstOrg) return firstOrg.id;
            throw new BadRequestException('ไม่พบข้อมูลหน่วยงานสำหรับผู้ใช้นี้');
        }
        return orgId;
    }

    @Get('daily-booking-limit')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'ดึงค่าจำนวนจองสูงสุดต่อวัน (default)' })
    @ApiResponse({ status: 200, description: 'ค่า limit ปัจจุบัน' })
    async getDailyBookingLimit() {
        const limit = await this.settingsService.getDailyBookingLimit();
        return { dailyBookingLimit: limit };
    }

    @Put('daily-booking-limit')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('STAFF', 'ADMIN')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'ตั้งค่าจำนวนจองสูงสุดต่อวัน default (เฉพาะ Staff/Admin)' })
    @ApiResponse({ status: 200, description: 'บันทึกสำเร็จ' })
    async setDailyBookingLimit(@Body() body: UpdateBookingLimitDto) {
        await this.settingsService.setDailyBookingLimit(body.limit);
        return { success: true, dailyBookingLimit: body.limit };
    }

    @Get('date-limits')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('STAFF', 'ADMIN')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'ดึง limit รายวันทั้งหมด' })
    @ApiResponse({ status: 200, description: 'รายการ limit รายวัน' })
    async getDateSpecificLimits() {
        const limits = await this.settingsService.getAllDateSpecificLimits();
        const defaultLimit = await this.settingsService.getDailyBookingLimit();
        return { dateLimits: limits, defaultLimit };
    }

    @Put('date-limit/:date')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('STAFF', 'ADMIN')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'ตั้ง limit สำหรับวันที่เฉพาะ (เฉพาะ Staff/Admin)' })
    @ApiResponse({ status: 200, description: 'บันทึกสำเร็จ' })
    async setDateSpecificLimit(
        @Param('date') date: string,
        @Body() body: UpdateBookingLimitDto,
    ) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            throw new BadRequestException('รูปแบบวันที่ไม่ถูกต้อง (ใช้ YYYY-MM-DD)');
        }
        await this.settingsService.setDateSpecificLimit(date, body.limit);
        return { success: true, date, limit: body.limit };
    }

    @Delete('date-limit/:date')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('STAFF', 'ADMIN')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'ลบ limit รายวัน (ใช้ค่า default แทน)' })
    @ApiResponse({ status: 200, description: 'ลบสำเร็จ' })
    async deleteDateSpecificLimit(@Param('date') date: string) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            throw new BadRequestException('รูปแบบวันที่ไม่ถูกต้อง (ใช้ YYYY-MM-DD)');
        }
        await this.settingsService.deleteDateSpecificLimit(date);
        return { success: true, date };
    }

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('STAFF', 'ADMIN')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'ดึงค่าตั้งค่าทั้งหมด (เฉพาะ Staff/Admin)' })
    @ApiResponse({ status: 200, description: 'รายการ settings ทั้งหมด' })
    async getAllSettings() {
        return this.settingsService.getAllSettings();
    }

    @Get('executive-approval-enabled')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('STAFF', 'ADMIN', 'EXECUTIVE')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'ดึงสถานะเปิด/ปิดระบบผู้อนุมัติของหน่วยงาน' })
    async getExecutiveApprovalEnabled(@Request() req: any) {
        const orgId = await this.resolveOrgId(req);
        const enabled = await this.settingsService.getExecutiveApprovalEnabled(orgId);
        return { executiveApprovalEnabled: enabled };
    }

    @Put('executive-approval-enabled')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('STAFF', 'ADMIN')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'เปิด/ปิดระบบผู้อนุมัติของหน่วยงาน' })
    async setExecutiveApprovalEnabled(
        @Request() req: any,
        @Body() body: { enabled: boolean },
    ) {
        const orgId = await this.resolveOrgId(req);
        if (typeof body?.enabled !== 'boolean') {
            throw new BadRequestException('กรุณาระบุ enabled เป็น true หรือ false');
        }
        await this.settingsService.setExecutiveApprovalEnabled(orgId, body.enabled);
        return { success: true, executiveApprovalEnabled: body.enabled };
    }

    @Get('line-notification-enabled')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'ดึงสถานะเปิด/ปิดระบบแจ้งเตือนผ่าน LINE ของหน่วยงาน' })
    async getLineNotificationEnabled(@Request() req: any) {
        const orgId = await this.resolveOrgId(req);
        const enabled = await this.settingsService.getLineNotificationEnabled(orgId);
        return { lineNotificationEnabled: enabled };
    }

    @Put('line-notification-enabled')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('STAFF', 'ADMIN')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'เปิด/ปิดระบบแจ้งเตือนผ่าน LINE ของหน่วยงาน (เฉพาะ Staff/Admin)' })
    async setLineNotificationEnabled(
        @Request() req: any,
        @Body() body: { enabled: boolean; applyToAll?: boolean },
    ) {
        const orgId = await this.resolveOrgId(req);
        if (typeof body?.enabled !== 'boolean') {
            throw new BadRequestException('กรุณาระบุ enabled เป็น true หรือ false');
        }
        const applyToAll = req.user.role === 'ADMIN' && body.applyToAll === true;
        await this.settingsService.setLineNotificationEnabled(orgId, body.enabled, applyToAll);
        return { success: true, lineNotificationEnabled: body.enabled, appliedToAll: applyToAll };
    }

    @Get('organization/line-oa')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('STAFF', 'ADMIN')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'ดึงการตั้งค่า LINE Official Account ของหน่วยงาน' })
    async getOrganizationLineOa(@Request() req: any) {
        const orgId = await this.resolveOrgId(req);
        return this.settingsService.getOrganizationLineOa(orgId);
    }

    @Put('organization/line-oa')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('STAFF', 'ADMIN')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'อัปเดตการตั้งค่า LINE Official Account ของหน่วยงาน' })
    async updateOrganizationLineOa(
        @Request() req: any,
        @Body() body: {
            lineUseCustomOa: boolean;
            lineChannelId?: string;
            lineChannelSecret?: string;
            lineChannelAccessToken?: string;
            lineLiffId?: string;
            lineBotBasicId?: string;
        },
    ) {
        const orgId = await this.resolveOrgId(req);
        if (typeof body?.lineUseCustomOa !== 'boolean') {
            throw new BadRequestException('กรุณาระบุ lineUseCustomOa เป็น true หรือ false');
        }
        return this.settingsService.updateOrganizationLineOa(orgId, body);
    }

    @Post('organization/line-oa/test')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('STAFF', 'ADMIN')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'ทดสอบ Channel Access Token ของ LINE OA หน่วยงาน' })
    async testOrganizationLineOa(
        @Request() req: any,
        @Body() body: { accessToken?: string },
    ) {
        const orgId = await this.resolveOrgId(req);
        return this.settingsService.testLineBotToken(body?.accessToken, orgId);
    }

    @Get('lock-return-office')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('STAFF', 'ADMIN', 'EXECUTIVE', 'DRIVE')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'ดึงการตั้งค่าล็อคปุ่มนำรถกลับถึงเทศบาล (200ม.)' })
    async getLockReturnOffice(@Request() req: any) {
        const orgId = await this.resolveOrgId(req);
        return this.settingsService.getLockReturnOfficeSettings(orgId);
    }

    @Put('lock-return-office')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('STAFF', 'ADMIN')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'ตั้งค่าเปิด/ปิด และรัศมี ล็อคปุ่มนำรถกลับถึงเทศบาล' })
    async setLockReturnOffice(
        @Request() req: any,
        @Body() body: { enabled: boolean; radiusMeters?: number; applyToAll?: boolean },
    ) {
        const orgId = await this.resolveOrgId(req);
        if (typeof body?.enabled !== 'boolean') {
            throw new BadRequestException('กรุณาระบุ enabled เป็น true หรือ false');
        }
        const applyToAll = req.user.role === 'ADMIN' || body.applyToAll === true;
        await this.settingsService.setLockReturnOfficeSettings(orgId, body.enabled, body.radiusMeters, applyToAll);
        return { success: true, lockReturnOfficeEnabled: body.enabled, returnOfficeRadiusMeters: body.radiusMeters ?? 200, appliedToAll: applyToAll };
    }

    @Get('queue-cancellation')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('STAFF', 'ADMIN', 'EXECUTIVE', 'USERS', 'CAREGIVER')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'ดึงการตั้งค่าการยกเลิกคิว (อนุญาตยกเลิก / กำหนดเวลาล่วงหน้า)' })
    async getQueueCancellation(@Request() req: any) {
        const orgId = await this.resolveOrgId(req);
        return this.settingsService.getQueueCancellationSettings(orgId);
    }

    @Put('queue-cancellation')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('STAFF', 'ADMIN')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'ตั้งค่าเปิด/ปิด และกำหนดยกเลิกล่วงหน้า (วัน / ชั่วโมง)' })
    async setQueueCancellation(
        @Request() req: any,
        @Body() body: {
            allowUserCancelQueue: boolean;
            cancelQueueUnit?: string;
            cancelQueueValue?: number;
            minCancelHoursBefore?: number;
            applyToAll?: boolean;
        },
    ) {
        const orgId = await this.resolveOrgId(req);
        if (typeof body?.allowUserCancelQueue !== 'boolean') {
            throw new BadRequestException('กรุณาระบุ allowUserCancelQueue เป็น true หรือ false');
        }
        const applyToAll = req.user.role === 'ADMIN' && body.applyToAll === true;
        await this.settingsService.setQueueCancellationSettings(
            orgId,
            body.allowUserCancelQueue,
            {
                cancelQueueUnit: body.cancelQueueUnit,
                cancelQueueValue: body.cancelQueueValue,
                minCancelHoursBefore: body.minCancelHoursBefore,
            },
            applyToAll,
        );
        const unit = body.cancelQueueUnit || 'DAYS';
        const val = body.cancelQueueValue ?? (body.minCancelHoursBefore ? Math.round(body.minCancelHoursBefore / 24) : 1);
        return {
            success: true,
            allowUserCancelQueue: body.allowUserCancelQueue,
            cancelQueueUnit: unit,
            cancelQueueValue: val,
            minCancelHoursBefore: body.minCancelHoursBefore ?? (unit === 'HOURS' ? val : val * 24),
            appliedToAll: applyToAll,
        };
    }

    @Get('volunteer-cancellation')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('STAFF', 'ADMIN', 'EXECUTIVE', 'DRIVE', 'CAREU')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'ดึงการตั้งค่าการยกเลิกงานของจิตอาสา/คนขับ/แคร์ยู' })
    async getVolunteerCancellation(@Request() req: any) {
        const orgId = await this.resolveOrgId(req);
        return this.settingsService.getVolunteerCancellationSettings(orgId);
    }

    @Put('volunteer-cancellation')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('STAFF', 'ADMIN')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'ตั้งค่าเปิด/ปิด และกำหนดยกเลิกงานล่วงหน้าของจิตอาสา/คนขับ/แคร์ยู (วัน / ชั่วโมง)' })
    async setVolunteerCancellation(
        @Request() req: any,
        @Body() body: {
            allowVolunteerCancelJob: boolean;
            volunteerCancelUnit?: string;
            volunteerCancelValue?: number;
            minVolunteerCancelHoursBefore?: number;
            applyToAll?: boolean;
        },
    ) {
        const orgId = await this.resolveOrgId(req);
        if (typeof body?.allowVolunteerCancelJob !== 'boolean') {
            throw new BadRequestException('กรุณาระบุ allowVolunteerCancelJob เป็น true หรือ false');
        }
        const applyToAll = req.user.role === 'ADMIN' && body.applyToAll === true;
        await this.settingsService.setVolunteerCancellationSettings(
            orgId,
            body.allowVolunteerCancelJob,
            {
                volunteerCancelUnit: body.volunteerCancelUnit,
                volunteerCancelValue: body.volunteerCancelValue,
                minVolunteerCancelHoursBefore: body.minVolunteerCancelHoursBefore,
            },
            applyToAll,
        );
        const unit = body.volunteerCancelUnit || 'DAYS';
        const val = body.volunteerCancelValue ?? (body.minVolunteerCancelHoursBefore ? Math.round(body.minVolunteerCancelHoursBefore / 24) : 1);
        return {
            success: true,
            allowVolunteerCancelJob: body.allowVolunteerCancelJob,
            volunteerCancelUnit: unit,
            volunteerCancelValue: val,
            minVolunteerCancelHoursBefore: body.minVolunteerCancelHoursBefore ?? (unit === 'HOURS' ? val : val * 24),
            appliedToAll: applyToAll,
        };
    }

    @Get('advance-booking')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('STAFF', 'ADMIN', 'EXECUTIVE', 'USERS', 'CAREGIVER')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'ดึงการตั้งค่าการจองคิวล่วงหน้า (เปิด/ปิด และกำหนดเวลาล่วงหน้า)' })
    async getAdvanceBooking(@Request() req: any) {
        const orgId = await this.resolveOrgId(req);
        return this.settingsService.getAdvanceBookingSettings(orgId);
    }

    @Put('advance-booking')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('STAFF', 'ADMIN')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'ตั้งค่าเปิด/ปิด และกำหนดเวลาจองล่วงหน้า (วัน / ชั่วโมง)' })
    async setAdvanceBooking(
        @Request() req: any,
        @Body() body: {
            advanceBookingLimitEnabled: boolean;
            advanceBookingUnit?: string;
            advanceBookingValue?: number;
            minAdvanceBookingDays?: number;
            applyToAll?: boolean;
        },
    ) {
        const orgId = await this.resolveOrgId(req);
        if (typeof body?.advanceBookingLimitEnabled !== 'boolean') {
            throw new BadRequestException('กรุณาระบุ advanceBookingLimitEnabled เป็น true หรือ false');
        }
        const applyToAll = req.user.role === 'ADMIN' && body.applyToAll === true;
        await this.settingsService.setAdvanceBookingSettings(
            orgId,
            body.advanceBookingLimitEnabled,
            {
                advanceBookingUnit: body.advanceBookingUnit,
                advanceBookingValue: body.advanceBookingValue,
                minAdvanceBookingDays: body.minAdvanceBookingDays,
            },
            applyToAll,
        );
        return {
            success: true,
            advanceBookingLimitEnabled: body.advanceBookingLimitEnabled,
            advanceBookingUnit: body.advanceBookingUnit || 'DAYS',
            advanceBookingValue: body.advanceBookingValue ?? body.minAdvanceBookingDays ?? 1,
            appliedToAll: applyToAll,
        };
    }

    @Get('organization')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('STAFF', 'ADMIN')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'ดึงข้อมูลองค์กรของ Staff ปัจจุบัน' })
    @ApiResponse({ status: 200, description: 'ข้อมูลองค์กรรวมถึง logoUrl' })
    async getMyOrganization(@Request() req: any) {
        const orgId = await this.resolveOrgId(req);
        return this.settingsService.getOrganization(orgId);
    }

    @Get('organization/phone')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'ดึงเบอร์โทรหน่วยงาน (สำหรับทุก role)' })
    @ApiResponse({ status: 200, description: 'เบอร์โทรหน่วยงาน' })
    async getOrganizationPhone(@Request() req: any) {
        const user = await this.prisma.user.findUnique({
            where: { id: req.user.userId },
            select: { organizationId: true }
        });
        if (!user?.organizationId) {
            return { phone: null, name: null };
        }
        const org = await this.settingsService.getOrganization(user.organizationId);
        return { phone: org.phone || null, name: org.name || null };
    }

    @Post('organization/logo')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('STAFF', 'ADMIN')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'อัปโหลดภาพโลโก้เทศบาล' })
    @UseInterceptors(
        FileInterceptor('logo', {
            storage: diskStorage({
                destination: (req, file, cb) => {
                    const uploadPath = './uploads/logoorganization';
                    if (!fs.existsSync(uploadPath)) {
                        fs.mkdirSync(uploadPath, { recursive: true });
                    }
                    cb(null, uploadPath);
                },
                filename: (req, file, cb) => {
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                    const ext = extname(file.originalname);
                    cb(null, `logo-${uniqueSuffix}${ext}`);
                },
            }),
            limits: { fileSize: 10 * 1024 * 1024 },
            fileFilter: (req, file, cb) => {
                if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
                    return cb(new BadRequestException('อนุญาตเฉพาะไฟล์ภาพ (jpg, jpeg, png, webp) เท่านั้น'), false);
                }
                cb(null, true);
            },
        }),
    )
    async uploadOrganizationLogo(
        @Request() req: any,
        @UploadedFile() file: any,
    ) {
        if (!file) {
            throw new BadRequestException('ไม่พบไฟล์รูปภาพ');
        }

        const orgId = await this.resolveOrgId(req);

        const ext = extname(file.originalname);
        const newFilename = `logo-${orgId}${ext}`;
        const tempPath = '.' + `/uploads/logoorganization/${file.filename}`;
        const finalPath = '.' + `/uploads/logoorganization/${newFilename}`;

        if (fs.existsSync(tempPath)) {
            if (fs.existsSync(finalPath)) {
                fs.unlinkSync(finalPath);
            }
            fs.renameSync(tempPath, finalPath);
        }

        const logoUrl = `/uploads/logoorganization/${newFilename}`;

        const oldOrg = await this.settingsService.getOrganization(orgId);

        const updated = await this.settingsService.updateOrganizationLogo(orgId, logoUrl);

        if (oldOrg && oldOrg.logoUrl && oldOrg.logoUrl !== logoUrl) {
            try {
                const oldFilePath = '.' + oldOrg.logoUrl;
                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath);
                }
            } catch (err) {
                console.error('Failed to delete old organization logo:', err);
            }
        }

        return { success: true, organization: updated };
    }

    @Put('organization')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('STAFF', 'ADMIN')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'อัปเดตข้อมูลองค์กรของ Staff ปัจจุบัน (พิกัด ฯลฯ)' })
    @ApiResponse({ status: 200, description: 'อัปเดตข้อมูลองค์กรสำเร็จ' })
    async updateMyOrganization(@Request() req: any, @Body() updateData: { lat: number; lng: number; phone?: string }) {
        const orgId = await this.resolveOrgId(req);

        if (updateData.lat === null || updateData.lat === undefined || updateData.lng === null || updateData.lng === undefined) {
            throw new BadRequestException('ละติจูดหรือลองจิจูดไม่ถูกต้อง');
        }

        const lat = typeof updateData.lat === 'string' ? parseFloat(updateData.lat) : updateData.lat;
        const lng = typeof updateData.lng === 'string' ? parseFloat(updateData.lng) : updateData.lng;

        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            throw new BadRequestException('ละติจูดหรือลองจิจูดไม่ถูกต้อง');
        }

        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            throw new BadRequestException('ละติจูดหรือลองจิจูดไม่ถูกต้อง');
        }

        const updated = await this.settingsService.updateOrganizationData(orgId, { lat, lng, phone: updateData.phone });
        return { success: true, organization: updated };
    }
}
