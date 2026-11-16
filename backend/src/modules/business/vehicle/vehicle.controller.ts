import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { VehicleService } from './vehicle.service';
import { CreateVehicleDto, UpdateVehicleDto } from './dto/vehicle.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { getStaffOrganizationId } from '../../../common/helpers/org-id.helper';
import { PrismaService } from '../../../core/prisma/prisma.service';

@Controller('vehicles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VehicleController {
    constructor(
        private readonly vehicleService: VehicleService,
        private readonly prisma: PrismaService,
    ) { }

    @Post()
    @Roles('ADMIN', 'STAFF')
    async create(@Body() createVehicleDto: CreateVehicleDto, @Request() req: any) {
        const orgId = await getStaffOrganizationId(req, this.prisma);
        return this.vehicleService.create(createVehicleDto, orgId);
    }

    @Get()
    async findAll(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('search') search?: string,
        @Request() req?: any,
    ) {
        const orgId = await getStaffOrganizationId(req, this.prisma);
        return this.vehicleService.findAll({
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 10,
            search,
            orgId,
        });
    }

    @Get(':id')
    async findOne(@Param('id') id: string, @Request() req: any) {
        const orgId = await getStaffOrganizationId(req, this.prisma);
        return this.vehicleService.findOne(+id, orgId);
    }

    @Patch(':id')
    @Roles('ADMIN', 'STAFF')
    async update(@Param('id') id: string, @Body() updateVehicleDto: UpdateVehicleDto, @Request() req: any) {
        const orgId = await getStaffOrganizationId(req, this.prisma);
        return this.vehicleService.update(+id, updateVehicleDto, orgId);
    }

    @Delete(':id')
    @Roles('ADMIN', 'STAFF')
    async remove(@Param('id') id: string, @Request() req: any) {
        const orgId = await getStaffOrganizationId(req, this.prisma);
        return this.vehicleService.remove(+id, orgId);
    }

    @Get(':id/mileage')
    @Roles('ADMIN', 'STAFF')
    async getMileageLogs(@Param('id') id: string, @Query('limit') limit?: string, @Request() req?: any) {
        const orgId = await getStaffOrganizationId(req, this.prisma);
        return this.vehicleService.getMileageLogs(+id, limit ? parseInt(limit, 10) : 20, orgId);
    }
}
