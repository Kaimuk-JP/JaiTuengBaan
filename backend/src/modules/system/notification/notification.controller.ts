import {
    Controller,
    Get,
    Patch,
    Delete,
    Param,
    Query,
    UseGuards,
    Request,
    ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@ApiTags('Notifications')
@ApiBearerAuth('JWT-auth')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
    constructor(private readonly notificationService: NotificationService) { }

    @Get()
    @ApiOperation({ summary: 'ดึงรายการการแจ้งเตือนของผู้ใช้' })
    @ApiQuery({ name: 'page', required: false, description: 'หมายเลขหน้า' })
    @ApiQuery({ name: 'limit', required: false, description: 'จำนวนต่อหน้า' })
    @ApiResponse({ status: 200, description: 'รายการการแจ้งเตือน' })
    async getNotifications(
        @Request() req,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.notificationService.getUserNotifications(
            req.user.userId,
            page ? Number(page) : 1,
            limit ? Number(limit) : 10,
        );
    }

    @Get('unread-count')
    @ApiOperation({ summary: 'ดึงจำนวนการแจ้งเตือนที่ยังไม่ได้อ่าน' })
    @ApiResponse({ status: 200, description: 'จำนวนที่ยังไม่อ่าน' })
    async getUnreadCount(@Request() req) {
        const count = await this.notificationService.getUnreadCount(req.user.userId);
        return { count };
    }

    @Get('online-users')
    @ApiOperation({ summary: 'ดึงจำนวนและรายชื่อผู้ใช้ที่กำลังออนไลน์อยู่ ณ ปัจจุบัน' })
    @ApiResponse({ status: 200, description: 'รายการผู้ใช้ออนไลน์' })
    async getOnlineUsers() {
        return this.notificationService.getOnlineUsers();
    }

    @Patch(':id/read')
    @ApiOperation({ summary: 'ทำเครื่องหมายว่าอ่านแล้ว' })
    @ApiParam({ name: 'id', description: 'Notification ID' })
    @ApiResponse({ status: 200, description: 'อัพเดทสำเร็จ' })
    async markAsRead(
        @Param('id', ParseIntPipe) id: number,
        @Request() req,
    ) {
        return this.notificationService.markAsRead(id, req.user.userId);
    }

    @Patch('read-all')
    @ApiOperation({ summary: 'ทำเครื่องหมายว่าอ่านแล้วทั้งหมด' })
    @ApiResponse({ status: 200, description: 'อัพเดทสำเร็จ' })
    async markAllAsRead(@Request() req) {
        return this.notificationService.markAllAsRead(req.user.userId);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'ลบการแจ้งเตือน' })
    @ApiParam({ name: 'id', description: 'Notification ID' })
    @ApiResponse({ status: 200, description: 'ลบสำเร็จ' })
    async deleteNotification(
        @Param('id', ParseIntPipe) id: number,
        @Request() req,
    ) {
        return this.notificationService.deleteNotification(id, req.user.userId);
    }
}
