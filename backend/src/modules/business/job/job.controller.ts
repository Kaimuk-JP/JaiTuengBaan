import { Body, Controller, ForbiddenException, Get, NotFoundException, Param, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { JobService } from './job.service';
import {
    AcceptJobDto,
    AssignJobDto,
    GetJobsQueryDto,
    RateJobDto,
    RateMunicipalDto,
    RejectJobDto,
    UpdateJobStatusDto,
    ConfirmHomeDeliveryDto,
} from './dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { getStaffOrganizationId } from '../../../common/helpers/org-id.helper';

@ApiTags('Jobs')
@ApiBearerAuth('JWT-auth')
@Controller('jobs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class JobController {
    constructor(
        private readonly jobService: JobService,
        private readonly prisma: PrismaService,
    ) { }

    private parseJobId(id: string) {
        return Number.parseInt(id, 10);
    }

    private async ensureStaffOwnsJob(req: any, jobId: number, message: string) {
        if (!['STAFF', 'EXECUTIVE'].includes(req.user.role)) return;
        const staffOrgId = await getStaffOrganizationId(req, this.prisma);
        const job = await this.jobService.getJobById(jobId);
        if (job && job.queue?.user?.organizationId !== staffOrgId) {
            throw new ForbiddenException(message);
        }
    }

    private ensureVolunteerOwnsJob(req: any, job: any, message: string) {
        if (req.user.role !== 'DRIVE' && req.user.role !== 'CAREU') return;
        if (job && job.vlt?.id !== req.user.userId && job.careu?.id !== req.user.userId) {
            throw new ForbiddenException(message);
        }
    }

    @Get('my-pending-ratings')
    @SkipThrottle()
    @Roles('USERS', 'CAREGIVER', 'ADMIN')
    @ApiOperation({
        summary: 'ดึงงานที่ยังไม่ได้ประเมิน',
        description: 'ดึงรายการงานที่เสร็จแล้วแต่ยังไม่ได้ให้คะแนนจิตอาสา หรือยังไม่ได้ประเมินเทศบาล',
    })
    @ApiResponse({ status: 200, description: 'รายการงานที่ยังไม่ได้ประเมิน' })
    async getMyPendingRatings(@Request() req: any) {
        return this.jobService.getMyPendingRatings(req.user.userId);
    }

    @Get()
    @Roles('STAFF', 'ADMIN')
    @ApiOperation({
        summary: 'ดึงรายการงานทั้งหมด',
        description: 'ดึงรายการงานพร้อม filter ตาม status, vltId, queueId, userId และ pagination',
    })
    @ApiResponse({ status: 200, description: 'รายการงานพร้อม pagination info' })
    async getAllJobs(@Query() query: GetJobsQueryDto, @Request() req: any) {
        const orgId = await getStaffOrganizationId(req, this.prisma);
        return this.jobService.getAllJobs({
            status: query.status,
            vltId: query.vltId,
            queueId: query.queueId,
            userId: query.userId,
            page: query.page,
            limit: query.limit || 30,
            organizationId: orgId,
        });
    }

    @Get('disbursement-report')
    @Roles('STAFF', 'ADMIN')
    @ApiOperation({
        summary: 'รายงานการทำรายเดือน',
        description: 'ดึงรายงานสรุปยอดเบิกจ่ายกองทุน แยกตามจิตอาสา พร้อมรายละเอียดแต่ละเคส',
    })
    @ApiResponse({ status: 200, description: 'รายงานการทำรายเดือน' })
    async getDisbursementReport(
        @Query('month') month: string,
        @Query('volunteerId') volunteerId: string,
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
        @Request() req: any,
    ) {
        if (!startDate || !endDate) {
            if (!month || !/^\d{4}-\d{2}$/.test(month)) {
                const now = new Date();
                month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            }
        }
        const orgId = await getStaffOrganizationId(req, this.prisma);
        return this.jobService.getDisbursementReport(month || '', orgId || undefined, volunteerId || undefined, startDate, endDate);
    }

    @Get('ratings-report')
    @Roles('STAFF', 'ADMIN')
    @ApiOperation({
        summary: 'รายงานคะแนนประเมิน',
        description: 'ดึงรายงานสรุปคะแนนประเมินจิตอาสา (คนขับ, แคร์ยู) และเทศบาล',
    })
    @ApiResponse({ status: 200, description: 'รายงานคะแนนประเมิน' })
    async getRatingsReport(
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
        @Request() req: any,
    ) {
        const orgId = await getStaffOrganizationId(req, this.prisma);
        return this.jobService.getRatingsReport(orgId || undefined, startDate, endDate);
    }

    @Get('assigned-to/:vltId')
    @SkipThrottle()
    @Roles('STAFF', 'ADMIN', 'DRIVE', 'CAREU')
    @ApiOperation({
        summary: 'ดึงงานที่มอบหมายให้จิตอาสา',
        description: 'แสดงรายการงานทั้งหมดที่มอบหมายให้จิตอาสาคนนี้',
    })
    @ApiParam({ name: 'vltId', description: 'Volunteer ID', example: 5 })
    @ApiResponse({ status: 200, description: 'รายการงานของจิตอาสา' })
    async getJobsAssignedToVolunteer(
        @Param('vltId') vltId: string,
        @Query('status') status?: string,
        @Query('date') date?: string
    ) {
        const statusFilter = status ? status.split(',') : undefined;
        return this.jobService.getJobsAssignedToVolunteer(vltId, statusFilter, date);
    }

    @Get('history-dates/:vltId')
    @Roles('STAFF', 'ADMIN', 'DRIVE', 'CAREU')
    @ApiOperation({
        summary: 'ดึงวันที่ที่มีประวัติการทำงาน',
        description: 'ดึงรายการวันที่ที่มีงานสถานะ COMPLETED ของจิตอาสา',
    })
    @ApiParam({ name: 'vltId', description: 'Volunteer ID', example: 5 })
    @ApiResponse({ status: 200, description: 'รายการวันที่' })
    async getVolunteerHistoryDates(
        @Param('vltId') vltId: string,
        @Query('role') role?: 'DRIVE' | 'CAREU',
    ) {
        return this.jobService.getVolunteerHistoryDates(vltId, role);
    }

    @Get('resource-availability')
    @Roles('STAFF', 'ADMIN')
    @ApiOperation({
        summary: 'ตรวจสอบความว่างของ resource',
        description: 'ดึงรายการรถ/คนขับ/แคร์ยูที่ไม่ว่างในวัน+รอบเวลาที่ระบุ',
    })
    @ApiResponse({ status: 200, description: 'รายการ resource ที่ไม่ว่าง' })
    async getResourceAvailability(
        @Request() req: any,
        @Query('date') date: string,
        @Query('bookingTime') bookingTime: string,
        @Query('hospitalId') hospitalId?: string,
        @Query('excludeJobId') excludeJobId?: string,
    ) {
        const orgId = await getStaffOrganizationId(req, this.prisma);
        return this.jobService.getBusyResources(
            date,
            bookingTime,
            orgId,
            hospitalId ? parseInt(hospitalId, 10) : undefined,
            excludeJobId ? parseInt(excludeJobId, 10) : undefined,
        );
    }

    @Get(':id/location-trail')
    @Roles('STAFF', 'EXECUTIVE', 'ADMIN')
    @ApiOperation({
        summary: 'ดึงประวัติตำแหน่งคนขับ',
        description: 'แสดง trail GPS ของงานสำหรับดูเส้นทางย้อนหลัง',
    })
    @ApiParam({ name: 'id', description: 'Job ID' })
    async getJobLocationTrail(@Param('id') id: string, @Request() req: any) {
        const jobId = this.parseJobId(id);
        await this.ensureStaffOwnsJob(req, jobId, 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลงานนี้ (อยู่คนละเทศบาล)');
        return this.jobService.getJobLocationTrail(jobId);
    }

    @Get(':id')
    @Roles('STAFF', 'ADMIN', 'DRIVE', 'CAREU', 'USERS', 'CAREGIVER')
    @ApiOperation({
        summary: 'ดึงข้อมูลงานตาม ID',
        description: 'แสดงรายละเอียดงานเดี่ยว รวมถึงข้อมูล Queue และ Volunteer',
    })
    @ApiParam({ name: 'id', description: 'Job ID', example: 1 })
    @ApiResponse({ status: 200, description: 'ข้อมูลงาน' })
    @ApiResponse({ status: 404, description: 'ไม่พบงาน' })
    async getJobById(@Param('id') id: string, @Request() req: any) {
        const jobId = this.parseJobId(id);
        const job = await this.jobService.getJobById(jobId);
        if (!job) {
            throw new NotFoundException('ไม่พบงาน');
        }

        await this.ensureStaffOwnsJob(req, jobId, 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลงานนี้ (อยู่คนละเทศบาล)');
        return job;
    }

    @Post(':id/assign')
    @SkipThrottle()
    @Roles('STAFF', 'ADMIN')
    @ApiOperation({ summary: 'มอบหมายงานให้จิตอาสา', description: 'Staff มอบหมายงานให้จิตอาสา' })
    @ApiParam({ name: 'id', description: 'Job ID' })
    @ApiResponse({ status: 200, description: 'มอบหมายสำเร็จ' })
    async assignJobToVolunteer(
        @Param('id') id: string,
        @Body() assignJobDto: AssignJobDto,
        @Request() req: any,
    ) {
        const jobId = this.parseJobId(id);
        await this.ensureStaffOwnsJob(req, jobId, 'คุณไม่มีสิทธิ์มอบหมายงานนี้ (อยู่คนละเทศบาล)');

        return this.jobService.assignJobToVolunteer(
            jobId,
            assignJobDto.vltId,
            req.user.userId,
            assignJobDto.vehicleId,
            assignJobDto.careuId,
        );
    }

    @Put(':id/reassign')
    @SkipThrottle()
    @Roles('STAFF', 'ADMIN')
    @ApiOperation({ summary: 'แก้ไขการมอบหมายงาน', description: 'Staff เปลี่ยนรถ/คนขับ/บัดดี้สำหรับงานที่มอบหมายไปแล้ว (ASSIGNED/ACCEPTED)' })
    @ApiParam({ name: 'id', description: 'Job ID' })
    @ApiResponse({ status: 200, description: 'แก้ไขสำเร็จ' })
    async reassignJob(
        @Param('id') id: string,
        @Body() assignJobDto: AssignJobDto,
        @Request() req: any,
    ) {
        const jobId = this.parseJobId(id);
        await this.ensureStaffOwnsJob(req, jobId, 'คุณไม่มีสิทธิ์แก้ไขงานนี้ (อยู่คนละเทศบาล)');

        return this.jobService.reassignJob(
            jobId,
            assignJobDto.vltId,
            req.user.userId,
            assignJobDto.vehicleId,
            assignJobDto.careuId,
        );
    }

    @Put(':id/accept-by-volunteer')
    @Roles('DRIVE', 'CAREU', 'ADMIN')
    @ApiOperation({ summary: 'จิตอาสายอมรับงาน', description: 'จิตอาสายืนยันรับงานที่ได้รับมอบหมาย' })
    @ApiParam({ name: 'id', description: 'Job ID' })
    @ApiResponse({ status: 200, description: 'ยอมรับงานสำเร็จ' })
    async acceptJobByVolunteer(
        @Param('id') id: string,
        @Body() acceptJobDto: AcceptJobDto,
        @Request() req,
    ) {
        const jobId = this.parseJobId(id);
        const job = await this.jobService.getJobById(jobId);
        this.ensureVolunteerOwnsJob(req, job, 'คุณไม่มีสิทธิ์ยอมรับงานนี้');

        return this.jobService.acceptJobByVolunteer(
            jobId,
            acceptJobDto.vltId,
            acceptJobDto.lat,
            acceptJobDto.lng,
        );
    }

    @Put(':id/reject-by-volunteer')
    @Roles('DRIVE', 'CAREU', 'ADMIN')
    @ApiOperation({ summary: 'จิตอาสาปฏิเสธงาน', description: 'จิตอาสาปฏิเสธงานที่ได้รับมอบหมาย' })
    @ApiParam({ name: 'id', description: 'Job ID' })
    @ApiResponse({ status: 200, description: 'ปฏิเสธงานสำเร็จ' })
    async rejectJobByVolunteer(
        @Param('id') id: string,
        @Body() rejectJobDto: RejectJobDto,
        @Request() req,
    ) {
        const jobId = this.parseJobId(id);
        const job = await this.jobService.getJobById(jobId);
        this.ensureVolunteerOwnsJob(req, job, 'คุณไม่มีสิทธิ์ปฏิเสธงานนี้');

        return this.jobService.rejectJobByVolunteer(
            jobId,
            rejectJobDto.vltId,
            rejectJobDto.reason,
        );
    }

    @Put(':id/update-status')
    @Roles('DRIVE', 'ADMIN')
    @ApiOperation({ summary: 'อัพเดทสถานะงาน', description: 'เจ้าหน้าที่ขับรถอัพเดทสถานะงาน (Start, Picked Up, Completed)' })
    @ApiParam({ name: 'id', description: 'Job ID' })
    @ApiResponse({ status: 200, description: 'อัพเดทสถานะสำเร็จ' })
    async updateJobStatus(
        @Param('id') id: string,
        @Body() updateJobStatusDto: UpdateJobStatusDto,
        @Request() req,
    ) {
        const jobId = this.parseJobId(id);
        const job = await this.jobService.getJobById(jobId);
        this.ensureVolunteerOwnsJob(req, job, 'คุณไม่มีสิทธิ์อัพเดทสถานะงานนี้');

        return this.jobService.updateJobStatus(
            jobId,
            updateJobStatusDto.status,
            updateJobStatusDto.vltId,
            { lat: updateJobStatusDto.lat, lng: updateJobStatusDto.lng },
            updateJobStatusDto.returnEvidenceUrl,
        );
    }

    @Post(':id/request-return-pickup')
    @Roles('USERS', 'CAREGIVER', 'ADMIN')
    @ApiOperation({ summary: 'เรียกรถกลับ', description: 'ประชาชนกดเรียกรถกลับจากโรงพยาบาล' })
    @ApiParam({ name: 'id', description: 'Job ID' })
    @ApiResponse({ status: 200, description: 'เรียกรถกลับสำเร็จ' })
    async requestReturnPickup(@Param('id') id: string, @Request() req: any) {
        const jobId = this.parseJobId(id);
        return this.jobService.requestReturnPickup(jobId, req.user.userId);
    }

    @Put(':id/confirm-home-delivery')
    @Roles('DRIVE', 'ADMIN')
    @ApiOperation({ summary: 'ยืนยันส่งถึงบ้าน', description: 'คนขับรถถ่ายรูปหลักฐานยืนยันการส่งถึงบ้าน' })
    @ApiParam({ name: 'id', description: 'Job ID' })
    @ApiResponse({ status: 200, description: 'ยืนยันส่งถึงบ้านสำเร็จ' })
    async confirmHomeDelivery(
        @Param('id') id: string,
        @Body() dto: ConfirmHomeDeliveryDto,
        @Request() req: any,
    ) {
        const jobId = this.parseJobId(id);
        const job = await this.jobService.getJobById(jobId);
        const isDriver = req.user.role === 'DRIVE' && job?.vltId === req.user.userId;
        if (!isDriver && req.user.role !== 'ADMIN') {
            throw new ForbiddenException('เฉพาะคนขับรถเท่านั้นที่สามารถยืนยันส่งถึงบ้านได้');
        }
        return this.jobService.confirmHomeDelivery(jobId, req.user.userId, dto.returnEvidenceUrl);
    }

    @Put(':id/rate')
    @Roles('USERS', 'ADMIN', 'CAREGIVER')
    @ApiOperation({ summary: 'ให้คะแนนงาน', description: 'ประชาชนให้คะแนนแยกคนขับและ จิตอาสาแคร์ยู' })
    @ApiParam({ name: 'id', description: 'Job ID' })
    @ApiResponse({ status: 200, description: 'บันทึกคะแนนสำเร็จ' })
    async rateJob(
        @Param('id') id: string,
        @Body() rateJobDto: RateJobDto,
        @Request() req,
    ) {
        return this.jobService.rateJob(
            parseInt(id),
            req.user.userId,
            rateJobDto.driverRatingScore,
            rateJobDto.driverComment,
            rateJobDto.careuRatingScore,
            rateJobDto.careuComment,
        );
    }

    @Put(':id/rate-municipal')
    @Roles('USERS', 'ADMIN', 'CAREGIVER')
    @ApiOperation({ summary: 'ประเมินเทศบาล', description: 'ผู้ใช้บริการประเมินความพึงพอใจต่อการบริการของเทศบาล (6 ด้าน)' })
    @ApiParam({ name: 'id', description: 'Job ID' })
    @ApiResponse({ status: 200, description: 'บันทึกการประเมินสำเร็จ' })
    @ApiResponse({ status: 400, description: 'งานยังไม่เสร็จ หรือประเมินไปแล้ว' })
    async rateMunicipal(
        @Param('id') id: string,
        @Body() dto: RateMunicipalDto,
        @Request() req,
    ) {
        return this.jobService.rateMunicipal(
            parseInt(id),
            req.user.userId,
            dto,
        );
    }
}
