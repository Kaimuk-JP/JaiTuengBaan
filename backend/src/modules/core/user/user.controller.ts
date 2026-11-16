import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { UserService } from './user.service';
import { AuthService } from '../auth/auth.service';
import { CreateUserDto, UpdateUserDto } from './dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { getStaffOrganizationId } from '../../../common/helpers/org-id.helper';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) { }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'ดึงรายชื่อผู้ใช้ทั้งหมด', description: 'Admin ดึงรายชื่อผู้ใช้ทั้งหมดพร้อม pagination' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'role', required: false })
  @ApiResponse({ status: 200, description: 'รายการผู้ใช้' })
  async getAllUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Request() req?: any,
  ) {
    const orgId = await getStaffOrganizationId(req, this.prisma);
    return this.userService.getAllUsersWithFilter({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      search,
      role,
      organizationId: orgId,
    });
  }

  @Get('search')
  @UseGuards(RolesGuard)
  @Roles('STAFF', 'ADMIN')
  @ApiOperation({ summary: 'ค้นหาผู้ใช้', description: 'ค้นหาผู้ใช้จากชื่อหรือเบอร์โทร' })
  @ApiQuery({ name: 'q', description: 'คำค้นหา' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'รายการผู้ใช้' })
  async searchUsers(
    @Query('q') query: string,
    @Query('roles') roles?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Request() req?: any,
  ) {
    const orgId = await getStaffOrganizationId(req, this.prisma);
    return this.userService.searchUsers(
      query,
      roles ? roles.split(',') : undefined,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      orgId,
    );
  }

  @Get('volunteers')
  @UseGuards(RolesGuard)
  @Roles('STAFF', 'ADMIN')
  @ApiOperation({ summary: 'ดึงรายชื่อเจ้าหน้าที่รถ', description: 'ค้นหาและดึงรายการเจ้าหน้าที่รถ' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ status: 200, description: 'รายการเจ้าหน้าที่รถ' })
  async getVolunteers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Request() req?: any,
  ) {
    const orgId = await getStaffOrganizationId(req, this.prisma);
    return this.userService.getVolunteers({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      search,
      organizationId: orgId,
    });
  }

  @Get('careu')
  @UseGuards(RolesGuard)
  @Roles('STAFF', 'ADMIN')
  @ApiOperation({ summary: 'ดึงรายชื่อจิตอาสาแคร์ยู', description: 'ค้นหาและดึงรายการจิตอาสาแคร์ยู' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ status: 200, description: 'รายการจิตอาสาแคร์ยู' })
  async getCareUs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Request() req?: any,
  ) {
    const orgId = await getStaffOrganizationId(req, this.prisma);
    return this.userService.getCareUs({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      search,
      organizationId: orgId,
    });
  }


  @Get('profile')
  @ApiOperation({ summary: 'ดูข้อมูลโปรไฟล์ส่วนตัว' })
  @ApiResponse({ status: 200, description: 'ข้อมูลโปรไฟล์' })
  async getProfile(@Request() req) {
    return this.authService.getFullUserProfile(req.user.userId);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('STAFF', 'ADMIN')
  @ApiOperation({ summary: 'เพิ่มผู้ใช้ใหม่โดยเจ้าหน้าที่', description: 'สร้างประชาชนหรือผู้ดูแลประชาชนใหม่ เพื่อไปเชื่อมโยงกับ LINE ภายหลัง' })
  @ApiResponse({ status: 201, description: 'สร้างผู้ใช้สำเร็จ' })
  async createUser(@Body() createData: any, @Request() req) {
    return this.userService.createPendingUser(createData, req.user.userId);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'แก้ไขข้อมูลโปรไฟล์ส่วนตัว' })
  @ApiResponse({ status: 200, description: 'แก้ไขข้อมูลสำเร็จ' })
  async updateProfile(@Request() req, @Body() updateData: UpdateUserDto) {
    return this.userService.updateUserProfile(req.user.userId, updateData);
  }

  @Get('me/residences')
  @ApiOperation({ summary: 'ดึงรายการบ้านที่ลงทะเบียนกับ IAM-GOV' })
  @ApiResponse({ status: 200, description: 'รายการบ้าน' })
  async getMyResidences(@Request() req) {
    return this.userService.getMyResidences(req.user.userId);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('STAFF', 'ADMIN')
  @ApiOperation({ summary: 'ดูข้อมูลผู้ใช้ตาม ID', description: 'Staff/Admin ดูข้อมูลผู้ใช้คนอื่น' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'ข้อมูลผู้ใช้' })
  async getUserById(@Param('id') id: string, @Request() req: any) {
    const targetUser = await this.userService.getUserById(id);
    if (!targetUser) throw new NotFoundException('ไม่พบประชาชน');

    if (req.user.role === 'STAFF') {
      const staffOrgId = await getStaffOrganizationId(req, this.prisma);
      if (targetUser.organizationId !== staffOrgId) {
        throw new ForbiddenException('คุณไม่มีสิทธิ์เข้าถึงข้อมูลผู้ใช้นี้');
      }
    }

    return this.authService.getFullUserProfile(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('STAFF', 'ADMIN')
  @ApiOperation({ summary: 'แก้ไขข้อมูลผู้ใช้ตาม ID', description: 'Staff/Admin แก้ไขข้อมูลผู้ใช้คนอื่น' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'แก้ไขข้อมูลสำเร็จ' })
  async updateUser(
    @Param('id') id: string,
    @Body() updateData: UpdateUserDto,
    @Request() req,
  ) {
    const targetUserId = id;
    const currentUser = req.user;

    const targetUser = await this.userService.getUserById(targetUserId);

    if (!targetUser) {
      throw new ForbiddenException('ไม่พบผู้ใช้ที่ต้องการแก้ไข');
    }

    if (currentUser.role === 'STAFF') {
      const staffOrgId = await getStaffOrganizationId(req, this.prisma);
      if (targetUser.organizationId !== staffOrgId) {
        throw new ForbiddenException('คุณไม่มีสิทธิ์เข้าถึงข้อมูลผู้ใช้นี้');
      }
    }

    if (targetUser.role === 'ADMIN' && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Staff ไม่สามารถแก้ไขข้อมูล Admin ได้');
    }

    if (updateData.role !== undefined) {
      throw new ForbiddenException('ไม่สามารถเปลี่ยน role ผ่าน endpoint นี้ได้ กรุณาใช้ /auth/user/update-role');
    }

    return this.userService.updateUserProfile(targetUserId, updateData);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'ลบบัญชีผู้ใช้', description: 'Admin ลบบัญชีผู้ใช้ออกจากระบบ' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'ลบบัญชีสำเร็จ' })
  @ApiResponse({ status: 403, description: 'ไม่มีสิทธิ์ลบบัญชีนี้' })
  @ApiResponse({ status: 404, description: 'ไม่พบผู้ใช้' })
  async deleteUser(
    @Param('id') id: string,
    @Request() req,
  ) {
    const targetUserId = id;
    const currentUserId = req.user.userId;

    if (targetUserId === currentUserId) {
      throw new ForbiddenException('ไม่สามารถลบบัญชีตัวเองได้');
    }

    const targetUser = await this.userService.getUserById(targetUserId);

    if (!targetUser) {
      throw new NotFoundException('ไม่พบผู้ใช้ที่ต้องการลบ');
    }

    if (targetUser.role === 'ADMIN') {
      throw new ForbiddenException('ไม่สามารถลบบัญชี Admin ได้');
    }

    return this.userService.deleteUser(targetUserId);
  }
}
