import { Controller, Get, Post, Patch, Delete, Query, Body, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { HospitalService } from './hospital.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Public } from '../../../common/decorators/public.decorator';

@ApiTags('Hospitals')
@Controller('hospitals')
export class HospitalController {
    constructor(private readonly hospitalService: HospitalService) { }

    @Get()
    @Public()
    @ApiOperation({ summary: 'ค้นหาโรงพยาบาล' })
    @ApiResponse({ status: 200, description: 'รายการโรงพยาบาล' })
    async getHospitals(
        @Query('search') search?: string,
        @Query('limit') limit?: string,
        @Query('page') page?: string,
    ) {
        return this.hospitalService.getHospitals(
            search,
            limit ? parseInt(limit) : undefined,
            page ? parseInt(page) : undefined,
        );
    }

    @Get('all')
    @Public()
    @ApiOperation({ summary: 'ดึงโรงพยาบาลทั้งหมด' })
    @ApiResponse({ status: 200, description: 'รายการโรงพยาบาลทั้งหมด' })
    async getAllHospitals() {
        return this.hospitalService.getAllHospitals();
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('STAFF', 'ADMIN')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'เพิ่มโรงพยาบาลใหม่ (เฉพาะ Staff/Admin)' })
    @ApiResponse({ status: 201, description: 'เพิ่มโรงพยาบาลสำเร็จ' })
    async createHospital(@Body() body: { name: string }) {
        return this.hospitalService.createHospital(body.name);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('STAFF', 'ADMIN')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'แก้ไขชื่อโรงพยาบาล (เฉพาะ Staff/Admin)' })
    @ApiResponse({ status: 200, description: 'แก้ไขสำเร็จ' })
    async updateHospital(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: { name: string },
    ) {
        return this.hospitalService.updateHospital(id, body.name);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('STAFF', 'ADMIN')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'ลบโรงพยาบาล (เฉพาะ Staff/Admin)' })
    @ApiResponse({ status: 200, description: 'ลบสำเร็จ' })
    async deleteHospital(@Param('id', ParseIntPipe) id: number) {
        return this.hospitalService.deleteHospital(id);
    }
}
