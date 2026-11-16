import { Controller, Get, Post, Body, Param, Patch, Delete, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DiseaseService } from './disease.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Public } from '../../../common/decorators/public.decorator';

@ApiTags('Diseases')
@Controller('diseases')
export class DiseaseController {
    constructor(private readonly diseaseService: DiseaseService) { }

    @Get()
    @Public()
    @ApiOperation({ summary: 'ดึงรายการโรคทั้งหมด' })
    @ApiQuery({ name: 'search', required: false, description: 'ค้นหาชื่อโรค' })
    @ApiQuery({ name: 'activeOnly', required: false, type: Boolean, description: 'แสดงเฉพาะที่เปิดใช้งาน' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'หมายเลขหน้า' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'จำนวนรายการต่อหน้า' })
    @ApiResponse({ status: 200, description: 'รายการโรคทั้งหมด' })
    async findAll(
        @Query('search') search?: string,
        @Query('activeOnly') activeOnly?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.diseaseService.findAll({
            search,
            activeOnly: activeOnly === 'true',
            page: page ? parseInt(page, 10) : undefined,
            limit: limit ? parseInt(limit, 10) : undefined,
        });
    }

    @Get(':id')
    @Public()
    @ApiOperation({ summary: 'ดึงข้อมูลโรคตาม ID' })
    @ApiResponse({ status: 200, description: 'ข้อมูลโรค' })
    async findOne(@Param('id', ParseIntPipe) id: number) {
        return this.diseaseService.findOne(id);
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('STAFF', 'ADMIN')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'เพิ่มโรคใหม่ (เฉพาะ Staff/Admin)' })
    @ApiResponse({ status: 201, description: 'เพิ่มโรคสำเร็จ' })
    async create(@Body() body: { name: string }) {
        return this.diseaseService.create(body.name);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('STAFF', 'ADMIN')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'แก้ไขข้อมูลโรค (เฉพาะ Staff/Admin)' })
    @ApiResponse({ status: 200, description: 'แก้ไขสำเร็จ' })
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: { name?: string; isActive?: boolean },
    ) {
        return this.diseaseService.update(id, body);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('STAFF', 'ADMIN')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'ลบโรค (เฉพาะ Staff/Admin)' })
    @ApiResponse({ status: 200, description: 'ลบสำเร็จ' })
    async delete(@Param('id', ParseIntPipe) id: number) {
        return this.diseaseService.delete(id);
    }
}
