import { Controller, Get, Post, Body, Param, Patch, Delete, Query, UseGuards, ParseIntPipe, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { EquipmentService } from './equipment.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

@ApiTags('Equipment')
@Controller('equipment')
export class EquipmentController {
    constructor(private readonly equipmentService: EquipmentService) { }

    @Get()
    @ApiOperation({ summary: 'ดึงรายการอุปกรณ์ทั้งหมด' })
    @ApiQuery({ name: 'search', required: false, description: 'ค้นหาชื่ออุปกรณ์' })
    @ApiQuery({ name: 'activeOnly', required: false, type: Boolean, description: 'แสดงเฉพาะที่เปิดใช้งาน' })
    @ApiQuery({ name: 'organizationId', required: false, description: 'กรองตามเทศบาล' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'หมายเลขหน้า' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'จำนวนรายการต่อหน้า' })
    @ApiResponse({ status: 200, description: 'รายการอุปกรณ์ทั้งหมด' })
    async findAll(
        @Query('search') search?: string,
        @Query('activeOnly') activeOnly?: string,
        @Query('organizationId') organizationId?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.equipmentService.findAll({
            search,
            activeOnly: activeOnly === 'true',
            organizationId,
            page: page ? parseInt(page, 10) : undefined,
            limit: limit ? parseInt(limit, 10) : undefined,
        });
    }

    @Get(':id')
    @ApiOperation({ summary: 'ดึงข้อมูลอุปกรณ์ตาม ID' })
    @ApiResponse({ status: 200, description: 'ข้อมูลอุปกรณ์' })
    async findOne(@Param('id', ParseIntPipe) id: number) {
        return this.equipmentService.findOne(id);
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('STAFF', 'ADMIN')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'เพิ่มอุปกรณ์ใหม่ (เฉพาะ Staff/Admin)' })
    @ApiResponse({ status: 201, description: 'เพิ่มอุปกรณ์สำเร็จ' })
    async create(
        @Body() body: { name: string },
        @Req() req: any,
    ) {
        const organizationId = req.user?.role === 'STAFF' ? req.user?.organizationId : undefined;
        return this.equipmentService.create(body.name, organizationId);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('STAFF', 'ADMIN')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'แก้ไขข้อมูลอุปกรณ์ (เฉพาะ Staff/Admin)' })
    @ApiResponse({ status: 200, description: 'แก้ไขสำเร็จ' })
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: { name?: string; isActive?: boolean },
    ) {
        return this.equipmentService.update(id, body);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('STAFF', 'ADMIN')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'ลบอุปกรณ์ (เฉพาะ Staff/Admin)' })
    @ApiResponse({ status: 200, description: 'ลบสำเร็จ' })
    async delete(@Param('id', ParseIntPipe) id: number) {
        return this.equipmentService.delete(id);
    }
}
