import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Query,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { CaregiverService } from './caregiver.service';
import { CreateCaregiverPatientDto, RegisterElderlyDto, StaffRegisterCaregiverDto, StaffAddExistingPatientDto } from './dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { getStaffOrganizationId } from '../../../common/helpers/org-id.helper';

@ApiTags('Caregiver')
@ApiBearerAuth('JWT-auth')
@Controller('caregiver')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CaregiverController {
  constructor(private readonly caregiverService: CaregiverService, private readonly prisma: PrismaService) { }


  @Get('patients/search')
  @Roles('CAREGIVER', 'STAFF', 'ADMIN')
  @ApiOperation({
    summary: 'ค้นหาประชาชน',
    description: 'ค้นหาประชาชนตามชื่อเพื่อเพิ่มในความดูแล',
  })
  @ApiQuery({ name: 'query', description: 'คำค้นหา (ชื่อ-สกุล)' })
  @ApiResponse({
    status: 200,
    description: 'รายชื่อผู้ยื่นคำร้องที่ตรงกับคำค้นหา',
  })
  async searchPatients(@Query('query') query: string) {
    return this.caregiverService.searchPatients(query);
  }

  @Post('patients')
  @Roles('CAREGIVER', 'ADMIN')
  @ApiOperation({
    summary: 'เพิ่มประชาชนในความดูแล',
    description:
      'เพิ่มประชาชนเข้าสู่รายชื่อที่ดูแล รอการอนุมัติจากเจ้าหน้าที่',
  })
  @ApiResponse({ status: 201, description: 'เพิ่มประชาชนสำเร็จ' })
  @ApiResponse({ status: 404, description: 'ไม่พบประชาชน' })
  @ApiResponse({ status: 409, description: 'ประชาชนอยู่ในรายชื่อแล้ว' })
  async addPatient(@Request() req, @Body() dto: CreateCaregiverPatientDto) {
    return this.caregiverService.addPatient(req.user.userId, dto);
  }

  @Post('register-elderly')
  @Roles('CAREGIVER', 'ADMIN')
  @ApiOperation({
    summary: 'ลงทะเบียนประชาชนใหม่',
    description: 'ผู้ดูแลประชาชนลงทะเบียนประชาชนใหม่และส่งคำร้องขอเพิ่มในความดูแล',
  })
  @ApiResponse({ status: 201, description: 'ลงทะเบียนประชาชนสำเร็จ' })
  @ApiResponse({
    status: 409,
    description: 'ประชาชนหรือเบอร์โทรศัพท์มีอยู่แล้วในระบบ',
  })
  async registerElderly(@Request() req, @Body() dto: RegisterElderlyDto) {
    return this.caregiverService.registerElderly(req.user.userId, dto);
  }

  @Get('patients')
  @Roles('CAREGIVER', 'ADMIN')
  @ApiOperation({
    summary: 'ดึงรายชื่อประชาชนที่ดูแล',
    description: 'ดึงรายชื่อผู้ยื่นคำร้องทั้งหมดที่อยู่ในความดูแลของผู้ดูแลประชาชน',
  })
  @ApiResponse({ status: 200, description: 'รายชื่อผู้ยื่นคำร้อง' })
  async getMyPatients(@Request() req) {
    return this.caregiverService.getMyPatients(req.user.userId);
  }

  @Get('bookings')
  @Roles('CAREGIVER', 'ADMIN')
  @ApiOperation({
    summary: 'ดึงรายการจองของประชาชน',
    description: 'ดึงรายการจองทั้งหมดของประชาชนที่อยู่ในความดูแล',
  })
  @ApiResponse({ status: 200, description: 'รายการจอง' })
  async getPatientBookings(@Request() req) {
    return this.caregiverService.getPatientBookings(req.user.userId);
  }


  @Get('requests')
  @Roles('STAFF', 'ADMIN')
  @ApiOperation({
    summary: 'ดึงรายการคำร้องขอเพิ่มประชาชน',
    description: 'สำหรับ Staff ดูรายการคำร้องทั้งหมด',
  })
  @ApiQuery({ name: 'status', required: false, description: 'กรองตามสถานะ' })
  @ApiQuery({ name: 'startDate', required: false, description: 'วันที่เริ่มต้น' })
  @ApiQuery({ name: 'endDate', required: false, description: 'วันที่สิ้นสุด' })
  @ApiResponse({ status: 200, description: 'รายการคำร้อง' })
  async getAllRequests(@Query('status') status?: string, @Query('startDate') startDate?: string, @Query('endDate') endDate?: string, @Request() req?: any) {
    const orgId = await getStaffOrganizationId(req, this.prisma);
    return this.caregiverService.getAllRequests(status, orgId, 1, 1000, startDate, endDate);
  }

  @Get(':id/patients')
  @Roles('STAFF', 'ADMIN')
  @ApiOperation({
    summary: 'ดึงรายชื่อผู้ยื่นคำร้องของผู้ดูแลประชาชนตาม ID',
    description: 'สำหรับ Staff ดูรายชื่อผู้ยื่นคำร้องของผู้ดูแลประชาชนคนใดคนหนึ่ง',
  })
  @ApiResponse({ status: 200, description: 'รายชื่อผู้ยื่นคำร้อง' })
  async getPatientsByCaregiverId(@Param('id') id: string) {
    return this.caregiverService.getMyPatients(id);
  }

  @Get(':id/bookings')
  @Roles('STAFF', 'ADMIN')
  @ApiOperation({
    summary: 'ดึงรายการจองของผู้ดูแลประชาชนตาม ID',
    description:
      'สำหรับ Staff ดูรายการจองของประชาชนในความดูแลของผู้ดูแลประชาชนคนใดคนหนึ่ง',
  })
  @ApiResponse({ status: 200, description: 'รายการจอง' })
  async getBookingsByCaregiverId(@Param('id') id: string) {
    return this.caregiverService.getPatientBookings(id);
  }

  @Put('requests/:id/approve')
  @Roles('STAFF', 'ADMIN')
  @ApiOperation({
    summary: 'อนุมัติคำร้อง',
    description: 'Staff อนุมัติคำร้องขอเพิ่มประชาชน',
  })
  @ApiResponse({ status: 200, description: 'อนุมัติสำเร็จ' })
  async approveRequest(@Param('id') id: string, @Request() req) {
    return this.caregiverService.approveRequest(parseInt(id), req.user.userId);
  }

  @Put('requests/:id/reject')
  @Roles('STAFF', 'ADMIN')
  @ApiOperation({
    summary: 'ปฏิเสธคำร้อง',
    description: 'Staff ปฏิเสธคำร้องขอเพิ่มประชาชน',
  })
  @ApiResponse({ status: 200, description: 'ปฏิเสธสำเร็จ' })
  async rejectRequest(
    @Param('id') id: string,
    @Body('rejectReason') rejectReason: string,
    @Request() req,
  ) {
    return this.caregiverService.rejectRequest(
      parseInt(id),
      req.user.userId,
      rejectReason,
    );
  }

  @Post('staff/register-caregiver')
  @Roles('STAFF', 'ADMIN')
  @ApiOperation({
    summary: 'เจ้าหน้าที่เพิ่มผู้ดูแลประชาชนให้ประชาชน',
    description: 'สร้างผู้ดูแลประชาชนใหม่และผูกกับประชาชน สถานะ APPROVED ทันที',
  })
  @ApiResponse({ status: 201, description: 'เพิ่มผู้ดูแลประชาชนสำเร็จ' })
  @ApiResponse({ status: 404, description: 'ไม่พบประชาชน' })
  @ApiResponse({ status: 409, description: 'ข้อมูลซ้ำในระบบ' })
  async staffRegisterCaregiver(@Request() req, @Body() dto: StaffRegisterCaregiverDto) {
    return this.caregiverService.staffRegisterCaregiver(req.user.userId, dto);
  }

  @Post('staff/add-existing-patient')
  @Roles('STAFF', 'ADMIN')
  @ApiOperation({
    summary: 'เจ้าหน้าที่เพิ่มประชาชนที่มีอยู่แล้วให้ผู้ดูแลประชาชน',
    description: 'ผูกประชาชนที่มีอยู่แล้วในระบบเข้ากับผู้ดูแลประชาชน สถานะ APPROVED ทันที',
  })
  @ApiResponse({ status: 201, description: 'เพิ่มสำเร็จ' })
  @ApiResponse({ status: 404, description: 'ไม่พบผู้ดูแลประชาชนหรือประชาชน' })
  @ApiResponse({ status: 409, description: 'ซ้ำในระบบ' })
  async staffAddExistingPatient(
    @Request() req,
    @Body() dto: StaffAddExistingPatientDto,
  ) {
    return this.caregiverService.staffAddExistingPatient(
      req.user.userId,
      dto.caregiverId,
      dto.patientId,
      dto.relationship,
      dto.additionalDetails,
    );
  }


  @Delete('patients/:patientId')
  @Roles('CAREGIVER', 'ADMIN')
  @ApiOperation({
    summary: 'ลบประชาชนที่ดูแล / ยกเลิกคำร้อง',
  })
  @ApiResponse({ status: 200, description: 'ลบสำเร็จ' })
  async removePatient(@Request() req, @Param('patientId') patientId: string) {
    return this.caregiverService.removePatient(req.user.userId, patientId);
  }
}
